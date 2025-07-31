# Local Test Environment Setup Guide

## Overview

This guide explains how to set up and run tests for the Ethereum Hub, which requires mainnet forking since 1inch protocols have no testnet deployments.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Yarn** package manager
3. **Alchemy or Infura API key** for mainnet forking
4. **Local development environment** with Git

## Environment Setup

### 1. Configure Environment Variables

Create `.env` file in the hardhat package root:

```bash
# Mainnet RPC URLs for forking
ALCHEMY_BASE_MAINNET_KEY=your_alchemy_key_here
INFURA_PROJECT_ID=your_infura_id_here

# Fork block number (optional, for deterministic testing)
FORK_BLOCK_NUMBER=latest

# Test accounts (DO NOT use real private keys)
TEST_PRIVATE_KEY_1=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
TEST_PRIVATE_KEY_2=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

# 1inch API configuration (for integration tests)
ONEINCH_API_KEY=your_hackathon_api_key
ONEINCH_API_URL=https://api.1inch.dev
```

### 2. Install Dependencies

```bash
cd packages/hardhat
yarn install
```

### 3. Start Local Fork

```bash
# Start BASE mainnet fork
yarn fork:base

# Or with specific block number
FORK_BLOCK_NUMBER=123456789 yarn fork:base
```

## Testing Strategy

### 1. Unit Tests (Isolated Contract Testing)

```bash
# Run all unit tests
yarn test

# Run specific test file
yarn test test/ethereum-hub/EscrowFactory.test.ts

# Run with coverage
yarn test:coverage
```

### 2. Integration Tests (Mainnet Fork)

```bash
# Start fork in one terminal
yarn fork:base

# Run integration tests in another terminal
yarn test:integration

# Run specific integration test
yarn test:integration test/integration/CrossChainSwap.test.ts
```

### 3. E2E Tests (Full Flow)

```bash
# Deploy contracts to fork
yarn deploy:fork

# Run E2E tests
yarn test:e2e
```

## Test Structure

```
test/
├── unit/                    # Isolated contract tests
│   ├── escrow/
│   │   ├── BaseEscrowFactory.test.ts
│   │   ├── EscrowSrc.test.ts
│   │   └── EscrowDst.test.ts
│   ├── resolver/
│   │   └── FusionPlusResolver.test.ts
│   └── libraries/
│       ├── TimelocksLib.test.ts
│       └── ImmutablesLib.test.ts
├── integration/             # Fork-based tests
│   ├── LimitOrderProtocol.test.ts
│   ├── CrossChainSwap.test.ts
│   └── ResolverFlow.test.ts
└── e2e/                     # End-to-end scenarios
    ├── AtomicSwapFlow.test.ts
    └── RevertScenarios.test.ts
```

## Writing Tests

### 1. Unit Test Example

```typescript
import { ethers } from "hardhat";
import { expect } from "chai";
import { BaseEscrowFactory, EscrowSrc } from "../typechain-types";

describe("BaseEscrowFactory", function () {
  let factory: BaseEscrowFactory;
  let escrowSrc: EscrowSrc;

  beforeEach(async function () {
    const Factory = await ethers.getContractFactory("BaseEscrowFactory");
    factory = await Factory.deploy();
    await factory.deployed();
  });

  it("Should deploy escrow with CREATE2", async function () {
    const salt = ethers.utils.randomBytes(32);
    const immutables = ethers.utils.defaultAbiCoder.encode(
      ["address", "address", "uint256"],
      [maker, taker, amount]
    );

    const tx = await factory.deploySrc(salt, immutables);
    const receipt = await tx.wait();
    
    // Verify deterministic address
    const computedAddress = await factory.computeEscrowAddress(salt, immutables);
    expect(receipt.events[0].args.escrow).to.equal(computedAddress);
  });
});
```

### 2. Integration Test Example

