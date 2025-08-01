import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createLogger } from '../utils/logger';
import { config } from '../config';
import { SessionManager } from '../core/SessionManager';

const logger = createLogger('WebSocketManager');

interface AuthenticatedSocket extends Socket {
  userId?: string;
  apiKey?: string;
  sessionSubscriptions: Set<string>;
  priceSubscriptions: Set<string>;
}

export class WebSocketManager {
  private clients = new Map<string, AuthenticatedSocket>();
  private sessionSubscribers = new Map<string, Set<string>>(); // sessionId -> clientIds
  private priceSubscribers = new Map<string, Set<string>>(); // pair -> clientIds
  private priceInterval?: NodeJS.Timeout;

  constructor(
    private io: SocketIOServer,
    private sessionManager: SessionManager
  ) {
    this.setupSocketHandlers();
  }

  async start(): Promise<void> {
    logger.info('Starting WebSocket manager');
    
    // Start simulated price updates
    this.startPriceUpdates();
  }

  async stop(): Promise<void> {
    logger.info('Stopping WebSocket manager');
    
    // Stop price updates
    if (this.priceInterval) {
      clearInterval(this.priceInterval);
    }

    // Disconnect all clients
    for (const [_clientId, socket] of this.clients) {
      socket.disconnect(true);
    }

    this.clients.clear();
    this.sessionSubscribers.clear();
    this.priceSubscribers.clear();
  }

  notifySessionUpdate(sessionId: string, update: any): void {
    const subscribers = this.sessionSubscribers.get(sessionId);
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const message = {
      type: 'session_update',
      sessionId,
      status: update.status,
      data: {
        phase: update.phase,
        progress: update.progress,
        details: update.details,
      },
    };

    for (const clientId of subscribers) {
      const socket = this.clients.get(clientId);
      if (socket) {
        socket.emit('session_update', message);
      }
    }

    logger.debug('Notified session update', {
      sessionId,
      subscriberCount: subscribers.size,
    });
  }

