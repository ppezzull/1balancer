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
- **[Scaffold-ETH Template](docs/SCAFFOLD-ETH-TEMPLATE.md)** - Original template documentation

### Package-Specific Documentation
- **[Hardhat Configuration](packages/hardhat/docs/CONFIGURATION.md)** - Smart contract development setup
- **[Contract Architecture](packages/hardhat/contracts/README.md)** - Contract structure overview
  - [Ethereum Hub](packages/hardhat/contracts/ethereum-hub/README.md)
  - [Portfolio Management](packages/hardhat/contracts/portfolio/README.md)
  - [1inch Foundation](packages/hardhat/contracts/foundation/README.md)

### Related Repositories
- **[1balancer-near](https://github.com/your-org/1balancer-near)** - NEAR Protocol implementation
- **[1balancer-docs](https://github.com/your-org/1balancer-docs)** - Extended documentation and analysis

## 🚀 Quick Start

### Prerequisites
- Node.js >= v20.18.3
- Yarn (v1 or v2+)
- Git

### Installation

1. Clone and install dependencies:
```bash
git clone https://github.com/your-org/1balancer
cd 1balancer
yarn install
```

2. Set up environment variables:
```bash
cd packages/nextjs
cp .env.example .env.local
# Add your API keys (see Configuration section)

cd ../hardhat
cp .env.example .env
# Add your deployment keys
```

3. Start development:
```bash
# Terminal 1: Start local blockchain
yarn chain

# Terminal 2: Deploy contracts
yarn deploy

# Terminal 3: Start frontend
yarn start
```

Visit `http://localhost:3000` to see your app.

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
```bash
yarn chain          # Start local blockchain
yarn deploy         # Deploy contracts
yarn start          # Start frontend
yarn hardhat:test   # Run contract tests
yarn generate       # Generate new deployer account
```

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

