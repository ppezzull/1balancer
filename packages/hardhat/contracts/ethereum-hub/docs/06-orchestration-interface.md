# Orchestration Service Interface

## Overview

The Orchestration Service is the off-chain component that coordinates cross-chain atomic swaps. It implements the "Orchestration Simulation Strategy" to avoid KYC requirements while providing Fusion+ functionality.

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Orchestration Service                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │   REST API  │  │  WebSocket   │  │  Event Monitor    │   │
│  │  (Express)  │  │   Server     │  │   (Multi-chain)   │   │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬────────┘   │
│         │                │                     │            │
│  ┌──────▼────────────────▼─────────────────────▼─────────┐  │
│  │              Core Orchestration Engine                │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ • Dutch Auction Simulator  • Secret Manager           │  │
│  │ • Session State Machine    • Cross-Chain Coordinator  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## REST API Specification

### Base URL
```
http://localhost:8080/api/v1
```

### Endpoints

#### 1. Create Swap Session

```http
POST /sessions

Request:
{
    "sourceChain": "base",
    "destinationChain": "near",
    "sourceToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on BASE
    "destinationToken": "usdt.near",
    "sourceAmount": "1000000000", // 1000 USDC (6 decimals)
    "destinationAmount": "999000000", // 999 USDT (6 decimals)
    "maker": "0x742d35Cc6634C0532925a3b844Bc9e7595f2BD4e",
    "taker": "alice.near",
    "slippageTolerance": 100 // 1% in basis points
}

Response:
{
    "sessionId": "sess_2KYp3x9mN5",
    "status": "initialized",
    "hashlockHash": "0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658",
    "estimatedCompletionTime": 180, // seconds
    "expirationTime": 1704067200, // Unix timestamp
    "fees": {
        "protocol": "30", // 0.3% in basis points
        "network": {
            "base": "0.001", // ETH
            "near": "0.01" // NEAR
        }
    }
}
```

#### 2. Get Session Status

```http
GET /sessions/:sessionId

Response:
{
    "sessionId": "sess_2KYp3x9mN5",
    "status": "source_locked",
    "steps": [
        {
            "step": "initialize",
            "status": "completed",
            "timestamp": 1704067000
        },
        {
            "step": "source_lock",
            "status": "completed",
            "timestamp": 1704067060,
            "txHash": "0x123...",
            "escrowAddress": "0xabc..."
        },
        {
            "step": "destination_lock",
            "status": "pending",
            "estimatedTime": 60
        },
        {
            "step": "reveal_secret",
            "status": "waiting"
        },
        {
            "step": "complete",
            "status": "waiting"
        }
    ],
    "currentPhase": "locking_destination",
    "timeRemaining": 7140 // seconds until timeout
}
```

#### 3. Execute Swap

```http
POST /sessions/:sessionId/execute

Request:
{
    "limitOrder": {
        "order": { /* 1inch order structure */ },
        "signature": "0x..."
    },
    "confirmationLevel": "fast" // or "secure"
}

Response:
{
    "sessionId": "sess_2KYp3x9mN5",
    "status": "executing",
    "message": "Swap execution initiated",
    "trackingUrl": "/sessions/sess_2KYp3x9mN5/track"
}
```

#### 4. Cancel Session

```http
POST /sessions/:sessionId/cancel

Response:
{
    "sessionId": "sess_2KYp3x9mN5",
    "status": "cancelling",
    "refundAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2BD4e",
    "estimatedRefundTime": 3600 // seconds
}
```

#### 5. Get Quote (Dutch Auction Simulation)

```http
POST /quote

Request:
{
    "sourceChain": "base",
    "destinationChain": "near",
    "sourceToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "destinationToken": "usdt.near",
    "amount": "1000000000",
    "urgency": "normal" // "fast", "normal", "slow"
}

Response:
{
    "quote": {
        "sourceAmount": "1000000000",
        "destinationAmount": "999000000",
        "rate": "0.999",
        "priceImpact": "0.1", // percentage
        "validUntil": 1704067300 // Unix timestamp
    },
    "dutchAuction": {
        "startPrice": "1.001",
        "endPrice": "0.995",
        "duration": 300, // seconds
        "currentPrice": "0.999"
    },
    "fees": {
        "protocol": "3000000", // 3 USDC
        "network": "1000000" // 1 USDC
    }
}
```

