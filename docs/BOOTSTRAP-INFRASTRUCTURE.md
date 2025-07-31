# 1Balancer Bootstrap Infrastructure

## Overview

The 1Balancer ecosystem uses a unified yarn script system that manages the entire multi-chain application with a single command.
 This infrastructure handles EVM (BASE chain) and NEAR Protocol components seamlessly.

## Quick Start

```bash
# Clone with submodule
git clone --recurse-submodules https://github.com/your-org/1balancer.git
cd 1balancer

# One command to rule them all
yarn bootstrap
```

That's it! The bootstrap command will:
1. Check system dependencies
2. Initialize the 1balancer-near submodule
3. Install all dependencies (main app + NEAR)
4. Setup Rust 1.86.0 for NEAR contracts
5. Deploy 1inch proxy to Vercel automatically
6. Create all environment files
7. Start all services

## Architecture

```
1balancer/                    # Main application repository
├── packages/                 # Scaffold-ETH packages
│   ├── nextjs/              # Frontend (port 3000)
│   └── hardhat/             # Smart contracts (port 8545)
├── scripts/                 # Infrastructure scripts
│   ├── check-dependencies.js
│   ├── setup-rust.js
│   ├── create-env-files.js
│   ├── check-status.js
│   ├── setup-proxy.js
│   └── show-logs.js
├── 1balancer-near/          # NEAR submodule (port 8090)
└── package.json             # Unified orchestration
```

## Available Commands

### Essential Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| `yarn bootstrap` | Complete setup from scratch | `yarn b` |
| `yarn dev:all` | Start all services | `yarn d` |
| `yarn stop` | Stop all services | `yarn s` |
| `yarn status` | Check service health | `yarn st` |

### Quick Start Scripts

```bash
# Bootstrap - Complete setup
yarn bootstrap

# Install all dependencies
yarn install:all

# Start everything
yarn dev:all

# Stop everything
yarn stop

# Check status
yarn status
```

### Submodule Management

```bash
# Initialize submodule
yarn submodule:init

# Update to latest
yarn submodule:update

# NEAR-specific commands
yarn near:dev    # Start NEAR services
yarn near:build  # Build NEAR contracts
yarn near:test   # Test NEAR contracts
yarn near:deploy # Deploy to NEAR local
```

### Setup Scripts

```bash
# Check system dependencies
yarn check:deps

# Setup Rust for NEAR
yarn setup:rust

# Configure 1inch proxy
yarn setup:proxy

# Create environment files
yarn create:envs
```

### Deployment & Testing

```bash
# Deploy to both chains
yarn deploy:all

# Run all tests
yarn test:all

# Clean everything
yarn clean:all

# Reset and reinstall
yarn reset

# View logs
yarn logs
```

## Environment Configuration

The project uses a centralized environment configuration approach:

1. **Main Configuration**: All environment variables are defined in `.env.example`
2. **User Configuration**: Copy `.env.example` to `.env` and fill in your values
3. **Package Inheritance**: Package-specific `.env` files inherit from the main `.env`

### Setup Process

```bash
# The bootstrap command handles this automatically
yarn create:envs
```

This will:
1. Copy `.env.example` to `.env` (if it doesn't exist)
2. Create package-specific `.env` files that inherit values from the main `.env`
3. Check for missing required values and provide guidance

### Configuration Structure

```
1balancer/
├── .env.example    # Template with all available variables
├── .env           # Your actual configuration (git ignored)
├── packages/
│   ├── nextjs/.env.local    # Inherits from root .env
│   └── hardhat/.env         # Inherits from root .env
└── 1balancer-near/.env      # Inherits from root .env
```

### Key Environment Variables

- **API Keys**: `ONEINCH_API_KEY`, `NEXT_PUBLIC_PRIVY_APP_ID`
- **Network Configuration**: RPC URLs, Chain IDs
- **Service Ports**: Frontend (3000), Hardhat (8545), NEAR Bridge (8090)
- **Deployment Keys**: Only for development, production uses secure key management

See `.env.example` for complete documentation of all variables.

## Service URLs

After bootstrap, services are available at:

- **Frontend**: http://localhost:3000
- **Hardhat RPC**: http://localhost:8545
- **NEAR Bridge**: http://localhost:8090
- **1inch Proxy**: Your Vercel URL

## 1inch Proxy Setup

The proxy handles CORS for 1inch API calls and is deployed automatically:

### Automated Deployment (Included in Bootstrap)

The proxy deployment is **automatically included** when you run:

```bash
yarn bootstrap
```

Or you can deploy it separately:

```bash
yarn setup:proxy
```

Both commands will:
1. Check/install Vercel CLI
2. Generate the exact official 1inch proxy project
3. Deploy to Vercel automatically with your API key
4. Update environment files with the deployed proxy URL
5. Test the deployment for compatibility

**Prerequisites**: Make sure you have `ONEINCH_API_KEY` set in your root `.env` file before running bootstrap.

### Manual Deployment

If you prefer manual setup:
1. Clone proxy repo: `git clone https://github.com/Tanz0rz/1inch-vercel-proxy`
2. Deploy to Vercel: `vercel`
3. Add API key in Vercel dashboard
4. Update NEXT_PUBLIC_PROXY_URL in .env.local

See [PROXY-DEPLOYMENT.md](./PROXY-DEPLOYMENT.md) for detailed instructions.

## Troubleshooting

### Port Already in Use
```bash
yarn stop  # Stops all services
# Or manually:
lsof -ti:3000 | xargs kill
```

### NEAR Setup Issues
```bash
# Ensure correct Rust version
rustup default 1.86.0
```

### Missing Dependencies
```bash
yarn reset  # Clean install everything
```

### Can't Connect to Services
```bash
yarn status  # Check what's running
yarn logs    # View service logs
```

## Development Workflow

1. **Daily Development**
   ```bash
   yarn d       # Start everything
   yarn st      # Check status
   yarn s       # Stop when done
   ```

2. **Making Changes**
   - Frontend changes: Hot reload at http://localhost:3000
   - Contract changes: Redeploy with `yarn deploy`
   - NEAR changes: Work in 1balancer-near submodule

3. **Testing**
   ```bash
   yarn test:all    # Run all tests
   yarn near:test   # NEAR tests only
   ```

## Advanced Usage

### Custom Service Management
```bash
# Start individual services
yarn chain       # Just Hardhat
yarn start       # Just frontend
yarn backend     # Just backend
yarn near:dev    # Just NEAR
```

### Submodule Workflow
```bash
# Update NEAR to latest
yarn submodule:update

# Work on NEAR locally
cd 1balancer-near
git checkout -b feature/my-feature
# Make changes
cd ..
git add 1balancer-near
git commit -m "Update NEAR submodule"
```

## Notes

- **Rust Version**: NEAR requires exactly Rust 1.86.0
- **Node Version**: Requires Node.js >= 20.18.3
- **Yarn Version**: Uses Yarn 3.2.3 (managed by packageManager)
- **Submodule**: Always commit submodule pointer changes

## Support

For issues:
1. Run `yarn status` to check services
2. Check logs with `yarn logs`
3. Ensure all dependencies with `yarn check:deps`
4. Reset if needed with `yarn reset`