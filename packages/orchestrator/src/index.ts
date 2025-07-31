import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from './utils/logger';
import { config } from './config';
import { setupRoutes } from './api/routes';
import { WebSocketManager } from './services/WebSocketManager';
import { EventMonitor } from './services/EventMonitor';
import { SessionManager } from './core/SessionManager';
import { DutchAuctionSimulator } from './core/DutchAuctionSimulator';
import { SecretManager } from './core/SecretManager';
import { CrossChainCoordinator } from './core/CrossChainCoordinator';
import { MetricsCollector } from './services/MetricsCollector';
import { errorHandler } from './api/middleware/errorHandler';
import { rateLimiter } from './api/middleware/rateLimiter';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.cors.origin,
    credentials: true,
  },
  path: '/ws',
});

// Initialize core services
const sessionManager = new SessionManager();
const dutchAuctionSimulator = new DutchAuctionSimulator();
const secretManager = new SecretManager();
const crossChainCoordinator = new CrossChainCoordinator(
  sessionManager,
  secretManager
);
const eventMonitor = new EventMonitor(crossChainCoordinator);
const webSocketManager = new WebSocketManager(io, sessionManager);
const metricsCollector = new MetricsCollector();

// Global middleware
app.use(helmet(config.security.helmet));
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    connections: {
      base: eventMonitor.isConnected('base'),
      near: eventMonitor.isConnected('near'),
      redis: sessionManager.isRedisConnected(),
    },
    metrics: metricsCollector.getSnapshot(),
  };
  res.json(health);
});

// Setup API routes
setupRoutes(app, {
  sessionManager,
  dutchAuctionSimulator,
  secretManager,
  crossChainCoordinator,
  webSocketManager,
  metricsCollector,
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start services
async function start() {
  try {
    // Initialize services
    await sessionManager.initialize();
    await eventMonitor.start();
    await webSocketManager.start();
    
    // Start HTTP server
    httpServer.listen(config.port, () => {
      logger.info(`🚀 Orchestration service running on port ${config.port}`);
      logger.info(`📡 WebSocket server running on port ${config.port} (path: /ws)`);
      logger.info(`🌍 Environment: ${config.env}`);
      logger.info(`🔗 BASE RPC: ${config.chains.base.rpcUrl}`);
      logger.info(`🔗 NEAR RPC: ${config.chains.near.rpcUrl}`);
      logger.info(`🔑 API Key configured: ${!!config.security.apiKeySecret}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      await shutdown();
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      await shutdown();
    });

  } catch (error) {
    logger.error('Failed to start orchestration service:', error);
    process.exit(1);
  }
}

async function shutdown() {
  try {
    // Stop accepting new connections
    httpServer.close();
    
    // Close WebSocket connections
    await webSocketManager.stop();
    
    // Stop event monitoring
    await eventMonitor.stop();
    
    // Clean up sessions
    await sessionManager.shutdown();
    
    logger.info('Orchestration service shut down successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the service
start();