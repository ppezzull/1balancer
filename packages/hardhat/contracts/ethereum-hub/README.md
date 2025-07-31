# Ethereum Hub - 1inch Fusion+ Cross-Chain Architecture

This is the production-grade implementation of the Ethereum Hub for 1balancer, implementing cross-chain atomic swaps between BASE and NEAR Protocol using 1inch's Fusion+ technology.

## Architecture Overview

The Ethereum Hub implements the **Three-Layer Architecture** pattern as described in solutionV3, with critical improvements based on 1inch's cross-chain patterns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│                   (FusionPlusHub.sol)                       │
│  - User Interface for Cross-Chain Swaps                    │
│  - Limit Order Protocol Integration                        │
│  - Order Creation and Management                           │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                  Orchestration Layer                         │
│               (FusionPlusResolver.sol)                      │
│  - Cross-Chain Coordination without KYC                     │
│  - Escrow Deployment on Both Chains                        │
│  - Atomic Execution Guarantee                              │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Protocol Layer                            │
│         (BaseEscrowFactory + EscrowSrc/Dst)                 │
│  - CREATE2 Deterministic Addresses                         │
│  - Timeout Coordination (Timelocks)                        │
│  - HTLC Pattern with Safety Deposits                       │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. FusionPlusHub (Application Layer)
The main entry point for users, integrating with 1inch's Limit Order Protocol:
- Creates gasless cross-chain swap orders
- Validates order parameters and signatures
- Manages user interactions and approvals
- Implements EIP-712 typed data signing

### 2. FusionPlusResolver (Orchestration Layer)
Implements the "Orchestration Simulation Strategy" to avoid KYC:
- `deploySrc()`: Deploys source chain escrow and fills limit order
- `deployDst()`: Coordinates destination chain escrow deployment
- `withdraw()`: Handles secret revelation and fund release
- `cancel()`: Manages timeout scenarios and fund recovery

### 3. BaseEscrowFactory (Protocol Layer)
Following 1inch's cross-chain-swap pattern:
- Uses CREATE2 for deterministic escrow addresses
- Implements immutable parameters pattern
- Ensures atomic execution across chains
- Manages timeout coordination with TimelocksLib

### 4. Escrow Contracts
- **EscrowSrc**: Source chain escrow with maker funds
- **EscrowDst**: Destination chain escrow with taker funds
- Both implement HTLC pattern with safety deposits
- Strict timeout ordering: `dstCancellation < srcWithdrawal`

## Critical Improvements from Original Implementation

### 1. Proper 1inch Integration
- ✅ Replaced simple HTLC with 1inch's escrow factory pattern from cross-chain-swap
- ✅ Integrated Limit Order Protocol for gasless operations
- ✅ Added proper order signature validation from limit-order-sdk
- ✅ Implemented TakerTraits for order flexibility

### 2. Cross-Chain Safety
- ✅ Implemented TimelocksLib for proper timeout coordination
- ✅ Added validation: destination timeout before source withdrawal
- ✅ Safety deposits to incentivize completion
- ✅ Atomic guarantees without trusted intermediaries

### 3. Testing Strategy
- ✅ Mainnet fork configuration (1inch has no testnets)
- ✅ Mock resolver for local testing
- ✅ Integration tests with forked environment
- ✅ CORS proxy for API integration

## Installation & Setup

### Prerequisites
- Node.js v18+
- Yarn package manager
- Alchemy/Infura API key for BASE mainnet

### Environment Setup

1. Configure `.env`:
```bash
ALCHEMY_BASE_MAINNET_KEY=your_key_here
ONEINCH_API_KEY=your_hackathon_key_here
```

2. Install dependencies:
```bash
yarn install
yarn proxy:install
```

3. Start development environment:
```bash
# Terminal 1: Start BASE mainnet fork
yarn fork:base

# Terminal 2: Start CORS proxy
yarn proxy:dev

# Terminal 3: Deploy contracts
yarn deploy:fork
```

## Testing

### Unit Tests
```bash
yarn test
```

### Integration Tests (Mainnet Fork)
```bash
# Start fork first
yarn fork:base

# Run integration tests
yarn test:integration
```

