# Ethereum Hub Architecture Documentation

## Overview

The Ethereum Hub is the core component of 1Balancer's cross-chain atomic swap infrastructure, implementing the Fusion+ challenge requirements by building upon 1inch foundation contracts. This documentation provides a comprehensive guide to the architecture, implementation details, and integration patterns.

## Table of Contents

1. [Architecture Overview](./01-architecture-overview.md)
2. [Three-Layer Pattern](./02-three-layer-pattern.md)
3. [Escrow Factory System](./03-escrow-factory-system.md)
4. [Limit Order Protocol Integration](./04-limit-order-integration.md)
5. [Cross-Chain Coordination](./05-cross-chain-coordination.md)
6. [Orchestration Service Interface](./06-orchestration-interface.md)
7. [Security Architecture](./07-security-architecture.md)
8. [Testing Guide](./08-testing-guide.md)
9. [NEAR Protocol Integration](./09-near-integration.md)

## Quick Start

```bash
# Deploy to BASE testnet
cd packages/hardhat
yarn deploy:base-testnet

# Run tests with mainnet fork
yarn test:fork
```

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                         │
│                    (Portfolio Management)                        │
├─────────────────────────────────────────────────────────────────┤
│                      ORCHESTRATION LAYER                         │
│               (Custom Coordination - No KYC)                     │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  Orchestration  │  │  Event Monitor   │  │  Dutch Auction │  │
│  │     Service     │  │    System        │  │   Simulator   │  │
│  └────────┬────────┘  └────────┬─────────┘  └───────┬───────┘  │
│           └─────────────────────┴────────────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                        PROTOCOL LAYER                            │
│                  (1inch Foundation + Extensions)                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │ Escrow Factory  │  │  Limit Order     │  │  Aggregation  │  │
│  │    System       │  │    Protocol      │  │    Router     │  │
│  └─────────────────┘  └──────────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. **Escrow Factory System**
- Implements 1inch cross-chain-swap pattern
- Uses CREATE2 for deterministic addresses
- Manages source and destination escrows
- Coordinates with Limit Order Protocol

### 2. **Fusion+ Hub**
- Main integration point
- Upgradeable proxy pattern
- Role-based access control
- Protocol fee management

### 3. **Libraries**
- **TimelocksLib**: Cross-chain timeout coordination
- **ImmutablesLib**: Parameter encoding/validation

### 4. **Interfaces**
- **ILimitOrderProtocol**: 1inch order integration
- **IEscrowFactory**: Escrow creation/management
- **IOrchestrationCoordinator**: Cross-chain coordination

## Design Principles

1. **No KYC Requirements**: Simulates resolver behavior without official status
2. **Atomic Execution**: Ensures all-or-nothing cross-chain swaps
3. **1inch Compatibility**: Maintains full compatibility with foundation contracts
4. **Security First**: Multiple layers of validation and timeout protection
5. **Orchestration Ready**: Designed for seamless integration with orchestration service

## Integration Points

### With 1inch Foundation
- Limit Order Protocol for gasless orders
- Aggregation Router for optimal routing
- Price Feed Aggregator for valuations

### With Orchestration Service
- REST API for session management
- WebSocket for real-time updates
- Event monitoring for state synchronization

### With NEAR Protocol
- Compatible HTLC implementation
- Cross-chain message verification
- Coordinated timeout management
- TEE solver integration

For detailed NEAR documentation, see [NEAR Protocol Integration](./09-near-integration.md)

## Security Features

- Hashlock/Timelock mechanism
- Cross-chain timeout coordination
- Role-based access control
- Emergency pause functionality
- Reentrancy protection
- Input validation at every level

## Next Steps

1. Review the [Architecture Overview](./01-architecture-overview.md) for detailed component descriptions
2. Understand the [Three-Layer Pattern](./02-three-layer-pattern.md) design
3. Learn about [1inch Foundation Alignment](./08-1inch-alignment.md)
4. Follow the [Deployment Guide](./10-deployment-guide.md) for setup

## Resources

- [1inch Cross-Chain Swap Repository](https://github.com/1inch/cross-chain-swap)
- [1inch Limit Order Protocol](https://github.com/1inch/limit-order-protocol)
- [1inch Developer Portal](https://portal.1inch.dev)
- [1Balancer Documentation](../../../../../../../1balancer-docs)

---
fast recap

 Implementation of the Ethereum Hub for Task 4. Here's a summary:

  Major Improvements Implemented

  1. Replaced Simple HTLC with 1inch Patterns ✅

  - Implemented BaseEscrowFactory following 1inch's cross-chain-swap pattern
  - Added CREATE2 deterministic address generation
  - Created EscrowSrc and EscrowDst contracts with proper immutables

  2. Added Limit Order Protocol Integration ✅

  - Created ILimitOrderProtocol interface
  - Integrated order filling with escrow deployment
  - Added EIP-712 signature validation

  3. Implemented Resolver Pattern ✅

  - Created FusionPlusResolver following cross-chain-resolver-example
  - Added deploySrc/deployDst functions
  - Implemented withdraw/cancel mechanisms

  4. Fixed Cross-Chain Safety ✅

  - Created TimelocksLib for timeout coordination
  - Enforced constraint: dstCancellation < srcWithdrawal
  - Added safety deposits for incentive alignment

  5. Setup Proper Testing Infrastructure ✅

  - Configured BASE mainnet forking (since 1inch has no testnets)
  - Created mock resolver and destination chain simulators
  - Added comprehensive integration tests

  6. Built CORS Proxy for API Access ✅

  - Express proxy server for 1inch API
  - Handles all API endpoints (Swap, Orderbook, Fusion)
  - Ready for Vercel deployment

  7. Created Comprehensive Documentation ✅

  - Architecture documentation matching solutionV3
  - Testing guide with mainnet fork instructions
  - Security architecture documentation
  - Updated main README with production-grade details

  Key Files Created/Modified

  Contracts

  - /escrow/BaseEscrowFactory.sol - Factory pattern from 1inch
  - /escrow/EscrowSrc.sol & /escrow/EscrowDst.sol - Escrow implementations
  - /resolver/FusionPlusResolver.sol - Orchestration without KYC
  - /libraries/TimelocksLib.sol & /libraries/ImmutablesLib.sol - Support libraries

  Testing

  - /test/mocks/MockFusionPlusResolver.sol - Local testing
  - /test/integration/CrossChainSwap.test.ts - Integration tests

  Infrastructure

  - /packages/proxy/ - Complete CORS proxy implementation
  - Updated hardhat.config.ts with mainnet fork configuration
  - Updated package.json with all necessary scripts

  The implementation now properly follows 1inch's patterns and is ready for production deployment on BASE mainnet, with all the safety mechanisms and testing
  infrastructure in place.