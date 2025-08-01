# 1Balancer Orchestration Service

The orchestration service is the middle layer in the three-layer architecture that coordinates cross-chain atomic swaps between BASE and NEAR without requiring KYC.

## Overview

This service implements the "Orchestration Simulation Strategy" to provide Fusion+ functionality while avoiding the KYC requirements of official 1inch resolvers.

### Key Features

- **REST API**: Full API for swap session management
- **WebSocket Server**: Real-time updates for swap progress
- **Dutch Auction Simulation**: Price discovery without official resolver status
- **Cross-Chain Coordination**: Event monitoring and state synchronization
- **Secret Management**: Secure handling of HTLC secrets
- **Session Management**: Complete swap lifecycle tracking

## Architecture

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

## Getting Started

### Prerequisites

- Node.js 18+
- Redis (optional, for production)
- Access to BASE and NEAR RPC endpoints
- 1inch API key (get from ETHGlobal for hackathon)

### Installation

```bash
cd packages/orchestrator
yarn install
```

### Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Configure required values:
```env
# Network Configuration
BASE_RPC_URL=https://sepolia.base.org
NEAR_RPC_URL=https://rpc.testnet.near.org

# Contracts (from hardhat deployment)
ESCROW_FACTORY_ADDRESS=0x...
FUSION_PLUS_HUB_ADDRESS=0x...
FUSION_PLUS_RESOLVER_ADDRESS=0x...

# Security
API_KEY_SECRET=your-secure-api-key
JWT_SECRET=your-secure-jwt-secret

# External Services
ONEINCH_API_KEY=your-1inch-api-key
```

### Development

```bash
# Run in development mode with hot reload
yarn dev

# Run unit tests
yarn test

# Run integration tests (recommended)
npm run test:integration

# Run all tests (unit + integration)
npm run test:all

# Run tests directly
node tests/integration/orchestrator.test.js

# Type checking
yarn typecheck

# Linting
yarn lint
```

### Production

```bash
# Build TypeScript
yarn build

# Start production server
yarn start
```

## API Documentation

### REST Endpoints

#### Create Swap Session
```http
POST /api/v1/sessions
Authorization: Bearer {api_key}

{
  "sourceChain": "base",
  "destinationChain": "near",
  "sourceToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "destinationToken": "usdt.near",
  "sourceAmount": "1000000000",
  "destinationAmount": "999000000",
  "maker": "0x742d35Cc6634C0532925a3b844Bc9e7595f2BD4e",
  "taker": "alice.near",
  "slippageTolerance": 100
}
```

#### Get Session Status
```http
GET /api/v1/sessions/{sessionId}
Authorization: Bearer {api_key}
```

#### Execute Swap
```http
POST /api/v1/sessions/{sessionId}/execute
Authorization: Bearer {api_key}

{
  "limitOrder": {
    "order": { /* 1inch order */ },
    "signature": "0x..."
  },
  "confirmationLevel": "fast"
}
```

#### Get Quote
```http
POST /api/v1/quote
Authorization: Bearer {api_key}

{
  "sourceChain": "base",
  "destinationChain": "near",
  "sourceToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "destinationToken": "usdt.near",
  "amount": "1000000000",
  "urgency": "normal"
}
```

### WebSocket Events

Connect to WebSocket:
```javascript
const ws = new WebSocket('ws://localhost:8080/ws');

// Authenticate
ws.send(JSON.stringify({
  type: 'auth',
  apiKey: 'your_api_key'
}));

// Subscribe to session
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'session',
  sessionId: 'sess_abc123'
}));
```

Event Types:
- `session_update`: Real-time swap progress
- `price_update`: Price feed updates
- `alert`: System alerts and warnings

## Core Components

### SessionManager
Manages swap session lifecycle with states:
- `initialized`: Session created
- `source_locked`: Tokens locked on BASE
- `both_locked`: Tokens locked on both chains
- `completed`: Swap completed successfully
- `failed`: Swap failed
- `cancelled`: Swap cancelled

### DutchAuctionSimulator
Simulates Dutch auction pricing without being an official resolver:
- Market price fetching
- Urgency-based pricing
- Price impact calculation
- Quote generation

### SecretManager
Handles cryptographic secrets for HTLC:
- Secret generation
- Secure storage with encryption
- One-time reveal mechanism
- Hash verification

### CrossChainCoordinator
Coordinates the atomic swap process:
- Source chain locking
- Destination chain coordination
- Secret revelation
- Failure handling

### EventMonitor
Monitors blockchain events on both chains:
- BASE: EscrowFactory and Resolver events
- NEAR: HTLC state changes
- Event verification and processing

## Security Considerations

1. **API Authentication**: All endpoints require API key authentication
2. **Rate Limiting**: Configurable per-IP and per-API-key limits
3. **Input Validation**: Joi schemas for all inputs
4. **Secret Encryption**: AES-256-GCM for secret storage
5. **CORS Configuration**: Restricted to allowed origins

## Monitoring

### Health Check
```http
GET /health

{
  "status": "healthy",
  "uptime": 3600,
  "connections": {
    "base": true,
    "near": true,
    "redis": true
  },
  "metrics": {
    "activeSwaps": 5,
    "completedToday": 42
  }
}
```

### Metrics
Prometheus-compatible metrics available at `/metrics`:
- Swap counters (initiated, completed, failed)
- API latency histograms
- WebSocket connection gauges
- System resource usage

## Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN yarn install --production
COPY . .
RUN yarn build
EXPOSE 8080
CMD ["yarn", "start"]
```

### Environment Variables
See `.env.example` for all configuration options.

## Integration with Frontend

```typescript
// Frontend integration example
import { OrchestrationClient } from '@1balancer/sdk';

const client = new OrchestrationClient({
  baseUrl: 'http://localhost:8080',
  apiKey: 'your-api-key'
});

// Create swap
const session = await client.createSwap({
  sourceChain: 'base',
  destinationChain: 'near',
  // ... other params
});

// Monitor progress
client.onSessionUpdate(session.sessionId, (update) => {
  console.log('Swap progress:', update.progress + '%');
});
```

## Troubleshooting

### Common Issues

1. **Connection refused**: Check RPC endpoints are accessible
2. **Invalid API key**: Ensure API_KEY_SECRET is set correctly
3. **Contract not found**: Deploy contracts first with hardhat
4. **NEAR connection failed**: Check NEAR account configuration

### Debug Mode
Set `LOG_LEVEL=debug` for verbose logging.

## License

MIT