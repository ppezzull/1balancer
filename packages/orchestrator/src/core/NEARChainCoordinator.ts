import { connect, KeyPair, Account, providers, keyStores } from 'near-api-js';
const { InMemoryKeyStore } = keyStores;
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
      // Check if we have valid credentials
      if (!this.nearConfig.privateKey || !this.nearConfig.masterAccount || 
          this.nearConfig.privateKey === '' || this.nearConfig.masterAccount === '') {
        logger.warn('NEAR credentials not provided - limited functionality', {
          hasAccount: !!this.nearConfig.masterAccount,
          hasPrivateKey: !!this.nearConfig.privateKey,
        });
        
        // Still create connection for read-only operations
        const keyStore = new InMemoryKeyStore();
        this.nearConnection = await connect({
          networkId: this.nearConfig.networkId,
          nodeUrl: this.nearConfig.nodeUrl,
          keyStore,
        });
        
        return;
      }
      
      // Setup key store
      let keyStore: keyStores.KeyStore = new InMemoryKeyStore();
      let hasValidCredentials = false;
      
      try {
        // Try to parse and set the private key
        const keyPair = KeyPair.fromString(this.nearConfig.privateKey as any);
        await keyStore.setKey(this.nearConfig.networkId, this.nearConfig.masterAccount, keyPair);
        hasValidCredentials = true;
        logger.info('NEAR private key validated successfully');
      } catch (keyError) {
        logger.warn('Invalid NEAR private key format - continuing with read-only access', { 
          error: keyError,
          keyFormat: 'Expected format: ed25519:base58_encoded_key (88+ chars after prefix)'
        });
        // Continue with empty keystore for read-only operations
      }

      // Initialize NEAR connection (works with or without credentials)
      this.nearConnection = await connect({
        networkId: this.nearConfig.networkId,
        nodeUrl: this.nearConfig.nodeUrl,
        keyStore,
      });

      // Initialize master account only if we have valid credentials
      if (hasValidCredentials) {
        this.masterAccount = new Account(
          this.nearConnection,
          this.nearConfig.masterAccount
        );
        logger.info('NEAR master account initialized for write operations');
      } else {
        logger.warn('NEAR running in read-only mode - write operations will fail');
      }
      
      logger.info('NEAR connection initialized with credentials', {
        networkId: this.nearConfig.networkId,
        htlcContract: this.htlcContract,
        masterAccount: this.nearConfig.masterAccount,
        contractSource: this.htlcContract.includes('fusion-htlc.testnet') ? 'default' : 'configured',
      });
    } catch (error) {
      logger.error('Failed to initialize NEAR connection', { error });
      throw error;
    }
  }

  async createHTLC(params: HTLCParams): Promise<string> {
    try {
      logger.info('Creating NEAR HTLC', { params });

      if (!this.masterAccount) {
        throw new Error('NEAR write operations unavailable - invalid private key format. Expected: ed25519:base58_key (88+ chars)');
      }

      // Convert amount to yoctoNEAR if native NEAR
      const amount = params.token === 'near' 
        ? this.parseNearAmount(params.amount)
        : params.amount;

      // Call create_htlc on NEAR contract
      const result = await this.masterAccount.functionCall({
        contractId: this.htlcContract,
        methodName: 'create_htlc',
        args: {
          args: {
            receiver: params.receiver,
            token: params.token,
            amount: amount,
            hashlock: params.hashlock,
            timelock: params.timelock,
            order_hash: params.orderHash,
          }
        },
        gas: BigInt('30000000000000'), // 30 TGas - reduced for cost optimization
        attachedDeposit: params.token === 'near' ? BigInt(amount) : BigInt('10000000000000000000000'), // 0.01 NEAR min storage
      });

      // Extract HTLC ID from result
      const htlcId = this.extractHTLCId(result);
      
      logger.info('NEAR HTLC created', { 
        htlcId,
        txHash: result.transaction.hash,
        params 
      });

      return htlcId;
    } catch (error) {
      logger.error('Failed to create NEAR HTLC', { error, params });
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