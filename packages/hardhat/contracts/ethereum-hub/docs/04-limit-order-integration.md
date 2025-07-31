# Limit Order Protocol Integration

## Overview

The Ethereum Hub integrates deeply with 1inch's Limit Order Protocol (LOP) to enable gasless cross-chain swaps. This document details how we leverage LOP for the Fusion+ challenge while maintaining full compatibility.

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User (Portfolio Owner)                    │
└─────────────────────────┬───────────────────────────────────┘
                          │ Signs Order
┌─────────────────────────▼───────────────────────────────────┐
│                 1inch Limit Order Protocol                   │
│                    (Gasless Orders)                          │
└─────────────────────────┬───────────────────────────────────┘
                          │ fillOrder()
┌─────────────────────────▼───────────────────────────────────┐
│                    Escrow Factory                            │
│              (Receives tokens from LOP)                      │
└─────────────────────────┬───────────────────────────────────┘
                          │ Holds tokens
┌─────────────────────────▼───────────────────────────────────┐
│                  Cross-Chain Execution                       │
└─────────────────────────────────────────────────────────────┘
```

## Order Structure

### Standard 1inch Order

```solidity
struct Order {
    uint256 salt;           // Unique order identifier
    address makerAsset;     // Token to sell
    address takerAsset;     // Token to buy
    address maker;          // Order creator (user)
    address receiver;       // Who receives makerAsset (escrow)
    address allowedSender;  // 0x0 for public orders
    uint256 makingAmount;   // Amount to sell
    uint256 takingAmount;   // Amount to buy
    uint256 offsets;        // Packed interactions data
    bytes interactions;     // Hooks and extensions
}
```

### Cross-Chain Extension

We extend the order with cross-chain parameters:

```solidity
// Encoded in interactions field
struct CrossChainParams {
    uint256 destinationChainId;
    address destinationToken;
    uint256 destinationAmount;
    bytes32 hashlockHash;
    uint32 timeoutDuration;
}
```

## Integration Points

### 1. Order Creation

```typescript
// Frontend creates order using 1inch SDK
import { LimitOrderBuilder } from '@1inch/limit-order-sdk';

const limitOrderBuilder = new LimitOrderBuilder(
    contractAddress,
    chainId,
    connector
);

