# 1Balancer Architecture Overview

## Three-Layer Architecture

1Balancer implements a three-layer architecture for cross-chain atomic swaps and portfolio management:

```
┌──────────────────────────────────────────────────────────┐
│         APPLICATION LAYER - Portfolio Management         │
│     Automated rebalancing with cross-chain support      │
├──────────────────────────────────────────────────────────┤
│      ORCHESTRATION LAYER - Custom Coordination          │
│   Simulated resolver behavior (No KYC requirements)     │
├──────────────────────────────────────────────────────────┤
│        PROTOCOL LAYER - 1inch Foundation                │
│    Limit Orders + Fusion + Cross-Chain Contracts        │
└──────────────────────────────────────────────────────────┘
```

## Key Components

### Ethereum Hub (BASE Chain)
- **Location**: `contracts/ethereum-hub/`
- **Purpose**: Fusion+ implementation for cross-chain atomic swaps
- **Components**:
  - Orchestration contracts for custom coordination
  - HTLC management for atomic swap execution
  - Cross-chain bridge interfaces

### Portfolio Management
- **Location**: `contracts/portfolio/`
- **Purpose**: Core 1Balancer business logic
- **Modules**:
  - BalancerFactory: User-specific portfolio creation
  - BaseBalancer: Percentage-based allocation
  - StableLimit: Precise stablecoin management
  - DriftBalancer: Automatic drift-based rebalancing
  - TimeBalancer: Chainlink Automation integration

### 1inch Foundation Integration
- **Location**: `contracts/foundation/`
- **Purpose**: Integration with 1inch protocols
- **Components**:
  - Limit Order Protocol usage
  - Fusion protocol integration
  - 1inch API adapters

## Cross-Chain Communication

The system communicates with the NEAR Protocol implementation (in separate repository) through:
- Event-based coordination
- Hashlock/timelock synchronization
- Orchestration layer message passing

## Deployment Target

All contracts are designed for deployment on BASE L2 for:
- Lower gas fees (10-100x cheaper than mainnet)
- Faster confirmation times (2 second blocks)
- Coinbase ecosystem integration