import { ethers } from 'ethers';
import { createLogger } from '../utils/logger';
import { config } from '../config';
import { SessionManager, SwapSession } from './SessionManager';
import { SecretManager } from './SecretManager';
import { ApiErrorFactory } from '../api/middleware/errorHandler';

const logger = createLogger('CrossChainCoordinator');

interface LimitOrder {
  order: any; // 1inch order structure
  signature: string;
}

interface ChainProviders {
  base: ethers.JsonRpcProvider;
  ethereum?: ethers.JsonRpcProvider;
}

export class CrossChainCoordinator {
  private providers: ChainProviders;
  // @ts-expect-error - Reserved for future contract interactions
  private _escrowFactoryAbi: any[]; // TODO: Use in production contract interactions
  // @ts-expect-error - Reserved for future contract interactions
  private _fusionResolverAbi: any[]; // TODO: Use in production contract interactions
  private escrowSrcAbi: any[];

  constructor(
    private sessionManager: SessionManager,
    private secretManager: SecretManager
  ) {
    // Initialize providers
    this.providers = {
      base: new ethers.JsonRpcProvider(config.chains.base.rpcUrl),
    };

    if (config.chains.ethereum.rpcUrl) {
      this.providers.ethereum = new ethers.JsonRpcProvider(config.chains.ethereum.rpcUrl);
    }

    // Initialize ABIs (simplified for demo)
    this._escrowFactoryAbi = [
      'function createSrcEscrow(tuple(address maker, address taker, address token, uint256 amount, uint256 safetyDeposit, bytes32 hashlockHash, tuple(uint32 srcWithdrawal, uint32 srcPublicWithdrawal, uint32 srcCancellation, uint32 srcDeployedAt, uint32 dstWithdrawal, uint32 dstCancellation, uint32 dstDeployedAt) timelocks, bytes32 orderHash, uint256 chainId) immutables) payable returns (address)',
      'event SrcEscrowCreated(address indexed escrow, bytes32 indexed orderHash, address indexed maker)',
    ];

    this._fusionResolverAbi = [
      'function deploySrc(tuple(address maker, address taker, address token, uint256 amount, uint256 safetyDeposit, bytes32 hashlockHash, tuple(uint32 srcWithdrawal, uint32 srcPublicWithdrawal, uint32 srcCancellation, uint32 srcDeployedAt, uint32 dstWithdrawal, uint32 dstCancellation, uint32 dstDeployedAt) timelocks, bytes32 orderHash, uint256 chainId) immutables, tuple(uint256 salt, address maker, address receiver, address makerAsset, address takerAsset, uint256 makingAmount, uint256 takingAmount, bytes makerTraits) order, bytes32 r, bytes32 vs, uint256 amount, uint256 takerTraits, bytes args) payable',
    ];

    this.escrowSrcAbi = [
      'function withdraw(bytes32 secret) external',
      'function cancel() external',
      'event Withdrawn(bytes32 secret)',
      'event Cancelled()',
    ];
  }

  async executeSwap(sessionId: string, limitOrder: LimitOrder): Promise<void> {
    const session = await this.sessionManager.getSession(sessionId);
    if (!session) {
      throw ApiErrorFactory.notFound('Session');
    }

    try {
      logger.info('Starting cross-chain swap execution', { sessionId });

      // Phase 1: Lock on source chain
      await this.lockSourceChain(session, limitOrder);

      // Phase 2: Lock on destination chain (NEAR)
      await this.lockDestinationChain(session);

      // Phase 3: Monitor and complete
      // This would be handled by event monitoring in production
      logger.info('Cross-chain swap initiated successfully', { sessionId });

    } catch (error) {
      logger.error('Failed to execute swap', { sessionId, error });
      await this.handleFailure(session, error as Error);
      throw error;
    }
  }

