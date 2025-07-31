# Escrow Factory System

## Overview

The Escrow Factory System is the core infrastructure that enables trustless cross-chain atomic swaps.
It follows 1inch's cross-chain-swap pattern while adding custom extensions for the Fusion+ challenge.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BaseEscrowFactory                        │
│  (Abstract factory with core functionality)                 │
├─────────────────────────────────────────────────────────────┤
│                     EscrowFactory                           │
│  (Concrete implementation for BASE chain)                   │
├─────────────────────────────────────────────────────────────┤
│     EscrowSrc                          EscrowDst            │
│  (Source chain escrow)              (Destination escrow)    │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. BaseEscrowFactory

**Purpose**: Abstract factory providing core escrow creation logic

**Key Features**:
- CREATE2 deployment for deterministic addresses
- Role-based access control
- Integration with Limit Order Protocol
- Escrow tracking and validation

```solidity
abstract contract BaseEscrowFactory is IEscrowFactory, AccessControl, Pausable {
    // Implementations
    address public immutable escrowSrcImplementation;
    address public immutable escrowDstImplementation;
    
    // 1inch integration
    address public immutable limitOrderProtocol;
    
    // Escrow tracking
    mapping(bytes32 => address) public escrows;
    mapping(address => bool) public isValidEscrow;
}
```

### 2. EscrowFactory

**Purpose**: Concrete implementation with BASE-specific features

**Additional Features**:
- Batch escrow creation
- Enhanced verification
- Emergency controls

```solidity
contract EscrowFactory is BaseEscrowFactory {
    function createEscrowPair(
        Immutables calldata srcImmutables,
        Immutables calldata dstImmutables
    ) external payable returns (address srcEscrow, address dstEscrow);
}
```

### 3. EscrowSrc (Source Chain)

**Purpose**: Holds tokens on source chain until swap completes

**State Machine**:
```
INITIALIZED → FUNDED → WITHDRAWN (success path)
     ↓                      ↓
     └──────→ CANCELLED ←────┘ (timeout path)
```

**Key Functions**:
```solidity
// Initialize with immutable parameters
function initialize(bytes calldata encodedImmutables) external payable

// Withdraw by revealing secret
function withdraw(bytes32 secret) external

// Cancel after timeout
function cancel() external
```

### 4. EscrowDst (Destination Chain)

**Purpose**: Mirror escrow on destination chain

**Key Difference**: Roles are swapped - original maker becomes taker

```solidity
// Must coordinate with source chain timeout
function initialize(
    bytes calldata encodedImmutables,
    uint256 srcCancellationTimestamp
) external payable
```

## Immutables System

### ImmutablesLib Structure

```solidity
struct Immutables {
    address maker;           // Order creator
    address taker;           // Order filler
    address token;           // Token to swap
    uint256 amount;          // Amount to swap
    uint256 safetyDeposit;   // Anti-spam deposit (0.1%)
    bytes32 hashlockHash;    // SHA256(secret)
    Timelocks timelocks;     // Cross-chain timeouts
    bytes32 orderHash;       // Links to 1inch order
    uint256 chainId;         // Target chain ID
}
```

### Why Immutables?

1. **Gas Efficiency**: Parameters stored once, not in every escrow
2. **Security**: Cannot be modified after deployment
3. **Determinism**: Same parameters = same address

## Timelock Coordination

### TimelocksLib Structure

```solidity
struct Timelocks {
    uint32 srcWithdrawal;        // T1: Taker can withdraw
    uint32 srcPublicWithdrawal;  // T2: Anyone can withdraw
    uint32 srcCancellation;      // T3: Maker can cancel
    uint32 dstWithdrawal;        // T1': Taker on destination
    uint32 dstCancellation;      // T2': Cancel on destination
}
```

### Critical Constraint

```
dstCancellation < srcWithdrawal
```

This ensures atomicity - destination times out before source can be withdrawn.

## CREATE2 Address Calculation

### How It Works

```solidity
address escrow = CREATE2(
    deployer: factory,
    salt: keccak256(immutables),
    bytecode: implementation.code
)
```

