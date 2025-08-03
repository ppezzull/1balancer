import { connect, KeyPair, Account, providers, keyStores } from 'near-api-js';
const { InMemoryKeyStore, UnencryptedFileSystemKeyStore } = keyStores;
import os from 'os';
import { createLogger } from '../utils/logger';
import { config } from '../config';
import { SessionManager, SwapSession } from './SessionManager';
import { SecretManager } from './SecretManager';
import { ApiErrorFactory } from '../api/middleware/errorHandler';

const logger = createLogger('NEARChainCoordinator');

interface HTLCParams {
  receiver: string;
  token: string;
  amount: string;
  hashlock: string;
  timelock: number;
  orderHash: string;
}

interface NEARConfig {
  networkId: string;
  nodeUrl: string;
  backupNodeUrl?: string;
  walletUrl?: string;
  helperUrl?: string;
  explorerUrl?: string;
  htlcContract: string;
  solverRegistry?: string;
  masterAccount?: string;
  privateKey?: string;
}

interface HTLCEvent {
  htlc_id: string;
  sender?: string;
  receiver?: string;
  secret?: string;
  amount?: string;
  hashlock?: string;
  timelock?: number;
}

export class NEARChainCoordinator {
  private provider!: providers.JsonRpcProvider;
  private masterAccount?: Account;
  private htlcContract: string;
  private nearConfig: NEARConfig;
  private nearConnection: any;

  constructor(
    private sessionManager: SessionManager,
    _secretManager: SecretManager
  ) {
    // Initialize NEAR config - prefer environment variables over config
    this.nearConfig = {
      networkId: config.chains.near?.networkId || 'testnet',
      nodeUrl: config.chains.near?.rpcUrl || 'https://rpc.testnet.near.org',
      backupNodeUrl: 'https://test.rpc.fastnear.com',
      walletUrl: `https://wallet.${config.chains.near?.networkId || 'testnet'}.near.org`,
      helperUrl: `https://helper.${config.chains.near?.networkId || 'testnet'}.near.org`,
      explorerUrl: `https://explorer.${config.chains.near?.networkId || 'testnet'}.near.org`,
      htlcContract: config.chains.near?.contracts?.htlc || 'fusion-htlc.testnet',
      solverRegistry: config.chains.near?.contracts?.solverRegistry || 'solver-registry.testnet',
      masterAccount: process.env.NEAR_MASTER_ACCOUNT || config.chains.near?.accountId,
      privateKey: process.env.NEAR_PRIVATE_KEY || config.chains.near?.privateKey,
    };
    
    // Log environment variables for debugging
    logger.info('NEAR config initialized', {
      hasAccount: !!this.nearConfig.masterAccount,
      hasPrivateKey: !!this.nearConfig.privateKey,
      accountId: this.nearConfig.masterAccount,
      networkId: this.nearConfig.networkId,
    });

    this.htlcContract = this.nearConfig.htlcContract;

    // Initialize RPC provider with failover
    this.initializeProvider();
    
    // Initialize NEAR connection
    this.initializeNear().catch(error => {
      logger.error('Failed to initialize NEAR coordinator', { error });
      logger.warn('Continuing without NEAR functionality');
    });
  }

  private initializeProvider(): void {
    // Create JSON RPC provider
    this.provider = new providers.JsonRpcProvider({ url: this.nearConfig.nodeUrl });
  }

