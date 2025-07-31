# Ethereum Hub Deployment Guide

## Overview

This guide explains all the deployment commands for the Ethereum Hub infrastructure on BASE testnet.
 The Ethereum Hub implements the Fusion+ cross-chain atomic swap protocol using HTLC (Hashed Timelock Contracts) and custom orchestration.

## Prerequisites

1. **Install Dependencies**
   ```bash
   yarn install
   ```

2. **Environment Setup**
   - Set `DEPLOYER_PRIVATE_KEY` in your `.env` file
   - Ensure you have BASE Sepolia ETH (get from [BASE Sepolia Faucet](https://docs.base.org/docs/tools/network-faucets/))
   - Optionally set `BASESCAN_API_KEY` for contract verification

3. **Compile Contracts**
   ```bash
   yarn compile
   ```

## Deployment Commands

### 1. Deploy Complete Ethereum Hub (Recommended)

```bash
yarn deploy:base-testnet
```

**What it does:**
- Deploys all three contracts in the correct order:
  1. HTLCManager - Atomic swap implementation
  2. OrchestrationCoordinator - Cross-chain coordination
  3. FusionPlusHub - Main integration hub (upgradeable proxy)
- Configures NEAR as a supported chain
- Sets up initial roles and permissions
- Saves deployment artifacts to `deployments/baseSepolia/`

**Network:** BASE Sepolia Testnet (Chain ID: 84532)

### 2. Deploy Individual Contracts

#### Deploy HTLCManager Only
```bash
yarn deploy:htlc
```

**What it does:**
- Deploys the HTLCManager contract
- Sets timeout bounds (30 minutes minimum, 7 days maximum)
- Grants admin roles to deployer

#### Deploy OrchestrationCoordinator Only
```bash
yarn deploy:orchestration
```

**What it does:**
- Deploys the OrchestrationCoordinator
- Links to previously deployed HTLCManager
- Configures NEAR as supported chain with 30-minute confirmation time

**Note:** Requires HTLCManager to be deployed first

#### Deploy FusionPlusHub Only
```bash
yarn deploy:hub
```

**What it does:**
- Deploys FusionPlusHub as upgradeable proxy
- Links to HTLCManager and OrchestrationCoordinator
- Sets protocol fee to 0.3%
- Uses placeholder addresses for 1inch contracts (not yet on BASE)

**Note:** Requires both HTLCManager and OrchestrationCoordinator to be deployed first

### 3. Local Development Deployment

```bash
yarn deploy:local
```

**What it does:**
- Deploys all contracts to local Hardhat network
- Useful for testing without spending testnet ETH
- Automatically mines blocks

**Prerequisites:** Start local node first with `yarn chain`

## Other Deployment-Related Commands

### Account Management

```bash
# List deployer account and balance
yarn account

# Generate new random account
yarn account:generate

# Import existing private key
yarn account:import

# Reveal current private key (BE CAREFUL!)
yarn account:reveal-pk
```

### Chain Management

```bash
# Start local Hardhat node
yarn chain

# Start forked BASE Sepolia for testing
yarn chain:fork
```

### Testing

```bash
# Run all tests including Ethereum Hub tests
yarn test

# Run specific test file
yarn test test/EthereumHub.ts
```

### Contract Verification

```bash
# Verify deployed contracts on Basescan
yarn verify --network baseSepolia
```

### Cleaning

```bash
# Clean all build artifacts
yarn clean
```

## Deployment Workflow

### For BASE Testnet Deployment:

1. **Prepare Environment**
   ```bash
   # Set up your deployer account
   yarn account:import
   # or
   yarn account:generate
   
   # Check your balance
   yarn account
   ```

2. **Compile Contracts**
   ```bash
   yarn compile
   ```

3. **Deploy to BASE Testnet**
   ```bash
   yarn deploy:base-testnet
   ```

4. **Verify Contracts (Optional)**
   ```bash
   yarn verify --network baseSepolia
   ```

### For Local Testing:

1. **Start Local Node**
   ```bash
   # Terminal 1
   yarn chain
   ```

2. **Deploy Locally**
   ```bash
   # Terminal 2
   yarn deploy:local
   ```

## Contract Addresses

After deployment, contract addresses are saved in:
- `deployments/baseSepolia/HTLCManager.json`
- `deployments/baseSepolia/OrchestrationCoordinator.json`
- `deployments/baseSepolia/FusionPlusHub.json`

The frontend automatically reads these addresses.

## Deployment Artifacts

Each deployment creates:
- Contract ABI
- Deployment address
- Transaction hash
- Constructor arguments
- Compiler settings

## Troubleshooting

### Common Issues:

1. **"Insufficient funds" error**
   - Get BASE Sepolia ETH from faucet
   - Check balance: `yarn account`

2. **"Nonce too high" error**
   - Reset account nonce in MetaMask
   - Or use a different account

3. **Compilation errors**
   - Run `yarn clean` then `yarn compile`
   - Check Solidity version (0.8.23)

4. **Verification fails**
   - Ensure BASESCAN_API_KEY is set
   - Wait a few minutes after deployment
   - Try manual verification on Basescan

## Architecture Notes

The deployment creates a three-layer architecture:

1. **Protocol Layer**: HTLCManager handles atomic swaps
2. **Orchestration Layer**: OrchestrationCoordinator manages cross-chain flow
3. **Application Layer**: FusionPlusHub provides the main interface

All contracts include:
- Access control (role-based permissions)
- Pausable functionality for emergencies
- Reentrancy protection
- Comprehensive event logging

## Next Steps

After deployment:
1. Grant necessary roles to operators/resolvers
2. Configure additional supported chains
3. Set up monitoring for events
4. Test cross-chain swap flow
5. Integrate with frontend

## Security Reminders

- Never commit private keys
- Use separate accounts for testnet/mainnet
- Always test on testnet first
- Monitor contract events
- Have pause mechanisms ready