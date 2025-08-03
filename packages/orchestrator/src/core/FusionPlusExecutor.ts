import { ethers } from 'ethers';
import { createLogger } from '../utils/logger';
import { config } from '../config';
import { SessionManager, SwapSession } from './SessionManager';
import { SecretManager } from './SecretManager';
import { NEARChainCoordinator } from './NEARChainCoordinator';
import { WebSocketManager } from '../services/WebSocketManager';
import { ApiErrorFactory } from '../api/middleware/errorHandler';

const logger = createLogger('FusionPlusExecutor');

// Contract ABIs
const ESCROW_FACTORY_ABI = [
  'function createSrcEscrow(tuple(address maker, address taker, address token, uint256 amount, uint256 safetyDeposit, bytes32 hashlockHash, tuple(uint32 srcWithdrawal, uint32 srcPublicWithdrawal, uint32 srcCancellation, uint32 srcDeployedAt, uint32 dstWithdrawal, uint32 dstCancellation, uint32 dstDeployedAt) timelocks, bytes32 orderHash, uint256 chainId) immutables) payable returns (address)',
  'function createDstEscrow(tuple(address maker, address taker, address token, uint256 amount, uint256 safetyDeposit, bytes32 hashlockHash, tuple(uint32 srcWithdrawal, uint32 srcPublicWithdrawal, uint32 srcCancellation, uint32 srcDeployedAt, uint32 dstWithdrawal, uint32 dstCancellation, uint32 dstDeployedAt) timelocks, bytes32 orderHash, uint256 chainId) immutables, uint256 srcCancellationTimestamp) payable returns (address)',
  'event SrcEscrowCreated(address indexed escrow, address indexed maker, address indexed taker, bytes32 hashlockHash)',
  'event DstEscrowCreated(address indexed escrow, address indexed maker, address indexed taker, bytes32 hashlockHash)',
];

