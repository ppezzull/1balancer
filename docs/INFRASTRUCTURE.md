# 1Balancer Infrastructure Documentation

## Overview

This document provides a comprehensive overview of 1Balancer's infrastructure, including proxy deployment, environment configuration, and service orchestration.

## Table of Contents

1. [Proxy Server Architecture](#proxy-server-architecture)
2. [Bootstrap Infrastructure](#bootstrap-infrastructure)
3. [Environment Configuration](#environment-configuration)
4. [Service Management](#service-management)
5. [Troubleshooting](#troubleshooting)

## Proxy Server Architecture

The 1inch API proxy is a critical component that handles CORS issues for browser-based requests.

### Key Features

- **Automated Deployment**: Deploy to Vercel with a single command
- **Zero Configuration**: Works out of the box with bundled templates
- **Secure**: API keys stored server-side only
- **Global CDN**: Vercel's edge network ensures low latency

### Quick Setup

```bash
yarn setup:proxy
```

This command:
1. Generates a complete proxy project
2. Deploys to Vercel automatically
3. Updates environment files with the proxy URL
4. Tests the deployment

For detailed proxy documentation, see [PROXY-DEPLOYMENT.md](./PROXY-DEPLOYMENT.md).

## Bootstrap Infrastructure

The bootstrap system provides one-command setup for the entire 1Balancer ecosystem.

### Complete Setup

```bash
yarn bootstrap
```

This single command:
1. Checks system dependencies
2. Initializes the NEAR submodule
3. Installs all dependencies
4. Sets up Rust for NEAR contracts
5. Deploys the 1inch proxy
6. Creates environment files
7. Starts all services

### Service Architecture

```
1balancer/
├── packages/nextjs/     # Frontend (port 3000)
├── packages/hardhat/    # EVM contracts (port 8545)
├── 1balancer-near/      # NEAR submodule (port 8090)
└── scripts/             # Infrastructure automation
```

For detailed bootstrap documentation, see [BOOTSTRAP-INFRASTRUCTURE.md](./BOOTSTRAP-INFRASTRUCTURE.md).

## Environment Configuration

### Centralized Configuration

All environment variables are managed through a single `.env` file in the project root:

1. Copy `.env.example` to `.env`
2. Fill in your values
3. Run `yarn create:envs` to propagate to packages

### Key Variables

- **API Keys**: `ONEINCH_API_KEY`, `ALCHEMY_API_KEY`
- **Authentication**: `NEXT_PUBLIC_PRIVY_APP_ID`
- **Proxy**: `NEXT_PUBLIC_PROXY_URL`
- **Networks**: RPC URLs and chain IDs

For detailed configuration, see [ENVIRONMENT-CONFIGURATION.md](./ENVIRONMENT-CONFIGURATION.md).

## Service Management

### Essential Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| `yarn bootstrap` | Complete setup | `yarn b` |
| `yarn dev:all` | Start all services | `yarn d` |
| `yarn stop` | Stop all services | `yarn s` |
| `yarn status` | Check service health | `yarn st` |

### Individual Services

```bash
yarn chain       # Hardhat blockchain
yarn start       # Frontend
yarn backend     # Backend API
yarn near:dev    # NEAR services
```

### Service URLs

- **Frontend**: http://localhost:3000
- **Hardhat RPC**: http://localhost:8545
- **NEAR Bridge**: http://localhost:8090
- **1inch Proxy**: Your Vercel deployment URL

## Troubleshooting

### Common Issues

#### Proxy Deployment Fails

```bash
# Check Vercel CLI
vercel --version

# Login to Vercel
vercel login

# Manual deployment
yarn proxy:deploy
```

#### Port Conflicts

```bash
# Stop all services
yarn stop

# Check specific port
lsof -ti:3000 | xargs kill
```

#### Missing Dependencies

```bash
# Check dependencies
yarn check:deps

# Clean install
yarn reset
```

### Getting Help

1. Check service status: `yarn status`
2. View logs: `yarn logs`
3. See documentation in `docs/` directory
4. Check GitHub issues

## Next Steps

1. Complete environment setup in `.env`
2. Deploy the proxy: `yarn setup:proxy`
3. Start development: `yarn dev:all`
4. Read architecture docs in `docs/ARCHITECTURE.md`

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Development Guide](./DEVELOPMENT.md)
- [Proxy Deployment](./PROXY-DEPLOYMENT.md)
- [Bootstrap Infrastructure](./BOOTSTRAP-INFRASTRUCTURE.md)
- [Environment Configuration](./ENVIRONMENT-CONFIGURATION.md)