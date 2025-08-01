# Fork Testing Guide

This guide explains how to use Hardhat's forking feature to test the 1balancer protocol against real mainnet state.

## Overview

Fork testing allows you to:
- Test against real mainnet state without spending real ETH
- Interact with deployed contracts and protocols
- Simulate complex DeFi interactions
- Test cross-chain functionality locally

## Prerequisites

1. **Alchemy API Key**: Required for forking mainnet networks
   ```bash
   # Add to your .env file
   ALCHEMY_API_KEY=your-alchemy-api-key-here
   ```

2. **Environment Setup**: Ensure all dependencies are installed
   ```bash
   yarn install
   ```

## Available Networks

The following networks are configured for forking:

| Network | Chain ID | Command |
|---------|----------|---------|
| Ethereum Mainnet | 1 | `yarn fork:mainnet` |
| Sepolia | 11155111 | `yarn fork:sepolia` |
| Base | 8453 | `yarn fork:base` |
| Arbitrum | 42161 | `yarn fork:arbitrum` |
| Optimism | 10 | `yarn fork:optimism` |
| Polygon | 137 | `yarn fork:polygon` |

## Usage

### 1. Starting a Fork

From the project root:

```bash
# Fork a specific network
yarn fork:base        # Fork Base mainnet
yarn fork:sepolia     # Fork Sepolia testnet
yarn fork:mainnet     # Fork Ethereum mainnet

# Or use the generic command
yarn fork <network-name>
```

The fork will start on `http://localhost:8545` by default.

### 2. Running Tests on Fork

```bash
# Run all tests on the fork
yarn test:fork

# Run specific test file
yarn hardhat:test test/integration/AtomicSwap.fork.test.ts --network localhost

# Run tests on a specific forked network
HARDHAT_NETWORK=base yarn test:fork
```

### 3. Deploying to Fork

```bash
# Deploy contracts to the forked network
yarn deploy:fork

# Deploy specific contracts
yarn hardhat:deploy --network localhost --tags EthereumHub
```

### 4. Interacting with Fork

```bash
# Open Hardhat console connected to fork
npx hardhat console --network localhost

# Run scripts against fork
npx hardhat run scripts/interact-fork.ts --network localhost
```

## Fork Configuration

### Setting Fork Block Number

For deterministic testing, you can pin the fork to a specific block:

```bash
# In your .env file
FORK_BLOCK_NUMBER=18500000
```

### Custom Fork URLs

If you need to use a different RPC provider, update the network configuration in `hardhat.config.ts`:

```typescript
base: {
  url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
  // ... other config
}
```

## Testing Best Practices

### 1. Use Test Accounts

The fork provides test accounts with ETH:

```javascript
const [deployer, user1, user2] = await ethers.getSigners();
```

### 2. Impersonate Accounts

You can impersonate any account on the fork:

```javascript
await network.provider.request({
  method: "hardhat_impersonateAccount",
  params: ["0x..."], // Address to impersonate
});
```

### 3. Set Token Balances

Modify token balances for testing:

```javascript
// Set USDC balance for test account
await network.provider.send("hardhat_setBalance", [
  testAccount.address,
  "0x1000000000000000000", // 1 ETH in hex
]);
```

### 4. Time Manipulation

Fast-forward blockchain time:

```javascript
await network.provider.send("evm_increaseTime", [3600]); // 1 hour
await network.provider.send("evm_mine"); // Mine new block
```

## Example: Testing 1inch Integration

```javascript
describe("1inch Fork Integration", function () {
  let swapContract;
  let usdc, weth;
  
  before(async function () {
    // Fork Base mainnet
    await network.provider.request({
      method: "hardhat_reset",
      params: [{
        forking: {
          url: `https://mainnet.base.org`,
          blockNumber: 18500000,
        },
      }],
    });
    
    // Deploy contracts
    swapContract = await deployContract("AtomicSwapERC20");
    
    // Get token instances
    usdc = await ethers.getContractAt("IERC20", TOKENS.BASE.USDC);
    weth = await ethers.getContractAt("IERC20", TOKENS.BASE.WETH);
  });
  
  it("Should execute swap through 1inch", async function () {
    // Test implementation
  });
});
```

## Troubleshooting

### Common Issues

1. **"Forking from RPC failed" Error**
   - Check your API key is valid
   - Ensure you have credits/requests available
   - Try a different RPC endpoint

2. **"Cannot find network" Error**
   - Verify network name is correctly spelled
   - Check hardhat.config.ts has the network configured

3. **Slow Fork Performance**
   - Use a specific block number to avoid syncing latest state
   - Consider using a local archive node for frequent testing

### Debugging Fork State

```javascript
// Check current block number
const blockNumber = await ethers.provider.getBlockNumber();
console.log("Forked at block:", blockNumber);

// Verify fork URL
const network = await ethers.provider.getNetwork();
console.log("Network:", network.name, network.chainId);
```

## Advanced Usage

### Multi-Network Fork Testing

Test cross-chain scenarios by running multiple forks:

```bash
# Terminal 1: Fork Base
HARDHAT_PORT=8545 yarn fork:base

# Terminal 2: Fork Ethereum
HARDHAT_PORT=8546 yarn fork:mainnet
```

### Fork State Snapshots

Save and restore fork state:

```javascript
// Save snapshot
const snapshotId = await network.provider.send("evm_snapshot");

// ... run tests that modify state ...

// Restore snapshot
await network.provider.send("evm_revert", [snapshotId]);
```

## Integration with CI/CD

For automated testing:

```yaml
# Example GitHub Actions
- name: Run Fork Tests
  env:
    ALCHEMY_API_KEY: ${{ secrets.ALCHEMY_API_KEY }}
  run: |
    yarn fork:base &
    sleep 10
    yarn test:fork
```

## Security Considerations

1. **Never commit real private keys** - Fork testing uses test accounts
2. **API keys should be in .env** - Never commit API keys
3. **Use read-only RPCs** - Forks cannot modify mainnet state
4. **Reset between tests** - Ensure clean state for each test suite

## Next Steps

- Review [TESTING-STRATEGY.md](../TESTING-STRATEGY.md) for overall testing approach
- Check [test examples](test/) for fork testing patterns
- See [hardhat.config.ts](packages/hardhat/hardhat.config.ts) for network configuration