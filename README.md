# 1Balancer - Cross-Chain Portfolio Management

<h4 align="center">
  <a href="https://docs.1inch.io">1inch Docs</a> |
  <a href="docs/ARCHITECTURE.md">Architecture</a> |
  <a href="docs/DEVELOPMENT.md">Development Guide</a>
</h4>

🔄 **1Balancer** is a cross-chain DeFi portfolio management system built for the 1inch Fusion+ hackathon. It enables automated portfolio rebalancing across EVM chains (via BASE) and NEAR Protocol using atomic swaps powered by 1inch's Fusion+ technology.

## 🏗️ Project Structure

This monorepo contains the complete 1Balancer implementation:

```
1balancer/
├── packages/
│   ├── hardhat/         # Smart contracts (Ethereum Hub on BASE)
│   │   ├── contracts/
│   │   │   ├── ethereum-hub/    # Fusion+ cross-chain implementation
│   │   │   ├── portfolio/       # Portfolio management modules
│   │   │   └── foundation/      # 1inch protocol integrations
│   │   └── docs/        # Hardhat-specific documentation
│   └── nextjs/          # Frontend application
│       └── app/api/1inch/       # 1inch API proxy
├── docs/                # Project documentation
└── rules/              # Development guidelines
```

## 🎯 Key Features

- **🔀 Cross-Chain Atomic Swaps**: Secure swaps between BASE and NEAR using HTLCs
- **⚖️ Automated Rebalancing**: Multiple strategies (BaseBalancer, DriftBalancer, TimeBalancer)
- **🔑 Social Login**: Privy integration for seamless onboarding
- **🏛️ Three-Layer Architecture**: Clean separation of protocol, orchestration, and application layers
- **🚀 1inch Foundation**: Built on battle-tested 1inch protocols

## 📚 Documentation

### Core Documentation
- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design and components
- **[Development Guide](docs/DEVELOPMENT.md)** - Setup and development workflow
- **[Bootstrap Infrastructure](docs/BOOTSTRAP-INFRASTRUCTURE.md)** - One-command setup guide
- **[Infrastructure Overview](docs/INFRASTRUCTURE.md)** - Complete infrastructure documentation
- **[Proxy Deployment](docs/PROXY-DEPLOYMENT.md)** - Automated 1inch API proxy setup
- **[Environment Configuration](docs/ENVIRONMENT-CONFIGURATION.md)** - Centralized env management
- **[Scaffold-ETH Template](docs/SCAFFOLD-ETH-TEMPLATE.md)** - Original template documentation

### Package-Specific Documentation
- **[Hardhat Configuration](packages/hardhat/docs/CONFIGURATION.md)** - Smart contract development setup
- **[Contract Architecture](packages/hardhat/contracts/README.md)** - Contract structure overview
  - [Ethereum Hub](packages/hardhat/contracts/ethereum-hub/README.md)
  - [Portfolio Management](packages/hardhat/contracts/portfolio/README.md)
  - [1inch Foundation](packages/hardhat/contracts/foundation/README.md)

### Testing Documentation
- **[Testing Strategy](TESTING-STRATEGY.md)** - Comprehensive testing approach
- **[Fork Testing Guide](FORK-TESTING-GUIDE.md)** - Testing with mainnet forks