  private async initializeNear(): Promise<void> {
    try {
      logger.info('[NEAR] Starting initialization process', {
        timestamp: new Date().toISOString(),
        config: {
          networkId: this.nearConfig.networkId,
          nodeUrl: this.nearConfig.nodeUrl,
          htlcContract: this.htlcContract,
          hasAccount: !!this.nearConfig.masterAccount,
          hasPrivateKey: !!this.nearConfig.privateKey,
          accountId: this.nearConfig.masterAccount,
          keyLength: this.nearConfig.privateKey?.length
        }
      });

      // Try to use FileSystemKeyStore first (reads from ~/.near-credentials)
      let keyStore: keyStores.KeyStore;
      let hasValidCredentials = false;
      
      try {
        // Use FileSystemKeyStore to read from ~/.near-credentials
        const credentialsPath = os.homedir() + '/.near-credentials';
        keyStore = new UnencryptedFileSystemKeyStore(credentialsPath);
        
        logger.info('[NEAR] Using FileSystemKeyStore for credentials', {
          credentialsPath,
          networkId: this.nearConfig.networkId,
          accountId: this.nearConfig.masterAccount
        });
        
        // Test if key exists in filesystem
        const storedKey = await keyStore.getKey(this.nearConfig.networkId, this.nearConfig.masterAccount!);
        if (storedKey) {
          logger.info('[NEAR] Successfully loaded credentials from filesystem', {
            accountId: this.nearConfig.masterAccount,
            networkId: this.nearConfig.networkId,
            hasPublicKey: typeof storedKey.getPublicKey === 'function'
          });
          hasValidCredentials = true;
        } else {
          throw new Error('No credentials found in filesystem');
        }
        
      } catch (fsError) {
        logger.warn('[NEAR] FileSystemKeyStore failed, falling back to InMemoryKeyStore', {
          error: (fsError as Error).message,
          hasEnvKey: !!this.nearConfig.privateKey,
          hasEnvAccount: !!this.nearConfig.masterAccount
        });
        
        // Fallback to InMemoryKeyStore with environment variables
        keyStore = new InMemoryKeyStore();
        
        if (this.nearConfig.privateKey && this.nearConfig.masterAccount) {
          try {
            logger.info('[NEAR] Loading credentials from environment variables', {
              accountId: this.nearConfig.masterAccount,
              keyLength: this.nearConfig.privateKey?.length
            });
            
            const keyPair = KeyPair.fromString(this.nearConfig.privateKey as any);
            await keyStore.setKey(this.nearConfig.networkId, this.nearConfig.masterAccount!, keyPair);
            
            // Verify the key was stored
            const storedKey = await keyStore.getKey(this.nearConfig.networkId, this.nearConfig.masterAccount!);
            if (storedKey) {
              logger.info('[NEAR] Successfully loaded credentials from environment', {
                accountId: this.nearConfig.masterAccount
              });
              hasValidCredentials = true;
            }
          } catch (envError) {
            logger.error('[NEAR] Failed to load credentials from environment', {
              error: (envError as Error).message
            });
          }
        }
      }

      // Initialize NEAR connection with detailed logging
      logger.info('[NEAR] Establishing connection to NEAR network', {
        networkId: this.nearConfig.networkId,
        nodeUrl: this.nearConfig.nodeUrl,
        hasValidCredentials
      });
      
      this.nearConnection = await connect({
        networkId: this.nearConfig.networkId,
        nodeUrl: this.nearConfig.nodeUrl,
        keyStore,
      });
      
      logger.info('[NEAR] NEAR connection established', {
        connectionType: typeof this.nearConnection,
        connectionMethods: Object.getOwnPropertyNames(this.nearConnection),
        hasAccount: typeof this.nearConnection.account === 'function'
      });

      // Initialize master account only if we have valid credentials
      if (hasValidCredentials) {
        logger.info('[NEAR] Creating master account for write operations', {
          accountId: this.nearConfig.masterAccount
        });
        
        // Use the connection's account method which properly binds the keystore
        this.masterAccount = await this.nearConnection.account(this.nearConfig.masterAccount!);
        
        logger.info('[NEAR] Master account created successfully', {
          accountId: this.masterAccount?.accountId,
          hasConnection: !!this.masterAccount?.connection
        });
        
        logger.info('[NEAR] Master account initialized for write operations');
      } else {
        logger.warn('[NEAR] Running in read-only mode - write operations will fail');
      }
      
      logger.info('[NEAR] Initialization completed successfully', {
        networkId: this.nearConfig.networkId,
        htlcContract: this.htlcContract,
        masterAccount: this.nearConfig.masterAccount,
        contractSource: this.htlcContract.includes('fusion-htlc.testnet') ? 'default' : 'configured',
        readOnlyMode: !hasValidCredentials,
        canPerformWrites: hasValidCredentials && !!this.masterAccount
      });
      
    } catch (error) {
      const err = error as Error;
      logger.error('[NEAR] Initialization failed with error', { 
        error: err.message,
        stack: err.stack,
        errorType: err.constructor.name,
        config: {
          networkId: this.nearConfig.networkId,
          nodeUrl: this.nearConfig.nodeUrl,
          hasAccount: !!this.nearConfig.masterAccount,
          hasPrivateKey: !!this.nearConfig.privateKey
        }
      });
      throw error;
    }
  }

