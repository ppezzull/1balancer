import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { ethers } from 'ethers';
import { createLogger } from '../utils/logger';
import { config } from '../config';

const logger = createLogger('SessionManager');

export interface SwapSession {
  sessionId: string;
  status: SessionStatus;
  sourceChain: string;
  destinationChain: string;
  sourceToken: string;
  destinationToken: string;
  sourceAmount: string;
  destinationAmount: string;
  maker: string;
  taker: string;
  slippageTolerance: number;
  hashlockHash: string;
  secret?: string;
  createdAt: number;
  updatedAt: number;
  expirationTime: number;
  estimatedCompletionTime: number;
  srcEscrowAddress?: string;
  dstEscrowAddress?: string;
  orderHash?: string;
  steps: SessionStep[];
  fees: {
    protocol: string;
    network: {
      [chain: string]: string;
    };
  };
  // NEAR-specific fields
  nearHTLCId?: string;
  revealedSecret?: string;
  // Additional fields for cross-chain coordination
  id: string;
  sourceAddress: string;
  destinationAddress: string;
  sourceAsset: string;
  destinationAsset: string;
}

export interface SessionStep {
  step: string;
  status: 'completed' | 'pending' | 'failed' | 'waiting';
  timestamp?: number;
  txHash?: string;
  escrowAddress?: string;
  estimatedTime?: number;
  error?: string;
}

export type SessionStatus = 
  | 'initialized'
  | 'executing'
  | 'source_locking'
  | 'source_locked'
  | 'destination_locking'
  | 'both_locked'
  | 'revealing_secret'
  | 'completed'
  | 'cancelling'
  | 'cancelled'
  | 'failed'
  | 'timeout'
  | 'refunding'
  | 'refunded'
  | 'htlc_created_near'
  | 'secret_revealed_near'
  | 'secret_revealed_base'
  | 'withdrawing_base'
  | 'withdrawing_near'
  | 'refunded_near';

interface CreateSessionParams {
  sourceChain: string;
  destinationChain: string;
  sourceToken: string;
  destinationToken: string;
  sourceAmount: string;
  destinationAmount: string;
  maker: string;
  taker: string;
  slippageTolerance: number;
}

export class SessionManager {
  private sessions = new Map<string, SwapSession>();
  private sessionsByOrderHash = new Map<string, string>();
  private cleanupInterval?: NodeJS.Timeout;

  async initialize(): Promise<void> {
    logger.info('Initializing SessionManager');
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(
      () => this.cleanupExpiredSessions(),
      config.session.cleanupInterval
    );
  }

  async createSession(params: CreateSessionParams): Promise<SwapSession> {
    // Check session limit
    if (this.sessions.size >= config.session.maxActiveSessions) {
      throw new Error('Maximum active sessions reached');
    }

    const sessionId = `sess_${uuidv4().substring(0, 10)}`;
    const now = Date.now();
    
    // Generate secret and hashlock
    const secret = this.generateSecret();
    const hashlockHash = this.generateHashlock(secret);

    const session: SwapSession = {
      sessionId,
      id: sessionId, // Add id field for compatibility
      status: 'initialized',
      ...params,
      hashlockHash,
      secret, // Store secret securely
      createdAt: now,
      updatedAt: now,
      expirationTime: now + (config.session.timeoutSeconds * 1000),
      estimatedCompletionTime: 180, // 3 minutes estimate
      // Map fields for cross-chain coordination
      sourceAddress: params.maker,
      destinationAddress: params.taker,
      sourceAsset: params.sourceToken,
      destinationAsset: params.destinationToken,
      steps: [
        {
          step: 'initialize',
          status: 'completed',
          timestamp: now,
        },
        {
          step: 'source_lock',
          status: 'pending',
          estimatedTime: 60,
        },
        {
          step: 'destination_lock',
          status: 'waiting',
          estimatedTime: 60,
        },
        {
          step: 'reveal_secret',
          status: 'waiting',
        },
        {
          step: 'complete',
          status: 'waiting',
        },
      ],
      fees: {
        protocol: '30', // 0.3% in basis points
        network: {
          base: '0.001', // ETH
          near: '0.01', // NEAR
        },
      },
    };

    this.sessions.set(sessionId, session);
    logger.info('Created new session', { sessionId, maker: params.maker });

    return session;
  }

  async getSession(sessionId: string): Promise<SwapSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async getSessionByOrderHash(orderHash: string): Promise<SwapSession | null> {
    const sessionId = this.sessionsByOrderHash.get(orderHash);
    return sessionId ? this.sessions.get(sessionId) || null : null;
  }

  async updateSessionStatus(sessionId: string, status: SessionStatus): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.status = status;
    session.updatedAt = Date.now();

    // Update step status based on new status
    this.updateStepStatus(session, status);