## WebSocket Interface

### Connection

```javascript
const ws = new WebSocket('ws://localhost:8080/ws');

// Authenticate
ws.send(JSON.stringify({
    type: 'auth',
    apiKey: 'your_api_key'
}));
```

### Event Subscriptions

```javascript
// Subscribe to session updates
ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'session',
    sessionId: 'sess_2KYp3x9mN5'
}));

// Subscribe to price updates
ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'prices',
    pairs: ['USDC/USDT']
}));
```

### Event Types

```typescript
interface SessionUpdate {
    type: 'session_update';
    sessionId: string;
    status: SessionStatus;
    data: {
        phase: string;
        progress: number; // 0-100
        details?: any;
    };
}

interface PriceUpdate {
    type: 'price_update';
    pair: string;
    price: string;
    timestamp: number;
    source: '1inch' | 'aggregated';
}

interface Alert {
    type: 'alert';
    severity: 'info' | 'warning' | 'error';
    message: string;
    sessionId?: string;
    action?: 'timeout_approaching' | 'network_issue' | 'price_deviation';
}
```

## Core Engine Components

### 1. Dutch Auction Simulator

```typescript
class DutchAuctionSimulator {
    simulate(params: AuctionParams): SimulatedQuote {
        const marketPrice = this.getMarketPrice(params);
        const urgencyMultiplier = this.getUrgencyMultiplier(params.urgency);
        
        const startPrice = marketPrice * (1 + 0.005); // 0.5% above market
        const endPrice = marketPrice * (1 - 0.005); // 0.5% below market
        
        const duration = 300 * urgencyMultiplier; // 5 minutes base
        const currentTime = Date.now();
        const elapsed = currentTime - params.startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentPrice = startPrice - (startPrice - endPrice) * progress;
        
        return {
            price: currentPrice,
            validFor: 60, // seconds
            confidence: 0.95
        };
    }
}
```

### 2. Session State Machine

```typescript
class SessionStateMachine {
    private transitions = {
        initialized: ['source_locking', 'cancelled'],
        source_locking: ['source_locked', 'failed'],
        source_locked: ['destination_locking', 'timeout'],
        destination_locking: ['both_locked', 'failed'],
        both_locked: ['revealing_secret', 'timeout'],
        revealing_secret: ['completed', 'failed'],
        completed: [],
        cancelled: [],
        failed: [],
        timeout: ['refunding'],
        refunding: ['refunded']
    };
    
    canTransition(from: SessionStatus, to: SessionStatus): boolean {
        return this.transitions[from]?.includes(to) || false;
    }
    
    async transition(session: Session, to: SessionStatus): Promise<void> {
        if (!this.canTransition(session.status, to)) {
            throw new Error(`Invalid transition: ${session.status} -> ${to}`);
        }
        
        session.status = to;
        await this.handleTransition(session, to);
    }
}
```

### 3. Secret Manager

```typescript
class SecretManager {
    private secrets = new Map<string, EncryptedSecret>();
    private kms: KMSClient; // Optional hardware security module
    
    async generateSecret(): Promise<SecretPair> {
        const secret = crypto.randomBytes(32);
        const hash = crypto.createHash('sha256').update(secret).digest();
        
        const encrypted = await this.encrypt(secret);
        this.secrets.set(hash.toString('hex'), {
            encrypted,
            createdAt: Date.now(),
            expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });
        
        return { secret, hash };
    }
    
    async revealSecret(hash: string): Promise<Buffer> {
        const encrypted = this.secrets.get(hash);
        if (!encrypted) throw new Error('Secret not found');
        
        const secret = await this.decrypt(encrypted.encrypted);
        this.secrets.delete(hash); // One-time use
        
        return secret;
    }
}
```

### 4. Cross-Chain Coordinator

