# Three-Layer Architecture Pattern

## Overview

The Ethereum Hub implements a clean three-layer architecture that separates concerns and enables the orchestration simulation strategy.
This pattern is fundamental to avoiding KYC requirements while maintaining trustless cross-chain execution.

## Layer Definitions

### 1. Application Layer (Top)

**Purpose**: Portfolio management and user interaction

**Components**:
- Portfolio display and rebalancing UI
- User wallet integration (Privy)
- Simple API calls to orchestration layer
- No direct blockchain interaction

**Key Principle**: The application layer has NO knowledge of Fusion+ complexity. It simply requests "rebalance my portfolio" and monitors status.

### 2. Orchestration Layer (Middle)

**Purpose**: Custom coordination without KYC requirements

**Components**:
```typescript
// Orchestration Service (off-chain)
class OrchestrationService {
    // Simulates resolver behavior
    simulateDutchAuction(order: Order): Quote
    
    // Manages cross-chain coordination
    coordinateHTLC(session: SwapSession): void
    
    // Monitors blockchain events
    monitorEvents(chains: Chain[]): EventStream
}
```

**Responsibilities**:
- Dutch auction simulation (avoiding resolver KYC)
- Secret generation and management
- Cross-chain event correlation
- HTLC lifecycle coordination
- Session state management

**Critical Design**: This layer simulates what official 1inch resolvers do, but without requiring KYC or capital bonds.

### 3. Protocol Layer (Bottom)

**Purpose**: Blockchain protocol integration

**Components**:
```solidity
// On-chain contracts
├── EscrowFactory       // 1inch pattern implementation
├── EscrowSrc/Dst       // Cross-chain escrows
├── FusionPlusHub       // Main integration point
└── FusionPlusResolver  // Resolver pattern
```

**Integrations**:
- 1inch Limit Order Protocol
- 1inch Aggregation Router
- 1inch Price Feeds
- Custom cross-chain extensions

## Layer Communication

### Application → Orchestration

**Interface**: REST API
```typescript
POST /api/sessions/create
{
    portfolio: Portfolio,
    targetWeights: Weight[],
    slippageTolerance: number
}

GET /api/sessions/:id/status
```

**Key Points**:
- Simple, high-level operations
- No blockchain details exposed
- Async with polling/websockets

### Orchestration → Protocol

**Interface**: Blockchain RPC + Events
```typescript
// Orchestration calls contracts
await escrowFactory.createSrcEscrow(immutables)
await resolver.deploySrc(immutables, order, signature)

// Monitors events
escrowFactory.on('SrcEscrowCreated', handleEscrowCreated)
escrowSrc.on('SecretRevealed', handleSecretRevealed)
```

**Key Points**:
- Direct contract interaction
- Event-driven state updates
- Multi-chain coordination

## Data Flow Example

```
1. User Action (Application Layer)
   └─> "Rebalance Portfolio" button clicked
   
2. Orchestration Processing (Orchestration Layer)
   ├─> Create swap session
   ├─> Calculate optimal routes (simulate Dutch auction)
   ├─> Generate cryptographic secret
   └─> Initiate cross-chain swaps
   
3. Protocol Execution (Protocol Layer)
   ├─> Create 1inch Limit Order
   ├─> Deploy source escrow
   ├─> Lock tokens in HTLC
   ├─> Wait for NEAR confirmation
   ├─> Reveal secret
   └─> Complete atomic swap
```

## Benefits of Three-Layer Pattern

### 1. **Clean Separation**
- UI developers don't need blockchain knowledge
- Blockchain developers don't need UI concerns
- Orchestration handles all complexity

### 2. **No KYC Requirements**
- Orchestration simulates resolver behavior
- No need for official resolver status
- Maintains decentralization

### 3. **Flexibility**
- Can swap orchestration implementations
- Can upgrade contracts independently
- Can change UI without touching protocols

### 4. **Security**
- Each layer validates its inputs
- Clear security boundaries
- Easier to audit

### 5. **Scalability**
- Orchestration can be horizontally scaled
- Protocol layer is efficient on-chain
- Application layer is stateless

## Implementation Guidelines

### For Application Layer
```typescript
// Good - High level operations
const { rebalance } = usePortfolio()
await rebalance(targetWeights)

// Bad - Low level blockchain details
const escrow = await escrowFactory.createSrcEscrow(...)
```

### For Orchestration Layer
```typescript
// Good - Coordinate without being on-chain
class SwapCoordinator {
    async simulateSwap(params: SwapParams) {
        const quote = await this.simulateDutchAuction(params)
        const session = await this.createSession(quote)
        return this.executeSwap(session)
    }
}

// Bad - Trying to be an official resolver
class OfficialResolver {
    // Would require KYC and capital
}
```

### For Protocol Layer
```solidity
// Good - Clean integration with 1inch
function fillOrderWithEscrow(
    ILimitOrderProtocol.Order calldata order,
    bytes calldata signature
) external {
    limitOrderProtocol.fillOrder(order, signature, ...);
}

// Bad - Reimplementing 1inch functionality
function myCustomOrderBook() { ... }
```

## Cross-Layer Security

### Application → Orchestration
- API authentication (JWT/OAuth)
- Rate limiting
- Input validation

### Orchestration → Protocol
- Transaction signing
- Gas management
- Nonce handling
- Event verification

### Protocol Internal
- Role-based access control
- Reentrancy protection
- Timeout coordination
- Emergency pause

## Testing Strategy by Layer

### Application Layer Tests
- UI component tests
- API integration tests
- User flow tests

### Orchestration Layer Tests
- Unit tests for simulation
- Integration tests with test chains
- Event handling tests

### Protocol Layer Tests
- Solidity unit tests
- Fork tests with mainnet state
- Cross-chain integration tests

## Conclusion

The three-layer pattern enables 1Balancer to:
1. Provide cross-chain swaps without KYC
2. Maintain clean separation of concerns
3. Scale each layer independently
4. Iterate quickly on any layer
5. Ensure security at each boundary

This architecture is essential for the Fusion+ challenge requirements while remaining practical for hackathon implementation.