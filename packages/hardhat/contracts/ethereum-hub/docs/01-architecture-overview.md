# Architecture Overview

## Introduction

The Ethereum Hub is a sophisticated smart contract system deployed on BASE chain that enables cross-chain atomic swaps through integration 
with 1inch foundation contracts. It implements the Fusion+ challenge requirements while avoiding KYC requirements through an innovative orchestration
simulation approach.

## Core Architecture Components

### 1. Contract Structure

```
ethereum-hub/
├── escrow/
│   ├── BaseEscrowFactory.sol     # Abstract factory following 1inch pattern
│   ├── EscrowFactory.sol         # Concrete implementation
│   ├── EscrowSrc.sol            # Source chain escrow contract
│   └── EscrowDst.sol            # Destination chain escrow contract
├── interfaces/
│   ├── IEscrowFactory.sol        # Factory interface
│   ├── ILimitOrderProtocol.sol  # 1inch LOP interface
│   ├── IHTLCManager.sol          # Legacy HTLC interface
│   └── IOrchestrationCoordinator.sol
├── libraries/
│   ├── TimelocksLib.sol          # Timeout coordination
│   └── ImmutablesLib.sol         # Parameter management
├── orchestration/
│   └── OrchestrationCoordinator.sol
├── htlc/
│   └── HTLCManager.sol           # Legacy, being migrated
└── FusionPlusHub.sol             # Main hub contract
```

### 2. Component Responsibilities

#### **FusionPlusHub.sol**
- Central integration point for all cross-chain operations
- Upgradeable via OpenZeppelin proxy pattern
- Manages protocol fees and access control
- Routes operations to appropriate subsystems

```solidity
contract FusionPlusHub is 
    Initializable, 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable 
{
    // Integrates with:
    address public limitOrderProtocol;      // 1inch LOP
    address public aggregationRouter;       // 1inch Router
    IEscrowFactory public escrowFactory;    // Cross-chain escrows
    IOrchestrationCoordinator public orchestrationCoordinator;
}
```

#### **Escrow Factory System**
Following 1inch's cross-chain-swap pattern:

1. **BaseEscrowFactory**: Abstract implementation providing core functionality
2. **EscrowFactory**: Concrete implementation with BASE-specific features
3. **EscrowSrc/EscrowDst**: Actual escrow contracts for atomic swaps

Key features:
- CREATE2 deployment for deterministic addresses
- Immutable parameter validation
- Cross-chain timeout coordination
- Integration with 1inch Limit Order Protocol

#### **Libraries**

**TimelocksLib.sol**:
```solidity
struct Timelocks {
    uint32 srcWithdrawal;        // When taker can withdraw on source
    uint32 srcPublicWithdrawal;  // When anyone can withdraw
    uint32 srcCancellation;      // When maker can cancel
    uint32 srcDeployedAt;        // Deployment timestamp
    uint32 dstWithdrawal;        // Destination chain withdrawal
    uint32 dstCancellation;      // Destination cancellation
    uint32 dstDeployedAt;        // Destination deployment
}
```

**ImmutablesLib.sol**:
```solidity
struct Immutables {
    address maker;
    address taker;
    address token;
    uint256 amount;
    uint256 safetyDeposit;
    bytes32 hashlockHash;
    Timelocks timelocks;
    bytes32 orderHash;       // Links to 1inch order
    uint256 chainId;         // Target chain
}
```

### 3. Cross-Chain Flow

```
[User] → [FusionPlusHub] → [EscrowFactory] → [EscrowSrc]
                ↓                                   ↓
        [Orchestration]                    [Lock Tokens]
           Service                               ↓
                ↓                          [Wait for Secret]
        [Monitor Events]                         ↓
                ↓                          [Reveal Secret]
        [Coordinate NEAR]                        ↓
                ↓                          [Complete Swap]
        [Complete Atomic Swap]
```

### 4. Integration Architecture

#### **1inch Foundation Integration**

```solidity
// Limit Order Protocol Integration
function fillOrderWithEscrow(
    ILimitOrderProtocol.Order calldata order,
    bytes calldata signature,
    uint256 makingAmount,
    uint256 takingAmount,
    address escrowAddress
) external {
    // Order is filled with escrow as receiver
    // Escrow handles cross-chain coordination
}
```

#### **Orchestration Service Interface**

The contracts are designed to work with an off-chain orchestration service:

```typescript
// Expected orchestration service calls
POST /api/sessions/create
{
    srcChain: "base",
    dstChain: "near",
    srcToken: "0x...",
    dstToken: "near_token.near",
    amount: "1000000"
}

// Contract expects these on-chain calls
orchestrator.createCrossChainOrder(orderParams)
orchestrator.confirmOrder(orderHash, htlcParams)
orchestrator.completeOrder(orderHash, secret)
```

### 5. Security Architecture

#### **Multi-Layer Validation**

1. **Input Validation**: Every function validates parameters
2. **State Validation**: State transitions are strictly controlled
3. **Timeout Protection**: Cross-chain timeouts prevent lockups
4. **Access Control**: Role-based permissions for critical functions

#### **Timeout Coordination**

```
Source Chain:      |--Withdraw--|--Public--|--Cancel-->
                   0           T1         T2         T3

Destination Chain: |--Withdraw--|--Cancel-->
                   0          T1'        T2'

Where: T2' < T1 (ensures atomic execution)
```

### 6. Gas Optimization

- Minimal storage usage with mappings
- Efficient struct packing in libraries
- CREATE2 for predictable addresses
- Batch operations where possible

### 7. Upgrade Path

The FusionPlusHub uses OpenZeppelin's upgradeable pattern:

```solidity
// Deployment
const FusionPlusHub = await upgrades.deployProxy(
    FusionPlusHubFactory,
    [limitOrderProtocol, aggregationRouter, htlcManager, orchestrationCoordinator, escrowFactory],
    { initializer: 'initialize' }
);

// Upgrade
const FusionPlusHubV2 = await upgrades.upgradeProxy(
    hubAddress,
    FusionPlusHubV2Factory
);
```

## Key Design Decisions

### 1. **Escrow Pattern over Simple HTLC**
- Follows 1inch's proven cross-chain-swap pattern
- Better integration with Limit Order Protocol
- More flexible for future extensions

### 2. **Orchestration Simulation**
- Avoids KYC requirements of official resolvers
- Maintains trustless execution
- Enables hackathon deployment without capital requirements

### 3. **Library-Based Architecture**
- Reusable components across contracts
- Gas-efficient implementation
- Clear separation of concerns

### 4. **Event-Driven Coordination**
- Comprehensive event emission
- Enables off-chain monitoring
- Facilitates cross-chain synchronization

## Next Steps

- Review [Three-Layer Pattern](./02-three-layer-pattern.md) for architectural boundaries
- Understand [Escrow Factory System](./03-escrow-factory-system.md) in detail
- Learn about [1inch Foundation Alignment](./08-1inch-alignment.md)