# BASE Sepolia Deployment Guide

## 🚀 Complete Deployment Process for 1Balancer Fusion+

This guide walks you through deploying the 1Balancer contracts to BASE Sepolia testnet and connecting them with the NEAR deployment for cross-chain atomic swaps.

## Prerequisites

1. **Deployer Account with BASE Sepolia ETH**
   - Generate account: `make account-generate`
   - Get your address: `make account`
   - Fund with BASE Sepolia ETH from [faucets](https://www.alchemy.com/faucets/base-sepolia)

2. **Environment Setup**
   - Ensure `DEPLOYER_PRIVATE_KEY` is set in `.env`
   - Verify you have at least 0.001 ETH on BASE Sepolia

3. **NEAR Deployment** (if doing cross-chain)
   - Complete NEAR deployment first: `make near-deploy`
   - Note your NEAR contract address

## Deployment Steps

### Option 1: Quick Deployment (Recommended)

Deploy all contracts with optimized gas settings:

```bash
# Deploy all BASE contracts at once
make deploy-base-all

# Or deploy individually:
make deploy-base-hub     # Deploy FusionPlusHub
make deploy-base-escrow  # Deploy EscrowFactory
```

### Option 2: Standard Deployment

Use the standard deployment flow:

```bash
# Deploy to BASE Sepolia
make deploy-base

# Check deployment status
make fusion-plus-status
```

### Option 3: Direct Hardhat Commands

If you need more control or encounter issues:

```bash
cd packages/hardhat

# Deploy FusionPlusHub with V2 improvements
npx hardhat deploy --network baseSepolia --tags FusionPlusHub

# Deploy EscrowFactory
npx hardhat deploy --network baseSepolia --tags EscrowFactory

# Deploy everything
npx hardhat deploy --network baseSepolia --tags EthereumHub
```

## Gas Optimization

The deployment scripts are optimized for BASE Sepolia with:
- Gas price: 0.1 gwei (very low for testnet)
- Estimated total cost: ~0.0008 ETH

Check gas estimates before deploying:
```bash
make base-gas-estimate
```

## Post-Deployment Configuration

### 1. Update 1inch Protocol Addresses

Once 1inch deploys to BASE, update the placeholder addresses:

```solidity
// Current placeholders in deployment
PLACEHOLDER_LIMIT_ORDER_PROTOCOL = "0x0000000000000000000000000000000000000001"
PLACEHOLDER_AGGREGATION_ROUTER = "0x0000000000000000000000000000000000000002"
```

Update via the FusionPlusHub contract:
```javascript
// In hardhat console or script
const hub = await ethers.getContract("FusionPlusHub");
await hub.updateContracts(
  "0x... actual limit order protocol ...",
  "0x... actual aggregation router ...",
  "0x0000000000000000000000000000000000000000" // Keep factory unchanged
);
```

### 2. Connect with NEAR Deployment

Update the orchestrator configuration with both deployments:

```bash
# Edit packages/orchestrator/.env
BASE_FUSIONPLUS_HUB=0x... (from deployment)
BASE_ESCROW_FACTORY=0x... (from deployment)
NEAR_HTLC_CONTRACT=fusion-htlc.your-account.testnet
```

### 3. Start Orchestration Service

```bash
# Start the orchestrator to bridge BASE and NEAR
make orchestrator-dev
```

## Verification on Basescan

Contracts are automatically verified if `BASESCAN_API_KEY` is set. Manual verification:

```bash
# Verify implementation contract
yarn hardhat verify --network baseSepolia \
  <implementation_address>

# For proxy contracts, use Basescan's proxy verification:
# https://sepolia.basescan.org/proxycontractchecker
```

## Testing the Deployment

### 1. Check Deployment Status
```bash
make fusion-plus-status
```

### 2. Run Integration Tests
```bash
# Test cross-chain swaps
make fusion-plus-test

# Run local simulation
make fusion-plus-local
```

### 3. Monitor Events
View contract events on [Basescan](https://sepolia.basescan.org) or via orchestrator logs:
```bash
make orchestrator-logs
```

## Troubleshooting

### Insufficient Funds Error
```bash
# Check your balance
make account

# Get more BASE Sepolia ETH
make account-fund
```

### Password Required Error
Use direct npx hardhat commands without the account system wrapper.

### Contract Already Deployed
Check existing deployments:
```bash
ls packages/hardhat/deployments/baseSepolia/
```

### Gas Price Issues
BASE Sepolia typically has very low gas prices. If transactions fail:
```javascript
// Adjust in deployment script
gasPrice: hre.ethers.parseUnits("1", "gwei"), // Increase if needed
```

## Complete Cross-Chain Flow

1. **Deploy BASE Contracts**
   ```bash
   make deploy-base-all
   ```

2. **Deploy NEAR Contracts**
   ```bash
   make near-deploy
   ```

3. **Start Orchestrator**
   ```bash
   make orchestrator-dev
   ```

4. **Test Atomic Swap**
   ```bash
   make fusion-plus-test
   ```

## Security Considerations

1. **Placeholder Addresses**: The contracts deploy with placeholder 1inch addresses. These MUST be updated when 1inch deploys to BASE.

2. **Access Control**: The deployer initially has all roles. Grant roles to appropriate addresses:
   - `RESOLVER_ROLE`: For resolvers/orchestrators
   - `OPERATOR_ROLE`: For operational tasks
   - `ADMIN_ROLE`: For configuration updates

3. **Upgradability**: FusionPlusHub is upgradeable. Ensure proper governance before mainnet deployment.

## Next Steps

1. **Update Documentation**: Document deployed addresses in project README
2. **Configure Frontend**: Update frontend to use deployed contracts
3. **Test Thoroughly**: Run comprehensive tests before mainnet
4. **Monitor Gas**: Track gas usage patterns on testnet
5. **Prepare Mainnet**: Plan for mainnet deployment with proper security audits

## Related Documentation

- [NEAR Deployment Guide](./1balancer-near/README.md)
- [Orchestrator Setup](./packages/orchestrator/docs/DEPLOYMENT.md)
- [Architecture Overview](./packages/hardhat/contracts/ethereum-hub/docs/01-architecture-overview.md)
- [Security Guide](./packages/hardhat/contracts/ethereum-hub/docs/07-security-architecture.md)