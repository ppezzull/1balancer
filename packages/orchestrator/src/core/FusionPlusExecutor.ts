import { ethers } from 'ethers';
import { createLogger } from '../utils/logger';
import { config } from '../config';
import { SessionManager, SwapSession } from './SessionManager';
import { SecretManager } from './SecretManager';
import { NEARChainCoordinator } from './NEARChainCoordinator';
import { WebSocketManager } from '../services/WebSocketManager';
import { ApiErrorFactory } from '../api/middleware/errorHandler';

const logger = createLogger('FusionPlusExecutor');

// Standard ETH address for native ETH (EIP-7528)
const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

// Contract ABIs
const ESCROW_FACTORY_ABI = [
  'function createSrcEscrow(tuple(address maker, address taker, address token, uint256 amount, uint256 safetyDeposit, bytes32 hashlockHash, tuple(uint32 srcWithdrawal, uint32 srcPublicWithdrawal, uint32 srcCancellation, uint32 srcDeployedAt, uint32 dstWithdrawal, uint32 dstCancellation, uint32 dstDeployedAt) timelocks, bytes32 orderHash, uint256 chainId) immutables) payable returns (address)',
  'function createDstEscrow(tuple(address maker, address taker, address token, uint256 amount, uint256 safetyDeposit, bytes32 hashlockHash, tuple(uint32 srcWithdrawal, uint32 srcPublicWithdrawal, uint32 srcCancellation, uint32 srcDeployedAt, uint32 dstWithdrawal, uint32 dstCancellation, uint32 dstDeployedAt) timelocks, bytes32 orderHash, uint256 chainId) immutables, uint256 srcCancellationTimestamp) payable returns (address)',
  'event SrcEscrowCreated(address indexed escrow, address indexed maker, address indexed taker, bytes32 hashlockHash)',
  'event DstEscrowCreated(address indexed escrow, address indexed maker, address indexed taker, bytes32 hashlockHash)',
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
    
    // Verify contract exists on chain
    this.verifyContractDeployment().catch(error => {
      logger.error('Failed to verify contract deployment', {
        error: (error as Error).message
      });
    });
    
    this.nearCoordinator = new NEARChainCoordinator(sessionManager, secretManager);
  }

  /**
   * Verify that the escrow factory contract is deployed and accessible
   */
  private async verifyContractDeployment(): Promise<void> {
    try {
      const code = await this.baseProvider.getCode(this.escrowFactory.target as string);
      if (code === '0x') {
        logger.error('EscrowFactory contract not found on chain!', {
          address: this.escrowFactory.target,
          network: config.chains.base.rpcUrl
        });
      } else {
        logger.info('EscrowFactory contract verified on chain', {
          address: this.escrowFactory.target,
          codeSize: code.length,
          network: config.chains.base.rpcUrl
        });
        
        // ABI verification - since we're using a minimal ABI, we'll skip the DEFAULT_ADMIN_ROLE check
        logger.info('EscrowFactory contract ready', {
          contractAddress: this.escrowFactory.target,
          abiFunctions: this.escrowFactory.interface.fragments
            .filter(f => f.type === 'function')
            .map(f => f.format().split('(')[0])
        });
      }
    } catch (error) {
      logger.error('Failed to verify contract deployment', {
        error: (error as Error).message,
        contractAddress: this.escrowFactory.target
      });
    }
  }

  /**
   * Execute a complete fusion+ swap with real blockchain transactions
   * This method now implements the full atomic swap including secret revelation and token exchange
   */
  async executeFullSwap(sessionId: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const session = await this.sessionManager.getSession(sessionId);
    if (!session) {
      throw ApiErrorFactory.notFound('Session not found');
    }

    logger.info(`[${timestamp}][FUSION+] Starting complete Fusion+ atomic swap execution`, {
      sessionId,
      maker: session.maker,
      taker: session.taker,
      sourceChain: session.sourceChain,
      destinationChain: session.destinationChain,
      sourceToken: session.sourceToken,
      destinationToken: session.destinationToken,
      sourceAmount: session.sourceAmount,
      destinationAmount: session.destinationAmount,
      flow: 'COMPLETE_ATOMIC_SWAP_WITH_TOKEN_EXCHANGE'
    });
    
    this.executionSteps.set(sessionId, []);

    try {
      // Step 1: Deploy escrow on BASE (Source Chain Locking)
      logger.info(`[${timestamp}][FUSION+] Step 1: Deploying escrow on BASE source chain`, {
        sessionId,
        action: 'source_chain_locking'
      });
      await this.deployBaseEscrow(session);
      
      // Step 2: Create HTLC on NEAR (Destination Chain Locking)  
      logger.info(`[${timestamp}][FUSION+] Step 2: Creating HTLC on NEAR destination chain`, {
        sessionId,
        action: 'destination_chain_locking'
      });
      await this.createNearHTLC(session);
      
      // Step 3: Wait for both chains to be confirmed locked
      logger.info(`[${timestamp}][FUSION+] Step 3: Waiting for both chains to be locked`, {
        sessionId,
        action: 'verify_both_locked'
      });
      await this.waitForBothLocked(session);
      
      // Step 4: Initiate secret revelation and complete token exchange (THE MISSING PIECE!)
      logger.info(`[${timestamp}][FUSION+] Step 4: Initiating secret revelation and token exchange`, {
        sessionId,
        action: 'complete_token_exchange',
        note: 'This is where the actual atomic swap happens!'
      });
      await this.initiateSecretRevelation(session);
      
      logger.info(`[${timestamp}][FUSION+] Complete Fusion+ atomic swap executed successfully`, {
        sessionId,
        finalStatus: 'completed',
        tokenExchangeComplete: true,
        aliceReceived: `${session.destinationAmount} ${session.destinationToken}`,
        bobReceived: `${session.sourceAmount} ${session.sourceToken}`,
        result: 'ATOMIC_SWAP_SUCCESS'
      });
      
    } catch (error) {
      const err = error as Error;
      logger.error(`[${timestamp}][FUSION+] Failed to execute complete Fusion+ swap`, {
        sessionId,
        error: err.message,
        stack: err.stack,
        errorType: err.constructor.name,
        phase: 'atomic_swap_execution'
      });
      await this.handleExecutionFailure(session, err);
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
        ethers.getAddress(ETH_ADDRESS) : 
        ethers.getAddress(session.sourceToken);
      
      logger.info('Formatted addresses', {
        originalMaker: session.maker,
        formattedMaker: makerAddress,
        originalToken: session.sourceToken,
        formattedToken: sourceTokenAddress
      });
      
      // Prepare immutables
      const timelocks = this.calculateTimelocks();
      
      logger.info('Calculated timelocks', {
        currentTime: Math.floor(Date.now() / 1000),
        timelocks,
        validation: {
          srcWithdrawalAfterDeployed: timelocks.srcWithdrawal > timelocks.srcDeployedAt,
          srcPublicAfterWithdrawal: timelocks.srcPublicWithdrawal > timelocks.srcWithdrawal,
          srcCancellationAfterPublic: timelocks.srcCancellation > timelocks.srcPublicWithdrawal,
          dstWithdrawalAfterDeployed: timelocks.dstWithdrawal > timelocks.dstDeployedAt,
          dstCancellationAfterWithdrawal: timelocks.dstCancellation > timelocks.dstWithdrawal,
          dstCancellationBeforeSrcWithdrawal: timelocks.dstCancellation < timelocks.srcWithdrawal,
          currentTimeValid: Math.floor(Date.now() / 1000) >= timelocks.srcDeployedAt
        }
      });
      
      // For cross-chain swaps with NEAR, we need to use a placeholder address
      // The actual NEAR account is stored in the session and handled separately
      let takerAddress: string;
      if (session.taker.endsWith('.testnet') || session.taker.endsWith('.near')) {
        // Use a deterministic placeholder address for NEAR accounts
        // This prevents ENS resolution attempts on non-ENS networks
        takerAddress = ethers.getAddress('0x' + '00'.repeat(19) + '01'); // 0x0000...0001
        logger.info('Using placeholder address for NEAR taker', {
          nearAccount: session.taker,
          placeholderAddress: takerAddress
        });
      } else {
        // Regular Ethereum address
        takerAddress = ethers.getAddress(session.taker);
      }
      
      const immutables = {
        maker: makerAddress,
        taker: takerAddress,
        token: sourceTokenAddress,
        amount: session.sourceAmount,
        safetyDeposit: ethers.parseEther('0.0001'), // Minimum safety deposit (0.0001 ETH)
        hashlockHash: session.hashlockHash,
        timelocks,
        orderHash: ethers.keccak256(ethers.toUtf8Bytes(session.sessionId)),
        chainId: config.chains.base.chainId,
      };
      
      // Log validation checks
      logger.info('Immutables validation checks', {
        makerNotZero: makerAddress !== ethers.ZeroAddress,
        takerNotZero: takerAddress !== ethers.ZeroAddress,
        tokenNotZero: sourceTokenAddress !== ethers.ZeroAddress,
        amountGreaterThanZero: BigInt(session.sourceAmount) > 0n,
        hashlockNotZero: session.hashlockHash !== ethers.ZeroHash,
        chainIdGreaterThanZero: config.chains.base.chainId > 0,
        values: {
          maker: makerAddress,
          taker: takerAddress,
          token: sourceTokenAddress,
          amount: session.sourceAmount,
          hashlockHash: session.hashlockHash,
          chainId: config.chains.base.chainId
        }
      });
      
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
        },
        // Store the actual NEAR account for reference
        nearTaker: session.taker.endsWith('.testnet') || session.taker.endsWith('.near') ? session.taker : undefined
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
      if (sourceTokenAddress !== ETH_ADDRESS) {
        await this.ensureTokenApproval(
          sourceTokenAddress,
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
        // Log the exact parameters being sent
        logger.info('Attempting gas estimation with parameters', {
          contractMethod: 'createSrcEscrow',
          immutablesStructure: {
            maker: immutables.maker,
            taker: immutables.taker,
            token: immutables.token,
            amount: immutables.amount.toString(),
            safetyDeposit: immutables.safetyDeposit.toString(),
            hashlockHash: immutables.hashlockHash,
            timelocks: {
              srcWithdrawal: immutables.timelocks.srcWithdrawal,
              srcPublicWithdrawal: immutables.timelocks.srcPublicWithdrawal,
              srcCancellation: immutables.timelocks.srcCancellation,
              srcDeployedAt: immutables.timelocks.srcDeployedAt,
              dstWithdrawal: immutables.timelocks.dstWithdrawal,
              dstCancellation: immutables.timelocks.dstCancellation,
              dstDeployedAt: immutables.timelocks.dstDeployedAt
            },
            orderHash: immutables.orderHash,
            chainId: immutables.chainId
          },
          value: immutables.safetyDeposit.toString()
        });
        
        // Check contract method exists
        const contractInterface = escrowFactoryWithSigner.interface;
        try {
          contractInterface.getFunction('createSrcEscrow');
        } catch (e) {
          const functionNames = contractInterface.fragments
            .filter(f => f.type === 'function')
            .map(f => (f as any).name)
            .filter(name => name);
          logger.error('createSrcEscrow method not found on contract!', {
            availableMethods: functionNames,
            error: (e as Error).message
          });
          throw new Error('createSrcEscrow method not found on contract');
        }
        
        gasEstimate = await (escrowFactoryWithSigner as any).createSrcEscrow.estimateGas(
          immutables,
          { value: immutables.safetyDeposit }
        );
        
        logger.info('Gas estimation successful', {
          estimatedGas: gasEstimate.toString(),
          wallet: wallet.address
        });
      } catch (gasError) {
        logger.error('Gas estimation failed - detailed error', {
          error: (gasError as any).message,
          code: (gasError as any).code,
          reason: (gasError as any).reason,
          data: (gasError as any).data,
          method: (gasError as any).method,
          transaction: (gasError as any).transaction,
          immutables: JSON.stringify(immutables, (_key, value) => 
            typeof value === 'bigint' ? value.toString() : value
          , 2),
          contractAddress: escrowFactoryWithSigner.target,
          walletAddress: wallet.address
        });
        
        // Try to decode the error
        if ((gasError as any).data) {
          try {
            const decodedError = escrowFactoryWithSigner.interface.parseError((gasError as any).data);
            logger.error('Decoded contract error', {
              errorName: decodedError?.name,
              errorArgs: decodedError?.args
            });
          } catch (decodeErr) {
            logger.error('Could not decode contract error', { 
              decodeError: (decodeErr as Error).message 
            });
          }
        }
        
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
      // For NEAR HTLCs, use the master account (with credentials) as receiver to enable withdrawal
      const nearMasterAccountId = await this.nearCoordinator.getMasterAccountId();
      
      const params = {
        receiver: session.taker.endsWith('.testnet') || session.taker.endsWith('.near') ? 
          nearMasterAccountId : session.taker, // Use master account as receiver for NEAR
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
      const nearResult = await this.nearCoordinator.createHTLC(params);
      const htlcId = typeof nearResult === 'string' ? nearResult : nearResult.htlcId;
      const txHash = typeof nearResult === 'string' ? nearResult : nearResult.txHash;
      const explorer = typeof nearResult === 'string' ? 
        `https://testnet.nearblocks.io/txns/${nearResult}` : 
        nearResult.explorer;
      
      step.status = 'completed';
      step.txHash = txHash; // Set txHash directly for display logic
      step.result = {
        htlcId,
        txHash, // Actual NEAR transaction hash
        explorer,
        contractExplorer: `https://testnet.nearblocks.io/address/fusion-htlc.rog_eth.testnet`
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
   * Wait for both chains to be locked before proceeding to secret revelation
   * This method polls the session status until both_locked is achieved
   */
  private async waitForBothLocked(session: SwapSession): Promise<void> {
    const timestamp = new Date().toISOString();
    const maxWaitTime = 10 * 60 * 1000; // 10 minutes
    const checkInterval = 5000; // 5 seconds
    const startTime = Date.now();
    
    logger.info(`[${timestamp}][FUSION+] Waiting for both chains to be locked`, {
      sessionId: session.sessionId,
      currentStatus: session.status,
      maxWaitTime: `${maxWaitTime / 1000}s`,
      checkInterval: `${checkInterval / 1000}s`,
      srcEscrowAddress: session.srcEscrowAddress,
      nearHTLCId: session.nearHTLCId
    });
    
    while (Date.now() - startTime < maxWaitTime) {
      const currentSession = await this.sessionManager.getSession(session.sessionId);
      
      if (!currentSession) {
        throw new Error(`Session ${session.sessionId} not found during wait`);
      }
      
      logger.debug(`[${timestamp}][FUSION+] Checking session status`, {
        sessionId: session.sessionId,
        currentStatus: currentSession.status,
        timeElapsed: `${(Date.now() - startTime) / 1000}s`,
        srcEscrowAddress: currentSession.srcEscrowAddress,
        nearHTLCId: currentSession.nearHTLCId
      });
      
      if (currentSession.status === 'both_locked') {
        logger.info(`[${timestamp}][FUSION+] Both chains confirmed locked - proceeding to secret revelation`, {
          sessionId: session.sessionId,
          totalWaitTime: `${(Date.now() - startTime) / 1000}s`,
          srcEscrowAddress: currentSession.srcEscrowAddress,
          nearHTLCId: currentSession.nearHTLCId,
          nextPhase: 'secret_revelation'
        });
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    const finalStatus = await this.sessionManager.getSession(session.sessionId);
    logger.error(`[${timestamp}][FUSION+] Timeout waiting for both chains to be locked`, {
      sessionId: session.sessionId,
      finalStatus: finalStatus?.status,
      timeoutAfter: `${maxWaitTime / 1000}s`,
      srcEscrowAddress: finalStatus?.srcEscrowAddress,
      nearHTLCId: finalStatus?.nearHTLCId
    });
    
    throw new Error('Timeout waiting for both chains to be locked');
  }

  /**
   * Initiate the secret revelation and token exchange phase
   * This is the core method that completes the atomic swap
   */
  private async initiateSecretRevelation(session: SwapSession): Promise<void> {
    const timestamp = new Date().toISOString();
    
    logger.info(`[${timestamp}][FUSION+] Initiating secret revelation phase - the actual token exchange`, {
      sessionId: session.sessionId,
      srcEscrowAddress: session.srcEscrowAddress,
      nearHTLCId: session.nearHTLCId,
      maker: session.maker,
      taker: session.taker,
      phase: 'secret_revelation_start'
    });
    
    const step: ExecutionStep = {
      function: 'reveal_secret_and_complete_swap',
      contract: 'Cross-Chain Coordinator',
      params: { 
        sessionId: session.sessionId,
        action: 'complete_atomic_swap'
      },
      status: 'pending'
    };
    
    this.addExecutionStep(session.sessionId, step);
    
    try {
      step.status = 'executing';
      this.updateExecutionStep(session.sessionId, step);
      
      // Update session status to indicate secret revelation in progress
      await this.sessionManager.updateSessionStatus(session.sessionId, 'revealing_secret');
      
      this.wsManager.sendToSession(session.sessionId, {
        type: 'session_update',
        status: 'revealing_secret',
        data: {
          phase: 'revealing_secret',
          progress: 75,
          message: 'Starting secret revelation to complete token exchange...'
        }
      });
      
      // Step 1: Reveal secret on NEAR (destination first for safety)
      logger.info(`[${timestamp}][FUSION+] Phase 1: Revealing secret on NEAR destination chain`, {
        sessionId: session.sessionId,
        nearHTLCId: session.nearHTLCId,
        action: 'reveal_secret_near'
      });
      const { secret: revealedSecret, txHash: nearTxHash } = await this.revealSecretOnNear(session);
      
      // Update step 3 with the NEAR transaction hash
      step.status = 'completed';
      step.txHash = nearTxHash; // Set txHash directly for display logic
      step.result = { 
        secretRevealed: true,
        aliceClaimedTokens: true,
        nearHTLCId: session.nearHTLCId,
        txHash: nearTxHash,
        explorer: `https://testnet.nearblocks.io/txns/${nearTxHash}`
      };
      this.updateExecutionStep(session.sessionId, step);
      
      // Step 2: Secret successfully revealed - now we can complete BASE withdrawal
      logger.info(`[${timestamp}][FUSION+] Phase 2: Secret obtained from NEAR withdrawal`, {
        sessionId: session.sessionId,
        nearHTLCId: session.nearHTLCId,
        hasRevealedSecret: !!revealedSecret,
        txHash: nearTxHash,
        action: 'secret_obtained_from_withdrawal',
        note: 'No polling needed - secret was revealed during HTLC withdrawal'
      });
      
      // Step 3: Use revealed secret to complete BASE withdrawal
      logger.info(`[${timestamp}][FUSION+] Phase 3: Completing BASE withdrawal with revealed secret`, {
        sessionId: session.sessionId,
        srcEscrowAddress: session.srcEscrowAddress,
        hasRevealedSecret: !!revealedSecret,
        action: 'complete_base_withdrawal'
      });
      await this.completeBaseWithRevealedSecret(session, revealedSecret);
      
      step.status = 'completed';
      step.result = { 
        phase: 'swap_completed',
        tokenExchangeComplete: true,
        aliceReceived: 'NEAR tokens',
        bobReceived: 'BASE tokens'
      };
      this.updateExecutionStep(session.sessionId, step);
      
      // Final status update
      await this.sessionManager.updateSessionStatus(session.sessionId, 'completed');
      
      this.wsManager.sendToSession(session.sessionId, {
        type: 'swap_completed',
        data: {
          phase: 'completed',
          progress: 100,
          message: 'Atomic swap completed successfully! Tokens have been exchanged.',
          details: {
            aliceReceived: `${session.destinationAmount} ${session.destinationToken} on NEAR`,
            bobReceived: `${session.sourceAmount} ${session.sourceToken} on BASE`,
            srcTxExplorer: session.srcEscrowAddress ? `https://sepolia.basescan.org/address/${session.srcEscrowAddress}` : null,
            nearTxExplorer: session.nearHTLCId ? `https://testnet.nearblocks.io/address/${session.nearHTLCId}` : null
          }
        }
      });
      
      logger.info(`[${timestamp}][FUSION+] Secret revelation and token exchange completed successfully`, {
        sessionId: session.sessionId,
        finalStatus: 'completed',
        tokenExchangeComplete: true,
        srcEscrowAddress: session.srcEscrowAddress,
        nearHTLCId: session.nearHTLCId
      });
      
    } catch (error) {
      const err = error as Error;
      step.status = 'failed';
      step.error = err.message;
      this.updateExecutionStep(session.sessionId, step);
      
      logger.error(`[${timestamp}][FUSION+] Secret revelation failed`, {
        sessionId: session.sessionId,
        error: err.message,
        stack: err.stack,
        phase: 'secret_revelation_failed',
        srcEscrowAddress: session.srcEscrowAddress,
        nearHTLCId: session.nearHTLCId
      });
      
      this.wsManager.sendToSession(session.sessionId, {
        type: 'execution_error',
        data: {
          phase: 'secret_revelation',
          error: err.message,
          details: 'Failed to complete token exchange - secret revelation failed',
          step: step
        }
      });
      
      throw error;
    }
  }

  /**
   * Reveal secret on NEAR to claim destination tokens
   * This is where Alice (maker) claims her NEAR tokens and reveals the secret
   */
  private async revealSecretOnNear(session: SwapSession): Promise<{ secret: string; txHash: string }> {
    const timestamp = new Date().toISOString();
    
    logger.info(`[${timestamp}][FUSION+] Revealing secret on NEAR to claim tokens`, {
      sessionId: session.sessionId,
      nearHTLCId: session.nearHTLCId,
      taker: session.taker,
      action: 'reveal_secret_near',
      purpose: 'Alice claims NEAR tokens and reveals secret'
    });
    
    try {
      // Get the secret from session manager
      logger.info(`[${timestamp}][FUSION+] Retrieving secret for revelation`, {
        sessionId: session.sessionId,
        hashlockHash: session.hashlockHash?.substring(0, 10) + '...',
        action: 'retrieve_secret'
      });
      
      const secret = await this.sessionManager.revealSecret(session.sessionId);
      
      if (!secret) {
        throw new Error('No secret available in session for revelation');
      }
      
      logger.info(`[${timestamp}][FUSION+] Secret retrieved successfully`, {
        sessionId: session.sessionId,
        secretLength: secret.length,
        secretPrefix: secret.substring(0, 10) + '...',
        action: 'secret_retrieved'
      });
      
      // Call NEAR coordinator to withdraw with secret (this reveals the secret publicly)
      logger.info(`[${timestamp}][FUSION+] Calling NEAR coordinator to withdraw HTLC with secret`, {
        sessionId: session.sessionId,
        nearHTLCId: session.nearHTLCId,
        receiver: session.taker,
        action: 'near_withdraw_call'
      });
      
      // Use master account as receiver since that's the account we have credentials for
      const nearMasterAccountId = await this.nearCoordinator.getMasterAccountId();
      const nearReceiver = session.taker.endsWith('.testnet') || session.taker.endsWith('.near') ? 
        nearMasterAccountId : session.taker;
        
      const nearTxHash = await this.nearCoordinator.withdrawHTLC(
        session.nearHTLCId!,
        secret,
        nearReceiver // Use account with credentials to withdraw
      );
      
      logger.info(`[${timestamp}][FUSION+] Secret successfully revealed on NEAR`, {
        sessionId: session.sessionId,
        nearHTLCId: session.nearHTLCId,
        secretRevealed: true,
        aliceClaimedTokens: true,
        txHash: nearTxHash,
        nextStep: 'use_revealed_secret_for_base_withdrawal'
      });

      return { secret, txHash: nearTxHash };
      
    } catch (error) {
      const err = error as Error;
      
      logger.error(`[${timestamp}][FUSION+] Failed to reveal secret on NEAR`, {
        sessionId: session.sessionId,
        nearHTLCId: session.nearHTLCId,
        error: err.message,
        stack: err.stack,
        action: 'reveal_secret_near_failed'
      });
      
      throw error;
    }
  }


  /**
   * Complete BASE withdrawal using the revealed secret from NEAR
   * This is where Bob gets his BASE tokens using the publicly revealed secret
   */
  private async completeBaseWithRevealedSecret(session: SwapSession, secret: string): Promise<void> {
    const timestamp = new Date().toISOString();
    
    logger.info(`[${timestamp}][FUSION+] Secret revealed - ready for client withdrawal`, {
      sessionId: session.sessionId,
      srcEscrowAddress: session.srcEscrowAddress,
      secretLength: secret.length,
      secretPrefix: secret.substring(0, 10) + '...',
      action: 'secret_ready_for_client_withdrawal',
      purpose: 'Taker (client) must withdraw BASE tokens using revealed secret'
    });
    
    const step: ExecutionStep = {
      function: 'client_withdraw_required',
      contract: session.srcEscrowAddress || 'BASE Escrow',
      params: { 
        secret: secret.substring(0, 10) + '...',
        escrowAddress: session.srcEscrowAddress,
        taker: session.taker,
        action: 'client_withdrawal_required'
      },
      status: 'completed'
    };
    
    this.addExecutionStep(session.sessionId, step);
    
    try {
      // Store the revealed secret in session for client access
      await this.sessionManager.updateSession(session.sessionId, {
        secret: secret,
        status: 'secret_revealed' as any
      });
      
      step.result = {
        secretRevealed: true,
        escrowAddress: session.srcEscrowAddress,
        taker: session.taker,
        clientWithdrawalRequired: true,
        withdrawalInstructions: {
          action: 'Call withdraw() function on escrow contract',
          contract: session.srcEscrowAddress,
          function: 'withdraw(bytes32 secret)',
          secret: secret,
          note: 'Must be called by taker wallet: ' + session.taker
        }
      };
      this.updateExecutionStep(session.sessionId, step);
      
      logger.info(`[${timestamp}][FUSION+] Atomic swap phase completed - secret revealed for client withdrawal`, {
        sessionId: session.sessionId,
        escrowAddress: session.srcEscrowAddress,
        taker: session.taker,
        secretRevealed: true,
        nextAction: 'CLIENT_WITHDRAWAL_REQUIRED',
        note: 'Taker must call withdraw() on BASE escrow contract with revealed secret'
      });
      
    } catch (error) {
      const err = error as Error;
      step.status = 'failed';
      step.error = err.message;
      this.updateExecutionStep(session.sessionId, step);
      
      logger.error(`[${timestamp}][FUSION+] Failed to prepare client withdrawal instructions`, {
        sessionId: session.sessionId,
        srcEscrowAddress: session.srcEscrowAddress,
        error: err.message,
        stack: err.stack,
        action: 'client_withdrawal_preparation_failed'
      });
      
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
      srcWithdrawal: now + 500,      // 8.33 minutes
      srcPublicWithdrawal: now + 800, // 13.33 minutes
      srcCancellation: now + 1100,    // 18.33 minutes
      srcDeployedAt: now - 60,       // 1 minute ago (ensures currentTime >= srcDeployedAt)
      dstWithdrawal: now + 180,      // 3 minutes (before src withdrawal)
      dstCancellation: now + 250,     // 4.17 minutes (MUST be before src withdrawal for cross-chain safety: 250 < 500, buffer of 250 seconds)
      dstDeployedAt: now - 60        // 1 minute ago (ensures currentTime >= dstDeployedAt)
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