  async createHTLC(params: HTLCParams): Promise<string> {
    const timestamp = new Date().toISOString();
    
    try {
      logger.info(`[${timestamp}][NEAR] Starting HTLC creation`, {
        contractId: this.htlcContract,
        params: {
          receiver: params.receiver,
          token: params.token,
          amount: params.amount,
          hashlock: params.hashlock ? `${params.hashlock.substring(0, 10)}...` : 'undefined',
          timelock: params.timelock,
          orderHash: params.orderHash ? `${params.orderHash.substring(0, 10)}...` : 'undefined'
        }
      });

      // Validate master account availability
      if (!this.masterAccount) {
        logger.error(`[${timestamp}][NEAR] Write operations unavailable - no master account`, {
          hasNearConnection: !!this.nearConnection,
          networkId: this.nearConfig.networkId,
          masterAccountId: this.nearConfig.masterAccount,
          hasPrivateKey: !!this.nearConfig.privateKey,
          error: 'Master account not initialized'
        });
        throw new Error('NEAR write operations unavailable - invalid private key format. Expected: ed25519:base58_key (87+ chars)');
      }

      logger.info(`[${timestamp}][NEAR] Master account ready for function call`, {
        accountId: this.masterAccount?.accountId,
        networkId: this.nearConfig.networkId
      });

      // Validate and parse amount
      logger.info(`[${timestamp}][NEAR] Processing amount conversion`, {
        originalAmount: params.amount,
        token: params.token,
        isNativeNear: params.token === 'near'
      });

      // Check if amount is already in yoctoNEAR format (very large number) or NEAR format (smaller number)
      const isAlreadyYoctoNear = params.amount.length > 20; // yoctoNEAR amounts are typically 24+ digits
      
      const amount = params.token === 'near' && !isAlreadyYoctoNear
        ? this.parseNearAmount(params.amount)
        : params.amount; // Already in correct format

      logger.info(`[${timestamp}][NEAR] Amount processed`, {
        originalAmount: params.amount,
        processedAmount: amount,
        isAlreadyYoctoNear,
        conversionApplied: params.token === 'near' && !isAlreadyYoctoNear
      });

      // Prepare function call arguments with validation
      const functionCallArgs = {
        receiver: params.receiver,
        token: params.token === 'near' ? null : params.token, // NEAR contract expects null for native token
        amount: amount,
        hashlock: params.hashlock,
        timelock: params.timelock,
        order_hash: params.orderHash,
      };

      logger.info(`[${timestamp}][NEAR] Prepared function call arguments`, {
        args: {
          receiver: functionCallArgs.receiver,
          token: functionCallArgs.token,
          amount: functionCallArgs.amount,
          hashlock: functionCallArgs.hashlock ? `${functionCallArgs.hashlock.substring(0, 10)}...` : 'undefined',
          timelock: functionCallArgs.timelock,
          order_hash: functionCallArgs.order_hash ? `${functionCallArgs.order_hash.substring(0, 10)}...` : 'undefined'
        },
        validation: {
          receiverNotEmpty: !!functionCallArgs.receiver,
          amountPositive: BigInt(functionCallArgs.amount) > 0n,
          hashlockLength: functionCallArgs.hashlock?.length || 0,
          timelockInFuture: functionCallArgs.timelock > Math.floor(Date.now() / 1000),
          orderHashLength: functionCallArgs.order_hash?.length || 0
        }
      });

      // Calculate gas and deposit
      const gasAmount = BigInt('30000000000000'); // 30 TGas
      const attachedDeposit = params.token === 'near' ? BigInt(amount) : BigInt('10000000000000000000000'); // 0.01 NEAR min storage

      logger.info(`[${timestamp}][NEAR] Function call configuration`, {
        contractId: this.htlcContract,
        methodName: 'create_htlc',
        gas: gasAmount.toString(),
        attachedDeposit: attachedDeposit.toString(),
        depositInNear: (Number(attachedDeposit) / 1e24).toFixed(6) + ' NEAR'
      });

      // Execute function call with comprehensive error handling
      logger.info(`[${timestamp}][NEAR] Executing contract function call`, {
        contractId: this.htlcContract,
        methodName: 'create_htlc',
        callerAccount: this.masterAccount.accountId
      });

      // Account is properly initialized with keystore access

      let result;
      try {
        result = await this.masterAccount.functionCall({
          contractId: this.htlcContract,
          methodName: 'create_htlc',
          args: functionCallArgs,
          gas: gasAmount,
          attachedDeposit: attachedDeposit,
        });
        
        logger.info(`[${timestamp}][NEAR] Function call completed successfully`, {
          hasResult: !!result,
          resultType: typeof result,
          hasTransaction: !!result?.transaction,
          transactionHash: result?.transaction?.hash,
          hasStatus: !!result?.status,
          statusType: typeof result?.status
        });
        
      } catch (functionCallError) {
        const error = functionCallError as Error;
        logger.error(`[${timestamp}][NEAR] Function call failed`, {
          error: error.message,
          stack: error.stack,
          errorType: error.constructor.name,
          contractId: this.htlcContract,
          methodName: 'create_htlc',
          args: functionCallArgs,
          gas: gasAmount.toString(),
          deposit: attachedDeposit.toString()
        });
        throw functionCallError;
      }

      // Extract and validate HTLC ID from result
      logger.info(`[${timestamp}][NEAR] Extracting HTLC ID from result`, {
        result: {
          hasTransaction: !!result.transaction,
          transactionHash: result.transaction?.hash,
          hasStatus: !!result.status,
          statusType: typeof result.status,
          hasSuccessValue: !!(result.status as any)?.SuccessValue
        }
      });

      const htlcId = this.extractHTLCId(result);
      
      if (!htlcId) {
        logger.error(`[${timestamp}][NEAR] Failed to extract HTLC ID from result`, {
          result: JSON.stringify(result, null, 2)
        });
        throw new Error('Failed to extract HTLC ID from transaction result');
      }
      
      logger.info(`[${timestamp}][NEAR] HTLC creation completed successfully`, { 
        htlcId,
        txHash: result.transaction.hash,
        blockHash: (result as any).transaction_outcome?.block_hash,
        gasUsed: (result as any).transaction_outcome?.outcome?.gas_burnt,
        explorer: `https://testnet.nearblocks.io/txns/${result.transaction.hash}`,
        contractExplorer: `https://testnet.nearblocks.io/address/${this.htlcContract}`,
        params: {
          receiver: params.receiver,
          token: params.token,
          amount: params.amount
        }
      });

      return htlcId;
      
    } catch (error) {
      const err = error as Error;
      logger.error(`[${timestamp}][NEAR] HTLC creation failed with error`, { 
        error: err.message,
        stack: err.stack,
        errorType: err.constructor.name,
        params,
        contractId: this.htlcContract,
        masterAccountId: this.masterAccount?.accountId,
        hasConnection: !!this.nearConnection
      });
      throw this.handleNearError(error);
    }
  }

