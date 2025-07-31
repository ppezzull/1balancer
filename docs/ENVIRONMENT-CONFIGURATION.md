# Environment Configuration System

## Overview

1balancer uses an **automatic environment variable inheritance system** that allows all packages to share configuration from a single root `.env` file. This eliminates the need for manual copying and ensures consistency across the monorepo.

## Key Features

1. **Automatic Inheritance**: Packages automatically load variables from root `.env`
2. **No Manual Copying**: Variables are read directly at runtime
3. **Single Source of Truth**: Root `.env` contains all configuration
4. **Local Overrides**: Each package can override specific values when needed
5. **Zero Configuration**: Works automatically with `yarn start`, `yarn chain`, etc.

## How Automatic Inheritance Works

### Configuration Structure

```
1balancer/
├── .env.example         # Template with all variables documented
├── .env                # Your actual configuration (git ignored)
├── packages/
│   ├── nextjs/
│   │   ├── env.config.js    # Automatic loader (NEW)
│   │   ├── next.config.ts   # Imports env.config.js
│   │   └── .env.local       # Local overrides only
│   └── hardhat/
│       ├── env.config.js    # Automatic loader (NEW)
│       ├── hardhat.config.ts # Imports env.config.js
│       └── .env             # Local overrides only
└── 1balancer-near/
    └── .env                 # NEAR-specific overrides
```

### The Magic: env.config.js

Each package has an `env.config.js` file that automatically loads the root `.env`:

```javascript
// packages/nextjs/env.config.js
const path = require('path');
const dotenv = require('dotenv');

// Load root .env first
const rootEnvPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: rootEnvPath });

// Then load local overrides
const localEnvPath = path.resolve(__dirname, '.env.local');
dotenv.config({ path: localEnvPath });
```

### Automatic Triggering

- **Next.js**: When you run `yarn start`, `next.config.ts` imports `env.config.js`
- **Hardhat**: When you run `yarn chain` or `yarn deploy`, `hardhat.config.ts` imports `env.config.js`
- **No manual steps required!**

## Setup Process

### 1. Initial Setup

```bash
# Automatic setup during bootstrap
yarn bootstrap

# Or manual setup
yarn create:envs
```

### 2. What Happens

1. Copies `.env.example` to `.env` (if it doesn't exist)
2. Prompts you to update `.env` with your actual values
3. Creates package-specific `.env` files that inherit from root
4. Validates required keys and provides guidance

### 3. Manual Configuration

```bash
# Copy the template
cp .env.example .env

# Edit with your values
nano .env

# Regenerate package configs
yarn create:envs
```

## Environment Variables by Package

### Variables Required by Next.js

These variables are used by the frontend application:

```env
# Authentication & APIs
NEXT_PUBLIC_PRIVY_APP_ID=            # Privy authentication (required)
NEXT_PUBLIC_ALCHEMY_API_KEY=         # Alchemy RPC access
ONEINCH_API_KEY=                     # 1inch API for swaps

# URLs & Endpoints
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_ORCHESTRATOR_URL=http://localhost:8080
NEXT_PUBLIC_NEAR_BRIDGE_URL=http://localhost:8090
NEXT_PUBLIC_PROXY_URL=               # Your 1inch proxy URL
NEXT_PUBLIC_ONE_INCH_API_URL=        # Your 1inch API proxy

# Configuration
CHAIN_ID=8453                        # Base mainnet
NEXT_PUBLIC_ENABLE_TESTNETS=true
NEXT_PUBLIC_ENABLE_BURNER_WALLET=true
```

### Variables Required by Hardhat

These variables are used for smart contract development:

```env
# API Keys
ALCHEMY_API_KEY=                     # For contract deployment
ETHERSCAN_V2_API_KEY=               # For contract verification
BASESCAN_API_KEY=                   # Base network verification

# Deployment
DEPLOYER_PRIVATE_KEY=               # Dev only - use test key
DEPLOYER_PRIVATE_KEY_ENCRYPTED=     # Production - encrypted key

# RPC URLs
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
LOCALHOST_RPC_URL=http://localhost:8545

# Configuration
REPORT_GAS=true
HARDHAT_PORT=8545
```

### Shared Variables

These are used by multiple packages:

```env
# 1inch Integration
ONEINCH_API_KEY=                    # Used by both frontend and contracts

# Alchemy
ALCHEMY_API_KEY=                    # Base key
NEXT_PUBLIC_ALCHEMY_API_KEY=        # Same value, frontend access

# Chain Configuration
CHAIN_ID=8453                       # Default to Base mainnet
```

### NEAR Protocol Variables

```env
# NEAR Environment
NEAR_ENV=localnet
NEAR_NETWORK_ID=localnet

# Contract Names
NEAR_HTLC_CONTRACT_NAME=fusion-plus-htlc.test.near
NEAR_SOLVER_CONTRACT_NAME=solver-registry.test.near
NEAR_MASTER_ACCOUNT_ID=test.near

# Service Ports
NEAR_BRIDGE_PORT=8090
SOLVER_PORT=8091
NEAR_LOCAL_PORT=3030
```

## Security Best Practices

### 1. Never Commit Secrets

- `.env` is gitignored
- Only `.env.example` with placeholder values is committed
- Use secure key management in production

### 2. Validate Before Use

```javascript
// Always validate required env vars
if (!process.env.ONEINCH_API_KEY) {
  throw new Error('ONEINCH_API_KEY is required');
}
```

### 3. Use Different Values Per Environment

```bash
# Development
.env.development

# Production
.env.production  # Use secure secrets management

# Testing
.env.test
```

## Package-Specific Overrides

While packages inherit from the root `.env`, you can override specific values:

### Next.js Frontend

```bash
# packages/nextjs/.env.local
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001  # Override port
```

### Hardhat

```bash
# packages/hardhat/.env
HARDHAT_PORT=8546  # Use different port
```

## Troubleshooting

### Missing Environment Variables

```bash
# Check what's missing
yarn create:envs

# Shows which required keys need values
```

### Regenerate Package Configs

```bash
# After updating root .env
yarn create:envs

# Forces recreation of all package .env files
```

### View Current Configuration

```bash
# Check loaded env vars (be careful not to expose secrets)
node -e "console.log(process.env.ONEINCH_API_KEY ? 'API Key is set' : 'API Key missing')"
```

## Production Deployment

For production, use proper secrets management:

1. **Vercel**: Environment variables in dashboard
2. **AWS**: Parameter Store or Secrets Manager
3. **Docker**: Docker secrets or encrypted env files
4. **Kubernetes**: ConfigMaps and Secrets

Never store production secrets in files or version control.

## Adding New Variables

1. Add to `.env.example` with documentation
2. Update `create-env-files.js` if needed for package inheritance
3. Document in this guide
4. Update validation in application code

## Environment Variable Reference

See `.env.example` for complete documentation of all available variables and their purposes.