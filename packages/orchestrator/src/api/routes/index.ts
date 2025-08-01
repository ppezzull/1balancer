import { Express } from 'express';
import { sessionsRouter } from './sessions';
import { quoteRouter } from './quote';
import { authenticate } from '../middleware/authenticate';
import { SessionManager } from '../../core/SessionManager';
import { DutchAuctionSimulator } from '../../core/DutchAuctionSimulator';
import { SecretManager } from '../../core/SecretManager';
import { CrossChainCoordinator } from '../../core/CrossChainCoordinator';
import { WebSocketManager } from '../../services/WebSocketManager';
import { MetricsCollector } from '../../services/MetricsCollector';

export interface Services {
  sessionManager: SessionManager;
  dutchAuctionSimulator: DutchAuctionSimulator;
  secretManager: SecretManager;
  crossChainCoordinator: CrossChainCoordinator;
  webSocketManager: WebSocketManager;
  metricsCollector: MetricsCollector;
}

export function setupRoutes(app: Express, services: Services): void {
  // API v1 routes
  const apiV1 = '/api/v1';
  
  // Apply authentication to all API routes
  app.use(apiV1, authenticate);
  
  // Mount routers
  app.use(`${apiV1}/sessions`, sessionsRouter(services));
  app.use(`${apiV1}/quote`, quoteRouter(services));
  
  // Version endpoint
  app.get(`${apiV1}/version`, (_req, res) => {
    res.json({
      version: '1.0.0',
      service: 'orchestrator',
      timestamp: new Date().toISOString(),
    });
  });
}