  async cancelSwap(sessionId: string): Promise<void> {
    const session = await this.sessionManager.getSession(sessionId);
    if (!session) {
      throw ApiErrorFactory.notFound('Session');
    }

    try {
      logger.info('Cancelling swap', { sessionId });

      // Check if we can cancel
      const canCancel = this.canCancelSwap(session);
      if (!canCancel) {
        throw ApiErrorFactory.badRequest('Cannot cancel swap in current state');
      }

      // Cancel on source chain if escrow exists
      if (session.srcEscrowAddress) {
        await this.cancelSourceEscrow(session);
      }

      // Update session status
      await this.sessionManager.updateSessionStatus(sessionId, 'cancelled');

      logger.info('Swap cancelled successfully', { sessionId });

    } catch (error) {
      logger.error('Failed to cancel swap', { sessionId, error });
      throw error;
    }
  }

  async revealSecret(sessionId: string, escrowAddress: string): Promise<void> {
    const session = await this.sessionManager.getSession(sessionId);
    if (!session) {
      throw ApiErrorFactory.notFound('Session');
    }

    try {
      // Get the secret
      const secret = await this.sessionManager.revealSecret(sessionId);

      // Call withdraw on the escrow
      const provider = this.providers.base;
      const wallet = new ethers.Wallet(process.env.ORCHESTRATOR_PRIVATE_KEY || '', provider);
      
      const escrow = new ethers.Contract(escrowAddress, this.escrowSrcAbi, wallet);
      const tx = await escrow.withdraw(secret);
      
      logger.info('Revealing secret on escrow', { 
        sessionId, 
        escrowAddress,
        txHash: tx.hash 
      });

      await tx.wait();

      // Update session status
      await this.sessionManager.updateSessionStatus(sessionId, 'completed');

    } catch (error) {
      logger.error('Failed to reveal secret', { sessionId, error });
      throw error;
    }
  }

  private async lockSourceChain(session: SwapSession, _limitOrder: LimitOrder): Promise<void> {
    logger.info('Locking tokens on source chain', { 
      sessionId: session.sessionId,
      chain: session.sourceChain 
    });

    // Update status
    await this.sessionManager.updateSessionStatus(session.sessionId, 'source_locking');

    // Prepare immutables for escrow
    const immutables = {
      maker: session.maker,
      taker: session.taker,
      token: session.sourceToken,
      amount: session.sourceAmount,
      safetyDeposit: ethers.parseEther('0.01'), // 0.01 ETH safety deposit
      hashlockHash: session.hashlockHash,
      timelocks: this.calculateTimelocks(),
      orderHash: ethers.keccak256(ethers.toUtf8Bytes(session.sessionId)),
      chainId: config.chains.base.chainId,
    };

    // In production, this would call the FusionPlusResolver
    // For demo, we'll simulate the escrow creation
    const escrowAddress = this.computeEscrowAddress(immutables);
    
    // Update session with escrow address
    await this.sessionManager.updateSessionWithEscrow(
      session.sessionId,
      'src',
      escrowAddress
    );

    // Update order hash
    await this.sessionManager.updateSessionWithOrderHash(
      session.sessionId,
      immutables.orderHash.toString()
    );

    // Update status
    await this.sessionManager.updateSessionStatus(session.sessionId, 'source_locked');

    logger.info('Source chain locked', {
      sessionId: session.sessionId,
      escrowAddress,
    });
  }

  private async lockDestinationChain(session: SwapSession): Promise<void> {
    logger.info('Locking tokens on destination chain', {
      sessionId: session.sessionId,
      chain: session.destinationChain,
    });

    // Update status
    await this.sessionManager.updateSessionStatus(session.sessionId, 'destination_locking');

    // In production, this would trigger NEAR HTLC creation
    // For demo, we'll simulate it
    const dstEscrowAddress = 'htlc.' + session.sessionId.substring(5) + '.near';
    
    await this.sessionManager.updateSessionWithEscrow(
      session.sessionId,
      'dst',
      dstEscrowAddress
    );

    // Simulate some delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update status
    await this.sessionManager.updateSessionStatus(session.sessionId, 'both_locked');

    logger.info('Destination chain locked', {
      sessionId: session.sessionId,
      escrowAddress: dstEscrowAddress,
    });
  }