```typescript
class CrossChainCoordinator {
    async coordinateSwap(session: SwapSession): Promise<void> {
        try {
            // Phase 1: Lock on source
            await this.lockSourceChain(session);
            
            // Phase 2: Lock on destination
            await this.lockDestinationChain(session);
            
            // Phase 3: Reveal secret
            await this.revealAndComplete(session);
            
        } catch (error) {
            await this.handleFailure(session, error);
        }
    }
    
    private async lockSourceChain(session: SwapSession) {
        const tx = await this.resolver.deploySrc(
            session.srcImmutables,
            session.limitOrder,
            session.signature
        );
        
        await this.waitForConfirmation(tx, 'base');
        await this.sessionManager.transition(session, 'source_locked');
    }
}
```

## Integration Examples

### Frontend Integration

```typescript
class OrchestrationClient {
    private baseUrl = 'http://localhost:8080/api/v1';
    private ws: WebSocket;
    
    async createSwap(params: SwapParams): Promise<SwapSession> {
        const response = await fetch(`${this.baseUrl}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        
        const session = await response.json();
        
        // Subscribe to updates
        this.subscribeToSession(session.sessionId);
        
        return session;
    }
    
    subscribeToSession(sessionId: string) {
        this.ws.send(JSON.stringify({
            type: 'subscribe',
            channel: 'session',
            sessionId
        }));
    }
}
```

### Contract Integration

```solidity
// Orchestration service calls these functions
interface IOrchestrationTarget {
    function initiateSwap(bytes calldata params) external returns (bytes32);
    function confirmLock(bytes32 swapId) external;
    function revealSecret(bytes32 swapId, bytes32 secret) external;
    function cancelSwap(bytes32 swapId) external;
}
```

## Security Considerations

### 1. Authentication

```typescript
// API Key authentication
app.use('/api', (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!isValidApiKey(apiKey)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
});
```

### 2. Rate Limiting

```typescript
const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests'
});

app.use('/api', rateLimiter);
```

### 3. Input Validation

```typescript
const validateSwapParams = Joi.object({
    sourceChain: Joi.string().valid('base', 'ethereum', 'polygon').required(),
    destinationChain: Joi.string().valid('near').required(),
    sourceToken: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
    destinationToken: Joi.string().required(),
    sourceAmount: Joi.string().pattern(/^\d+$/).required(),
    slippageTolerance: Joi.number().min(0).max(1000).required()
});
```

## Monitoring and Health

### Health Check Endpoint

```http
GET /health

Response:
{
    "status": "healthy",
    "uptime": 86400,
    "connections": {
        "base": "connected",
        "near": "connected",
        "redis": "connected"
    },
    "metrics": {
        "activeSwaps": 12,
        "completedToday": 156,
        "averageCompletionTime": 185
    }
}
```

### Metrics Collection

```typescript
class MetricsCollector {
    private metrics = {
        swapsInitiated: new Counter('swaps_initiated_total'),
        swapsCompleted: new Counter('swaps_completed_total'),
        swapsFailed: new Counter('swaps_failed_total'),
        swapDuration: new Histogram('swap_duration_seconds'),
        apiLatency: new Histogram('api_latency_milliseconds')
    };
    
    recordSwapCompletion(duration: number) {
        this.metrics.swapsCompleted.inc();
        this.metrics.swapDuration.observe(duration);
    }
}
```

## Deployment Configuration

### Environment Variables

```bash
# Network Configuration
BASE_RPC_URL=https://mainnet.base.org
NEAR_RPC_URL=https://rpc.mainnet.near.org

# Service Configuration
PORT=8080
WS_PORT=8081
NODE_ENV=production

# Security
API_KEY_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret

# External Services
INCH_API_KEY=your-1inch-api-key
REDIS_URL=redis://localhost:6379

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

## Conclusion

The Orchestration Service provides:

1. **Simple API**: Easy integration for frontends
2. **Real-time Updates**: WebSocket for live status
3. **Security**: Authentication and validation
4. **Reliability**: State management and error handling
5. **Monitoring**: Health checks and metrics

This service is the key to enabling cross-chain swaps without KYC requirements in the Fusion+ challenge.