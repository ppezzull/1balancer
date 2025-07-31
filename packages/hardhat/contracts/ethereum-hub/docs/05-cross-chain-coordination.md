# Cross-Chain Coordination

## Overview

Cross-chain coordination is the heart of the Fusion+ implementation. This document details how the Ethereum Hub orchestrates atomic swaps between BASE and NEAR Protocol, ensuring either both legs execute or neither does.

## Coordination Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   Orchestration Service                      │
│                  (Coordinator & Monitor)                     │
├─────────────────┬────────────────────────┬───────────────────┤
│                 │                         │                  │
▼                 ▼                         ▼                  │
BASE Chain     Event Bridge            NEAR Chain              │
│                 │                         │                  │
├─ EscrowSrc      ├─ WebSocket            ├─ HTLC Contract     │
├─ FusionPlusHub  ├─ REST API             ├─ FT Tokens         │
└─ Resolver       └─ Message Queue        └─ Event Stream      │
```

## Coordination Phases

### Phase 1: Initialization

```typescript
// Orchestration Service
async function initiateCrossChainSwap(params: SwapParams) {
    // 1. Generate secret
    const secret = crypto.randomBytes(32);
    const hashlockHash = sha256(secret);
    
    // 2. Create immutables for both chains
    const srcImmutables = createSourceImmutables(params, hashlockHash);
    const dstImmutables = createDestinationImmutables(params, hashlockHash);
    
    // 3. Store session
    const session = {
        id: generateSessionId(),
        secret: encrypt(secret), // Encrypted storage
        srcImmutables,
        dstImmutables,
        status: 'initialized'
    };
    
    return session;
}
```

### Phase 2: Source Chain Lock

```solidity
// On BASE - EscrowSrc deployment and funding
function deploySrc(
    Immutables calldata immutables,
    Order calldata order,
    bytes32 r,
    bytes32 vs
) external {
    // 1. Deploy escrow
    address escrow = factory.createSrcEscrow(immutables);
    
    // 2. Fill order (tokens to escrow)
    limitOrderProtocol.fillOrderArgs(order, r, vs, ...);
    
    // 3. Emit event for orchestration
    emit SrcEscrowCreated(escrow, immutables.hashlockHash);
}
```

### Phase 3: Destination Chain Lock

```typescript
// Orchestration monitors BASE events
baseProvider.on('SrcEscrowCreated', async (event) => {
    const session = findSession(event.hashlockHash);
    
    // Deploy on NEAR
    await nearContract.create_htlc({
        receiver: session.dstImmutables.taker,
        hashlock: session.hashlockHash,
        timelock: session.dstImmutables.timelock,
        token_id: session.dstImmutables.token,
        amount: session.dstImmutables.amount
    });
    
    session.status = 'both_locked';
});
```

### Phase 4: Secret Reveal

```typescript
// Orchestration reveals secret on destination first
async function revealSecret(session: SwapSession) {
    // 1. Reveal on NEAR (destination)
    await nearContract.withdraw({
        htlc_id: session.nearHtlcId,
        secret: session.secret
    });
    
    // 2. Monitor for NEAR confirmation
    await waitForNearConfirmation(session);
    
    // 3. Reveal on BASE (source)
    await escrowSrc.withdraw(session.secret);
    
    session.status = 'completed';
}
```

## Timeout Coordination

### Critical Timing Constraints

```
Timeline:
0h                  24h                 48h                 72h
├───────────────────┼───────────────────┼───────────────────┤
│                   │                   │                   │
│  NEAR Withdraw    │  NEAR Cancel      │  BASE Withdraw    │  BASE Cancel
│  Period           │  Starts           │  Period           │  Starts
```

**Key Rule**: `NEAR_CANCEL < BASE_WITHDRAW`

This ensures atomicity - NEAR times out before BASE can be withdrawn.

### Timeout Implementation

```solidity
// In TimelocksLib
function create(uint32 baseDuration) returns (Timelocks memory) {
    uint32 currentTime = uint32(block.timestamp);
    
    // Source chain (BASE) - longer timeouts
    timelocks.srcWithdrawal = currentTime + baseDuration;
    timelocks.srcCancellation = currentTime + baseDuration + SAFETY_BUFFER;
    
    // Destination chain (NEAR) - shorter timeouts
    timelocks.dstWithdrawal = currentTime + (baseDuration / 2);
    timelocks.dstCancellation = currentTime + baseDuration - SAFETY_BUFFER;
    
    // Validate: dst cancels before src withdraws
    require(timelocks.dstCancellation < timelocks.srcWithdrawal);
}
```

## Event Monitoring

### BASE Chain Events

```typescript
class BaseEventMonitor {
    constructor(
        private provider: ethers.Provider,
        private contracts: ContractSet
    ) {}
    
