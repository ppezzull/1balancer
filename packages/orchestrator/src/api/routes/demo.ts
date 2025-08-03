import { Router } from 'express';
import { Services } from './index';
import { asyncHandler } from '../middleware/asyncHandler';
import { createLogger } from '../../utils/logger';
import { FusionPlusExecutor } from '../../core/FusionPlusExecutor';

const logger = createLogger('demo-api');

export function demoRouter(services: Services): Router {
  const router = Router();
  const { sessionManager, webSocketManager, secretManager } = services;
  const executor = new FusionPlusExecutor(sessionManager, secretManager, webSocketManager);

  // Demo endpoint to simulate swap execution
  router.post(
    '/simulate/:sessionId',
    asyncHandler(async (req, res) => {
      const { sessionId } = req.params;
      logger.info('Simulating swap execution for demo', { sessionId });

      const session = await sessionManager.getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      if (session.status !== 'initialized') {
        res.status(400).json({ 
          error: 'Session already executed',
          currentStatus: session.status 
        });
        return;
      }

      // Start simulation
      res.json({
        sessionId,
        message: 'Simulation started. Check WebSocket for updates.',
        note: 'This is a demo simulation. In production, real blockchain events would trigger these updates.'
      });

      // Simulate the execution phases asynchronously
      simulateExecutionPhases(sessionId, sessionManager, webSocketManager).catch(error => {
        logger.error('Simulation failed', { sessionId, error });
      });
    })
  );

  /**
   * Execute real swap with minimal amounts for testing
   */
  router.post(
    '/execute/:sessionId',
    asyncHandler(async (req, res) => {
      const { sessionId } = req.params;
      
      logger.info('Starting real execution', { sessionId });
      
      // Start real execution in background
      executor.executeFullSwap(sessionId).catch(error => {
        logger.error('Real execution failed', { sessionId, error });
      });
      
      res.json({
        success: true,
        sessionId,
        note: 'Real execution started. Monitor WebSocket for updates and check blockchain explorers.'
      });
    })
  );

  /**
   * Get execution steps for transparency
   */
  router.get(
    '/execution-steps/:sessionId',
    asyncHandler(async (req, res) => {
      const { sessionId } = req.params;
      
      const steps = executor.getExecutionSteps(sessionId);
      
      res.json({
        sessionId,
        steps,
        totalSteps: steps.length,
        completed: steps.filter(s => s.status === 'completed').length,
        failed: steps.filter(s => s.status === 'failed').length
      });
    })
  );

  /**
   * Create demo session with minimal amounts
   */
  router.post(
    '/create-minimal-session',
    asyncHandler(async (req, res) => {
      // Create session with minimal amounts for testing
      const session = await sessionManager.createSession({
        sourceChain: 'base',
        destinationChain: 'near',
        sourceToken: '0x0000000000000000000000000000000000000000', // Native ETH
        destinationToken: 'near', // Native NEAR
        sourceAmount: '1000000000000000', // 0.001 ETH
        destinationAmount: '100000000000000000000000', // 0.1 NEAR
        maker: req.body.maker || '0x742d35Cc6634C0532925a3b844Bc9e7595f2BD4e',
        taker: req.body.taker || 'alice.testnet',
        slippageTolerance: 50
      });

      logger.info('Created minimal demo session', { sessionId: session.sessionId });

      res.json({
        sessionId: session.sessionId,
        hashlockHash: session.hashlockHash,
        status: session.status,
        amounts: {
          source: '0.001 ETH',
          destination: '0.1 NEAR'
        },
        note: 'Session created with minimal amounts for testing'
      });
    })
  );

  return router;
}

async function simulateExecutionPhases(
  sessionId: string,
  sessionManager: any,
  webSocketManager: any
): Promise<void> {
  const phases = [
    { status: 'source_locking', phase: 'locking_source', progress: 10, delay: 2000 },
    { status: 'source_locked', phase: 'source_confirmed', progress: 30, delay: 3000 },
    { status: 'destination_locking', phase: 'locking_destination', progress: 50, delay: 3000 },
    { status: 'both_locked', phase: 'both_confirmed', progress: 70, delay: 2000 },
    { status: 'revealing_secret', phase: 'revealing', progress: 90, delay: 2000 },
    { status: 'completed', phase: 'completed', progress: 100, delay: 1000 }
  ];

  for (const phase of phases) {
    await new Promise(resolve => setTimeout(resolve, phase.delay));
    
    // Update session status
    await sessionManager.updateSessionStatus(sessionId, phase.status);
    
    // Update steps
    const session = await sessionManager.getSession(sessionId);
    if (session) {
      updateStepStatus(session, phase.status);
      await sessionManager.updateSession(sessionId, session);
    }
    
    // Send WebSocket update
    webSocketManager.notifySessionUpdate(sessionId, {
      status: phase.status,
      phase: phase.phase,
      progress: phase.progress,
      timestamp: Date.now()
    });
    
    logger.info('Simulated phase update', { 
      sessionId, 
      status: phase.status, 
      progress: phase.progress 
    });
  }
}

function updateStepStatus(session: any, status: string): void {
  const stepMap: Record<string, string> = {
    'source_locking': 'source_lock',
    'source_locked': 'source_lock',
    'destination_locking': 'destination_lock',
    'both_locked': 'destination_lock',
    'revealing_secret': 'reveal_secret',
    'completed': 'complete'
  };

  const currentStep = stepMap[status];
  if (currentStep) {
    const step = session.steps.find((s: any) => s.step === currentStep);
    if (step) {
      step.status = 'completed';
      step.timestamp = Date.now();
    }
    
    // Mark previous steps as completed
    const stepOrder = ['initialize', 'source_lock', 'destination_lock', 'reveal_secret', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    for (let i = 0; i <= currentIndex; i++) {
      const prevStep = session.steps.find((s: any) => s.step === stepOrder[i]);
      if (prevStep && prevStep.status !== 'completed') {
        prevStep.status = 'completed';
        prevStep.timestamp = Date.now();
      }
    }
  }
}