### Benefits

1. **Predictable Addresses**: Can calculate before deployment
2. **Cross-Chain Coordination**: Same calculation on all chains
3. **No Front-Running**: Address depends on parameters

## Integration with 1inch

### Order Flow

```
1. User creates Limit Order via 1inch SDK
2. Orchestration service calls fillOrderWithEscrow()
3. Order is filled with escrow as receiver
4. Escrow holds tokens until cross-chain swap completes
```

### Code Example

```solidity
function fillOrderWithEscrow(
    ILimitOrderProtocol.Order calldata order,
    bytes calldata signature,
    uint256 makingAmount,
    uint256 takingAmount,
    address escrowAddress
) external onlyRole(RESOLVER_ROLE) {
    require(isValidEscrow[escrowAddress], "Invalid escrow");
    
    // Fill order with escrow as receiver
    bytes memory interaction = abi.encode(escrowAddress);
    
    ILimitOrderProtocol(limitOrderProtocol).fillOrder(
        order,
        signature,
        interaction,
        makingAmount,
        takingAmount,
        0 // skipPermitAndThresholdAmount
    );
}
```

## Security Features

### 1. Safety Deposits

- 0.1% of swap amount
- Prevents spam attacks
- Returned on successful completion

### 2. Access Control

```solidity
bytes32 public constant ORCHESTRATOR_ROLE = keccak256("ORCHESTRATOR_ROLE");
bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
```

### 3. Validation

- Immutables validation on creation
- Timeout coordination checks
- Escrow state verification

### 4. Emergency Controls

```solidity
function emergencyPause() external onlyRole(DEFAULT_ADMIN_ROLE)
function emergencyRecover(address token, uint256 amount) external
```

## Gas Optimization

### 1. Minimal Proxy Pattern

Using Clones library for cheap deployment:
```solidity
escrow = Clones.cloneDeterministic(implementation, salt);
```

### 2. Efficient Storage

- Immutables encoded/decoded as needed
- Minimal state in escrows
- Events for off-chain tracking

### 3. Batch Operations

```solidity
function createEscrowPair() // Single transaction for both escrows
```

## Event System

### Factory Events

```solidity
event SrcEscrowCreated(address escrow, address maker, address taker, bytes32 hashlockHash);
event DstEscrowCreated(address escrow, address maker, address taker, bytes32 hashlockHash);
```

### Escrow Events

```solidity
event SecretRevealed(bytes32 hashlockHash, bytes32 secret);
event FundsWithdrawn(address recipient, uint256 amount);
event EscrowCancelled(address maker);
```

## Testing Considerations

### 1. Deterministic Tests

```javascript
const expectedAddress = await factory.addressOfEscrowSrc(immutables);
const actualAddress = await factory.createSrcEscrow(immutables);
expect(actualAddress).to.equal(expectedAddress);
```

### 2. Timeout Tests

```javascript
// Fast forward time
await network.provider.send("evm_increaseTime", [timelock.srcCancellation]);
await escrow.cancel(); // Should succeed
```

### 3. Cross-Chain Simulation

```javascript
// Deploy on both "chains" (different contracts)
const srcEscrow = await deploySrcEscrow(immutables);
const dstEscrow = await deployDstEscrow(immutables);
// Coordinate atomic execution
```

## Production Considerations

### 1. Multi-Chain Deployment

- Same factory bytecode on all chains
- Consistent implementation addresses
- Synchronized deployment process

### 2. Monitoring

- Watch factory events
- Track escrow states
- Alert on timeout approaching

### 3. Upgradability

- Factory can be upgraded
- Escrow implementations are immutable
- Use proxy pattern for factory

## Conclusion

The Escrow Factory System provides:
1. **Trustless Execution**: No intermediaries needed
2. **1inch Compatibility**: Seamless integration
3. **Cross-Chain Safety**: Coordinated timeouts
4. **Gas Efficiency**: Minimal proxy pattern
5. **Production Ready**: Security and monitoring built-in

This system is the foundation for enabling cross-chain atomic swaps in the Fusion+ challenge.