  async withdrawHTLC(htlcId: string, secret: string, receiver: string): Promise<void> {
    try {
      logger.info('Withdrawing NEAR HTLC', { htlcId, receiver });

      // Get receiver account
      const receiverAccount = new Account(
        this.nearConnection,
        receiver
      );

      // Call withdraw on NEAR contract
      const result = await receiverAccount.functionCall({
        contractId: this.htlcContract,
        methodName: 'withdraw',
        args: {
          htlc_id: htlcId,
          secret: secret,
        },
        gas: BigInt('30000000000000'), // 30 TGas - reduced for cost optimization
      });

      logger.info('NEAR HTLC withdrawn', {
        htlcId,
        txHash: result.transaction.hash,
      });
    } catch (error) {
      logger.error('Failed to withdraw NEAR HTLC', { error, htlcId });
      throw this.handleNearError(error);
    }
  }

  async refundHTLC(htlcId: string, sender: string): Promise<void> {
    try {
      logger.info('Refunding NEAR HTLC', { htlcId, sender });

      // Get sender account
      const senderAccount = new Account(
        this.nearConnection,
        sender
      );

      // Call refund on NEAR contract
      const result = await senderAccount.functionCall({
        contractId: this.htlcContract,
        methodName: 'refund',
        args: {
          htlc_id: htlcId,
        },
        gas: BigInt('30000000000000'), // 30 TGas - reduced for cost optimization
      });

      logger.info('NEAR HTLC refunded', {
        htlcId,
        txHash: result.transaction.hash,
      });
    } catch (error) {
      logger.error('Failed to refund NEAR HTLC', { error, htlcId });
      throw this.handleNearError(error);
    }
  }

