# Account Management Guide

## Overview

To deploy contracts and execute transactions on blockchain, you need a deployer account. This guide explains how to set up and manage your accounts in 1Balancer.

## Account Commands

### 1. Check Current Account
```bash
make account
```
Shows your current deployer account address and balance (if configured).

### 2. Generate New Account
```bash
make account-generate
```
- Creates a new Ethereum account
- Saves it in `packages/hardhat/.env`
- **IMPORTANT**: Save the private key shown! You'll need it to access funds

Example output:
```
👛 Generating new Burner Wallet...
🔐 Private Key: 0x1234...abcd
📬 Address: 0xAbCd...1234

💾 Account saved to packages/hardhat/.env
```

### 3. Import Existing Account
```bash
make account-import
```
- Import an existing private key
- Useful if you already have a funded account
- Enter your private key when prompted (it won't be shown on screen)

### 4. Reveal Private Key
```bash
make account-reveal-pk
```
- Shows the private key of your current deployer account
- **CAUTION**: Only use in secure environments

## Account Setup Flow

### For Local Development:
1. Start local blockchain: `make chain`
2. Generate account: `make account-generate`
3. Account automatically has 10,000 ETH on localhost
4. Deploy contracts: `make deploy`

### For Testnet:
1. Generate account: `make account-generate`
2. Fund your account with testnet ETH:
   - BASE Sepolia: https://sepolia.basescan.org/faucet
   - Get testnet ETH from faucet
3. Deploy contracts: `make deploy-sepolia`

### For Mainnet:
1. **NEVER** use a generated account for mainnet
2. Import a secure account: `make account-import`
3. Ensure proper security measures

## Important Notes

1. **Private Key Security**:
   - Never share your private key
   - Don't commit `.env` files to git
   - Use different accounts for different networks

2. **Account Storage**:
   - Accounts are stored in `packages/hardhat/.env`
   - Format: `DEPLOYER_PRIVATE_KEY=0x...`

3. **Network-Specific**:
   - Same account works across all EVM networks
   - But balances are separate per network
   - NEAR accounts are managed separately

## Troubleshooting

### "You don't have a deployer account"
Run `make account-generate` or `make account-import`

### "Insufficient funds" 
- For localhost: Restart chain with `make chain`
- For testnet: Get funds from faucet
- For mainnet: Transfer real ETH to account

### Lost private key
- For localhost: Just generate a new one
- For testnet/mainnet: Funds are lost forever!

## Integration with Fusion+ Demo

The fusion+ demo checks for:
1. Active blockchain connection
2. Configured deployer account
3. Deployed contracts
4. Running services

Run `make fusion-plus` to see your current setup status.