### Related Repositories
- **[1balancer-near](https://github.com/your-org/1balancer-near)** - NEAR Protocol implementation
- **[1balancer-docs](https://github.com/your-org/1balancer-docs)** - Extended documentation and analysis

## 🚀 Quick Start

### Prerequisites
- Node.js >= v20.18.3
- Yarn >= 3.2.3
- Git
- Curl (usually pre-installed)

### One-Command Setup

```bash
# Clone with NEAR submodule
git clone --recurse-submodules https://github.com/your-org/1balancer
cd 1balancer

# Bootstrap everything with one command
yarn bootstrap
```

That's it! The bootstrap command will:
- ✅ Check system dependencies
- ✅ Initialize 1balancer-near submodule
- ✅ Install all dependencies
- ✅ Setup Rust 1.86.0 for NEAR
- ✅ Deploy official 1inch proxy to Vercel automatically
- ✅ Create environment files
- ✅ Start all services

### What's Running

After bootstrap, you'll have:
- **Frontend**: http://localhost:3000
- **Hardhat Node**: http://localhost:8545
- **NEAR Bridge**: http://localhost:8090
- **Status Check**: `yarn status`

### Daily Commands

```bash
yarn d        # Start everything (short for dev:all)
yarn st       # Check status
yarn s        # Stop everything
```

For detailed setup instructions, see [Bootstrap Infrastructure](docs/BOOTSTRAP-INFRASTRUCTURE.md).

## ⚙️ Configuration

### Required API Keys

1. **1inch API Key** (for hackathon):
   - Obtain through ETHGlobal process
   - Required for Fusion+ integration
   - Add to `packages/nextjs/.env.local`

2. **Alchemy API Key** (optional for localhost):
   - Get from [alchemy.com](https://www.alchemy.com/)
   - Required for mainnet/testnet deployment
   - Add to both `.env` files

3. **Privy Project ID**:
   - Create account at [console.privy.io](https://console.privy.io)
   - Enable Ethereum wallets in dashboard
   - Add to `packages/nextjs/.env.local`

See [Hardhat Configuration](packages/hardhat/docs/CONFIGURATION.md) for detailed setup.

## 🚀 Deployment

### NEAR Contract Deployment

The NEAR contracts enable cross-chain atomic swaps with BASE. Deploy to testnet:

```bash
# From 1balancer-near directory
cd 1balancer-near

# IMPORTANT: Always build before deploying to ensure optimized WASM
make build

# Initial deployment (creates new contract account)
make deploy-testnet

# Redeployment (updates existing contract code, preserves state)
make redeploy-testnet
```

**Manual redeployment command:**
```bash
# The exact command used for redeployment
near deploy fusion-htlc.rog_eth.testnet target/wasm32-unknown-unknown/release/fusion_plus_htlc.wasm --networkId testnet
```

**Requirements:**
- NEAR CLI installed: `npm install -g near-cli`
- NEAR testnet account with sufficient balance (3+ NEAR)
- Environment variable: `NEAR_MASTER_ACCOUNT=your-account.testnet`

**Contract Explorer:**
- View deployed contract: `https://testnet.nearblocks.io/address/fusion-htlc.rog_eth.testnet`

### BASE Contract Deployment

BASE contracts are deployed via Hardhat (see Hardhat documentation for deployment commands).

## 🏗️ Architecture

1Balancer implements a three-layer architecture:

```
┌──────────────────────────────────────────────────────────┐
│         APPLICATION LAYER - Portfolio Management         │
│     Automated rebalancing with cross-chain support      │
├──────────────────────────────────────────────────────────┤
│      ORCHESTRATION LAYER - Custom Coordination          │
│   Simulated resolver behavior (No KYC requirements)     │
├──────────────────────────────────────────────────────────┤
│        PROTOCOL LAYER - 1inch Foundation                │
│    Limit Orders + Fusion + Cross-Chain Contracts        │
└──────────────────────────────────────────────────────────┘
```

## 🔧 Development

### Smart Contracts
- Edit contracts in `packages/hardhat/contracts/`
- Run tests: `yarn hardhat:test`
- Deploy: `yarn deploy`

### Frontend
- Edit pages in `packages/nextjs/app/`
- Components in `packages/nextjs/components/`
- 1inch API proxy in `packages/nextjs/app/api/1inch/`

### Key Commands

#### Quick Start & Management
```bash
yarn bootstrap      # Complete setup from scratch
yarn dev:all        # Start all services (or yarn d)
yarn stop           # Stop all services (or yarn s)
yarn status         # Check service health (or yarn st)
```

#### Individual Services
```bash
yarn chain          # Start local blockchain
yarn deploy         # Deploy contracts to local
yarn start          # Start frontend only
yarn backend        # Start backend only
```

#### Fork Testing
```bash
yarn fork:base      # Fork Base mainnet
yarn fork:sepolia   # Fork Sepolia testnet
yarn fork:mainnet   # Fork Ethereum mainnet
yarn test:fork      # Run tests on fork
```

#### Cross-Chain Operations
```bash
yarn deploy:all     # Deploy to both EVM and NEAR
yarn test:all       # Run all tests
yarn near:dev       # Start NEAR services
yarn near:deploy    # Deploy NEAR contracts
```

#### Maintenance
```bash
yarn check:deps     # Check system dependencies
yarn create:envs    # Create environment files
yarn clean:all      # Clean everything
yarn reset          # Clean and reinstall
```

See all commands: `yarn run`

## 🔒 Security

- Private keys are encrypted (never plain text)
- Environment variables for sensitive data
- Comprehensive `.gitignore` for security
- Atomic swaps with timeout protection

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📜 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Built with [Scaffold-ETH 2](https://scaffoldeth.io)
- Powered by [1inch Protocols](https://1inch.io)
- Social login by [Privy](https://privy.io)
- Hackathon: [1inch Fusion+ Challenge](https://ethglobal.com)

 