const ESCROW_SRC_ABI = [
  'function withdraw(bytes32 secret) external',
  'function cancel() external',
  'function publicWithdraw(bytes32 secret) external',
  'event Withdrawn(bytes32 secret)',
  'event Cancelled()',
  'function getImmutables() view returns (tuple(address maker, address taker, address token, uint256 amount, uint256 safetyDeposit, bytes32 hashlockHash, tuple(uint32 srcWithdrawal, uint32 srcPublicWithdrawal, uint32 srcCancellation, uint32 srcDeployedAt, uint32 dstWithdrawal, uint32 dstCancellation, uint32 dstDeployedAt) timelocks, bytes32 orderHash, uint256 chainId))',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

interface ExecutionStep {
  function: string;
  contract: string;
  params: any;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  txHash?: string;
  result?: any;
  error?: string;
  gasUsed?: string;
}

export class FusionPlusExecutor {
  private baseProvider: ethers.JsonRpcProvider;
  private escrowFactory: ethers.Contract;
  private nearCoordinator: NEARChainCoordinator;
  private executionSteps: Map<string, ExecutionStep[]> = new Map();
  
  constructor(
    private sessionManager: SessionManager,
    secretManager: SecretManager,
    private wsManager: WebSocketManager
  ) {
    this.baseProvider = new ethers.JsonRpcProvider(config.chains.base.rpcUrl);
    // Use hardcoded address if config returns zero address
    const factoryAddress = config.contracts.escrowFactory === ethers.ZeroAddress 
      ? '0x135aCf86351F2113726318dE6b4ca66FA90d54Fd'
      : config.contracts.escrowFactory;
    
    logger.info('Initializing FusionPlusExecutor', {
      baseRpcUrl: config.chains.base.rpcUrl,
      factoryAddress,
      configFactoryAddress: config.contracts.escrowFactory,
      defaultFactoryAddress: '0x135aCf86351F2113726318dE6b4ca66FA90d54Fd'
    });
    
    this.escrowFactory = new ethers.Contract(
      factoryAddress,
      ESCROW_FACTORY_ABI,
      this.baseProvider
    );
    
    logger.info('EscrowFactory contract initialized', {
      address: this.escrowFactory.target,
      provider: this.baseProvider._getConnection().url
    });
    
    this.nearCoordinator = new NEARChainCoordinator(sessionManager, secretManager);
  }

  /**
   * Execute a complete fusion+ swap with real blockchain transactions
   */
  async executeFullSwap(sessionId: string): Promise<void> {
    const session = await this.sessionManager.getSession(sessionId);
    if (!session) {
      throw ApiErrorFactory.notFound('Session not found');
    }

    logger.info('Starting full Fusion+ swap execution', { sessionId });
    this.executionSteps.set(sessionId, []);

    try {
      // Step 1: Deploy escrow on BASE
      await this.deployBaseEscrow(session);
      
      // Step 2: Create HTLC on NEAR
      await this.createNearHTLC(session);
      
      // Step 3: Monitor for completion
      await this.startMonitoring(session);
      
      logger.info('Fusion+ swap initiated successfully', { sessionId });
      
    } catch (error) {
      logger.error('Failed to execute Fusion+ swap', { sessionId, error });
      await this.handleExecutionFailure(session, error as Error);
      throw error;
    }
  }

  /**
   * Deploy escrow on BASE with transparent logging
   */
  private async deployBaseEscrow(session: SwapSession): Promise<void> {
    logger.info('Deploying escrow on BASE', { sessionId: session.sessionId });
    
    const step: ExecutionStep = {
      function: 'createSrcEscrow',
      contract: 'EscrowFactory',
      params: {},
      status: 'pending'
    };
    
    this.addExecutionStep(session.sessionId, step);
    
    try {
      // Log raw session data
      logger.info('Raw session data', {
        sessionId: session.sessionId,
        maker: session.maker,
        taker: session.taker,
        sourceToken: session.sourceToken,
        sourceAmount: session.sourceAmount,
        hashlockHash: session.hashlockHash
      });
      
      // Validate and format addresses
      // Fix checksum for the maker address
      let makerAddress: string;
      try {
        makerAddress = ethers.getAddress(session.maker);
      } catch (e) {
        // If checksum fails, convert to proper checksum format
        logger.warn('Invalid maker address checksum, converting to proper format', {
          original: session.maker,
          error: (e as Error).message
        });
        // Convert to lowercase first, then use getAddress to get proper checksum
        makerAddress = ethers.getAddress(session.maker.toLowerCase());
      }
      
      const sourceTokenAddress = session.sourceToken === ethers.ZeroAddress ? 
        ethers.ZeroAddress : 
        ethers.getAddress(session.sourceToken);
      
      logger.info('Formatted addresses', {
        originalMaker: session.maker,
        formattedMaker: makerAddress,
        originalToken: session.sourceToken,
        formattedToken: sourceTokenAddress
      });
      
      // Prepare immutables
      const timelocks = this.calculateTimelocks();
      const immutables = {
        maker: makerAddress,
        taker: session.taker,
        token: sourceTokenAddress,
        amount: session.sourceAmount,
        safetyDeposit: ethers.parseEther('0.0001'), // Minimum safety deposit (0.0001 ETH)
        hashlockHash: session.hashlockHash,
        timelocks,
        orderHash: ethers.keccak256(ethers.toUtf8Bytes(session.sessionId)),
        chainId: config.chains.base.chainId,
      };
      
      step.params = {
        immutables: {
          maker: immutables.maker,
          taker: immutables.taker,
          token: immutables.token,
          amount: immutables.amount.toString(),
          safetyDeposit: immutables.safetyDeposit.toString(),
          hashlockHash: immutables.hashlockHash,
          timelocks: Object.entries(immutables.timelocks).reduce((acc, [key, val]) => ({
            ...acc,
            [key]: val.toString()
          }), {}),
          orderHash: immutables.orderHash,
          chainId: immutables.chainId
        }
      };
      
      step.status = 'executing';
      this.updateExecutionStep(session.sessionId, step);
      
      // Get wallet
      const privateKey = process.env.ORCHESTRATOR_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('ORCHESTRATOR_PRIVATE_KEY not set');
      }
      
      const wallet = new ethers.Wallet(privateKey, this.baseProvider);
      
      // Check wallet balance
      const balance = await this.baseProvider.getBalance(wallet.address);
      const requiredBalance = immutables.safetyDeposit + ethers.parseEther('0.001'); // Safety deposit + gas
      
      logger.info('Checking wallet balance', {
        wallet: wallet.address,
        balance: ethers.formatEther(balance),
        required: ethers.formatEther(requiredBalance)
      });
      
      if (balance < requiredBalance) {
        const error = new Error(`Insufficient funds. Wallet ${wallet.address} has ${ethers.formatEther(balance)} ETH but needs at least ${ethers.formatEther(requiredBalance)} ETH. Please fund the wallet using BASE Sepolia faucet.`);
        logger.error('Insufficient funds for escrow deployment', {
          wallet: wallet.address,
          balance: ethers.formatEther(balance),
          required: ethers.formatEther(requiredBalance)
        });
        throw error;
      }
      
      const escrowFactoryWithSigner = this.escrowFactory.connect(wallet);
      
      // Check token approval if not native ETH
      if (session.sourceToken !== ethers.ZeroAddress) {
        await this.ensureTokenApproval(
          session.sourceToken,
          wallet,
          this.escrowFactory.target as string,
          session.sourceAmount
        );
      }
      
      // Deploy escrow
      logger.info('Calling createSrcEscrow', {
        factoryAddress: this.escrowFactory.target,
        immutables: step.params.immutables
      });
      
      // Log the actual factory address being used
      logger.info('Factory contract details', {
        factoryAddress: this.escrowFactory.target,
        signerAddress: wallet.address,
        connectedFactoryAddress: escrowFactoryWithSigner.target
      });
      
      // Log immutables object before gas estimation
      logger.info('Immutables object for gas estimation', {
        immutables: JSON.stringify(immutables, (_key, value) => 
          typeof value === 'bigint' ? value.toString() : value
        , 2)
      });
      
      // Let ethers.js estimate gas for Base Sepolia
      let gasEstimate;
      try {
        gasEstimate = await (escrowFactoryWithSigner as any).createSrcEscrow.estimateGas(
          immutables,
          { value: immutables.safetyDeposit }
        );
        
        logger.info('Gas estimation successful', {
          estimatedGas: gasEstimate.toString(),
          wallet: wallet.address
        });
      } catch (gasError) {
        logger.error('Gas estimation failed', {
          error: gasError,
          immutables: JSON.stringify(immutables, (_key, value) => 
            typeof value === 'bigint' ? value.toString() : value
          , 2)
        });
        throw gasError;
      }
      
      const tx = await (escrowFactoryWithSigner as any).createSrcEscrow(
        immutables,
        {
          value: immutables.safetyDeposit,
          gasLimit: gasEstimate * 120n / 100n, // Add 20% buffer
          maxFeePerGas: ethers.parseUnits('2', 'gwei'), // Base Sepolia typical gas
          maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei')
        }
      );
      
      step.txHash = tx.hash;
      logger.info('Escrow deployment transaction sent', { 
        txHash: tx.hash,
        explorer: `https://sepolia.basescan.org/tx/${tx.hash}`
      });
      
      this.updateExecutionStep(session.sessionId, step);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Extract escrow address from events
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.escrowFactory.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          return parsed?.name === 'SrcEscrowCreated';
        } catch {
          return false;
        }
      });
      
      if (!event) {
        throw new Error('SrcEscrowCreated event not found');
      }
      
      const parsedEvent = this.escrowFactory.interface.parseLog({
        topics: event.topics,
        data: event.data
      });
      
      const escrowAddress = parsedEvent?.args?.escrow;
      
      step.status = 'completed';
      step.result = {
        escrowAddress,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      step.gasUsed = receipt.gasUsed.toString();
      
      this.updateExecutionStep(session.sessionId, step);
      
      // Update session
      await this.sessionManager.updateSessionWithEscrow(
        session.sessionId,
        'src',
        escrowAddress
      );
      await this.sessionManager.updateSessionStatus(session.sessionId, 'source_locked');
      
      // Send WebSocket update
      this.wsManager.sendToSession(session.sessionId, {
        type: 'session_update',
        status: 'source_locked',
        data: {
          phase: 'source_locked',
          progress: 30,
          escrowAddress,
          txHash: tx.hash,
          explorer: `https://sepolia.basescan.org/tx/${tx.hash}`
        }
      });
      
      logger.info('BASE escrow deployed successfully', {
        sessionId: session.sessionId,
        escrowAddress,
        txHash: tx.hash
      });
      
    } catch (error) {
      step.status = 'failed';
      step.error = (error as Error).message;
      this.updateExecutionStep(session.sessionId, step);
      
      logger.error('Escrow deployment failed', {
        sessionId: session.sessionId,
        error: (error as Error).message,
        stack: (error as Error).stack,
        wallet: process.env.ORCHESTRATOR_PRIVATE_KEY ? 
          new ethers.Wallet(process.env.ORCHESTRATOR_PRIVATE_KEY).address : 
          'No wallet configured',
        code: (error as any).code,
        reason: (error as any).reason,
        data: (error as any).data
      });
      
      // Send detailed error via WebSocket
      this.wsManager.sendToSession(session.sessionId, {
        type: 'execution_error',
        data: {
          phase: 'source_locking',
          error: (error as Error).message,
          details: (error as any).reason || (error as any).code || 'Unknown error',
          step: step
        }
      });
      
      throw error;
    }
  }

  /**
   * Create HTLC on NEAR with transparent logging
   */
  private async createNearHTLC(session: SwapSession): Promise<void> {
    logger.info('Creating HTLC on NEAR', { sessionId: session.sessionId });
    
    const step: ExecutionStep = {
      function: 'create_htlc',
      contract: 'fusion-htlc.rog_eth.testnet',
      params: {},
      status: 'pending'
    };
    
    this.addExecutionStep(session.sessionId, step);
    
    try {
      const params = {
        receiver: session.taker,
        token: session.destinationToken,
        amount: session.destinationAmount,
        hashlock: session.hashlockHash,
        timelock: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        orderHash: session.orderHash || session.hashlockHash
      };
      
      step.params = params;
      step.status = 'executing';
      this.updateExecutionStep(session.sessionId, step);
      
      // Call NEAR coordinator
      const htlcId = await this.nearCoordinator.createHTLC(params);
      
      step.status = 'completed';
      step.result = {
        htlcId,
        explorer: `https://testnet.nearblocks.io/address/${htlcId}`
      };
      
      this.updateExecutionStep(session.sessionId, step);
      
      // Update session
      session.nearHTLCId = htlcId;
      await this.sessionManager.updateSession(session.sessionId, {
        nearHTLCId: htlcId,
        dstEscrowAddress: htlcId,
        status: 'both_locked'
      });
      
      // Send WebSocket update
      this.wsManager.sendToSession(session.sessionId, {
        type: 'session_update',
        status: 'both_locked',
        data: {
          phase: 'both_locked',
          progress: 70,
          nearHTLCId: htlcId,
          explorer: `https://testnet.nearblocks.io/address/${htlcId}`
        }
      });
      
      logger.info('NEAR HTLC created successfully', {
        sessionId: session.sessionId,
        htlcId
      });
      
    } catch (error) {
      step.status = 'failed';
      step.error = (error as Error).message;
      this.updateExecutionStep(session.sessionId, step);
      throw error;
    }
  }

  /**
   * Start monitoring both chains for secret revelation
   */
  private async startMonitoring(session: SwapSession): Promise<void> {
    logger.info('Starting cross-chain monitoring', { sessionId: session.sessionId });
    
    // Monitor BASE escrow for withdrawals
    if (session.srcEscrowAddress) {
      const escrow = new ethers.Contract(
        session.srcEscrowAddress,
        ESCROW_SRC_ABI,
        this.baseProvider
      );
      
      escrow.on('Withdrawn', async (secret: string) => {
        logger.info('Secret revealed on BASE', {
          sessionId: session.sessionId,
          secret: secret.slice(0, 10) + '...'
        });
        
        // Withdraw on NEAR using the revealed secret
        await this.completeNearWithdrawal(session, secret);
      });
    }
    
    // Monitor NEAR for secret revelations
    this.nearCoordinator.monitorEvents(async (event: any) => {
      if (event.eventName === 'secret_revealed' && event.htlc_id === session.nearHTLCId) {
        logger.info('Secret revealed on NEAR', {
          sessionId: session.sessionId,
          secret: event.secret?.slice(0, 10) + '...'
        });
        
        // Withdraw on BASE using the revealed secret
        await this.completeBaseWithdrawal(session, event.secret);
      }
    });
  }

  /**
   * Complete withdrawal on NEAR after secret is revealed
   */
  private async completeNearWithdrawal(session: SwapSession, secret: string): Promise<void> {
    const step: ExecutionStep = {
      function: 'withdraw',
      contract: session.nearHTLCId || 'NEAR HTLC',
      params: { secret },
      status: 'executing'
    };
    
    this.addExecutionStep(session.sessionId, step);
    
    try {
      await this.nearCoordinator.withdrawHTLC(
        session.nearHTLCId!,
        secret,
        session.taker
      );
      
      step.status = 'completed';
      this.updateExecutionStep(session.sessionId, step);
      
      await this.sessionManager.updateSessionStatus(session.sessionId, 'completed');
      
      // Send completion update
      this.wsManager.sendToSession(session.sessionId, {
        type: 'session_update',
        status: 'completed',
        data: {
          phase: 'completed',
          progress: 100,
          message: 'Swap completed successfully!'
        }
      });
      
    } catch (error) {
      step.status = 'failed';
      step.error = (error as Error).message;
      this.updateExecutionStep(session.sessionId, step);
      throw error;
    }
  }

  /**
   * Complete withdrawal on BASE after secret is revealed
   */
  private async completeBaseWithdrawal(session: SwapSession, secret: string): Promise<void> {
    if (!session.srcEscrowAddress) return;
    
    const step: ExecutionStep = {
      function: 'withdraw',
      contract: session.srcEscrowAddress,
      params: { secret },
      status: 'executing'
    };
    
    this.addExecutionStep(session.sessionId, step);
    
    try {
      const privateKey = process.env.ORCHESTRATOR_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('ORCHESTRATOR_PRIVATE_KEY not set');
      }
      
      const wallet = new ethers.Wallet(privateKey, this.baseProvider);
      const escrow = new ethers.Contract(
        session.srcEscrowAddress,
        ESCROW_SRC_ABI,
        wallet
      );
      
      const tx = await (escrow as any).withdraw(secret);
      step.txHash = tx.hash;
      
      await tx.wait();
      
      step.status = 'completed';
      this.updateExecutionStep(session.sessionId, step);
      
      await this.sessionManager.updateSessionStatus(session.sessionId, 'completed');
      
      // Send completion update
      this.wsManager.sendToSession(session.sessionId, {
        type: 'session_update',
        status: 'completed',
        data: {
          phase: 'completed',
          progress: 100,
          message: 'Swap completed successfully!',
          txHash: tx.hash
        }
      });
      
    } catch (error) {
      step.status = 'failed';
      step.error = (error as Error).message;
      this.updateExecutionStep(session.sessionId, step);
      throw error;
    }
  }

  /**
   * Get execution steps for transparency
   */
  getExecutionSteps(sessionId: string): ExecutionStep[] {
    return this.executionSteps.get(sessionId) || [];
  }

  /**
   * Calculate timelocks for the swap
   */
  private calculateTimelocks() {
    const now = Math.floor(Date.now() / 1000);
    
    return {
      srcWithdrawal: now + 300,      // 5 minutes
      srcPublicWithdrawal: now + 600, // 10 minutes
      srcCancellation: now + 900,     // 15 minutes
      srcDeployedAt: now,
      dstWithdrawal: now + 240,      // 4 minutes (before src)
      dstCancellation: now + 840,     // 14 minutes (before src)
      dstDeployedAt: now
    };
  }

  /**
   * Ensure token approval for escrow factory
   */
  private async ensureTokenApproval(
    tokenAddress: string,
    wallet: ethers.Wallet,
    spender: string,
    amount: string
  ): Promise<void> {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
    
    const allowance = await (token as any).allowance(wallet.address, spender);
    
    if (allowance < BigInt(amount)) {
      logger.info('Approving token for escrow factory', {
        token: tokenAddress,
        spender,
        amount
      });
      
      const approveTx = await (token as any).approve(spender, amount);
      await approveTx.wait();
      
      logger.info('Token approval completed', { txHash: approveTx.hash });
    }
  }

  /**
   * Handle execution failures
   */
  private async handleExecutionFailure(session: SwapSession, error: Error): Promise<void> {
    logger.error('Handling execution failure', {
      sessionId: session.sessionId,
      error: error.message
    });
    
    await this.sessionManager.updateSessionStatus(session.sessionId, 'failed');
    
    // Send failure update
    this.wsManager.sendToSession(session.sessionId, {
      type: 'session_update',
      status: 'failed',
      data: {
        phase: 'failed',
        error: error.message,
        steps: this.getExecutionSteps(session.sessionId)
      }
    });
  }

  /**
   * Add execution step for transparency
   */
  private addExecutionStep(sessionId: string, step: ExecutionStep): void {
    const steps = this.executionSteps.get(sessionId) || [];
    steps.push(step);
    this.executionSteps.set(sessionId, steps);
    
    // Send real-time update
    this.wsManager.sendToSession(sessionId, {
      type: 'execution_step',
      data: { step }
    });
  }

  /**
   * Update execution step
   */
  private updateExecutionStep(sessionId: string, updatedStep: ExecutionStep): void {
    const steps = this.executionSteps.get(sessionId) || [];
    const index = steps.findIndex(s => 
      s.function === updatedStep.function && 
      s.contract === updatedStep.contract
    );
    
    if (index >= 0) {
      steps[index] = updatedStep;
      this.executionSteps.set(sessionId, steps);
      
      // Send real-time update
      this.wsManager.sendToSession(sessionId, {
        type: 'execution_step_update',
        data: { step: updatedStep }
      });
    }
  }

  /**
   * Simulate execution for demo purposes
   */
  async simulateExecution(sessionId: string): Promise<void> {
    const session = await this.sessionManager.getSession(sessionId);
    if (!session) {
      throw ApiErrorFactory.notFound('Session not found');
    }

    logger.info('Simulating Fusion+ execution for demo', { sessionId });

    // Simulate each step with delays
    const steps = [
      { status: 'source_locking', progress: 10, delay: 2000 },
      { status: 'source_locked', progress: 30, delay: 3000 },
      { status: 'destination_locking', progress: 50, delay: 2000 },
      { status: 'both_locked', progress: 70, delay: 3000 },
      { status: 'revealing_secret', progress: 90, delay: 2000 },
      { status: 'completed', progress: 100, delay: 1000 }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.delay));
      
      await this.sessionManager.updateSessionStatus(sessionId, step.status as any);
      
      this.wsManager.sendToSession(sessionId, {
        type: 'session_update',
        status: step.status,
        data: {
          phase: step.status,
          progress: step.progress,
          message: `Simulating ${step.status}...`
        }
      });
    }

    logger.info('Simulation completed', { sessionId });
  }
}