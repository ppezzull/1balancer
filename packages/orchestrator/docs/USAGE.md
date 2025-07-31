# Orchestrator Service Usage Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Configuration](#configuration)
3. [API Usage](#api-usage)
4. [WebSocket Usage](#websocket-usage)
5. [Integration Examples](#integration-examples)
6. [Command Line Usage](#command-line-usage)
7. [Monitoring and Debugging](#monitoring-and-debugging)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Yarn package manager
- Access to BASE and NEAR RPC endpoints
- 1inch API key (for hackathon: get from ETHGlobal)
- Deployed smart contracts on BASE

### Quick Start

```bash
# Navigate to orchestrator directory
cd packages/orchestrator

# Install dependencies
yarn install

# Copy environment configuration
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start development server
yarn dev
```

### First-Time Setup

Run the automated setup script:
```bash
./scripts/setup.sh
```

This will:
- Check Node.js version
- Install dependencies
- Create .env file
- Set up logs directory
- Check optional dependencies (Redis)

## Configuration

### Environment Variables

Create a `.env` file with the following configuration:

```env
# Network Configuration
NODE_ENV=development
BASE_RPC_URL=https://sepolia.base.org
NEAR_RPC_URL=https://rpc.testnet.near.org

# Service Configuration
PORT=8080
LOG_LEVEL=debug

# Contract Addresses (from hardhat deployment)
ESCROW_FACTORY_ADDRESS=0x... # Get from deployment
FUSION_PLUS_HUB_ADDRESS=0x... # Get from deployment
FUSION_PLUS_RESOLVER_ADDRESS=0x... # Get from deployment

# Security
API_KEY_SECRET=your-secure-api-key-here
JWT_SECRET=your-secure-jwt-secret-here
CORS_ORIGIN=http://localhost:3000

# External Services
ONEINCH_API_KEY=your-1inch-api-key
REDIS_URL=redis://localhost:6379 # Optional

# NEAR Configuration
NEAR_NETWORK_ID=testnet
NEAR_ORCHESTRATOR_ACCOUNT_ID=orchestrator.testnet
NEAR_PRIVATE_KEY=ed25519:... # Optional for hackathon
```

### Configuration Validation

The service validates configuration on startup:
```bash
# Check configuration
make check-env
```

## API Usage

### Authentication

All API requests require authentication via API key:

```bash
# Using API key header
curl -H "X-API-Key: your-api-key" http://localhost:8080/api/v1/health

# Or using Authorization header
curl -H "Authorization: Bearer your-jwt-token" http://localhost:8080/api/v1/health
```

### Create Swap Session

```bash
# Create a new swap session
curl -X POST http://localhost:8080/api/v1/sessions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "sourceChain": "base",
    "destinationChain": "near",
    "sourceToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "destinationToken": "usdt.near",
    "sourceAmount": "1000000000",
    "destinationAmount": "999000000",
    "maker": "0x742d35Cc6634C0532925a3b844Bc9e7595f2BD4e",
    "taker": "alice.near",
    "slippageTolerance": 100
  }'
```

Response:
```json
{
  "sessionId": "sess_abc123def",
  "status": "initialized",
  "hashlockHash": "0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658",
  "estimatedCompletionTime": 180,
  "expirationTime": 1704067200,
  "fees": {
    "protocol": "30",
    "network": {
      "base": "0.001",
      "near": "0.01"
    }
  }
}
```

### Get Session Status

```bash
# Get session status
curl http://localhost:8080/api/v1/sessions/sess_abc123def \
  -H "X-API-Key: your-api-key"
```

Response:
```json
{
  "sessionId": "sess_abc123def",
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
    }
  ],
  "currentPhase": "locking_destination",
  "timeRemaining": 7140
}
```

### Execute Swap

```bash
# Execute the swap with limit order
curl -X POST http://localhost:8080/api/v1/sessions/sess_abc123def/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "limitOrder": {
      "order": {
        "salt": "1234567890",
        "maker": "0x742d35Cc6634C0532925a3b844Bc9e7595f2BD4e",
        "receiver": "0x0000000000000000000000000000000000000000",
        "makerAsset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "takerAsset": "0x0000000000000000000000000000000000000000",
        "makingAmount": "1000000000",
        "takingAmount": "999000000",
        "makerTraits": "0x..."
      },
      "signature": "0x..."
    },
    "confirmationLevel": "fast"
  }'
```

### Get Quote

```bash
# Get Dutch auction quote
curl -X POST http://localhost:8080/api/v1/quote \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "sourceChain": "base",
    "destinationChain": "near",
    "sourceToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "destinationToken": "usdt.near",
    "amount": "1000000000",
    "urgency": "normal"
  }'
```

### Cancel Session

```bash
# Cancel a session
curl -X POST http://localhost:8080/api/v1/sessions/sess_abc123def/cancel \
  -H "X-API-Key: your-api-key"
```

## WebSocket Usage

### Connection and Authentication

```javascript
// Connect to WebSocket server
const ws = new WebSocket('ws://localhost:8080/ws');

// Wait for connection
ws.on('open', () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    apiKey: 'your-api-key'
  }));
});

// Handle authentication response
ws.on('message', (data) => {
  const message = JSON.parse(data);
  
  if (message.type === 'authenticated' && message.success) {
    console.log('Authenticated successfully');
    
    // Subscribe to session updates
    ws.send(JSON.stringify({
      type: 'subscribe',
      channel: 'session',
      sessionId: 'sess_abc123def'
    }));
  }
});
```

### Subscribing to Events

```javascript
// Subscribe to session updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'session',
  sessionId: 'sess_abc123def'
}));

// Subscribe to price updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'prices',
  pairs: ['USDC/USDT', 'ETH/USDC']
}));

// Handle updates
ws.on('message', (data) => {
  const message = JSON.parse(data);
  
  switch(message.type) {
    case 'session_update':
      console.log('Session update:', message);
      break;
      
    case 'price_update':
      console.log('Price update:', message);
      break;
      
    case 'alert':
      console.log('Alert:', message);
      break;
  }
});
```

### Unsubscribing

```javascript
// Unsubscribe from session
ws.send(JSON.stringify({
  type: 'unsubscribe',
  channel: 'session',
  sessionId: 'sess_abc123def'
}));
```

## Integration Examples

### Frontend Integration (React)

```typescript
// OrchestrationClient.ts
export class OrchestrationClient {
  private baseUrl: string;
  private apiKey: string;
  private ws: WebSocket | null = null;
  
  constructor(config: { baseUrl: string; apiKey: string }) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }
  
  async createSwap(params: SwapParams): Promise<SwapSession> {
    const response = await fetch(`${this.baseUrl}/api/v1/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create swap session');
    }
    
    return response.json();
  }
  
  connectWebSocket(): void {
    this.ws = new WebSocket(`${this.baseUrl.replace('http', 'ws')}/ws`);
    
    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({
        type: 'auth',
        apiKey: this.apiKey
      }));
    };
  }
  
  subscribeToSession(sessionId: string, callback: (update: any) => void): void {
    if (!this.ws) {
      throw new Error('WebSocket not connected');
    }
    
    this.ws.send(JSON.stringify({
      type: 'subscribe',
      channel: 'session',
      sessionId
    }));
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'session_update' && message.sessionId === sessionId) {
        callback(message);
      }
    };
  }
}

