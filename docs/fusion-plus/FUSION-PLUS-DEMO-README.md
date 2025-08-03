# Fusion+ Demo - Current State & Architecture

## Overview

The 1Balancer Fusion+ demo showcases a cross-chain atomic swap system between BASE (Ethereum L2) and NEAR Protocol. The system is designed to work without KYC requirements by using an "orchestration simulation" approach.

## Demo Options

Run with: `make fusion-plus-demo`

1. **Quick Status Demo** - Shows real API calls and current session state
2. **Complete Flow Demo** - Simulates the entire swap execution flow
3. **Full Interactive Demo** - Interactive menu with multiple scenarios

## Current Implementation Status

### ✅ What's Working

1. **Orchestrator Service**
   - Running on port 8080
   - Healthy connections to BASE and NEAR
   - REST API for session management
   - WebSocket support for real-time updates

2. **Session Creation**
   - Real sessions created via API
   - Cryptographic hashlock generation
   - Session state stored in memory
   - Proper validation of inputs

3. **NEAR Integration**
   - Connected to NEAR testnet
   - Contract: fusion-htlc.rog_eth.testnet
   - Event monitoring active
   - Fixed parameter serialization

4. **BASE Contracts**
   - FusionPlusHub: 0x5938297bfdeeF3ac56EB4198E0B484b2A0B3adD8
   - EscrowFactory: 0x135aCf86351F2113726318dE6b4ca66FA90d54Fd
   - Deployed on BASE Sepolia

### ❓ Why Progress Shows 0%

The demo creates real sessions but shows 0% progress because:

1. **No Execution Trigger**: The session is created but the actual swap execution requires:
   - A signed 1inch Limit Order
   - The order must include the session's hashlock
   - Execution via the `/execute` endpoint

2. **Event-Driven Updates**: Progress updates come from blockchain events:
   - Escrow deployment on BASE
   - HTLC creation on NEAR
   - Secret reveals
   - These events aren't triggered in the demo state

3. **State Machine**: The session remains in "initialized" status until execution begins

## Architecture

```
User Flow:
1. Create Session → Get hashlock
2. Create 1inch Order with hashlock
3. Sign and submit order
4. Orchestrator monitors events
5. Automated cross-chain execution
6. Atomic completion or refund
```

### Key Components

1. **SessionManager**: Tracks swap lifecycle
2. **DutchAuctionSimulator**: Price discovery without KYC
3. **SecretManager**: Cryptographic secret handling
4. **CrossChainCoordinator**: Manages atomic execution
5. **EventMonitor**: Watches blockchain events

## Production vs Demo

### In Production:
- User creates real 1inch order
- Real funds locked in escrows
- Blockchain events trigger updates
- Progress reflects actual state
- WebSocket provides live updates

### In Demo:
- Sessions created but not executed
- No real blockchain transactions
- State remains at initialization
- Simulated flow shows what would happen

## Next Steps for Full Implementation

1. **Connect 1inch Integration**
   ```typescript
   // Need to implement actual order validation
   validateLimitOrder(order, sessionHashlock)
   ```

2. **Implement Escrow Deployment**
   ```typescript
   // Deploy via FusionPlusHub
   await fusionHub.deploySrc(immutables, order, signature)
   ```

3. **Wire Event Processing**
   ```typescript
   // Connect events to state updates
   on('SrcEscrowCreated', updateProgress)
   ```

4. **Complete NEAR Flow**
   ```typescript
   // Create matching HTLC on NEAR
   await nearCoordinator.createHTLC(params)
   ```

## Testing the Current System

1. **Check Health**:
   ```bash
   curl http://localhost:8080/health
   ```

2. **Create Session**:
   ```bash
   curl -X POST http://localhost:8080/api/v1/sessions \
     -H "X-API-Key: demo-secret-key" \
     -H "Content-Type: application/json" \
     -d '{
       "sourceChain": "base",
       "destinationChain": "near",
       "sourceToken": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
       "destinationToken": "near",
       "sourceAmount": "100000000",
       "destinationAmount": "50000000000000000000000000",
       "maker": "0x742d35Cc6634C0532925a3b844Bc9e7595f2BD4e",
       "taker": "alice.testnet",
       "slippageTolerance": 50
     }'
   ```

3. **Check Status**:
   ```bash
   curl http://localhost:8080/api/v1/sessions/{sessionId} \
     -H "X-API-Key: demo-secret-key"
   ```

## Security Features

- SHA-256 hashlocks for atomicity
- Timeout protection
- One-time secret reveals
- No single point of failure

## Conclusion

The orchestrator service provides the foundation for KYC-free cross-chain swaps. The demo shows the API working correctly but lacks the actual blockchain execution layer. This is by design - the hackathon submission demonstrates the architecture and feasibility while the full implementation would require:

1. Real 1inch order integration
2. Production key management
3. Gas optimization
4. Mainnet deployment

The 0% progress accurately reflects that sessions are created but not executed, showing the system's honest state tracking.