  private async cancelSourceEscrow(session: SwapSession): Promise<void> {
    if (!session.srcEscrowAddress) {
      return;
    }

    try {
      const provider = this.providers.base;
      const wallet = new ethers.Wallet(process.env.ORCHESTRATOR_PRIVATE_KEY || '', provider);
      
      const escrow = new ethers.Contract(session.srcEscrowAddress, this.escrowSrcAbi, wallet);
      const tx = await escrow.cancel();
      
      logger.info('Cancelling source escrow', {
        sessionId: session.sessionId,
        escrowAddress: session.srcEscrowAddress,
        txHash: tx.hash,
      });

      await tx.wait();
    } catch (error) {
      logger.error('Failed to cancel source escrow', {
        sessionId: session.sessionId,
        error,
      });
      throw error;
    }
  }

  private calculateTimelocks() {
    const now = Math.floor(Date.now() / 1000);
    
    return {
      srcWithdrawal: now + 300, // 5 minutes
      srcPublicWithdrawal: now + 600, // 10 minutes
      srcCancellation: now + 900, // 15 minutes
      srcDeployedAt: now,
      dstWithdrawal: now + 240, // 4 minutes (before src withdrawal)
      dstCancellation: now + 840, // 14 minutes (before src cancellation)
      dstDeployedAt: now,
    };
  }

  private computeEscrowAddress(immutables: any): string {
    // In production, this would use CREATE2 to compute the address
    // For demo, we'll generate a deterministic address
    const hash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'bytes32'],
        [immutables.maker, immutables.hashlockHash]
      )
    );
    
    return '0x' + hash.substring(26); // Take last 20 bytes
  }

  private canCancelSwap(session: SwapSession): boolean {
    const cancellableStatuses = [
      'initialized',
      'executing',
      'source_locking',
      'source_locked',
      'destination_locking',
    ];
    
    return cancellableStatuses.includes(session.status);
  }

  private async handleFailure(session: SwapSession, error: Error): Promise<void> {
    logger.error('Handling swap failure', {
      sessionId: session.sessionId,
      error: error.message,
    });

    // Update session status
    await this.sessionManager.updateSessionStatus(session.sessionId, 'failed');

    // If tokens are locked, initiate refund
    if (session.srcEscrowAddress && session.status === 'source_locked') {
      await this.sessionManager.updateSessionStatus(session.sessionId, 'refunding');
      // Refund would be handled by timeout or manual intervention
    }
  }

  // Event handlers for blockchain monitoring
  async handleEscrowCreated(event: any): Promise<void> {
    const { orderHash, escrow, maker } = event;
    
    const session = await this.sessionManager.getSessionByOrderHash(orderHash);
    if (!session) {
      logger.warn('Received event for unknown order', { orderHash });
      return;
    }

    logger.info('Escrow created event received', {
      sessionId: session.sessionId,
      escrow,
      maker,
    });

    // Update session
    await this.sessionManager.updateSessionWithEscrow(session.sessionId, 'src', escrow);
    await this.sessionManager.updateSessionStatus(session.sessionId, 'source_locked');
  }

  async handleSecretRevealed(event: any): Promise<void> {
    const { secret, escrow } = event;
    
    logger.info('Secret revealed event received', {
      escrow,
      secretHash: ethers.keccak256(secret),
    });

    // Find session by escrow address
    // In production, maintain escrow -> session mapping
    const sessions = await this.sessionManager.listSessions({
      status: 'both_locked',
      limit: 1000,
      offset: 0,
    });

    const session = sessions.find(s => s.srcEscrowAddress === escrow);
    if (!session) {
      logger.warn('Received secret for unknown escrow', { escrow });
      return;
    }

    // Verify secret
    const valid = await this.secretManager.verifySecret(secret, session.hashlockHash);
    if (!valid) {
      logger.error('Invalid secret revealed', {
        sessionId: session.sessionId,
        escrow,
      });
      return;
    }

    // Store secret for destination withdrawal
    await this.secretManager.storeExternalSecret(secret, session.hashlockHash);
    
    // Update session status
    await this.sessionManager.updateSessionStatus(session.sessionId, 'revealing_secret');
  }
}