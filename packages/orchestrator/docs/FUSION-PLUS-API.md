# Fusion+ API Reference

## Overview

This document provides a complete API reference for the Fusion+ implementation in the 1Balancer orchestrator service. All endpoints require authentication via API key.

## Base URL

```
http://localhost:8080/api/v1
```

## Authentication

All requests must include an API key in the header:

```http
X-API-Key: demo-secret-key
```

## Endpoints

### 1. Create Minimal Session

Creates a new swap session with minimal amounts for testing.

**Endpoint**: `POST /demo/create-minimal-session`

**Request Body**:
```json
{
  "maker": "0x742d35Cc6634C0532925a3b844Bc9e7595f2BD4e",  // Optional, BASE address
  "taker": "alice.testnet"                                   // Optional, NEAR account
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
  },
  "note": "Session created with minimal amounts for testing"
}
```

**Default Values**:
- Source Chain: BASE Sepolia
- Destination Chain: NEAR Testnet
- Source Token: Native ETH (0x0000...0000)
- Destination Token: Native NEAR
- Source Amount: 0.001 ETH (1000000000000000 wei)
- Destination Amount: 0.1 NEAR (100000000000000000000000 yoctoNEAR)
- Slippage Tolerance: 0.5% (50 basis points)

### 2. Execute Swap

Executes a real blockchain swap for the given session.

**Endpoint**: `POST /demo/execute/:sessionId`

**URL Parameters**:
- `sessionId`: The session ID returned from create-minimal-session

**Response**:
```json
{
  "success": true,
  "sessionId": "sess_b81b9d63-2",
  "note": "Real execution started. Monitor WebSocket for updates and check blockchain explorers."
}
```

**Execution Process**:
1. Deploys escrow on BASE Sepolia
2. Creates HTLC on NEAR Testnet
3. Monitors for secret revelation
4. Completes cross-chain swap

### 3. Get Execution Steps

Retrieves detailed execution steps for transparency.

**Endpoint**: `GET /demo/execution-steps/:sessionId`

**URL Parameters**:
- `sessionId`: The session ID to query

**Response**:
```json
{
  "sessionId": "sess_b81b9d63-2",
  "steps": [
    {
      "function": "createSrcEscrowWithoutOrderValidation",
      "contract": "EscrowFactory",
      "params": {
        "immutables": {
          "maker": "0x742d35Cc6634C0532925a3b844Bc9e7595f2BD4e",
          "taker": "0x456d35Cc6634C0532925a3b844Bc9e7595f2BD4e",
          "token": "0x0000000000000000000000000000000000000000",
          "amount": "1000000000000000",
          "safetyDeposit": "100000000000000",
          "hashlockHash": "0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658",
          "timelocks": {
            "srcWithdrawal": "1704067500",
            "srcPublicWithdrawal": "1704067800",
            "srcCancellation": "1704068100",
            "srcDeployedAt": "1704067200",
            "dstWithdrawal": "1704067440",
            "dstCancellation": "1704068040",
            "dstDeployedAt": "1704067200"
          },
          "orderHash": "0x123...",
          "chainId": 84532
        }
      },
      "status": "completed",
      "txHash": "0xdf452cce0ffee009e5013f52bb6fd84086ac9599b6f212bfe50aaaa03846d657",
      "result": {
        "escrowAddress": "0x9afc4b936cfd483ea56f0f6e69ba993d6da7bb68",
        "blockNumber": 12345678,
        "gasUsed": "285000"
      },
      "gasUsed": "285000"
    },
    {
      "function": "create_htlc",
      "contract": "fusion-htlc.rog_eth.testnet",
      "params": {
        "receiver": "alice.testnet",
        "token": "near",
        "amount": "100000000000000000000000",
        "hashlock": "0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658",
        "timelock": 1704070800,
        "orderHash": "0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658"
      },
      "status": "completed",
      "result": {
        "htlcId": "htlc_1754180331357",
        "explorer": "https://testnet.nearblocks.io/address/htlc_1754180331357"
      }
    }
  ],
  "totalSteps": 2,
  "completed": 2,
  "failed": 0
}
```

### 4. Simulate Swap

Simulates a swap execution without real blockchain transactions.

**Endpoint**: `POST /demo/simulate/:sessionId`

**URL Parameters**:
- `sessionId`: The session ID to simulate

**Response**:
```json
{
  "success": true,
  "sessionId": "sess_b81b9d63-2",
  "note": "Simulation started. Monitor WebSocket for updates."
}
```

## WebSocket API

### Connection

```javascript
const ws = new WebSocket('ws://localhost:8080/ws');
```

### Authentication

Send after connection:
```json
{
  "type": "auth",
  "apiKey": "demo-secret-key"
}
```

### Subscribe to Session

```json
{
  "type": "subscribe",
  "channel": "session",
  "sessionId": "sess_b81b9d63-2"
}
```

### Message Types