    logger.info('Updated session status', { sessionId, status });
  }


  async updateSessionWithOrderHash(sessionId: string, orderHash: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.orderHash = orderHash;
    this.sessionsByOrderHash.set(orderHash, sessionId);
  }

  async updateSessionWithEscrow(
    sessionId: string, 
    escrowType: 'src' | 'dst', 
    escrowAddress: string
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (escrowType === 'src') {
      session.srcEscrowAddress = escrowAddress;
    } else {
      session.dstEscrowAddress = escrowAddress;
    }
    session.updatedAt = Date.now();
  }

  async getSessionStatus(sessionId: string): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const timeRemaining = Math.max(0, session.expirationTime - Date.now()) / 1000;
    const currentPhase = this.getCurrentPhase(session.status);

    return {
      sessionId: session.sessionId,
      status: session.status,
      steps: session.steps,
      currentPhase,
      timeRemaining,
      srcEscrowAddress: session.srcEscrowAddress,
      dstEscrowAddress: session.dstEscrowAddress,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  async listSessions(options: {
    status?: string;
    limit: number;
    offset: number;
  }): Promise<SwapSession[]> {
    let sessions = Array.from(this.sessions.values());

    // Filter by status if provided
    if (options.status) {
      sessions = sessions.filter(s => s.status === options.status);
    }

    // Sort by creation time (newest first)
    sessions.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    return sessions.slice(options.offset, options.offset + options.limit);
  }

  async revealSecret(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.secret) {
      throw new Error('No secret available for session');
    }

    // In production, implement proper access control
    return session.secret;
  }

  // Redis methods removed - using in-memory storage only
  // If Redis is needed in the future, implement connection logic here

  async shutdown(): Promise<void> {
    logger.info('Shutting down SessionManager');
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Save state if needed
    this.sessions.clear();
    this.sessionsByOrderHash.clear();
  }

  private generateSecret(): string {
    // Generate a 32-byte random secret
    const secret = createHash('sha256')
      .update(uuidv4() + Date.now())
      .digest('hex');
    return '0x' + secret;
  }

  private generateHashlock(secret: string): string {
    // Generate hashlock from secret using Keccak-256 (matches BASE contract and updated NEAR contract)
    const cleanSecret = secret.startsWith('0x') ? secret.slice(2) : secret;
    const secretBytes = '0x' + cleanSecret;
    
    // Use ethers keccak256 with abi.encodePacked equivalent (just the bytes)
    const hash = ethers.keccak256(secretBytes);
    return hash;
  }

  private updateStepStatus(session: SwapSession, status: SessionStatus): void {
    const now = Date.now();

    switch (status) {
      case 'source_locking':
        this.updateStep(session, 'source_lock', 'pending');
        break;
      case 'source_locked':
        this.updateStep(session, 'source_lock', 'completed', now);
        this.updateStep(session, 'destination_lock', 'pending');
        break;
      case 'destination_locking':
        this.updateStep(session, 'destination_lock', 'pending');
        break;
      case 'both_locked':
        this.updateStep(session, 'destination_lock', 'completed', now);
        this.updateStep(session, 'reveal_secret', 'pending');
        break;
      case 'revealing_secret':
        this.updateStep(session, 'reveal_secret', 'pending');
        break;
      case 'completed':
        this.updateStep(session, 'reveal_secret', 'completed', now);
        this.updateStep(session, 'complete', 'completed', now);
        break;
      case 'failed':
      case 'cancelled':
        // Mark remaining steps as failed
        session.steps.forEach(step => {
          if (step.status === 'pending' || step.status === 'waiting') {
            step.status = 'failed';
          }
        });
        break;
    }
  }

  private updateStep(
    session: SwapSession, 
    stepName: string, 
    status: SessionStep['status'],
    timestamp?: number
  ): void {
    const step = session.steps.find(s => s.step === stepName);
    if (step) {
      step.status = status;
      if (timestamp) {
        step.timestamp = timestamp;
      }
    }
  }

  private getCurrentPhase(status: SessionStatus): string {
    const phaseMap: Record<SessionStatus, string> = {
      'initialized': 'initialization',
      'executing': 'execution',
      'source_locking': 'locking_source',
      'source_locked': 'source_locked',
      'destination_locking': 'locking_destination',
      'both_locked': 'both_locked',
      'revealing_secret': 'revealing',
      'completed': 'completed',
      'cancelling': 'cancelling',
      'cancelled': 'cancelled',
      'failed': 'failed',
      'timeout': 'timeout',
      'refunding': 'refunding',
      'refunded': 'refunded',
      'htlc_created_near': 'htlc_created_near',
      'secret_revealed_near': 'secret_revealed_near',
      'secret_revealed_base': 'secret_revealed_base',
      'withdrawing_base': 'withdrawing_base',
      'withdrawing_near': 'withdrawing_near',
      'refunded_near': 'refunded_near',
    };

    return phaseMap[status] || 'unknown';
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions) {
      if (now > session.expirationTime && 
          ['completed', 'cancelled', 'failed', 'refunded', 'refunded_near'].includes(session.status)) {
        this.sessions.delete(sessionId);
        if (session.orderHash) {
          this.sessionsByOrderHash.delete(session.orderHash);
        }
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} expired sessions`);
    }
  }

  // Helper methods for NEARChainCoordinator
  async getActiveSessions(): Promise<SwapSession[]> {
    const sessions = await this.listSessions({
      limit: 1000,
      offset: 0,
    });
    
    // Filter for active sessions
    const activeStatuses: SessionStatus[] = [
      'initialized', 'executing', 'both_locked', 
      'secret_revealed_near', 'secret_revealed_base',
      'withdrawing_base', 'withdrawing_near'
    ];
    
    return sessions.filter(s => activeStatuses.includes(s.status));
  }

  async updateSession(sessionId: string, session: Partial<SwapSession>): Promise<void> {
    const existingSession = await this.getSession(sessionId);
    if (!existingSession) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    // Update session in storage
    const updatedSession = {
      ...existingSession,
      ...session,
      updatedAt: Date.now(),
    };
    
    this.sessions.set(sessionId, updatedSession);
    if (updatedSession.orderHash) {
      this.sessionsByOrderHash.set(updatedSession.orderHash, sessionId);
    }
    
    logger.info('Session updated', { sessionId, updates: Object.keys(session) });
  }
}