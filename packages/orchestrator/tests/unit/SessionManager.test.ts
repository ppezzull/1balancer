import { SessionManager } from '../../src/core/SessionManager';
import testConfig from '../test-config.json';

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  beforeEach(async () => {
    sessionManager = new SessionManager();
    await sessionManager.initialize();
  });

  afterEach(() => {
    sessionManager.shutdown();
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create session with dynamic chain config', async () => {
      const sessionData = {
        sourceChain: testConfig.chains.base.chainId.toString(),
        destinationChain: 'near',
        sourceToken: testConfig.chains.base.tokens.USDC,
        destinationToken: testConfig.chains.near.tokens.USDC,
        sourceAmount: '1000000', // 1 USDC
        destinationAmount: '999000', // After fees
        maker: testConfig.testAccounts.ethereum[0].address,
        taker: testConfig.testAccounts.near[0].accountId,
        slippageTolerance: testConfig.testConstants.defaultSlippage
      };

      const session = await sessionManager.createSession(sessionData);

      expect(session).toMatchObject({
        status: 'initialized',
        sourceChain: sessionData.sourceChain,
        destinationChain: sessionData.destinationChain,
        sourceToken: sessionData.sourceToken,
        destinationToken: sessionData.destinationToken,
        sourceAmount: sessionData.sourceAmount,
        destinationAmount: sessionData.destinationAmount,
        maker: sessionData.maker,
        taker: sessionData.taker,
        hashlockHash: expect.stringMatching(/^0x[a-fA-F0-9]{64}$/),
        secret: expect.any(String)
      });

      expect(session.sessionId).toMatch(/^sess_[a-f0-9-]+/);
      expect(session.steps).toHaveLength(5);
      expect(session.steps[0]).toMatchObject({
        step: 'initialize',
        status: 'completed'
      });
    });

    it('should enforce session limit', async () => {
      const sessionData = {
        sourceChain: testConfig.chains.base.chainId.toString(),
        destinationChain: 'near',
        sourceToken: testConfig.chains.base.tokens.USDC,
        destinationToken: testConfig.chains.near.tokens.USDC,
        sourceAmount: '1000000',
        destinationAmount: '999000',
        maker: testConfig.testAccounts.ethereum[0].address,
        taker: testConfig.testAccounts.near[0].accountId,
        slippageTolerance: testConfig.testConstants.defaultSlippage
      };

      // Create sessions up to the limit
      const maxSessions = 100; // Default max from config
      const promises = [];
      for (let i = 0; i < maxSessions; i++) {
        promises.push(sessionManager.createSession({
          ...sessionData,
          sourceAmount: String(1000000 + i)
        }));
      }
      await Promise.all(promises);

      // Next session should fail
      await expect(sessionManager.createSession(sessionData))
        .rejects.toThrow('Maximum active sessions reached');
    });

    it('should handle concurrent session creation', async () => {
      const sessionPromises = Array(5).fill(null).map((_, index) => {
        const sessionData = {
          sourceChain: testConfig.chains.base.chainId.toString(),
          destinationChain: 'near',
          sourceToken: testConfig.chains.base.tokens.USDC,
          destinationToken: testConfig.chains.near.tokens.USDC,
          sourceAmount: `${1000000 * (index + 1)}`,
          destinationAmount: `${999000 * (index + 1)}`,
          maker: testConfig.testAccounts.ethereum[0].address,
          taker: testConfig.testAccounts.near[0].accountId,
          slippageTolerance: testConfig.testConstants.defaultSlippage
        };

        return sessionManager.createSession(sessionData);
      });

      const sessions = await Promise.all(sessionPromises);

      expect(sessions).toHaveLength(5);
      const sessionIds = sessions.map(s => s.sessionId);
      expect(new Set(sessionIds).size).toBe(5); // All IDs unique
    });
  });

  describe('getSession', () => {
    it('should retrieve existing session', async () => {
      const sessionData = {
        sourceChain: testConfig.chains.base.chainId.toString(),
        destinationChain: 'near',
        sourceToken: testConfig.chains.base.tokens.USDC,
        destinationToken: testConfig.chains.near.tokens.USDC,
        sourceAmount: '1000000',
        destinationAmount: '999000',
        maker: testConfig.testAccounts.ethereum[0].address,
        taker: testConfig.testAccounts.near[0].accountId,
        slippageTolerance: testConfig.testConstants.defaultSlippage
      };

      const created = await sessionManager.createSession(sessionData);
      const retrieved = await sessionManager.getSession(created.sessionId);

      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent session', async () => {
      const session = await sessionManager.getSession('non-existent-id');
      expect(session).toBeNull();
    });
  });

  describe('updateSessionStatus', () => {
    it('should update session status correctly', async () => {
      const sessionData = {
        sourceChain: testConfig.chains.base.chainId.toString(),
        destinationChain: 'near',
        sourceToken: testConfig.chains.base.tokens.USDC,
        destinationToken: testConfig.chains.near.tokens.USDC,
        sourceAmount: '1000000',
        destinationAmount: '999000',
        maker: testConfig.testAccounts.ethereum[0].address,
        taker: testConfig.testAccounts.near[0].accountId,
        slippageTolerance: testConfig.testConstants.defaultSlippage
      };

      const session = await sessionManager.createSession(sessionData);

      await sessionManager.updateSessionStatus(session.sessionId, 'source_locked');
      const updated = await sessionManager.getSession(session.sessionId);

      expect(updated!.status).toBe('source_locked');
      expect(updated!.updatedAt).toBeGreaterThanOrEqual(session.updatedAt);
    });

    it('should throw for invalid session ID', async () => {
      await expect(sessionManager.updateSessionStatus('invalid-id', 'source_locked'))
        .rejects.toThrow('Session not found');
    });

    it('should update step status when session status changes', async () => {
      const sessionData = {
        sourceChain: testConfig.chains.base.chainId.toString(),
        destinationChain: 'near',
        sourceToken: testConfig.chains.base.tokens.USDC,
        destinationToken: testConfig.chains.near.tokens.USDC,
        sourceAmount: '1000000',
        destinationAmount: '999000',
        maker: testConfig.testAccounts.ethereum[0].address,
        taker: testConfig.testAccounts.near[0].accountId,
        slippageTolerance: testConfig.testConstants.defaultSlippage
      };

      const session = await sessionManager.createSession(sessionData);
      await sessionManager.updateSessionStatus(session.sessionId, 'source_locked');
      
      const updated = await sessionManager.getSession(session.sessionId);
      const sourceStep = updated!.steps.find(s => s.step === 'source_lock');
      
      expect(sourceStep?.status).toBe('completed');
    });
  });

  describe('updateSessionWithOrderHash', () => {
    it('should update session with order hash', async () => {
      const sessionData = {
        sourceChain: testConfig.chains.base.chainId.toString(),
        destinationChain: 'near',
        sourceToken: testConfig.chains.base.tokens.USDC,
        destinationToken: testConfig.chains.near.tokens.USDC,
        sourceAmount: '1000000',
        destinationAmount: '999000',
        maker: testConfig.testAccounts.ethereum[0].address,
        taker: testConfig.testAccounts.near[0].accountId,
        slippageTolerance: testConfig.testConstants.defaultSlippage
      };

      const session = await sessionManager.createSession(sessionData);
      const orderHash = '0x' + 'a'.repeat(64);

      await sessionManager.updateSessionWithOrderHash(session.sessionId, orderHash);

      const updated = await sessionManager.getSession(session.sessionId);
      expect(updated!.orderHash).toBe(orderHash);

      // Should be able to retrieve by order hash
      const byOrderHash = await sessionManager.getSessionByOrderHash(orderHash);
      expect(byOrderHash?.sessionId).toBe(session.sessionId);
    });
  });

  describe('listSessions', () => {
    it('should list sessions with pagination', async () => {
      // Create multiple sessions
      const sessionPromises = Array(5).fill(null).map((_, index) => 
        sessionManager.createSession({
          sourceChain: testConfig.chains.base.chainId.toString(),
          destinationChain: 'near',
          sourceToken: testConfig.chains.base.tokens.USDC,
          destinationToken: testConfig.chains.near.tokens.USDC,
          sourceAmount: `${1000000 * (index + 1)}`,
          destinationAmount: `${999000 * (index + 1)}`,
          maker: testConfig.testAccounts.ethereum[0].address,
          taker: testConfig.testAccounts.near[0].accountId,
          slippageTolerance: testConfig.testConstants.defaultSlippage
        })
      );

      const sessions = await Promise.all(sessionPromises);

      // Test pagination
      const page1 = await sessionManager.listSessions({ limit: 2, offset: 0 });
      expect(page1).toHaveLength(2);

      const page2 = await sessionManager.listSessions({ limit: 2, offset: 2 });
      expect(page2).toHaveLength(2);

      // Test filtering by status
      await sessionManager.updateSessionStatus(sessions[0].sessionId, 'source_locked');
      const filtered = await sessionManager.listSessions({ 
        status: 'source_locked', 
        limit: 10, 
        offset: 0 
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].sessionId).toBe(sessions[0].sessionId);
    });
  });

  describe('updateSessionWithEscrow', () => {
    it('should update session with escrow addresses', async () => {
      const sessionData = {
        sourceChain: testConfig.chains.base.chainId.toString(),
        destinationChain: 'near',
        sourceToken: testConfig.chains.base.tokens.USDC,
        destinationToken: testConfig.chains.near.tokens.USDC,
        sourceAmount: '1000000',
        destinationAmount: '999000',
        maker: testConfig.testAccounts.ethereum[0].address,
        taker: testConfig.testAccounts.near[0].accountId,
        slippageTolerance: testConfig.testConstants.defaultSlippage
      };

      const session = await sessionManager.createSession(sessionData);
      const srcEscrow = '0x' + 'b'.repeat(40);
      const dstEscrow = 'escrow.testnet';

      await sessionManager.updateSessionWithEscrow(session.sessionId, 'src', srcEscrow);
      await sessionManager.updateSessionWithEscrow(session.sessionId, 'dst', dstEscrow);

      const updated = await sessionManager.getSession(session.sessionId);
      expect(updated!.srcEscrowAddress).toBe(srcEscrow);
      expect(updated!.dstEscrowAddress).toBe(dstEscrow);
    });
  });

  describe('getSessionStatus', () => {
    it('should return detailed session status', async () => {
      const sessionData = {
        sourceChain: testConfig.chains.base.chainId.toString(),
        destinationChain: 'near',
        sourceToken: testConfig.chains.base.tokens.USDC,
        destinationToken: testConfig.chains.near.tokens.USDC,
        sourceAmount: '1000000',
        destinationAmount: '999000',
        maker: testConfig.testAccounts.ethereum[0].address,
        taker: testConfig.testAccounts.near[0].accountId,
        slippageTolerance: testConfig.testConstants.defaultSlippage
      };

      const session = await sessionManager.createSession(sessionData);
      const status = await sessionManager.getSessionStatus(session.sessionId);

      expect(status).toMatchObject({
        sessionId: session.sessionId,
        status: 'initialized',
        steps: expect.any(Array),
        currentPhase: expect.any(String),
        timeRemaining: expect.any(Number),
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      });

      expect(status.steps).toHaveLength(5);
      expect(status.timeRemaining).toBeGreaterThan(0);
    });

    it('should return null for non-existent session', async () => {
      const status = await sessionManager.getSessionStatus('non-existent');
      expect(status).toBeNull();
    });
  });
});