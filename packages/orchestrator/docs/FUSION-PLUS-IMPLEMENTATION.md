# Fusion+ Implementation Documentation

## Overview

The 1Balancer Fusion+ implementation provides cross-chain atomic swaps between BASE (Ethereum L2) and NEAR Protocol using the 1inch Fusion+ protocol standards. This documentation covers the complete implementation, including real blockchain interactions, transparent execution tracking, and optimized gas usage.

## Table of Contents

1. [Architecture](#architecture)
2. [Core Components](#core-components)
3. [API Endpoints](#api-endpoints)
4. [Execution Flow](#execution-flow)
5. [Contract Integration](#contract-integration)
6. [Cost Optimization](#cost-optimization)
7. [Usage Guide](#usage-guide)
8. [Testing](#testing)
9. [Future Integration](#future-integration)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Fusion+ System Architecture                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend (CLI/UI)                                               │
│      ├── REST API ──────────► Orchestrator                      │
│      └── WebSocket ─────────► Real-time Updates                 │
│                                                                  │
│  Orchestrator Service                                            │
│      ├── FusionPlusExecutor ──► Blockchain Transactions         │
│      ├── SessionManager ──────► State Management                │
│      ├── SecretManager ───────► Hashlock Generation             │
│      └── WebSocketManager ────► Progress Updates                │
│                                                                  │
│  Blockchain Layer                                                │
│      ├── BASE Sepolia                                            │
│      │   ├── EscrowFactory (0x135aCf86351F2113726318dE6b4ca66FA90d54Fd)
│      │   └── FusionPlusHub (0x5938297bfdeeF3ac56EB4198E0B484b2A0B3adD8)
│      └── NEAR Testnet                                           │
│          └── HTLC Contract (fusion-htlc.rog_eth.testnet)        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. FusionPlusExecutor

**Location**: `packages/orchestrator/src/core/FusionPlusExecutor.ts`

The main execution engine for Fusion+ swaps:

```typescript
class FusionPlusExecutor {
  // Execute a complete fusion+ swap with real blockchain transactions
  async executeFullSwap(sessionId: string): Promise<void>
  
  // Get execution steps for transparency
  getExecutionSteps(sessionId: string): ExecutionStep[]
  
  // Simulate execution for demo purposes
  async simulateExecution(sessionId: string): Promise<void>
}
```

**Key Features**:
- Real blockchain transaction execution
- Transparent step tracking
- WebSocket updates for each step
- Optimized gas usage
- Error handling and recovery

### 2. Execution Steps

Each swap execution consists of the following transparent steps:

```typescript
interface ExecutionStep {
  function: string;      // Function being called
  contract: string;      // Contract address
  params: any;          // Call parameters
  status: 'pending' | 'executing' | 'completed' | 'failed';
  txHash?: string;      // Transaction hash when available
  result?: any;         // Execution result
  error?: string;       // Error message if failed
  gasUsed?: string;     // Gas consumed
}
```

### 3. Session Management

Sessions track the complete swap lifecycle:

```typescript
interface SwapSession {
  sessionId: string;
  hashlockHash: string;
  sourceChain: 'base';
  destinationChain: 'near';
  sourceAmount: string;
  destinationAmount: string;
  maker: string;        // BASE address
  taker: string;        // NEAR account
  status: SessionStatus;
  srcEscrowAddress?: string;
  nearHTLCId?: string;
}
```

## API Endpoints

### 1. Create Minimal Session

```http
POST /api/v1/demo/create-minimal-session
X-API-Key: demo-secret-key
Content-Type: application/json

{
  "maker": "0x742d35Cc6634C0532925a3b844Bc9e7595f2BD4e",
  "taker": "alice.testnet"
}
```

**Response**:
```json
{
  "sessionId": "sess_b81b9d63-2",
  "hashlockHash": "0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658",
  "status": "initialized",
  "amounts": {
    "source": "0.001 ETH",
    "destination": "0.1 NEAR"
  }
}
```

### 2. Execute Real Swap

```http
POST /api/v1/demo/execute/:sessionId
X-API-Key: demo-secret-key
```

**Response**:
```json
{
  "success": true,
  "sessionId": "sess_b81b9d63-2",
  "note": "Real execution started. Monitor WebSocket for updates and check blockchain explorers."
}
```

### 3. Get Execution Steps

```http
GET /api/v1/demo/execution-steps/:sessionId
X-API-Key: demo-secret-key
```

**Response**:
```json
{
  "sessionId": "sess_b81b9d63-2",
  "steps": [
    {
      "function": "createSrcEscrowWithoutOrderValidation",
      "contract": "EscrowFactory",
      "status": "completed",
      "txHash": "0xdf452cce0ffee009e5013f52bb6fd84086ac9599b6f212bfe50aaaa03846d657",
      "gasUsed": "285000"
    },
    {
      "function": "create_htlc",
      "contract": "fusion-htlc.rog_eth.testnet",
      "status": "completed",
      "result": {
        "htlcId": "htlc_1754180331357"
      }
    }
  ],
  "totalSteps": 2,
  "completed": 2,
  "failed": 0
}
```

## Execution Flow

### Step 1: Deploy Escrow on BASE

```typescript
// Function: createSrcEscrowWithoutOrderValidation
// Contract: EscrowFactory (0x135aCf86351F2113726318dE6b4ca66FA90d54Fd)

const immutables = {
  maker: session.maker,
  taker: session.taker,
  token: session.sourceToken,
  amount: session.sourceAmount,
  safetyDeposit: ethers.parseEther('0.0001'), // Minimal deposit
  hashlockHash: session.hashlockHash,
  timelocks: {
    srcWithdrawal: now + 300,      // 5 minutes
    srcPublicWithdrawal: now + 600, // 10 minutes
    srcCancellation: now + 900,     // 15 minutes
    srcDeployedAt: now,
    dstWithdrawal: now + 240,      // 4 minutes
    dstCancellation: now + 840,     // 14 minutes
    dstDeployedAt: now
  },
  orderHash: ethers.keccak256(ethers.toUtf8Bytes(session.sessionId)),
  chainId: 84532 // BASE Sepolia
};
```

### Step 2: Create HTLC on NEAR

```typescript
// Function: create_htlc
// Contract: fusion-htlc.rog_eth.testnet

const params = {
  receiver: session.taker,
  token: session.destinationToken,
  amount: session.destinationAmount,
  hashlock: session.hashlockHash,
  timelock: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  orderHash: session.orderHash
};
```

### Step 3: Monitor for Secret Reveal

The system monitors both chains for secret revelation:
- BASE: `Withdrawn` event on escrow contract
- NEAR: `secret_revealed` event via polling

### Step 4: Complete Cross-Chain Swap

Once the secret is revealed on one chain, it's automatically used to complete the swap on the other chain.

## Contract Integration

### BASE Sepolia Contracts

1. **EscrowFactory** (`0x135aCf86351F2113726318dE6b4ca66FA90d54Fd`)
   - Creates deterministic escrow contracts
   - Manages escrow lifecycle
   - Emits events for monitoring

2. **FusionPlusHub** (`0x5938297bfdeeF3ac56EB4198E0B484b2A0B3adD8`)
   - Central coordination contract
   - Manages resolver interactions

### NEAR Testnet Contract

**HTLC Contract** (`fusion-htlc.rog_eth.testnet`)
- Creates hash time-locked contracts
- Manages NEAR token locks
- Provides event monitoring interface

## Cost Optimization

### BASE Sepolia
- **Safety Deposit**: 0.0001 ETH (reduced from 0.01 ETH)
- **Gas Limit**: 300,000 (optimized from 500,000)
- **Gas Price**: 0.01 gwei (minimum for testnet)
- **Total Cost**: ~0.0001 ETH + minimal gas

### NEAR Testnet
- **Gas**: 30 TGas (reduced from 300 TGas)
- **Storage Deposit**: 0.01 NEAR (minimum required)
- **Total Cost**: ~0.01 NEAR

## Usage Guide

### Prerequisites

1. Start the orchestrator service:
```bash
make run
```

2. Ensure contracts are deployed:
```bash
make fusion-plus-status
```

### Running the Demo

#### Option 1: Interactive Demo Menu
```bash
make fusion-plus-demo
```

Select from menu:
1. Quick status demo
2. Complete flow demo (simulation)
3. **Transparent execution demo (real transactions)**
4. Full interactive demo

#### Option 2: Direct Script Execution
```bash
node scripts/fusion-plus-demo-transparent.js
```

### WebSocket Integration

Connect to WebSocket for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:8080/ws');

// Authenticate
ws.send(JSON.stringify({
  type: 'auth',
  apiKey: 'demo-secret-key'
}));

// Subscribe to session
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'session',
  sessionId: 'sess_abc123'
}));

// Handle updates
ws.on('message', (data) => {
  const message = JSON.parse(data);
  if (message.type === 'session_update') {
    console.log('Progress:', message.data.progress + '%');
  }
});
```

## Testing

### Unit Tests
```bash
cd packages/orchestrator
yarn test
```

### Integration Tests
```bash
# With minimal amounts on testnet
yarn test:integration
```

### Manual Testing Checklist

- [ ] Orchestrator starts successfully
- [ ] WebSocket connects and authenticates
- [ ] Session creation returns valid hashlock
- [ ] Escrow deploys on BASE with correct parameters
- [ ] HTLC creates on NEAR with matching hashlock
- [ ] Events are monitored on both chains
- [ ] Secret reveal triggers cross-chain completion
- [ ] Execution steps are tracked transparently
- [ ] Gas costs match optimization targets

## Future Integration

### UI Component Integration

When integrating with UI components (e.g., BuyCryptoModal):

```typescript
// 1. Create session
const session = await fetch('/api/v1/demo/create-minimal-session', {
  method: 'POST',
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    maker: userAddress,
    taker: nearAccount
  })
});

// 2. Execute swap
await fetch(`/api/v1/demo/execute/${session.sessionId}`, {
  method: 'POST',
  headers: { 'X-API-Key': API_KEY }
});

// 3. Monitor via WebSocket or polling
const steps = await fetch(`/api/v1/demo/execution-steps/${session.sessionId}`);
```

### Production Considerations

1. **Security**:
   - Implement proper authentication
   - Add rate limiting
   - Validate all inputs
   - Use secure key management

2. **Reliability**:
   - Add retry mechanisms
   - Implement proper error recovery
   - Add transaction monitoring
   - Store state persistently

3. **Performance**:
   - Optimize RPC calls
   - Implement caching
   - Use batch operations
   - Add connection pooling

4. **Monitoring**:
   - Add comprehensive logging
   - Implement metrics collection
   - Set up alerts
   - Track success rates

## Troubleshooting

### Common Issues

1. **"Orchestrator not detected"**
   - Ensure orchestrator is running: `make run`
   - Check port 8080 is available

2. **"NEAR account does not exist"**
   - Verify NEAR credentials in `.env`
   - Check account exists on testnet

3. **"Insufficient funds"**
   - Ensure BASE Sepolia ETH available
   - Check NEAR testnet balance

4. **"Gas estimation failed"**
   - Verify contract addresses
   - Check RPC endpoints
   - Ensure proper token approvals

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug yarn dev
```

View execution details:
```bash
curl http://localhost:8080/api/v1/demo/execution-steps/SESSION_ID \
  -H "X-API-Key: demo-secret-key" | jq
```

## References

- [1inch Fusion+ Documentation](https://docs.1inch.io/docs/fusion-swap/introduction)
- [BASE Documentation](https://docs.base.org)
- [NEAR Documentation](https://docs.near.org)
- [Smart Contract Source Code](https://github.com/1balancer)