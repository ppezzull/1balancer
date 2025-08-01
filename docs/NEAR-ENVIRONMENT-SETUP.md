# NEAR Environment Setup Guide

## Overview

The 1Balancer NEAR integration uses environment variables configured in the **root `.env` file**. These variables are automatically passed to all submodules including the orchestrator service.

## How It Works

```
1balancer/
├── .env                    # ← All NEAR variables go here
├── packages/
│   └── orchestrator/       # ← Reads NEAR config from root .env
└── 1balancer-near/         # ← Also inherits from root .env
```

## Environment Variables

### For Local Development (Default Values Work!)

No configuration needed! The defaults are set up for testnet:

```bash
# These are already set in .env with working defaults:
NEAR_NETWORK_ID=testnet              # Uses NEAR testnet
NEAR_HTLC_CONTRACT=fusion-htlc.testnet  # Pre-deployed contract
```

### For Testnet Deployment (Optional)

If you want to deploy your own contracts or act as a resolver:

```bash
# In root .env file, uncomment and set:
NEAR_MASTER_ACCOUNT=myaccount.testnet    # Your NEAR testnet account
NEAR_PRIVATE_KEY=ed25519:xxxxx...        # Your private key
```

To get these values:
1. Create a NEAR testnet account at https://testnet.mynearwallet.com/
2. Find your private key in `~/.near-credentials/testnet/myaccount.testnet.json`

### For Mainnet Deployment

```bash
# In root .env file:
NEAR_NETWORK_ID=mainnet
NEAR_HTLC_CONTRACT=fusion-htlc.near      # Mainnet contract address
NEAR_MASTER_ACCOUNT=myaccount.near       # Your mainnet account
NEAR_PRIVATE_KEY=ed25519:xxxxx...        # Your mainnet private key
```

## Common Questions

### Q: Where do I set these variables?
**A:** Always in the root `.env` file at `/1balancer/.env`

### Q: Do I need a NEAR account for local development?
**A:** No! The default configuration works without any NEAR account.

### Q: What is the HTLC contract?
**A:** It's a pre-deployed smart contract on NEAR that handles atomic swaps. You don't need to deploy it yourself.

### Q: When do I need NEAR_MASTER_ACCOUNT?
**A:** Only if you want to:
- Deploy your own smart contracts
- Act as a resolver/solver in the system
- Interact with NEAR blockchain directly

### Q: How do the values flow to submodules?
**A:** The orchestrator and other services read directly from the root `.env` file. There's no need to duplicate these values.

## Quick Start Examples

### 1. Basic Local Development (No Config Needed)
```bash
# Just run - uses testnet defaults
make deploy-local
```

### 2. Testnet with Your Account
```bash
# Edit .env and add:
NEAR_MASTER_ACCOUNT=yourname.testnet
NEAR_PRIVATE_KEY=ed25519:your-key-here

# Then run
make deploy-local
```

### 3. Custom Local NEAR Node
```bash
# Edit .env:
NEAR_NETWORK_ID=localnet
NEAR_RPC_URL=http://localhost:3030

# Then run
make deploy-local
```

## Troubleshooting

### "NEAR account does not exist"
- Make sure your account name matches the network (e.g., `.testnet` for testnet)
- Verify the account exists at https://testnet.mynearwallet.com/

### "Invalid private key"
- Check the format: must start with `ed25519:`
- Don't include quotes around the key
- Make sure it matches your account

### "Cannot connect to NEAR"
- For testnet: Check internet connection
- For localnet: Make sure NEAR node is running locally
- Try the backup RPC: `NEAR_RPC_URL=https://test.rpc.fastnear.com`