  async getHTLC(htlcId: string): Promise<any> {
    try {
      const result = await this.provider.query({
        request_type: 'call_function',
        finality: 'final',
        account_id: this.htlcContract,
        method_name: 'get_htlc',
        args_base64: Buffer.from(JSON.stringify({ htlc_id: htlcId })).toString('base64'),
      });

      if ((result as any).result) {
        const htlc = JSON.parse(Buffer.from((result as any).result).toString());
        return htlc;
      }

      return null;
    } catch (error) {
      logger.error('Failed to get HTLC', { error, htlcId });
      throw this.handleNearError(error);
    }
  }

  async getActiveHTLCs(fromIndex: number = 0, limit: number = 100): Promise<any[]> {
    try {
      const result = await this.provider.query({
        request_type: 'call_function',
        finality: 'final',
        account_id: this.htlcContract,
        method_name: 'get_active_htlcs',
        args_base64: Buffer.from(JSON.stringify({ 
          from_index: fromIndex, 
          limit: limit 
        })).toString('base64'),
      });

      if ((result as any).result) {
        const htlcs = JSON.parse(Buffer.from((result as any).result).toString());
        return htlcs;
      }

      return [];
    } catch (error) {
      logger.error('Failed to get active HTLCs', { error });
      return [];
    }
  }

  async startEventMonitoring(): Promise<void> {
    logger.info('Starting NEAR event monitoring');
    
    // Poll for events every 5 seconds
    setInterval(async () => {
      try {
        await this.pollForEvents();
      } catch (error) {
        logger.error('Error polling NEAR events', { error });
      }
    }, 5000);
  }