// Usage in React component
const SwapComponent: React.FC = () => {
  const [session, setSession] = useState<SwapSession | null>(null);
  const [status, setStatus] = useState<string>('');
  
  const client = useMemo(() => new OrchestrationClient({
    baseUrl: 'http://localhost:8080',
    apiKey: process.env.REACT_APP_ORCHESTRATOR_API_KEY!
  }), []);
  
  useEffect(() => {
    client.connectWebSocket();
  }, [client]);
  
  const handleCreateSwap = async () => {
    try {
      const newSession = await client.createSwap({
        sourceChain: 'base',
        destinationChain: 'near',
        // ... other params
      });
      
      setSession(newSession);
      
      // Subscribe to updates
      client.subscribeToSession(newSession.sessionId, (update) => {
        setStatus(update.status);
      });
    } catch (error) {
      console.error('Failed to create swap:', error);
    }
  };
  
  return (
    <div>
      <button onClick={handleCreateSwap}>Create Swap</button>
      {session && <div>Session: {session.sessionId} - Status: {status}</div>}
    </div>
  );
};
```

### Backend Integration (Node.js)

```typescript
// swapService.ts
import axios from 'axios';

class SwapService {
  private apiClient = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
    headers: {
      'X-API-Key': process.env.ORCHESTRATOR_API_KEY
    }
  });
  
  async executeSwap(params: SwapParams): Promise<string> {
    // Create session
    const { data: session } = await this.apiClient.post('/sessions', params);
    
    // Get quote
    const { data: quote } = await this.apiClient.post('/quote', {
      sourceChain: params.sourceChain,
      destinationChain: params.destinationChain,
      sourceToken: params.sourceToken,
      destinationToken: params.destinationToken,
      amount: params.sourceAmount,
      urgency: 'normal'
    });
    
    // Execute swap
    await this.apiClient.post(`/sessions/${session.sessionId}/execute`, {
      limitOrder: {
        // ... order details
      },
      confirmationLevel: 'fast'
    });
    
    return session.sessionId;
  }
  
  async pollStatus(sessionId: string): Promise<SessionStatus> {
    const { data } = await this.apiClient.get(`/sessions/${sessionId}`);
    return data;
  }
}
```

## Command Line Usage

### Using Make Commands

```bash
# Development
make dev          # Start development server
make test         # Run tests
make lint         # Run linter
make typecheck    # TypeScript type checking