const order = limitOrderBuilder.buildOrder({
    makerAssetAddress: sourceToken,
    takerAssetAddress: NATIVE_TOKEN, // ETH/BASE
    makerAmount: amount,
    takerAmount: expectedReturn,
    maker: userAddress,
    receiver: escrowAddress, // Pre-computed escrow
    interactions: encodeCrossChainParams(params)
});
```

### 2. Order Signing

```typescript
// EIP-712 signature
const signature = await limitOrderBuilder.buildOrderSignature(
    userAddress,
    order
);
```

### 3. Order Filling

```solidity
// In BaseEscrowFactory
function fillOrderWithEscrow(
    ILimitOrderProtocol.Order calldata order,
    bytes calldata signature,
    uint256 makingAmount,
    uint256 takingAmount,
    address escrowAddress
) external onlyRole(RESOLVER_ROLE) {
    // Validate escrow
    require(isValidEscrow[escrowAddress], "Invalid escrow");
    
    // Fill order - tokens go to escrow
    ILimitOrderProtocol(limitOrderProtocol).fillOrder(
        order,
        signature,
        abi.encode(escrowAddress), // interaction data
        makingAmount,
        takingAmount,
        0 // skipPermitAndThresholdAmount
    );
}
```

## Advanced Features

### 1. Partial Fills

Supporting gradual portfolio rebalancing:

```solidity
// Order can be filled in multiple transactions
uint256 remaining = limitOrderProtocol.remaining(orderHash);
if (remaining > 0) {
    // Can still fill more
    fillOrderWithEscrow(order, signature, partialAmount, ...);
}
```

### 2. Conditional Execution

Using predicates for market conditions:

```solidity
// In order interactions
bytes predicate = abi.encodeCall(
    pricePredicate.checkPrice,
    (tokenA, tokenB, minPrice)
);
```

### 3. Order Cancellation

```solidity
// User can cancel unfilled orders
function cancelOrder(uint256 orderInfo) external {
    limitOrderProtocol.cancelOrder(orderInfo);
}
```

## Security Considerations

### 1. Signature Validation

The LOP validates signatures, ensuring only the maker can create orders:

```solidity
// Inside LOP (1inch code)
require(
    SignatureChecker.isValidSignatureNow(
        order.maker,
        orderHash,
        signature
    ),
    "Bad signature"
);
```

### 2. Replay Protection

- Salt ensures uniqueness
- Filled amounts tracked on-chain
- Orders bound to specific chain

### 3. Receiver Validation

```solidity
// Ensure tokens go to valid escrow
require(order.receiver == computedEscrowAddress, "Invalid receiver");
```

## Integration Benefits

### 1. **Gasless Orders**
- Users sign orders off-chain
- Resolvers pay gas for execution
- Better UX for portfolio rebalancing

### 2. **Composability**
- Works with existing 1inch infrastructure
- Compatible with aggregators and market makers
- Can integrate with other protocols

### 3. **Security**
- Battle-tested 1inch contracts
- No custom order logic needed
- Standard EIP-712 signatures

### 4. **Flexibility**
- Supports any ERC20 token
- Conditional execution options
- Partial fill capabilities

## Implementation Pattern

### Step 1: Prepare Order Parameters

```typescript
function prepareCrossChainOrder(
    sourceToken: string,
    destinationChain: number,
    amount: BigNumber
): OrderParams {
    // Calculate escrow address
    const escrowAddress = calculateEscrowAddress(params);
    
    // Encode cross-chain data
    const interactions = encodeCrossChainParams({
        destinationChainId,
        destinationToken,
        hashlockHash: generateHashlock()
    });
    
    return {
        makerAsset: sourceToken,
        makingAmount: amount,
        receiver: escrowAddress,
        interactions
    };
}
```

### Step 2: Create and Sign Order

```typescript
async function createSignedOrder(params: OrderParams): Promise<SignedOrder> {
    const order = await limitOrderBuilder.buildOrder(params);
    const signature = await limitOrderBuilder.buildOrderSignature(
        maker,
        order
    );
    
    return { order, signature };
}
```

### Step 3: Execute Cross-Chain Swap

```typescript
async function executeCrossChainSwap(signedOrder: SignedOrder) {
    // 1. Deploy escrow
    const escrow = await deployEscrow(signedOrder.order);
    
    // 2. Fill order (tokens go to escrow)
    await fillOrderWithEscrow(
        signedOrder.order,
        signedOrder.signature,
        escrow
    );
    
    // 3. Coordinate cross-chain execution
    await coordinateCrossChain(escrow);
}
```

## Testing with LOP

### 1. Fork Testing

```javascript
// Fork BASE mainnet to test with real LOP
const { ethers } = require("hardhat");

describe("LOP Integration", () => {
    it("fills order with escrow", async () => {
        // Create order
        const order = await createOrder(params);
        
        // Sign order
        const signature = await signOrder(order);
        
        // Fill through escrow factory
        await escrowFactory.fillOrderWithEscrow(
            order,
            signature,
            order.makingAmount,
            order.takingAmount,
            escrowAddress
        );
        
        // Verify tokens in escrow
        expect(await token.balanceOf(escrowAddress))
            .to.equal(order.makingAmount);
    });
});
```

### 2. Signature Testing

```javascript
it("validates order signatures", async () => {
    const invalidSignature = "0x1234..."; // Bad signature
    
    await expect(
        escrowFactory.fillOrderWithEscrow(
            order,
            invalidSignature,
            ...
        )
    ).to.be.revertedWith("Bad signature");
});
```

## Common Patterns

### 1. Pre-compute Escrow Address

```typescript
// Calculate before order creation
const escrowAddress = await factory.addressOfEscrowSrc(immutables);

// Use as receiver in order
order.receiver = escrowAddress;
```

### 2. Batch Orders

```typescript
// Multiple orders for portfolio rebalancing
const orders = tokens.map(token => 
    createOrder(token, targetAllocation)
);

// Fill all orders
for (const order of orders) {
    await fillOrderWithEscrow(order, ...);
}
```

### 3. Order Status Tracking

```typescript
// Monitor order fills
limitOrderProtocol.on('OrderFilled', (orderHash, maker) => {
    updateOrderStatus(orderHash, 'filled');
    initiateCrossChainExecution(orderHash);
});
```

## Conclusion

The Limit Order Protocol integration provides:

1. **Gasless Execution**: Better UX for users
2. **Security**: Leveraging battle-tested 1inch contracts
3. **Flexibility**: Partial fills and conditional execution
4. **Compatibility**: Works with existing 1inch ecosystem

This integration is crucial for enabling efficient cross-chain portfolio rebalancing in the Fusion+ challenge.