#### Session Update
```json
{
  "type": "session_update",
  "status": "source_locked",
  "sessionId": "sess_b81b9d63-2",
  "data": {
    "phase": "source_locked",
    "progress": 30,
    "escrowAddress": "0x9afc4b936cfd483ea56f0f6e69ba993d6da7bb68",
    "txHash": "0xdf452cce0ffee009e5013f52bb6fd84086ac9599b6f212bfe50aaaa03846d657",
    "explorer": "https://sepolia.basescan.org/tx/0xdf452cce0ffee009e5013f52bb6fd84086ac9599b6f212bfe50aaaa03846d657"
  }
}
```

#### Execution Step
```json
{
  "type": "execution_step",
  "data": {
    "step": {
      "function": "createSrcEscrowWithoutOrderValidation",
      "contract": "EscrowFactory",
      "status": "executing",
      "params": { ... }
    }
  }
}
```

#### Execution Step Update
```json
{
  "type": "execution_step_update",
  "data": {
    "step": {
      "function": "createSrcEscrowWithoutOrderValidation",
      "contract": "EscrowFactory",
      "status": "completed",
      "txHash": "0xdf452cce0ffee009e5013f52bb6fd84086ac9599b6f212bfe50aaaa03846d657",
      "gasUsed": "285000"
    }
  }
}
```

## Status Values

### Session Status
- `initialized`: Session created, ready for execution
- `source_locking`: Deploying escrow on source chain
- `source_locked`: Funds locked on source chain
- `destination_locking`: Creating HTLC on destination chain
- `both_locked`: Both chains have locked funds
- `revealing_secret`: Secret being revealed
- `completed`: Swap completed successfully
- `failed`: Swap failed
- `refunding`: Initiating refund
- `refunded`: Funds refunded

### Execution Step Status
- `pending`: Step not yet started
- `executing`: Step in progress
- `completed`: Step completed successfully
- `failed`: Step failed

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "message": "Missing required parameter: maker"
}
```

### 404 Not Found
```json
{
  "error": "Session not found",
  "sessionId": "sess_invalid"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Failed to deploy escrow: insufficient funds"
}
```

## Rate Limits

- Create Session: 10 requests per minute
- Execute Swap: 5 requests per minute
- Get Status: 60 requests per minute
- WebSocket: 1 connection per client

## Example Integration

### JavaScript/TypeScript

```typescript
class FusionPlusClient {
  private baseUrl = 'http://localhost:8080/api/v1';
  private apiKey = 'demo-secret-key';
  private ws: WebSocket;

  async createAndExecuteSwap(maker: string, taker: string) {
    // 1. Create session
    const session = await fetch(`${this.baseUrl}/demo/create-minimal-session`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ maker, taker })
    }).then(r => r.json());

    console.log('Session created:', session.sessionId);

    // 2. Connect WebSocket
    this.ws = new WebSocket('ws://localhost:8080/ws');
    
    this.ws.onopen = () => {
      // Authenticate
      this.ws.send(JSON.stringify({
        type: 'auth',
        apiKey: this.apiKey
      }));
      
      // Subscribe
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'session',
        sessionId: session.sessionId
      }));
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Update:', message);
    };

    // 3. Execute swap
    await fetch(`${this.baseUrl}/demo/execute/${session.sessionId}`, {
      method: 'POST',
      headers: { 'X-API-Key': this.apiKey }
    });

    // 4. Monitor execution steps
    const checkSteps = async () => {
      const steps = await fetch(
        `${this.baseUrl}/demo/execution-steps/${session.sessionId}`,
        { headers: { 'X-API-Key': this.apiKey } }
      ).then(r => r.json());
      
      console.log(`Progress: ${steps.completed}/${steps.totalSteps}`);
      
      if (steps.completed < steps.totalSteps && steps.failed === 0) {
        setTimeout(checkSteps, 2000);
      }
    };
    
    checkSteps();
  }
}
```

### cURL Examples

```bash
# Create session
curl -X POST http://localhost:8080/api/v1/demo/create-minimal-session \
  -H "X-API-Key: demo-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"maker": "0x742d35Cc6634C0532925a3b844Bc9e7595f2BD4e", "taker": "alice.testnet"}'

# Execute swap
curl -X POST http://localhost:8080/api/v1/demo/execute/sess_b81b9d63-2 \
  -H "X-API-Key: demo-secret-key"

# Check steps
curl http://localhost:8080/api/v1/demo/execution-steps/sess_b81b9d63-2 \
  -H "X-API-Key: demo-secret-key"
```

## Security Considerations

1. **API Key**: Keep the API key secure and rotate regularly
2. **HTTPS**: Use HTTPS in production environments
3. **Rate Limiting**: Implement proper rate limiting
4. **Input Validation**: All inputs are validated server-side
5. **Error Messages**: Sensitive information is not exposed in errors

## Support

For issues or questions:
- GitHub: https://github.com/1balancer
- Documentation: /packages/orchestrator/docs/
- Logs: /packages/orchestrator/logs/