  private async pollForEvents(): Promise<void> {
    try {
      // Get recent transactions for the HTLC contract
      const result = await this.provider.query({
        request_type: 'call_function',
        finality: 'final',
        account_id: this.htlcContract,
        method_name: 'get_recent_events',
        args_base64: Buffer.from(JSON.stringify({
          from_timestamp: Date.now() - 60000 // Last minute
        })).toString('base64'),
      });

      if ((result as any).result) {
        const events = JSON.parse(Buffer.from((result as any).result).toString());
        for (const event of events) {
          await this.handleNearEvent(event);
        }
      }
    } catch (error: any) {
      // Handle specific NEAR errors gracefully
      if (error.type === 'AccountDoesNotExist') {
        logger.debug('NEAR contract not deployed yet - expected in development', {
          contract: this.htlcContract,
          hint: 'Deploy NEAR contracts or use existing testnet contracts'
        });
      } else if (error.message?.includes('FunctionCallError')) {
        // Contract might not have get_recent_events method
        logger.debug('Contract does not support get_recent_events - using alternative monitoring');
      } else {
        logger.debug('Error polling NEAR events', { error });
      }
    }
  }

  private async handleNearEvent(event: HTLCEvent): Promise<void> {
    logger.info('Processing NEAR event', { event });

    // Handle different event types
    if (event.secret) {
      // Secret revealed event
      await this.handleSecretRevealed(event);
    } else if (event.sender && event.receiver) {
      // HTLC created event
      await this.handleHTLCCreated(event);
    }
  }


