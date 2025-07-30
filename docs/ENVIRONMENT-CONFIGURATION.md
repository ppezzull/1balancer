# Environment Configuration Guide

## Overview

1Balancer uses a centralized environment configuration system that ensures consistency across all packages while maintaining flexibility for different deployment environments.

## Key Principles

1. **Single Source of Truth**: All environment variables are defined in `.env.example`
2. **No Hardcoded Values**: Scripts read from `.env`, never contain hardcoded secrets
3. **Inheritance Model**: Package-specific env files inherit from the root `.env`
4. **Clear Documentation**: Every variable is documented in `.env.example`

## Configuration Structure

```
1balancer/
├── .env.example         # Template with all variables documented
├── .env                # Your actual configuration (git ignored)
├── packages/
│   ├── nextjs/
│   │   └── .env.local  # Frontend-specific overrides
│   └── hardhat/
│       └── .env        # Smart contract-specific overrides
└── 1balancer-near/
    └── .env            # NEAR-specific overrides
```

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

## Environment Variables

### API Keys & Authentication

```env
# 1inch API - Required for DeFi operations
ONE_INCH_API_KEY=your-key-here

# Social Auth - Required for user login
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-id

# Blockchain Access (Optional for local dev)
ALCHEMY_API_KEY=your-alchemy-key
INFURA_API_KEY=your-infura-key
```

### Network Configuration

```env
# Service Ports
FRONTEND_PORT=3000
HARDHAT_PORT=8545
ORCHESTRATOR_PORT=8080
NEAR_BRIDGE_PORT=8090

# RPC Endpoints
BASE_RPC_URL=https://mainnet.base.org
LOCALHOST_RPC_URL=http://localhost:8545
```

### NEAR Protocol

```env
# NEAR Environment
NEAR_ENV=localnet
NEAR_HTLC_CONTRACT_NAME=fusion-plus-htlc.test.near
NEAR_SOLVER_CONTRACT_NAME=solver-registry.test.near
```

## Security Best Practices

### 1. Never Commit Secrets

- `.env` is gitignored
- Only `.env.example` with placeholder values is committed
- Use secure key management in production

### 2. Validate Before Use

```javascript
// Always validate required env vars
if (!process.env.ONE_INCH_API_KEY) {
  throw new Error('ONE_INCH_API_KEY is required');
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
node -e "console.log(process.env.ONE_INCH_API_KEY ? 'API Key is set' : 'API Key missing')"
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