  broadcastAlert(alert: {
    severity: 'info' | 'warning' | 'error';
    message: string;
    sessionId?: string;
    action?: string;
  }): void {
    const message = {
      type: 'alert',
      ...alert,
      timestamp: Date.now(),
    };

    if (alert.sessionId) {
      // Send to session subscribers
      const subscribers = this.sessionSubscribers.get(alert.sessionId);
      if (subscribers) {
        for (const clientId of subscribers) {
          const socket = this.clients.get(clientId);
          if (socket) {
            socket.emit('alert', message);
          }
        }
      }
    } else {
      // Broadcast to all clients
      this.io.emit('alert', message);
    }
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const authSocket = socket as AuthenticatedSocket;
      authSocket.sessionSubscriptions = new Set();
      authSocket.priceSubscriptions = new Set();

      logger.info('New WebSocket connection', { socketId: socket.id });

      // Handle authentication
      socket.on('auth', (data) => this.handleAuth(authSocket, data));

      // Handle subscriptions
      socket.on('subscribe', (data) => this.handleSubscribe(authSocket, data));
      socket.on('unsubscribe', (data) => this.handleUnsubscribe(authSocket, data));

      // Handle disconnection
      socket.on('disconnect', () => this.handleDisconnect(authSocket));

      // Handle errors
      socket.on('error', (error) => {
        logger.error('Socket error', { socketId: socket.id, error });
      });

      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to 1Balancer orchestration service',
        version: '1.0.0',
        requiresAuth: true,
      });
    });
  }

  private async handleAuth(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      const { apiKey, token } = data;

      if (apiKey) {
        // Validate API key
        if (this.validateApiKey(apiKey)) {
          socket.apiKey = apiKey;
          this.clients.set(socket.id, socket);
          
          socket.emit('authenticated', {
            success: true,
            method: 'api_key',
          });
          
          logger.info('Socket authenticated with API key', { socketId: socket.id });
        } else {
          socket.emit('authenticated', {
            success: false,
            error: 'Invalid API key',
          });
          
          socket.disconnect();
        }
      } else if (token) {
        // Validate JWT token
        try {
          const decoded = jwt.verify(token, config.security.jwtSecret) as any;
          socket.userId = decoded.userId;
          this.clients.set(socket.id, socket);
          
          socket.emit('authenticated', {
            success: true,
            method: 'jwt',
            userId: decoded.userId,
          });
          
          logger.info('Socket authenticated with JWT', { 
            socketId: socket.id,
            userId: decoded.userId 
          });
        } catch (error) {
          socket.emit('authenticated', {
            success: false,
            error: 'Invalid token',
          });
          
          socket.disconnect();
        }
      } else {
        socket.emit('authenticated', {
          success: false,
          error: 'No authentication provided',
        });
        
        socket.disconnect();
      }
    } catch (error) {
      logger.error('Authentication error', { socketId: socket.id, error });
      socket.disconnect();
    }
  }

  private async handleSubscribe(socket: AuthenticatedSocket, data: any): Promise<void> {
    if (!this.clients.has(socket.id)) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { channel, sessionId, pairs } = data;

    switch (channel) {
      case 'session':
        if (sessionId) {
          await this.subscribeToSession(socket, sessionId);
        }
        break;

      case 'prices':
        if (pairs && Array.isArray(pairs)) {
          await this.subscribeToPrices(socket, pairs);
        }
        break;

      default:
        socket.emit('error', { message: 'Unknown channel' });
    }
  }

  private async handleUnsubscribe(socket: AuthenticatedSocket, data: any): Promise<void> {
    const { channel, sessionId, pairs } = data;

    switch (channel) {
      case 'session':
        if (sessionId) {
          this.unsubscribeFromSession(socket, sessionId);
        }
        break;

      case 'prices':
        if (pairs && Array.isArray(pairs)) {
          this.unsubscribeFromPrices(socket, pairs);
        }
        break;
    }
  }

  private handleDisconnect(socket: AuthenticatedSocket): void {
    logger.info('Socket disconnected', { socketId: socket.id });

    // Remove from all subscriptions
    for (const sessionId of socket.sessionSubscriptions) {
      const subscribers = this.sessionSubscribers.get(sessionId);
      if (subscribers) {
        subscribers.delete(socket.id);
        if (subscribers.size === 0) {
          this.sessionSubscribers.delete(sessionId);
        }
      }
    }

    for (const pair of socket.priceSubscriptions) {
      const subscribers = this.priceSubscribers.get(pair);
      if (subscribers) {
        subscribers.delete(socket.id);
        if (subscribers.size === 0) {
          this.priceSubscribers.delete(pair);
        }
      }
    }

    // Remove from clients
    this.clients.delete(socket.id);
  }

  private async subscribeToSession(socket: AuthenticatedSocket, sessionId: string): Promise<void> {
    // Verify session exists
    const session = await this.sessionManager.getSession(sessionId);
    if (!session) {
      socket.emit('subscription_error', {
        channel: 'session',
        sessionId,
        error: 'Session not found',
      });
      return;
    }

    // Add to subscribers
    if (!this.sessionSubscribers.has(sessionId)) {
      this.sessionSubscribers.set(sessionId, new Set());
    }
    this.sessionSubscribers.get(sessionId)!.add(socket.id);
    socket.sessionSubscriptions.add(sessionId);

    // Send current status
    const status = await this.sessionManager.getSessionStatus(sessionId);
    socket.emit('session_snapshot', {
      sessionId,
      ...status,
    });

    socket.emit('subscribed', {
      channel: 'session',
      sessionId,
    });

    logger.debug('Socket subscribed to session', { socketId: socket.id, sessionId });
  }

  private async subscribeToPrices(socket: AuthenticatedSocket, pairs: string[]): Promise<void> {
    for (const pair of pairs) {
      if (!this.priceSubscribers.has(pair)) {
        this.priceSubscribers.set(pair, new Set());
      }
      this.priceSubscribers.get(pair)!.add(socket.id);
      socket.priceSubscriptions.add(pair);
    }

    socket.emit('subscribed', {
      channel: 'prices',
      pairs,
    });

    logger.debug('Socket subscribed to prices', { socketId: socket.id, pairs });
  }

  private unsubscribeFromSession(socket: AuthenticatedSocket, sessionId: string): void {
    const subscribers = this.sessionSubscribers.get(sessionId);
    if (subscribers) {
      subscribers.delete(socket.id);
      if (subscribers.size === 0) {
        this.sessionSubscribers.delete(sessionId);
      }
    }
    socket.sessionSubscriptions.delete(sessionId);

    socket.emit('unsubscribed', {
      channel: 'session',
      sessionId,
    });
  }

  private unsubscribeFromPrices(socket: AuthenticatedSocket, pairs: string[]): void {
    for (const pair of pairs) {
      const subscribers = this.priceSubscribers.get(pair);
      if (subscribers) {
        subscribers.delete(socket.id);
        if (subscribers.size === 0) {
          this.priceSubscribers.delete(pair);
        }
      }
      socket.priceSubscriptions.delete(pair);
    }

    socket.emit('unsubscribed', {
      channel: 'prices',
      pairs,
    });
  }

  private validateApiKey(apiKey: string): boolean {
    // Simple validation for demo
    return apiKey === config.security.apiKeySecret || apiKey === 'demo-api-key';
  }

  private startPriceUpdates(): void {
    // Simulate price updates every 5 seconds
    this.priceInterval = setInterval(() => {
      this.broadcastPriceUpdate();
    }, 5000);
  }

  private broadcastPriceUpdate(): void {
    const pairs = ['USDC/USDT', 'ETH/USDC', 'ETH/USDT'];
    
    for (const pair of pairs) {
      const subscribers = this.priceSubscribers.get(pair);
      if (!subscribers || subscribers.size === 0) {
        continue;
      }

      // Generate simulated price
      const basePrice = pair === 'USDC/USDT' ? 0.999 : pair === 'ETH/USDC' ? 3200 : 3195;
      const variation = (Math.random() - 0.5) * 0.002; // 0.2% variation
      const price = basePrice * (1 + variation);

      const update = {
        type: 'price_update',
        pair,
        price: price.toFixed(6),
        timestamp: Date.now(),
        source: '1inch',
      };

      for (const clientId of subscribers) {
        const socket = this.clients.get(clientId);
        if (socket) {
          socket.emit('price_update', update);
        }
      }
    }
  }

  // Admin methods
  getConnectionStats(): {
    totalConnections: number;
    authenticatedConnections: number;
    sessionSubscriptions: number;
    priceSubscriptions: number;
  } {
    return {
      totalConnections: this.io.engine.clientsCount,
      authenticatedConnections: this.clients.size,
      sessionSubscriptions: this.sessionSubscribers.size,
      priceSubscriptions: this.priceSubscribers.size,
    };
  }
}