### E2E Tests
```bash
yarn test:e2e
```

## Key Contract Addresses

### BASE Mainnet
- 1inch Limit Order Protocol: `0x111111125421ca6dc452d289314280a0f8842a65`
- 1inch Aggregation Router V6: `0x111111125421cA6dc452d289314280a0f8842A65`

### Deployed Contracts (Fork)
Run `yarn deploy:fork` to get addresses

## Cross-Chain Flow

```
BASE (Source Chain)                    NEAR (Destination Chain)
     │                                        │
     ├─[1]─Create Limit Order                 │
     │     (Gasless, signed)                  │
     │                                        │
     ├─[2]─Resolver: deploySrc()              │
     │     - Deploy escrow via CREATE2        │
     │     - Lock maker funds                 │
     │                                        │
     ├────────[3]─Notify Resolver─────────────►│
     │                                        │
     │                                        ├─[4]─Resolver: deployDst()
     │                                        │     - Deploy NEAR escrow
     │                                        │     - Lock taker funds
     │                                        │
     │◄───────[5]─Confirm Deployment────────────┤
     │                                        │
     ├─[6]─Reveal Secret                      │
     │     (After dst confirmation)            │
     │                                        │
     └─[7]─Complete Swap                      └─[8]─Complete Swap
           (Both parties withdraw)                  (Using revealed secret)
```

## Security Considerations

### Timeout Coordination
The system enforces strict timeout ordering to prevent griefing:
```
dstWithdrawal < dstCancellation < srcWithdrawal < srcCancellation
```

This ensures:
- Destination chain settles first (preventing source chain griefing)
- Both parties have clear windows for action
- No race conditions between chains

### Atomic Guarantees
- Either both swaps complete or neither does
- No intermediate states where one party loses funds
- Resolver incentivized with safety deposits

### Access Control
- Only resolver can deploy escrows
- Only parties can withdraw/cancel their escrows
- Admin functions use OpenZeppelin access control

## API Integration

### Using the CORS Proxy
Frontend requests to 1inch API:
```typescript
// Use proxy URL instead of direct API
const PROXY_URL = 'http://localhost:3001';
const quote = await fetch(`${PROXY_URL}/api/1inch/swap/v6.0/8453/quote?...`);
```

### Creating Cross-Chain Orders
```typescript
const order = await fusionPlusHub.createOrder({
  maker: userAddress,
  srcToken: USDC_BASE,
  dstToken: USDC_NEAR,
  srcAmount: parseUnits('100', 6),
  dstAmount: parseUnits('95', 6), // 5% slippage
  secretHash: keccak256(secret),
  timelocks: calculateTimelocks()
});
```

## Production Deployment

### Mainnet Deployment Steps
1. Audit all contracts
2. Deploy to BASE mainnet
3. Verify contracts on BaseScan
4. Configure resolver infrastructure
5. Set up monitoring and alerts

### Monitoring
- Track escrow deployments
- Monitor timeout events
- Alert on failed swaps
- Analyze gas costs

## Documentation

Detailed documentation available in `/docs`:
- `01-architecture-overview.md` - System design
- `02-three-layer-pattern.md` - Architecture pattern
- `03-escrow-factory-system.md` - Factory implementation
- `04-limit-order-integration.md` - 1inch LOP integration
- `05-cross-chain-coordination.md` - Atomic swap mechanics
- `06-orchestration-interface.md` - Resolver interface
- `07-security-architecture.md` - Security measures
- `08-testing-guide.md` - Testing strategies

## Key Insights from 1inch Analysis

### From cross-chain-resolver-example
- Resolver pattern with deploySrc/deployDst functions
- Order filling integrated with escrow deployment
- Batch operations support via arbitraryCalls

### From cross-chain-swap
- CREATE2 escrow factory pattern
- Immutable parameters encoding
- Deterministic address generation across chains

### From limit-order-protocol
- Gasless order creation
- EIP-712 signature validation
- TakerTraits for flexible order execution

## Contributing

1. Follow existing code patterns from 1inch repositories
2. Add comprehensive tests for all changes
3. Update documentation to reflect changes
4. Run linters and formatters before committing

## License

MIT