    async startMonitoring() {
        // Escrow creation
        this.contracts.factory.on('SrcEscrowCreated', 
            this.handleEscrowCreated.bind(this)
        );
        
        // Secret reveal
        this.contracts.escrow.on('SecretRevealed',
            this.handleSecretRevealed.bind(this)
        );
        
        // Cancellation
        this.contracts.escrow.on('EscrowCancelled',
            this.handleCancellation.bind(this)
        );
    }
}
```

### NEAR Chain Events

```typescript
class NearEventMonitor {
    async pollEvents() {
        const events = await this.near.connection.provider.query({
            request_type: 'EXPERIMENTAL_changes',
            finality: 'final',
            account_id: HTLC_CONTRACT
        });
        
        for (const event of events) {
            if (event.type === 'htlc_created') {
                await this.handleHtlcCreated(event);
            } else if (event.type === 'secret_revealed') {
                await this.handleSecretRevealed(event);
            }
        }
    }
}
```

## State Synchronization

### Session State Machine

```typescript
enum SessionStatus {
    INITIALIZED = 'initialized',
    SOURCE_LOCKED = 'source_locked',
    BOTH_LOCKED = 'both_locked',
    DESTINATION_WITHDRAWN = 'destination_withdrawn',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    FAILED = 'failed'
}

class SessionManager {
    async transitionState(
        sessionId: string, 
        newStatus: SessionStatus
    ) {
        const session = await this.getSession(sessionId);
        
        // Validate transition
        if (!this.isValidTransition(session.status, newStatus)) {
            throw new Error('Invalid state transition');
        }
        
        session.status = newStatus;
        await this.saveSession(session);
        
        // Emit event for monitoring
        this.emit('stateChanged', session);
    }
}
```

### Cross-Chain Message Verification

```typescript
interface CrossChainMessage {
    sourceChain: string;
    destinationChain: string;
    hashlockHash: bytes32;
    action: 'lock' | 'withdraw' | 'cancel';
    proof: MessageProof;
}

async function verifyMessage(message: CrossChainMessage): Promise<boolean> {
    // Verify the action happened on source chain
    const sourceEvent = await getEvent(
        message.sourceChain,
        message.proof.txHash,
        message.proof.eventIndex
    );
    
    // Verify hashlock matches
    return sourceEvent.hashlockHash === message.hashlockHash;
}
```

## Failure Handling

### Scenario 1: Destination Chain Failure

```typescript
async function handleDestinationFailure(session: SwapSession) {
    // If NEAR lock fails, cancel BASE escrow
    if (session.status === 'source_locked') {
        // Wait for cancellation timeout
        await waitForTimeout(session.srcImmutables.timelocks.srcCancellation);
        
        // Cancel on BASE
        await escrowSrc.cancel();
        
        session.status = 'cancelled';
    }
}
```

### Scenario 2: Network Issues

```typescript
async function handleNetworkFailure(session: SwapSession) {
    const MAX_RETRIES = 3;
    let retries = 0;
    
    while (retries < MAX_RETRIES) {
        try {
            await revealSecret(session);
            break;
        } catch (error) {
            retries++;
            await delay(RETRY_DELAY * retries);
        }
    }
    
    if (retries === MAX_RETRIES) {
        // Initiate emergency cancellation
        await emergencyCancellation(session);
    }
}
```

## Security Measures

### 1. Secret Management

```typescript
class SecretManager {
    private secrets = new Map<string, EncryptedSecret>();
    