  private extractHTLCId(result: any): string {
    // Try to extract HTLC ID from transaction result
    if (result.status && result.status.SuccessValue) {
      try {
        const decoded = Buffer.from(result.status.SuccessValue, 'base64').toString();
        return decoded.replace(/"/g, '');
      } catch (error) {
        logger.warn('Failed to decode HTLC ID from result', { error });
      }
    }

    // Fallback: generate ID from transaction hash
    return result.transaction.hash;
  }

  private parseNearAmount(amount: string): string {
    // Convert NEAR to yoctoNEAR (1 NEAR = 10^24 yoctoNEAR)
    const parts = amount.split('.');
    const whole = parts[0] || '0';
    const fraction = parts[1] || '';
    
    // Pad fraction to 24 digits
    const paddedFraction = fraction.padEnd(24, '0').slice(0, 24);
    
    // Combine whole and fraction
    const yoctoNear = whole + paddedFraction;
    
    // Remove leading zeros
    return yoctoNear.replace(/^0+/, '') || '0';
  }

  private handleNearError(error: any): Error {
    if (error.type === 'AccountDoesNotExist') {
      return ApiErrorFactory.notFound('NEAR account does not exist');
    } else if (error.type === 'NotEnoughBalance') {
      return ApiErrorFactory.badRequest('Insufficient NEAR balance');
    } else if (error.type === 'InvalidTxError') {
      return ApiErrorFactory.badRequest('Invalid NEAR transaction');
    } else {
      return ApiErrorFactory.internal(`NEAR operation failed: ${error.message || error.toString()}`);
    }
  }

  // Add missing methods that are called from CrossChainCoordinator
  async revealSecret(sessionId: string, escrowAddress: string, secret: string): Promise<void> {
    try {
      logger.info('Revealing secret on NEAR', { sessionId, escrowAddress, secret });
      
      // Find the HTLC associated with this session
      const session = await this.sessionManager.getSession(sessionId);
      if (!session || !session.nearHTLCId) {
        throw new Error('Session or NEAR HTLC ID not found');
      }
      
      // Withdraw using the secret
      await this.withdrawHTLC(session.nearHTLCId, secret, escrowAddress);
      
      logger.info('Secret revealed on NEAR successfully', { sessionId });
    } catch (error) {
      logger.error('Failed to reveal secret on NEAR', { error, sessionId });
      throw this.handleNearError(error);
    }
  }

  async lockOnNEAR(session: SwapSession): Promise<string> {
    try {
      logger.info('Locking assets on NEAR', { sessionId: session.id });
      
      // Create HTLC on NEAR
      const htlcId = await this.createHTLC({
        receiver: session.destinationAddress || session.taker,
        token: session.destinationAsset || session.destinationToken,
        amount: session.destinationAmount,
        hashlock: session.orderHash || session.hashlockHash,
        timelock: Math.floor(Date.now() / 1000) + 3600, // 1 hour timeout
        orderHash: session.orderHash || session.hashlockHash,
      });
      
      // Update session with NEAR HTLC ID
      session.nearHTLCId = htlcId;
      session.status = 'htlc_created_near';
      await this.sessionManager.updateSession(session.id, session);
      
      return htlcId;
    } catch (error) {
      logger.error('Failed to lock assets on NEAR', { error, sessionId: session.id });
      throw this.handleNearError(error);
    }
  }

  async handleHTLCRefunded(event: HTLCEvent): Promise<void> {
    logger.info('HTLC refunded on NEAR', { event });
    
    const { htlc_id } = event;
    if (!htlc_id) {
      logger.warn('Invalid refund event - missing HTLC ID', { event });
      return;
    }
    
    // Find session by NEAR HTLC ID
    const sessions = await this.sessionManager.getActiveSessions();
    const session = sessions.find(s => s.nearHTLCId === htlc_id);
    
    if (session) {
      // Update session status
      session.status = 'refunded_near';
      await this.sessionManager.updateSession(session.id, session);
      
      logger.info('Session marked as refunded on NEAR', {
        sessionId: session.id,
        htlcId: htlc_id,
      });
    }
  }

  async monitorEvents(callback: (event: any) => void): Promise<void> {
    logger.info('Starting NEAR event monitoring with callback');
    
    // Poll for events and call the callback
    setInterval(async () => {
      try {
        const result = await this.provider.query({
          request_type: 'call_function',
          finality: 'final',
          account_id: this.htlcContract,
          method_name: 'get_recent_events',
          args_base64: Buffer.from(JSON.stringify({
            _from_timestamp: String(Date.now() - 60000) // Last minute - must be string
          })).toString('base64'),
        });

        if ((result as any).result) {
          const events = JSON.parse(Buffer.from((result as any).result).toString());
          for (const event of events) {
            // Add event name based on event data
            if (event.secret) {
              event.eventName = 'secret_revealed';
            } else if (event.htlc_id && event.sender && event.receiver) {
              event.eventName = 'htlc_created';
            } else if (event.htlc_id && event.refunded) {
              event.eventName = 'htlc_refunded';
            }
            
            // Call the provided callback
            callback(event);
          }
        }
      } catch (error: any) {
        // Handle specific NEAR errors gracefully
        if (error.type === 'AccountDoesNotExist') {
          logger.debug('NEAR contract account does not exist yet - this is expected in development', { 
            contract: this.htlcContract 
          });
        } else {
          logger.error('Error monitoring NEAR events', { 
            error,
            errorType: error.type,
            errorMessage: error.message || error.toString(),
            contract: this.htlcContract
          });
        }
      }
    }, 5000);
  }

  // Make these methods public so CrossChainCoordinator can call them
  public async handleHTLCCreated(event: HTLCEvent): Promise<void> {
    logger.info('HTLC created on NEAR', { event });
    // Handle HTLC creation if needed
  }

  public async handleSecretRevealed(event: HTLCEvent): Promise<void> {
    const { htlc_id, secret } = event;
    
    if (!htlc_id || !secret) {
      logger.warn('Invalid secret revealed event', { event });
      return;
    }

    logger.info('Secret revealed on NEAR', { htlc_id, secret });

    // Find session by NEAR HTLC ID
    const sessions = await this.sessionManager.getActiveSessions();
    const session = sessions.find(s => 
      s.nearHTLCId === htlc_id && 
      s.status === 'secret_revealed_near'
    );

    if (session) {
      // Update session with revealed secret
      session.revealedSecret = secret;
      session.status = 'withdrawing_base';
      await this.sessionManager.updateSession(session.id, session);

      // Trigger BASE withdrawal
      logger.info('Triggering BASE withdrawal with revealed secret', {
        sessionId: session.id,
        secret,
      });
    }
  }

  shutdown(): void {
    logger.info('Shutting down NEAR coordinator');
    // Cleanup if needed
  }
}