```typescript
import { ethers } from "hardhat";
import { expect } from "chai";
import { ILimitOrderProtocol } from "../typechain-types";

describe("1inch Integration", function () {
  let limitOrderProtocol: ILimitOrderProtocol;
  const LIMIT_ORDER_PROTOCOL_ADDRESS = "0x111111125421ca6dc452d289314280a0f8842a65";

  beforeEach(async function () {
    // Fork must be running
    limitOrderProtocol = await ethers.getContractAt(
      "ILimitOrderProtocol",
      LIMIT_ORDER_PROTOCOL_ADDRESS
    );
  });

  it("Should fill order on mainnet fork", async function () {
    // Create and sign order
    const order = {
      salt: ethers.utils.randomBytes(32),
      makerAsset: USDC_ADDRESS,
      takerAsset: WETH_ADDRESS,
      // ... other order fields
    };

    // Test filling order
    await expect(
      limitOrderProtocol.fillOrder(order, signature, makingAmount, takingAmount, thresholdAmount)
    ).to.emit(limitOrderProtocol, "OrderFilled");
  });
});
```

### 3. Mock Resolver Example

```typescript
// test/mocks/MockResolver.sol
contract MockResolver {
    mapping(bytes32 => bool) public orderSimulations;
    
    function simulateOrder(bytes32 orderHash) external {
        orderSimulations[orderHash] = true;
    }
    
    function isOrderSimulated(bytes32 orderHash) external view returns (bool) {
        return orderSimulations[orderHash];
    }
}
```

## Common Test Scenarios

### 1. Successful Atomic Swap
- User creates order on source chain
- Resolver deploys escrows on both chains
- Assets are swapped atomically
- Both parties receive their assets

### 2. Timeout Scenarios
- Source chain timeout before destination
- Proper fund recovery for both parties
- No loss of funds in any scenario

### 3. Resolver Failure Handling
- Resolver doesn't complete swap
- User can cancel after timeout
- Funds are properly recovered

### 4. Gas Optimization Tests
- Measure gas costs for operations
- Compare with baseline implementations
- Ensure efficiency targets are met

## Debugging Tips

### 1. Fork Connection Issues
```bash
# Check if fork is running
curl http://localhost:8545 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Reset fork to specific block
curl http://localhost:8545 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"hardhat_reset","params":[{"forking":{"jsonRpcUrl":"https://base-mainnet.g.alchemy.com/v2/YOUR_KEY","blockNumber":12345678}}],"id":1}'
```

### 2. Transaction Tracing
```typescript
// Enable console.log in tests
import "hardhat/console.sol";

// In contract
console.log("Order hash:", orderHash);
console.log("Escrow address:", escrowAddress);
```

### 3. Event Monitoring
```typescript
// Listen for all events
const filter = factory.filters.EscrowDeployed();
const events = await factory.queryFilter(filter);
events.forEach(event => {
  console.log("Escrow deployed:", event.args);
});
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: yarn install
      - run: yarn test
      
  integration:
    runs-on: ubuntu-latest
    services:
      hardhat:
        image: ethereum/client-go:latest
        options: --name hardhat-fork
    steps:
      - uses: actions/checkout@v3
      - run: yarn install
      - run: yarn fork:base &
      - run: sleep 10
      - run: yarn test:integration
```

## Performance Considerations

1. **Fork Caching**: Use `--fork-block-number` for consistent tests
2. **Parallel Testing**: Run unit tests in parallel, integration tests sequentially
3. **State Management**: Reset fork state between test suites
4. **Gas Reporting**: Enable gas reporter for optimization insights

## Troubleshooting

### Common Issues

1. **"Provider not connected"**
   - Ensure fork is running: `yarn fork:base`
   - Check RPC URL in hardhat config

2. **"Nonce too high"**
   - Reset local fork: `yarn fork:reset`
   - Clear test account state

3. **"Insufficient funds"**
   - Fork from block with funded accounts
   - Use hardhat's impersonation feature

4. **"Contract not found"**
   - Verify contract addresses for BASE mainnet
   - Check fork block number is recent

### Debug Commands

```bash
# Show current fork info
yarn fork:info

# Reset fork to latest block
yarn fork:reset

# Run tests with verbose logging
DEBUG=* yarn test

# Generate gas report
REPORT_GAS=true yarn test
```

## Next Steps

1. Complete mock resolver implementation
2. Add comprehensive integration test suite
3. Set up continuous integration
4. Add performance benchmarks
5. Create test data fixtures for common scenarios