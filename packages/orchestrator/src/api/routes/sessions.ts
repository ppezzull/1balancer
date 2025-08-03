import { Router } from 'express';
import Joi from 'joi';
import { Services } from './index';
import { validateRequest } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/asyncHandler';
import { createLogger } from '../../utils/logger';

const logger = createLogger('sessions-api');

// Validation schemas
const createSessionSchema = Joi.object({
  sourceChain: Joi.string().valid('base', 'ethereum', 'polygon').required(),
  destinationChain: Joi.string().valid('near').required(),
  sourceToken: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  destinationToken: Joi.string().required(),
  sourceAmount: Joi.string().pattern(/^\d+$/).required(),
  destinationAmount: Joi.string().pattern(/^\d+$/).required(),
  maker: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  taker: Joi.string().required(),
  slippageTolerance: Joi.number().min(0).max(10000).required(), // basis points
});

const executeSwapSchema = Joi.object({
  limitOrder: Joi.object({
    order: Joi.object().required(),
    signature: Joi.string().pattern(/^0x[a-fA-F0-9]+$/).required(),
  }).required(),
  confirmationLevel: Joi.string().valid('fast', 'secure').default('fast'),
});

export function sessionsRouter(services: Services): Router {
  const router = Router();
  const { sessionManager, crossChainCoordinator, webSocketManager, metricsCollector } = services;

  // Create swap session
  router.post(
    '/',
    validateRequest(createSessionSchema),
    asyncHandler(async (req, res) => {
      const startTime = Date.now();
      logger.info('Creating new swap session', { body: req.body });

      const session = await sessionManager.createSession({
        sourceChain: req.body.sourceChain,
        destinationChain: req.body.destinationChain,
        sourceToken: req.body.sourceToken,
        destinationToken: req.body.destinationToken,
        sourceAmount: req.body.sourceAmount,
        destinationAmount: req.body.destinationAmount,
        maker: req.body.maker,
        taker: req.body.taker,
        slippageTolerance: req.body.slippageTolerance,
      });

      // Notify WebSocket clients
      webSocketManager.notifySessionUpdate(session.sessionId, {
        status: session.status,
        phase: 'initialized',
        progress: 0,
      });

      // Record metrics
      metricsCollector.recordSwapInitiated();
      metricsCollector.recordApiLatency('create_session', Date.now() - startTime);

      res.status(201).json({
        sessionId: session.sessionId,
        status: session.status,
        hashlockHash: session.hashlockHash,
        estimatedCompletionTime: session.estimatedCompletionTime,
        expirationTime: session.expirationTime,
        fees: session.fees,
      });
    })
  );

  // Get session status
  router.get(
    '/:sessionId',
    asyncHandler(async (req, res) => {
      const { sessionId } = req.params;
      logger.debug('Getting session status', { sessionId });

      const session = await sessionManager.getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      const status = await sessionManager.getSessionStatus(sessionId);
      res.json(status);
    })
  );

  // Execute swap
  router.post(
    '/:sessionId/execute',
    validateRequest(executeSwapSchema),
    asyncHandler(async (req, res) => {
      const { sessionId } = req.params;
      const { limitOrder, confirmationLevel } = req.body;
      
      logger.info('Executing swap', { sessionId, confirmationLevel });

      const session = await sessionManager.getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      if (session.status !== 'initialized') {
        res.status(400).json({ 
          error: 'Invalid session state', 
          currentStatus: session.status 
        });
        return;
      }

      // Start cross-chain coordination
      await crossChainCoordinator.executeSwap(sessionId, limitOrder);

      // Update session status
      await sessionManager.updateSessionStatus(sessionId, 'executing');

      // Notify WebSocket clients
      webSocketManager.notifySessionUpdate(sessionId, {
        status: 'executing',
        phase: 'source_locking',
        progress: 10,
      });

      res.json({
        sessionId,
        status: 'executing',
        message: 'Swap execution initiated',
        trackingUrl: `/api/v1/sessions/${sessionId}`,
      });
    })
  );

  // Cancel session
  router.post(
    '/:sessionId/cancel',
    asyncHandler(async (req, res) => {
      const { sessionId } = req.params;
      logger.info('Cancelling session', { sessionId });

      const session = await sessionManager.getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      const canCancel = ['initialized', 'executing', 'source_locked'].includes(session.status);
      if (!canCancel) {
        res.status(400).json({ 
          error: 'Cannot cancel session in current state', 
          currentStatus: session.status 
        });
        return;
      }

      // Initiate cancellation
      await crossChainCoordinator.cancelSwap(sessionId);
      await sessionManager.updateSessionStatus(sessionId, 'cancelling');

      // Notify WebSocket clients
      webSocketManager.notifySessionUpdate(sessionId, {
        status: 'cancelling',
        phase: 'initiating_refund',
        progress: 0,
      });

      // Record metrics
      metricsCollector.recordSwapCancelled();

      res.json({
        sessionId,
        status: 'cancelling',
        refundAddress: session.maker,
        estimatedRefundTime: 3600, // 1 hour
      });
    })
  );

  // Get revealed secret for client withdrawal (taker only)
  router.get(
    '/:sessionId/secret',
    asyncHandler(async (req, res) => {
      const { sessionId } = req.params;
      const { walletAddress } = req.query;
      
      logger.debug('Getting session secret for withdrawal', { sessionId, walletAddress });

      const session = await sessionManager.getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // Security: Only allow taker to access the secret
      if (!walletAddress || session.taker.toLowerCase() !== (walletAddress as string).toLowerCase()) {
        res.status(403).json({ 
          error: 'Unauthorized - Only the taker can access withdrawal information',
          taker: session.taker
        });
        return;
      }

      // Check if secret has been revealed
      if (!session.revealedSecret) {
        res.status(400).json({ 
          error: 'Secret not yet revealed',
          status: session.status,
          message: 'Please wait for the atomic swap to reach the secret revelation phase'
        });
        return;
      }

      res.json({
        sessionId,
        secret: session.revealedSecret,
        escrowAddress: session.srcEscrowAddress,
        taker: session.taker,
        withdrawalInstructions: {
          action: 'Call withdraw() function on escrow contract',
          contract: session.srcEscrowAddress,
          function: 'withdraw(bytes32 secret)',
          secret: session.revealedSecret,
          note: `Must be called by taker wallet: ${session.taker}`,
          explorerUrl: session.sourceChain === 'base' 
            ? `https://basescan.org/address/${session.srcEscrowAddress}`
            : `https://etherscan.io/address/${session.srcEscrowAddress}`
        },
        timestamp: session.updatedAt
      });
    })
  );

  // Get all sessions (admin endpoint)
  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const { status, limit = 50, offset = 0 } = req.query;
      
      const sessions = await sessionManager.listSessions({
        status: status as string,
        limit: Number(limit),
        offset: Number(offset),
      });

      res.json({
        sessions,
        total: sessions.length,
        limit: Number(limit),
        offset: Number(offset),
      });
    })
  );

  return router;
}