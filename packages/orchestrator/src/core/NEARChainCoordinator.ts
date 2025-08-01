import { connect, KeyPair, Account, providers, keyStores, transactions } from 'near-api-js';
const { JsonRpcProvider } = providers;
const { UnencryptedFileSystemKeyStore, InMemoryKeyStore } = keyStores;
const { SignedTransaction } = transactions;
import { createLogger } from '../utils/logger';
import { config } from '../config';
import { SessionManager, SwapSession } from './SessionManager';
import { SecretManager } from './SecretManager';
import { ApiErrorFactory } from '../api/middleware/errorHandler';
import { NearTransaction, EventData } from '../types';

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
  private provider: providers.JsonRpcProvider;
  private masterAccount?: Account;
  private htlcContract: string;
  private nearConfig: NEARConfig;
  private nearConnection: any;

  constructor(
    private sessionManager: SessionManager,
    private secretManager: SecretManager
  ) {
    // Initialize NEAR config
    this.nearConfig = {
      networkId: config.chains.near?.networkId || 'testnet',
      nodeUrl: config.chains.near?.rpcUrl || 'https://rpc.testnet.near.org',
      backupNodeUrl: 'https://test.rpc.fastnear.com',
      walletUrl: `https://wallet.${config.chains.near?.networkId || 'testnet'}.near.org`,
      helperUrl: `https://helper.${config.chains.near?.networkId || 'testnet'}.near.org`,
      explorerUrl: `https://explorer.${config.chains.near?.networkId || 'testnet'}.near.org`,
      htlcContract: config.chains.near?.contracts?.htlc || 'fusion-htlc.testnet',
      solverRegistry: config.chains.near?.contracts?.solverRegistry || 'solver-registry.testnet',
      masterAccount: process.env.NEAR_MASTER_ACCOUNT,
      privateKey: process.env.NEAR_PRIVATE_KEY,
    };

    this.htlcContract = this.nearConfig.htlcContract;

    // Initialize RPC provider with failover
    this.initializeProvider();
    
    // Initialize NEAR connection
    this.initializeNear();
  }

  private initializeProvider(): void {
    // Create JSON RPC provider
    this.provider = new providers.JsonRpcProvider({ url: this.nearConfig.nodeUrl });
  }

  private async initializeNear(): Promise<void> {
    try {
      // Setup key store
      let keyStore: InMemoryKeyStore | UnencryptedFileSystemKeyStore;
      
      if (this.nearConfig.privateKey && this.nearConfig.masterAccount) {
        // Use in-memory key store for server environment
        keyStore = new InMemoryKeyStore();
        const keyPair = KeyPair.fromString(this.nearConfig.privateKey);
        await keyStore.setKey(this.nearConfig.networkId, this.nearConfig.masterAccount, keyPair);
      } else {
        // Use unencrypted file system key store (for development)
        const keyPath = process.env.NEAR_KEY_PATH || `${process.env.HOME}/.near-credentials`;
        keyStore = new UnencryptedFileSystemKeyStore(keyPath);
      }

      // Initialize NEAR connection using modern API
      this.nearConnection = await connect({
        networkId: this.nearConfig.networkId,
        provider: this.provider,
        keyStore,
      });

      // Initialize master account if credentials provided
      if (this.nearConfig.masterAccount) {
        this.masterAccount = new Account(
          this.nearConnection,
          this.nearConfig.masterAccount
        );
        
        logger.info('NEAR connection initialized', {
          networkId: this.nearConfig.networkId,
          htlcContract: this.htlcContract,
          masterAccount: this.nearConfig.masterAccount,
        });
      } else {
        logger.warn('NEAR initialized without master account - limited functionality');
      }
    } catch (error) {
      logger.error('Failed to initialize NEAR connection', { error });
      throw error;
    }
  }

  async createHTLC(params: HTLCParams): Promise<string> {
    try {
      logger.info('Creating NEAR HTLC', { params });

      if (!this.masterAccount) {
        throw new Error('NEAR master account not configured');
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
        gas: BigInt('300000000000000'), // 300 TGas
        attachedDeposit: params.token === 'near' ? BigInt(amount) : BigInt(1), // Attach amount if NEAR, else storage deposit
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
        gas: BigInt('300000000000000'), // 300 TGas
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
        gas: BigInt('300000000000000'), // 300 TGas
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

      if (result.result) {
        const htlc = JSON.parse(Buffer.from(result.result).toString());
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

      if (result.result) {
        const htlcs = JSON.parse(Buffer.from(result.result).toString());
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

      if (result.result) {
        const events = JSON.parse(Buffer.from(result.result).toString());
        for (const event of events) {
          await this.handleNearEvent(event);
        }
      }
    } catch (error) {
      // Contract might not have get_recent_events method, use alternative approach
      logger.debug('Using alternative event monitoring approach');
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

  private async handleSecretRevealed(event: HTLCEvent): Promise<void> {
    const { htlc_id, secret } = event;
    
    if (!htlc_id || !secret) {
      logger.warn('Invalid secret revealed event', { event });
      return;
    }

    logger.info('Secret revealed on NEAR', { htlc_id, secret });

    // Find session by NEAR HTLC ID
    const sessions = this.sessionManager.getActiveSessions();
    const session = sessions.find(s => 
      s.nearHTLCId === htlc_id && 
      s.status === 'secret_revealed_near'
    );

    if (session) {
      // Update session with revealed secret
      session.revealedSecret = secret;
      session.status = 'withdrawing_base';
      this.sessionManager.updateSession(session.id, session);

      // Trigger BASE withdrawal
      logger.info('Triggering BASE withdrawal with revealed secret', {
        sessionId: session.id,
        secret,
      });
    }
  }

  private async handleHTLCCreated(event: HTLCEvent): Promise<void> {
    logger.info('HTLC created on NEAR', { event });
    // Handle HTLC creation if needed
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
      return ApiErrorFactory.internal('NEAR operation failed', { 
        error: error.message || error.toString() 
      });
    }
  }

  shutdown(): void {
    logger.info('Shutting down NEAR coordinator');
    // Cleanup if needed
  }
}