    generateSecret(): SecretPair {
        const secret = crypto.randomBytes(32);
        const hash = sha256(secret);
        
        // Encrypt and store
        const encrypted = this.encrypt(secret);
        this.secrets.set(hash, encrypted);
        
        // Delete after use or timeout
        setTimeout(() => this.secrets.delete(hash), TIMEOUT);
        
        return { secret, hash };
    }
}
```

### 2. Atomic Execution Guards

```solidity
// Ensure atomic execution
modifier atomicExecution(bytes32 hashlockHash) {
    // Check both chains are ready
    require(
        orchestrator.isBothChainsReady(hashlockHash),
        "Chains not synchronized"
    );
    _;
}
```

### 3. Replay Protection

```typescript
// Prevent replay attacks
const processedMessages = new Set<string>();

function processMessage(message: CrossChainMessage) {
    const messageId = hashMessage(message);
    
    if (processedMessages.has(messageId)) {
        throw new Error('Message already processed');
    }
    
    processedMessages.add(messageId);
    // Process message...
}
```

## Monitoring and Alerts

### Health Checks

```typescript
class HealthMonitor {
    async checkHealth(): Promise<HealthStatus> {
        return {
            baseConnection: await this.checkBaseConnection(),
            nearConnection: await this.checkNearConnection(),
            pendingSwaps: await this.countPendingSwaps(),
            timedOutSwaps: await this.checkTimedOutSwaps()
        };
    }
    
    async checkTimedOutSwaps() {
        const sessions = await this.getActiveSessions();
        const alerts = [];
        
        for (const session of sessions) {
            if (this.isApproachingTimeout(session)) {
                alerts.push({
                    sessionId: session.id,
                    timeRemaining: this.getTimeRemaining(session)
                });
            }
        }
        
        return alerts;
    }
}
```

### Performance Metrics

```typescript
interface SwapMetrics {
    totalSwaps: number;
    successfulSwaps: number;
    failedSwaps: number;
    averageCompletionTime: number;
    pendingSwaps: number;
}

class MetricsCollector {
    async collectMetrics(): Promise<SwapMetrics> {
        // Aggregate from both chains
        const baseMetrics = await this.getBaseMetrics();
        const nearMetrics = await this.getNearMetrics();
        
        return this.aggregateMetrics(baseMetrics, nearMetrics);
    }
}
```

## Best Practices

### 1. Timeout Buffer

Always include safety buffers:
```typescript
const SAFETY_BUFFER = 2 * 60 * 60; // 2 hours
const NETWORK_DELAY = 5 * 60; // 5 minutes
```

### 2. Event Confirmation

Wait for finality:
```typescript
// BASE
await provider.waitForTransaction(txHash, CONFIRMATIONS);

// NEAR
await near.connection.provider.txStatus(txHash, 'final');
```

### 3. State Persistence

```typescript
// Persist session state
class SessionStore {
    async save(session: SwapSession) {
        // Primary storage
        await this.redis.set(session.id, JSON.stringify(session));
        
        // Backup storage
        await this.database.upsert('sessions', session);
    }
}
```

## Conclusion

Cross-chain coordination ensures:

1. **Atomicity**: All-or-nothing execution
2. **Security**: Proper timeout management
3. **Reliability**: Failure handling and retries
4. **Monitoring**: Real-time status tracking
5. **Performance**: Efficient event processing

This coordination layer is essential for trustless cross-chain swaps in the Fusion+ challenge.