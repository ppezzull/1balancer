# 🚀 1Balancer Deployment Summary

## Quick Deployment Commands

### 1. Setup Environment
```bash
# Generate deployer account (if needed)
make account-generate

# Check your account
make account

# Fund your account
make account-fund
# Get BASE Sepolia ETH from: https://www.alchemy.com/faucets/base-sepolia
```

### 2. Deploy to BASE Sepolia
```bash
# Option A: Deploy all at once (recommended)
make deploy-base-all

# Option B: Deploy individually
make deploy-base-hub     # FusionPlusHub
make deploy-base-escrow  # EscrowFactory

# Option C: Standard deployment
make deploy-base
```

### 3. Deploy to NEAR Testnet
```bash
# Build and deploy NEAR contracts
make near-build
make near-deploy
```

### 4. Start Services
```bash
# Start orchestrator
make orchestrator-dev

# Check status
make fusion-plus-status
```

### 5. Test Everything
```bash
# Run integration tests
make fusion-plus-test

# Run local demo
make fusion-plus-local
```

## Gas Costs

**BASE Sepolia Deployment:**
- FusionPlusHub: ~3M gas (~0.0003 ETH)
- EscrowFactory: ~5M gas (~0.0005 ETH)
- **Total: ~0.0008 ETH**

## Deployed Contracts

After deployment, find your contracts at:
- **BASE Contracts**: `packages/hardhat/deployments/baseSepolia/`
- **NEAR Contracts**: `1balancer-near/.near-credentials/testnet/deploy.json`

## Key Features Implemented

✅ **Enhanced FusionPlusHub V2**
- Better order tracking with status management
- Improved 1inch protocol integration readiness
- Gas-optimized deployment settings
- Comprehensive event emissions

✅ **Secure EscrowFactory**
- HTLC implementation with SHA-256
- Timeout coordination for atomic swaps
- Role-based access control
- Emergency pause functionality

✅ **Easy Deployment UX**
- One-command deployment: `make deploy-base-all`
- Gas estimation: `make base-gas-estimate`
- Status checking: `make fusion-plus-status`
- Integrated with NEAR workflow

## Next Steps

1. **Update 1inch Addresses** when they deploy to BASE
2. **Test Cross-Chain Swaps** with `make fusion-plus-test`
3. **Monitor Gas Usage** on testnet before mainnet
4. **Security Audit** before production deployment

## Documentation

- [Detailed BASE Deployment Guide](./BASE-DEPLOYMENT-GUIDE.md)
- [Architecture Documentation](./packages/hardhat/contracts/ethereum-hub/docs/)
- [NEAR Integration Guide](./1balancer-near/README.md)
- [Orchestrator Documentation](./packages/orchestrator/docs/)