# Production
make build        # Build for production
make start        # Start production server

# Docker
make docker-build # Build Docker image
make docker-run   # Run Docker container

# Utilities
make logs         # Tail logs
make health       # Health check
make metrics      # Monitor metrics
```

### Direct Commands

```bash
# Development with hot reload
yarn dev

# Build TypeScript
yarn build

# Start production
yarn start

# Run tests
yarn test
yarn test:watch

# Linting
yarn lint

# Type checking
yarn typecheck
```

## Monitoring and Debugging

### Health Check

```bash
# Check service health
curl http://localhost:8080/health
```

Response:
```json
{
  "status": "healthy",
  "uptime": 3600,
  "timestamp": "2024-01-15T10:30:00Z",
  "connections": {
    "base": true,
    "near": true,
    "redis": true
  },
  "metrics": {
    "activeSwaps": 5,
    "completedToday": 42,
    "averageCompletionTime": 185
  }
}
```

### Viewing Logs

```bash
# Tail logs in development
yarn dev

# View production logs
tail -f logs/combined.log
tail -f logs/error.log

# Filter logs by module
grep "SessionManager" logs/combined.log
```

### Metrics Endpoint

```bash
# Get Prometheus metrics
curl http://localhost:8080/metrics
```

Sample output:
```
# TYPE orchestrator_swaps_initiated_total counter
orchestrator_swaps_initiated_total 156

# TYPE orchestrator_swaps_completed_total counter
orchestrator_swaps_completed_total 142

# TYPE orchestrator_api_latency histogram
orchestrator_api_latency_count 1000
orchestrator_api_latency_sum 45000
```

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL=debug
```

### Common Issues

1. **Connection Refused**
   ```bash
   # Check if service is running
   ps aux | grep node
   
   # Check port availability
   lsof -i :8080
   ```

2. **Authentication Failed**
   ```bash
   # Verify API key
   echo $API_KEY_SECRET
   
   # Test with curl
   curl -H "X-API-Key: $API_KEY_SECRET" http://localhost:8080/health
   ```

3. **Contract Not Found**
   ```bash
   # Verify contract addresses in .env
   # Ensure contracts are deployed
   cd ../hardhat
   yarn deploy --network baseSepolia
   ```

4. **WebSocket Connection Failed**
   - Check CORS configuration
   - Verify WebSocket port (8080)
   - Check authentication

## Production Deployment

### Environment Setup

```bash
# Production .env
NODE_ENV=production
LOG_LEVEL=info
PORT=8080

# Use production RPC endpoints
BASE_RPC_URL=https://mainnet.base.org
NEAR_RPC_URL=https://rpc.mainnet.near.org
```

### Process Management

Using PM2:
```bash
# Install PM2
npm install -g pm2

# Start service
pm2 start dist/index.js --name orchestrator

# Monitor
pm2 monit

# Logs
pm2 logs orchestrator
```

### Load Balancing

For multiple instances:
```nginx
upstream orchestrator {
    server localhost:8080;
    server localhost:8081;
    server localhost:8082;
}

server {
    location /api/ {
        proxy_pass http://orchestrator;
    }
    
    location /ws {
        proxy_pass http://orchestrator;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```