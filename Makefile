# 1Balancer - Cross-Chain Atomic Swap Protocol
# ============================================
# This Makefile provides a clean interface to the project's functionality.
# Type 'make' or 'make help' to get started.

.PHONY: help help-dev help-all all setup run stop test clean dev build deploy status logs

# Check if dependencies are installed
.yarn-installed:
	@if [ ! -f .yarn-installed ]; then \
		echo "📦 Installing dependencies (one-time setup)..."; \
		yarn install > /dev/null 2>&1 && \
		yarn install:all > /dev/null 2>&1 && \
		touch .yarn-installed && \
		echo "✅ Dependencies installed"; \
	fi

# Default target - shows essential commands only
help:
	@echo ""
	@echo "  🚀 1BALANCER - Cross-Chain Atomic Swap Protocol"
	@echo "  =============================================="
	@echo ""
	@echo "  🎯 NEW TO 1BALANCER? Start here:"
	@echo "    make guide           - Interactive setup guide (RECOMMENDED)"
	@echo "    make quickstart      - Fastest path to running demo"
	@echo ""
	@echo "  QUICK START:"
	@echo "    make setup           - First-time setup (installs everything)"
	@echo "    make run             - Start all services"
	@echo "    make stop            - Stop all services"
	@echo "    make status          - Check service health"
	@echo "    make logs            - View all logs"
	@echo ""
	@echo "  DEVELOPMENT:"
	@echo "    make dev             - Development mode (hot reload)"
	@echo "    make test            - Run all tests"
	@echo "    make test-unit       - Unit tests only"
	@echo "    make test-integration - Integration tests"
	@echo "    make build           - Build for production"
	@echo "    make clean           - Clean all artifacts"
	@echo ""
	@echo "  SERVICES:"
	@echo "    make chain           - Start local blockchain"
	@echo "    make frontend        - Start frontend only"
	@echo "    make backend         - Start orchestrator only"
	@echo "    make proxy           - Start 1inch proxy only"
	@echo ""
	@echo "  DEPLOYMENT:"
	@echo "    make deploy          - Deploy to localhost"
	@echo "    make deploy-fork     - Deploy to forked mainnet"
	@echo "    make deploy-sepolia  - Deploy to Sepolia testnet"
	@echo "    make deploy-base     - Deploy to Base network"
	@echo ""
	@echo "  NEAR PROTOCOL:"
	@echo "    make near-build      - Build NEAR contracts"
	@echo "    make near-test       - Test NEAR contracts"
	@echo "    make near-deploy     - Deploy to NEAR testnet"
	@echo "    make near-status     - Check deployment status"
	@echo "    make near-delete     - Show how to delete contracts"
	@echo ""
	@echo "  🏆 FUSION+ DEMO (HACKATHON):"
	@echo "    make fusion-plus         - Run complete Fusion+ demonstration"
	@echo "    make fusion-plus-local   - Run demo on LOCAL chain (no costs!)"
	@echo "    make fusion-plus-test    - Run integration tests on testnet"
	@echo "    make fusion-plus-setup   - Quick setup for demo"
	@echo "    make fusion-plus-arch    - View system architecture"
	@echo "    make fusion-plus-status  - Check deployment status"
	@echo ""
	@echo "  ADVANCED:"
	@echo "    make help-dev        - Show more development commands"
	@echo "    make help-all        - Show ALL available commands"
	@echo ""

# Development commands help
help-dev:
	@echo ""
	@echo "  🔧 ADDITIONAL DEVELOPMENT COMMANDS"
	@echo "  ================================="
	@echo ""
	@echo "  INTENT-DRIVEN WORKFLOWS:"
	@echo "    make workflows           - Show all guided workflows"
	@echo "    make workflow-test-swaps - Test atomic swaps locally"
	@echo "    make workflow-1inch      - Integrate with 1inch protocols"
	@echo "    make workflow-cross-chain - Build cross-chain dApp"
	@echo "    make workflow-debug      - Debug failed swaps"
	@echo ""
	@echo "  FORK TESTING:"
	@echo "    make fork-mainnet    - Fork Ethereum mainnet"
	@echo "    make fork-base       - Fork Base network"
	@echo "    make fork-arbitrum   - Fork Arbitrum"
	@echo "    make fork-optimism   - Fork Optimism"
	@echo "    make fork-polygon    - Fork Polygon"
	@echo ""
	@echo "  BASE SEPOLIA DEPLOYMENT:"
	@echo "    make deploy-base-all     - Deploy all BASE contracts at once"
	@echo "    make deploy-base-hub     - Deploy only FusionPlusHub"
	@echo "    make deploy-base-escrow  - Deploy only EscrowFactory"
	@echo "    make base-gas-estimate   - Check deployment gas costs"
	@echo ""
	@echo "  NEAR TESTNET DEPLOYMENT:"
	@echo "    make deploy-near-all     - Build and deploy all NEAR contracts"
	@echo "    make deploy-near-htlc    - Deploy only HTLC contract"
	@echo "    make deploy-near-solver  - Deploy only solver registry"
	@echo "    make near-gas-estimate   - Check deployment gas costs"
	@echo ""
	@echo "  TESTING & QUALITY:"
	@echo "    make test-fork       - Run fork tests"
	@echo "    make test-coverage   - Generate coverage report"
	@echo "    make lint            - Run linter"
	@echo "    make format          - Format code"
	@echo "    make typecheck       - Check TypeScript types"
	@echo ""
	@echo "  ORCHESTRATOR:"
	@echo "    make orchestrator-check - Check prerequisites & setup guide"
	@echo "    make orchestrator-test  - Test orchestrator"
	@echo "    make orchestrator-build - Build orchestrator"
	@echo "    make orchestrator-dev   - Orchestrator dev mode"
	@echo ""
	@echo "  PROXY & API:"
	@echo "    make proxy-setup     - Setup/deploy 1inch proxy to Vercel"
	@echo "    make proxy-test      - Test proxy endpoints"
	@echo "    make proxy-deploy    - Redeploy proxy to Vercel"
	@echo ""
	@echo "  ACCOUNT MANAGEMENT:"
	@echo "    make account-status  - Quick status check"
	@echo "    make account         - Full details with balances"
	@echo "    make account-fund    - Get your address for faucets"
	@echo "    make account-generate - Generate new account"
	@echo "    make account-import  - Import existing private key"
	@echo ""
	@echo "  UTILITIES:"
	@echo "    make create-env      - Create .env files"
	@echo "    make update-env      - Update .env files"
	@echo "    make verify          - Verify contracts"
	@echo "    make metrics         - View metrics"
	@echo ""

# Complete command reference
help-all: help help-dev
	@echo "  🔬 ADVANCED COMMANDS"
	@echo "  ==================="
	@echo ""
	@echo "  ORCHESTRATOR:"
	@echo "    make orchestrator-check     - Check prerequisites & setup guide"
	@echo "    make orchestrator-test      - Test orchestrator"
	@echo "    make orchestrator-build     - Build orchestrator"
	@echo "    make orchestrator-dev       - Dev mode for orchestrator"
	@echo "    make orchestrator-logs      - View orchestrator logs"
	@echo ""
	@echo "  NEAR PROTOCOL:"
	@echo "    make near-install           - Install NEAR dependencies"
	@echo "    make near-build             - Build NEAR contracts"
	@echo "    make near-test              - Test NEAR contracts"
	@echo "    make near-deploy            - Deploy to NEAR testnet"
	@echo "    make near-dev               - NEAR development mode"
	@echo ""
	@echo "  FORK TESTING (all chains):"
	@echo "    make fork-mainnet           - Fork Ethereum mainnet"
	@echo "    make fork-sepolia           - Fork Sepolia testnet"
	@echo "    make fork-base              - Fork Base network"
	@echo "    make fork-base-sepolia      - Fork Base Sepolia"
	@echo "    make fork-arbitrum          - Fork Arbitrum"
	@echo "    make fork-arbitrum-sepolia  - Fork Arbitrum Sepolia"
	@echo "    make fork-optimism          - Fork Optimism"
	@echo "    make fork-optimism-sepolia  - Fork Optimism Sepolia"
	@echo "    make fork-polygon           - Fork Polygon"
	@echo "    make fork-polygon-mumbai    - Fork Polygon Mumbai"
	@echo ""
	@echo "  ACCOUNT MANAGEMENT:"
	@echo "    make account                - View current account (requires password)"
	@echo "    make account-status         - Quick status check (no password)"
	@echo "    make account-generate       - Generate new account"
	@echo "    make account-import         - Import existing account"
	@echo "    make account-reveal-pk      - Reveal private key"
	@echo "    make account-fund           - Get testnet tokens (shows faucets)"
	@echo "    make a                      - Alias for account-status"
	@echo ""
	@echo "  PROXY & API:"
	@echo "    make proxy-setup            - Setup/deploy 1inch proxy to Vercel"
	@echo "    make proxy-test             - Test proxy endpoints"
	@echo "    make proxy-deploy           - Redeploy proxy to Vercel"
	@echo "    make proxy-logs             - View proxy deployment logs"
	@echo ""
	@echo "  UTILITIES:"
	@echo "    make check-deps             - Check dependencies"
	@echo "    make create-env             - Create .env files"
	@echo "    make update-env             - Update .env files"
	@echo "    make format                 - Format code"
	@echo "    make lint                   - Run linter"
	@echo "    make typecheck              - Check TypeScript types"
	@echo "    make verify                 - Verify contracts"
	@echo ""
	@echo "  DOCKER:"
	@echo "    make docker-build           - Build Docker images"
	@echo "    make docker-run             - Run in Docker"
	@echo "    make docker-stop            - Stop Docker containers"
	@echo ""
	@echo "  CI/CD:"
	@echo "    make ci                     - Run CI pipeline"
	@echo "    make release                - Create release"
	@echo ""
	@echo "  SUBMODULES:"
	@echo "    make submodule-init         - Initialize submodules"
	@echo "    make submodule-update       - Update submodules"
	@echo ""

# ============================================
# GUIDED SETUP FOR NEW USERS
# ============================================

# Interactive setup guide
guide:
	@clear
	@echo ""
	@echo "  🎯 WELCOME TO 1BALANCER SETUP GUIDE"
	@echo "  ==================================="
	@echo ""
	@echo "  This guide will help you get 1Balancer running in minutes."
	@echo ""
	@echo "  Choose your development path:"
	@echo ""
	@echo "  1) 🏠 LOCAL DEVELOPMENT"
	@echo "     • Run everything on your machine"
	@echo "     • No real tokens needed"
	@echo "     • Perfect for development & testing"
	@echo ""
	@echo "  2) 🌐 TESTNET DEPLOYMENT"
	@echo "     • Deploy to real test networks"
	@echo "     • Requires testnet tokens"
	@echo "     • For integration testing"
	@echo ""
	@echo "  3) 🏆 FUSION+ DEMO (Hackathon)"
	@echo "     • Quick setup for judges"
	@echo "     • Shows cross-chain swaps"
	@echo "     • BASE ↔ NEAR atomic swaps"
	@echo ""
	@echo "  Enter your choice (1/2/3) or 'q' to quit:"
	@read -p "  > " choice; \
	case $$choice in \
		1) make guide-local ;; \
		2) make guide-testnet ;; \
		3) make guide-fusion ;; \
		q|Q) echo "  Goodbye!" ;; \
		*) echo "  Invalid choice. Please run 'make guide' again." ;; \
	esac

# Local development guide
guide-local:
	@clear
	@echo ""
	@echo "  🏠 LOCAL DEVELOPMENT SETUP"
	@echo "  ========================="
	@echo ""
	@echo "  Let's set up your local development environment..."
	@echo ""
	@echo "  📋 CHECKING PREREQUISITES:"
	@node scripts/check-dependencies.js || { \
		echo ""; \
		echo "  ❌ Missing dependencies detected!"; \
		echo ""; \
		echo "  Please install the missing dependencies and run 'make guide' again."; \
		exit 1; \
	}
	@echo ""
	@echo "  ✅ All prerequisites installed!"
	@echo ""
	@echo "  🔧 SETTING UP PROJECT..."
	@echo ""
	@echo "  Installing packages (this may take a few minutes)..."
	@yarn install > install.log 2>&1 && echo "  ✓ Core dependencies installed" || { echo "  ❌ Installation failed. Check install.log"; exit 1; }
	@yarn install:all > install-all.log 2>&1 && echo "  ✓ All packages installed" || { echo "  ❌ Installation failed. Check install-all.log"; exit 1; }
	@touch .yarn-installed
	@echo "  ✓ Creating environment files..."
	@node scripts/create-env-files.js > /dev/null 2>&1
	@echo ""
	@echo "  ✅ LOCAL SETUP COMPLETE!"
	@echo ""
	@echo "  📚 NEXT STEPS:"
	@echo "  ============="
	@echo ""
	@echo "  1. Start local blockchain:"
	@echo "     make chain"
	@echo ""
	@echo "  2. Generate deployer account:"
	@echo "     make account-generate"
	@echo ""
	@echo "  3. In a new terminal, deploy contracts:"
	@echo "     make deploy"
	@echo ""
	@echo "  4. Start all services:"
	@echo "     make dev"
	@echo ""
	@echo "  5. Open frontend:"
	@echo "     http://localhost:3000"
	@echo ""
	@echo "  💡 TIP: Run 'make status' anytime to check service health"
	@echo ""

# Testnet deployment guide
guide-testnet:
	@clear
	@echo ""
	@echo "  🌐 TESTNET DEPLOYMENT SETUP"
	@echo "  ==========================="
	@echo ""
	@echo "  Setting up for testnet deployment..."
	@echo ""
	@echo "  📋 REQUIREMENTS:"
	@echo "  • BASE Sepolia ETH (get from faucet)"
	@echo "  • NEAR Testnet tokens"
	@echo "  • 1inch API key (from ETHGlobal for hackathon)"
	@echo ""
	@echo "  Do you have all requirements? (y/n)"
	@read -p "  > " confirm; \
	if [ "$$confirm" != "y" ] && [ "$$confirm" != "Y" ]; then \
		echo ""; \
		echo "  📚 GET TESTNET RESOURCES:"; \
		echo "  ======================="; \
		echo ""; \
		echo "  1. BASE Sepolia ETH:"; \
		echo "     https://docs.base.org/docs/tools/network-faucets"; \
		echo ""; \
		echo "  2. NEAR Testnet tokens:"; \
		echo "     https://nearblocks.io/faucets"; \
		echo ""; \
		echo "  3. 1inch API key (hackathon):"; \
		echo "     Request through ETHGlobal Discord"; \
		echo ""; \
		echo "  Come back when you have all requirements!"; \
		exit 0; \
	fi
	@echo ""
	@echo "  🔧 CONFIGURING FOR TESTNET..."
	@echo ""
	@if [ ! -f ".yarn-installed" ]; then \
		echo "  Installing packages..."; \
		yarn install > install.log 2>&1 && yarn install:all > install-all.log 2>&1; \
		touch .yarn-installed; \
	fi
	@echo "  ✓ Dependencies ready"
	@echo ""
	@echo "  🔐 ENVIRONMENT SETUP:"
	@echo "  ==================="
	@echo ""
	@echo "  Please configure your .env file with:"
	@echo "  • Private key (with testnet funds)"
	@echo "  • 1inch API key"
	@echo "  • RPC endpoints"
	@echo ""
	@echo "  Run: nano .env"
	@echo ""
	@echo "  Press Enter when configuration is complete..."
	@read _
	@echo ""
	@echo "  📚 TESTNET DEPLOYMENT STEPS:"
	@echo "  ==========================="
	@echo ""
	@echo "  1. Generate or import account:"
	@echo "     make account-generate  # Or: make account-import"
	@echo ""
	@echo "  2. Fund your account with testnet ETH"
	@echo ""
	@echo "  3. Deploy to BASE Sepolia:"
	@echo "     make deploy-base"
	@echo ""
	@echo "  4. Deploy to NEAR testnet:"
	@echo "     make near-deploy"
	@echo ""
	@echo "  5. Start orchestrator:"
	@echo "     make orchestrator-dev"
	@echo ""
	@echo "  6. Run integration tests:"
	@echo "     make fusion-plus-test"
	@echo ""
	@echo "  💡 TIP: Check deployment status with 'make fusion-plus-status'"
	@echo ""

# Fusion+ demo guide
guide-fusion:
	@clear
	@echo ""
	@echo "  🏆 FUSION+ DEMO QUICK SETUP"
	@echo "  =========================="
	@echo ""
	@echo "  Setting up the Fusion+ cross-chain demo..."
	@echo ""
	@echo "  This will demonstrate:"
	@echo "  • Atomic swaps between BASE and NEAR"
	@echo "  • HTLC with SHA-256 hashlocks"
	@echo "  • Complete orchestration system"
	@echo ""
	@echo "  Press Enter to begin setup..."
	@read _
	@echo ""
	@echo "  🔧 INSTALLING DEPENDENCIES..."
	@if [ ! -f ".yarn-installed" ]; then \
		yarn install > install.log 2>&1 && yarn install:all > install-all.log 2>&1 && \
		touch .yarn-installed && \
		echo "  ✓ Dependencies installed"; \
	else \
		echo "  ✓ Dependencies already installed"; \
	fi
	@echo ""
	@echo "  🔐 CHECKING CONFIGURATION..."
	@if grep -q "your-1inch-api-key-here" .env 2>/dev/null; then \
		echo "  ⚠️  1inch API key not configured"; \
		echo "  Please set your API key in .env file"; \
		echo "  (Get from ETHGlobal for hackathon)"; \
		echo ""; \
		echo "  Run: nano .env"; \
		echo "  Then run: make fusion-plus-setup"; \
		exit 1; \
	else \
		echo "  ✓ API key configured"; \
	fi
	@echo ""
	@echo "  📄 CHECKING DEPLOYMENTS..."
	@if [ -f "packages/hardhat/deployments/baseSepolia/FusionPlusHub.json" ]; then \
		echo "  ✓ BASE contracts deployed"; \
	else \
		echo "  ⚠️  BASE contracts not deployed"; \
		echo "  Run: make deploy-base"; \
	fi
	@if [ -f "1balancer-near/.near-credentials/testnet/deploy.json" ]; then \
		echo "  ✓ NEAR contracts deployed"; \
	else \
		echo "  ⚠️  NEAR contracts not deployed"; \
		echo "  Run: make near-deploy"; \
	fi
	@echo ""
	@echo "  🎯 STARTING SERVICES..."
	@if curl -s http://localhost:8080/health > /dev/null 2>&1; then \
		echo "  ✓ Orchestrator running"; \
	else \
		echo "  Starting orchestrator..."; \
		cd packages/orchestrator && yarn dev > ../../orchestrator.log 2>&1 & \
		sleep 5; \
		echo "  ✓ Orchestrator started"; \
	fi
	@echo ""
	@echo "  ✅ FUSION+ DEMO READY!"
	@echo ""
	@echo "  📚 RUN THE DEMO:"
	@echo "  ==============="
	@echo ""
	@echo "  1. View architecture:"
	@echo "     make fusion-plus-arch"
	@echo ""
	@echo "  2. Run live demo:"
	@echo "     make fusion-plus"
	@echo ""
	@echo "  3. Check status:"
	@echo "     make fusion-plus-status"
	@echo ""
	@echo "  💡 The demo will show real cross-chain swaps on testnet!"
	@echo ""

# Quick start - fastest path to demo
quickstart:
	@echo "⚡ QUICK START - Getting you running in 60 seconds..."
	@echo ""
	@# Install dependencies if needed
	@if [ ! -f ".yarn-installed" ]; then \
		echo "📦 Installing dependencies..."; \
		yarn install > /dev/null 2>&1 && \
		yarn install:all > /dev/null 2>&1 && \
		touch .yarn-installed; \
	fi
	@# Create env files
	@node scripts/create-env-files.js > /dev/null 2>&1
	@echo "✓ Environment configured"
	@# Start chain
	@echo "⛓️  Starting blockchain..."
	@yarn chain > hardhat.log 2>&1 &
	@sleep 5
	@# Check account first
	@cd packages/hardhat && yarn account > /tmp/account-check 2>&1 || true
	@if grep -q "You don't have a deployer account" /tmp/account-check 2>/dev/null; then \
		echo "⚠️  No deployer account - generating one..."; \
		cd packages/hardhat && yarn generate > /dev/null 2>&1 || true; \
	fi
	@# Deploy contracts
	@echo "📄 Deploying contracts..."
	@yarn deploy --network localhost > /dev/null 2>&1 || true
	@# Start services
	@echo "🚀 Starting services..."
	@yarn dev:all > services.log 2>&1 &
	@sleep 3
	@echo ""
	@echo "✅ 1BALANCER IS RUNNING!"
	@echo ""
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "📡 API Docs: http://localhost:3001/api-docs"
	@echo ""
	@echo "📚 NEXT STEPS:"
	@echo "  • View logs: make logs"
	@echo "  • Run tests: make test"
	@echo "  • Stop all:  make stop"
	@echo ""

# ============================================
# ESSENTIAL COMMANDS (New Users)
# ============================================

# Complete setup and run
all: setup run
	@echo "✅ 1Balancer is ready!"

# First-time setup - installs everything needed
setup:
	@echo "🚀 Setting up 1Balancer..."
	@echo ""
	@# First ensure dependencies are installed
	@if [ ! -f ".yarn-installed" ]; then \
		echo "📦 Installing dependencies (this may take a few minutes)..."; \
		yarn install && yarn install:all && touch .yarn-installed && \
		echo "✅ Dependencies installed" || { \
			echo "❌ Installation failed. Please check your network connection and try again."; \
			exit 1; \
		}; \
	else \
		echo "✅ Dependencies already installed"; \
	fi
	@echo ""
	@node scripts/check-dependencies.js || exit 1
	@echo ""
	@echo "🔧 Setting up environment..."
	@node scripts/create-env-files.js > /dev/null 2>&1
	@echo "✅ Environment configured"
	@echo ""
	@if [ ! -d "1balancer-near" ]; then \
		echo "📂 Initializing submodules..."; \
		git submodule update --init --recursive > /dev/null 2>&1 || echo "⚠️  No submodules found"; \
	fi
	@echo ""
	@echo "🦀 Setting up Rust (if needed)..."
	@node scripts/setup-rust.js > /dev/null 2>&1 || echo "⚠️  Rust setup skipped"
	@echo ""
	@echo "🌐 Setting up 1inch API proxy..."
	@if grep -q "your-1inch-api-key-here" .env 2>/dev/null; then \
		echo ""; \
		echo "⚠️  Proxy setup skipped!"; \
		echo ""; \
		echo "📚 SETUP REQUIRED:"; \
		echo "  1. Get API key from:    https://portal.1inch.dev/"; \
		echo "  2. Update .env file with your API key"; \
		echo "  3. Then run:           make proxy-setup"; \
	else \
		node scripts/setup-proxy.js > /dev/null 2>&1 || echo "⚠️  Proxy setup failed - Run 'make proxy-setup' manually"; \
	fi
	@echo ""
	@echo "✅ Setup complete!"
	@echo ""
	@echo "📚 NEXT STEPS:"
	@echo "  1. Start local development:  make run"
	@echo "  2. Or run the guide:        make guide"
	@echo "  3. Check service status:    make status"

# Start everything
run: .yarn-installed
	@echo "🚀 Starting 1Balancer..."
	@echo ""
	@echo "⛓️  Starting local blockchain..."
	@yarn chain > hardhat.log 2>&1 &
	@sleep 5
	@# Check account first
	@cd packages/hardhat && yarn account > /tmp/account-check 2>&1 || true
	@if grep -q "You don't have a deployer account" /tmp/account-check 2>/dev/null; then \
		echo "⚠️  No deployer account - generating one..."; \
		cd packages/hardhat && yarn generate > /dev/null 2>&1 || true; \
	fi
	@echo "📄 Deploying contracts..."
	@yarn deploy --network localhost > /dev/null 2>&1 || true
	@echo "🎯 Starting all services..."
	@yarn dev:all > services.log 2>&1 &
	@sleep 3
	@echo ""
	@echo "✅ 1BALANCER IS RUNNING!"
	@echo ""
	@echo "  🌐 Frontend:     http://localhost:3000"
	@echo "  ⛓️  Blockchain:   http://localhost:8545"
	@echo "  🎯 Orchestrator: http://localhost:3001"
	@echo "  📚 API Docs:     http://localhost:3001/api-docs"
	@echo ""
	@echo "📚 NEXT STEPS:"
	@echo "  • View logs:            make logs"
	@echo "  • Check service health: make status"
	@echo "  • Run tests:            make test"
	@echo "  • Stop all services:    make stop"
	@echo ""
	@echo "💡 TIP: The frontend may take 30-60 seconds to fully load"

# Stop everything
stop:
	@echo "🛑 Stopping all services..."
	@yarn stop > /dev/null 2>&1
	@echo "✅ All services stopped"

# Check service status
status:
	@node scripts/check-status.js

# ============================================
# BASIC DEVELOPMENT COMMANDS
# ============================================

# Development mode with hot reload
dev: .yarn-installed
	@echo "🔧 Starting development mode..."
	@yarn dev:all
	@echo ""
	@echo "📚 DEVELOPMENT TIPS:"
	@echo "  • Frontend changes reload automatically"
	@echo "  • Contract changes: run 'make deploy' in new terminal"
	@echo "  • View orchestrator logs: make orchestrator-logs"
	@echo "  • Run specific tests: yarn test path/to/test.ts"

# Run all tests
test: .yarn-installed
	@echo "🧪 Running all tests..."
	@yarn test:all

# Build for production
build: .yarn-installed
	@echo "🏗️  Building for production..."
	@yarn build
	@cd packages/orchestrator && yarn build
	@echo "✅ Build complete"

# Clean everything
clean:
	@echo "🧹 Cleaning project..."
	@yarn clean:all > /dev/null 2>&1
	@rm -rf node_modules .next dist build coverage
	@rm -f *.log .yarn-installed
	@echo "✅ Project cleaned"

# ============================================
# DEPLOYMENT COMMANDS
# ============================================

# Deploy to localhost
deploy: .yarn-installed
	@echo "📄 Deploying contracts to localhost..."
	@# Check if local chain is running
	@if ! curl -s http://localhost:8545 > /dev/null 2>&1; then \
		echo ""; \
		echo "❌ Local blockchain not running!"; \
		echo ""; \
		echo "📚 SETUP REQUIRED:"; \
		echo "  1. Start blockchain:    make chain"; \
		echo "  2. Then run:           make deploy"; \
		exit 1; \
	fi
	@# For localhost, use default Hardhat accounts (no password needed)
	@echo "  Using default Hardhat test accounts..."
	@cd packages/hardhat && npx hardhat deploy --network localhost
	@echo ""
	@echo "📚 NEXT STEPS:"
	@echo "  • Start frontend:       make frontend"
	@echo "  • Start orchestrator:   make backend"
	@echo "  • Run integration test: make test-integration"

# Deploy Mock NEAR contract for local testing
deploy-mock-near: .yarn-installed
	@echo "🌐 Deploying Mock NEAR HTLC for local testing..."
	@cd packages/hardhat && npx hardhat deploy --tags MockNEARHTLC --network localhost
	@echo "✅ Mock NEAR contract deployed!"
	@echo "📋 Update .env with the deployed address shown above"

# Deploy with account system (for testnets)
deploy-with-account: .yarn-installed
	@echo "📄 Deploying contracts..."
	@# Check if account exists first
	@cd packages/hardhat && yarn account > /tmp/account-check 2>&1 || true
	@if grep -q "You don't have a deployer account" /tmp/account-check 2>/dev/null; then \
		echo ""; \
		echo "❌ No deployer account found!"; \
		echo ""; \
		echo "📚 SETUP REQUIRED:"; \
		echo "  1. Generate account:    make account-generate"; \
		echo "  2. Or import existing:  make account-import"; \
		echo "  3. Fund account from faucet"; \
		echo "  4. Then run deployment again"; \
		exit 1; \
	fi
	@yarn deploy --network localhost
	@echo ""
	@echo "📚 NEXT STEPS:"
	@echo "  • Start frontend:       make frontend"
	@echo "  • Start orchestrator:   make backend"
	@echo "  • Run integration test: make test-integration"

# Deploy to forked mainnet
deploy-fork: .yarn-installed
	@echo "📄 Deploying to forked mainnet..."
	@# Check if account exists first
	@cd packages/hardhat && yarn account > /tmp/account-check 2>&1 || true
	@if grep -q "You don't have a deployer account" /tmp/account-check 2>/dev/null; then \
		echo ""; \
		echo "❌ No deployer account found!"; \
		echo ""; \
		echo "📚 SETUP REQUIRED:"; \
		echo "  1. Generate account:    make account-generate"; \
		echo "  2. Or import existing:  make account-import"; \
		echo "  3. Then run:           make deploy-fork"; \
		exit 1; \
	fi
	@yarn deploy:fork
	@echo ""
	@echo "📚 NEXT STEPS:"
	@echo "  • Test with mainnet tokens: make test-fork"
	@echo "  • Start orchestrator:       make orchestrator-dev"

# Deploy to Sepolia testnet
deploy-sepolia: .yarn-installed
	@echo "📄 Deploying to Sepolia testnet..."
	@# Check if account exists first
	@cd packages/hardhat && yarn account > /tmp/account-check 2>&1 || true
	@if grep -q "You don't have a deployer account" /tmp/account-check 2>/dev/null; then \
		echo ""; \
		echo "❌ No deployer account found!"; \
		echo ""; \
		echo "📚 SETUP REQUIRED:"; \
		echo "  1. Generate account:    make account-generate"; \
		echo "  2. Or import existing:  make account-import"; \
		echo "  3. Fund with testnet ETH from faucet"; \
		echo "  4. Then run:           make deploy-sepolia"; \
		exit 1; \
	fi
	@yarn deploy --network sepolia
	@echo ""
	@echo "📚 NEXT STEPS:"
	@echo "  • Verify contracts:     make verify"
	@echo "  • Configure proxy:      make proxy-setup"
	@echo "  • Start orchestrator:   make orchestrator-dev"

# Deploy to Base
deploy-base: .yarn-installed
	@echo "📄 Deploying to Base Sepolia..."
	@# Check if account exists first
	@cd packages/hardhat && yarn account > /tmp/account-check 2>&1 || true
	@if grep -q "You don't have a deployer account" /tmp/account-check 2>/dev/null; then \
		echo ""; \
		echo "❌ No deployer account found!"; \
		echo ""; \
		echo "📚 SETUP REQUIRED:"; \
		echo "  1. Generate account:    make account-generate"; \
		echo "  2. Or import existing:  make account-import"; \
		echo "  3. Fund with BASE ETH from faucet"; \
		echo "  4. Then run:           make deploy-base"; \
		exit 1; \
	fi
	@echo ""
	@echo "📋 DEPLOYMENT NOTES:"
	@echo "  • If you get 'insufficient funds' error, fund your account:"
	@echo "    - Get deployer address: make account"
	@echo "    - Get BASE Sepolia ETH from:"
	@echo "      https://www.alchemy.com/faucets/base-sepolia"
	@echo "      https://faucet.quicknode.com/base/sepolia"
	@echo ""
	@echo "  • Alternative direct deployment (if make fails):"
	@echo "    cd packages/hardhat"
	@echo "    npx hardhat deploy --network baseSepolia --tags EthereumHub"
	@echo ""
	@cd packages/hardhat && yarn deploy:base-testnet || { \
		echo ""; \
		echo "⚠️  Deployment failed. Common issues:"; \
		echo "  1. Insufficient funds - fund your account"; \
		echo "  2. Password required - use direct deployment command above"; \
		echo "  3. Network issues - check your connection"; \
		exit 1; \
	}
	@echo ""
	@echo "📚 NEXT STEPS:"
	@echo "  • Deploy NEAR contracts: make near-deploy"
	@echo "  • Check deployment:      make fusion-plus-status"
	@echo "  • Run integration test:  make fusion-plus-test"

# Optimized BASE deployment commands
deploy-base-hub: .yarn-installed
	@echo "🚀 Deploying FusionPlusHub to BASE Sepolia..."
	@cd packages/hardhat && npx hardhat deploy --network baseSepolia --tags FusionPlusHub
	@echo "✅ FusionPlusHub deployed!"

deploy-base-escrow: .yarn-installed
	@echo "🏭 Deploying EscrowFactory to BASE Sepolia..."
	@cd packages/hardhat && npx hardhat deploy --network baseSepolia --tags EscrowFactory
	@echo "✅ EscrowFactory deployed!"

deploy-base-all: deploy-base-hub deploy-base-escrow
	@echo "✅ All BASE contracts deployed!"
	@make fusion-plus-status

# Check BASE deployment gas estimates
base-gas-estimate: .yarn-installed
	@echo "⛽ Estimating deployment gas costs for BASE Sepolia..."
	@echo ""
	@echo "Approximate gas costs:"
	@echo "  • FusionPlusHub:  ~3,000,000 gas"
	@echo "  • EscrowFactory:  ~5,000,000 gas"
	@echo "  • Total:          ~8,000,000 gas"
	@echo ""
	@echo "At 0.1 gwei gas price (typical for testnet):"
	@echo "  • Total cost: ~0.0008 ETH"
	@echo ""
	@echo "Get BASE Sepolia ETH from faucets listed in 'make account-fund'"

# ============================================
# INDIVIDUAL SERVICE COMMANDS
# ============================================

# Start local blockchain
chain: .yarn-installed
	@echo "⛓️  Starting local blockchain..."
	@yarn chain

# Start frontend only
frontend: .yarn-installed
	@echo "🌐 Starting frontend..."
	@yarn start

# Start backend/orchestrator
backend: .yarn-installed
	@echo "🎯 Starting backend services..."
	@cd packages/orchestrator && yarn dev

# Start proxy server
proxy: .yarn-installed
	@echo "🔌 Starting API proxy..."
	@if grep -q "your-1inch-api-key-here" .env 2>/dev/null; then \
		echo "❌ Error: You need to set your real 1inch API key in .env file"; \
		echo "Replace 'your-1inch-api-key-here' with your actual API key from https://portal.1inch.dev/"; \
		exit 1; \
	fi
	@yarn proxy:dev

# Setup/deploy proxy to Vercel
proxy-setup:
	@echo "🔐 Setting up 1inch API proxy..."
	@if grep -q "your-1inch-api-key-here" .env 2>/dev/null; then \
		echo "❌ Error: You need to set your real 1inch API key in .env file"; \
		echo "Replace 'your-1inch-api-key-here' with your actual API key from https://portal.1inch.dev/"; \
		exit 1; \
	fi
	@yarn setup:proxy

# Test proxy endpoints
proxy-test:
	@echo "🧪 Testing proxy endpoints..."
	@if grep -q "your-1inch-api-key-here" .env 2>/dev/null; then \
		echo "❌ Error: You need to set your real 1inch API key in .env file"; \
		echo "Replace 'your-1inch-api-key-here' with your actual API key from https://portal.1inch.dev/"; \
		exit 1; \
	fi
	@yarn proxy:test

# Redeploy proxy to Vercel
proxy-deploy: .yarn-installed
	@echo "🚀 Redeploying proxy to Vercel..."
	@if grep -q "your-1inch-api-key-here" .env 2>/dev/null; then \
		echo "❌ Error: You need to set your real 1inch API key in .env file"; \
		echo "Replace 'your-1inch-api-key-here' with your actual API key from https://portal.1inch.dev/"; \
		exit 1; \
	fi
	@yarn proxy:deploy

# View proxy logs (if running locally)
proxy-logs:
	@echo "📋 Proxy deployment info:"
	@if [ -f "packages/nextjs/.env.local" ]; then \
		grep "NEXT_PUBLIC_PROXY_URL" packages/nextjs/.env.local || echo "No proxy URL found"; \
	else \
		echo "No .env.local file found"; \
	fi
	@echo ""
	@echo "To view Vercel deployment logs:"
	@echo "1. Visit https://vercel.com/dashboard"
	@echo "2. Select your '1inch-proxy' project"
	@echo "3. Go to the 'Functions' tab for logs"

# ============================================
# TESTING COMMANDS
# ============================================

# Unit tests only
test-unit: .yarn-installed
	@echo "🧪 Running unit tests..."
	@yarn test:unit

# Integration tests
test-integration: .yarn-installed
	@echo "🧪 Running integration tests..."
	@# Check if contracts are deployed
	@if [ ! -d "packages/hardhat/deployments/localhost" ] || [ -z "$$(ls -A packages/hardhat/deployments/localhost 2>/dev/null)" ]; then \
		echo ""; \
		echo "❌ No contracts deployed!"; \
		echo ""; \
		echo "📚 SETUP REQUIRED:"; \
		echo "  1. Start blockchain:    make chain"; \
		echo "  2. Deploy contracts:    make deploy"; \
		echo "  3. Then run tests:      make test-integration"; \
		exit 1; \
	fi
	@./scripts/run-integration-tests.sh

# Fork testing
test-fork: .yarn-installed
	@echo "🔱 Running fork tests..."
	@yarn test:fork

# Coverage report
test-coverage: .yarn-installed
	@echo "📊 Generating coverage report..."
	@yarn test:coverage

# ============================================
# MONITORING COMMANDS
# ============================================

# View logs
logs: .yarn-installed
	@node scripts/show-logs.js

# View metrics
metrics: .yarn-installed
	@cd packages/orchestrator && make metrics

# Quick health check
health: .yarn-installed
	@yarn test:health

# ============================================
# ORCHESTRATOR COMMANDS
# ============================================

# Check orchestrator prerequisites
orchestrator-check:
	@bash scripts/orchestrator-check.sh
	@echo ""
	@echo "📚 NEXT STEPS:"
	@echo "  • Configure environment: nano .env"
	@echo "  • Run orchestrator:      make orchestrator-dev"
	@echo "  • Test orchestrator:     make orchestrator-test"

orchestrator-test: .yarn-installed orchestrator-check
	@echo "🧪 Running orchestrator tests..."
	@if [ -f ".env" ]; then \
		export $$(grep -E '^NEAR_' .env 2>/dev/null | xargs) && \
		cd packages/orchestrator && yarn test; \
	else \
		cd packages/orchestrator && yarn test; \
	fi
	@echo ""
	@echo "📚 NEXT STEPS:"
	@echo "  • Build orchestrator:    make orchestrator-build"
	@echo "  • Start development:     make orchestrator-dev"
	@echo "  • View documentation:    cat packages/orchestrator/docs/USAGE.md"

orchestrator-build: .yarn-installed orchestrator-check
	@echo "🏗️  Building orchestrator..."
	@if [ -f ".env" ]; then \
		export $$(grep -E '^NEAR_' .env 2>/dev/null | xargs) && \
		cd packages/orchestrator && yarn build; \
	else \
		cd packages/orchestrator && yarn build; \
	fi
	@echo ""
	@echo "📚 NEXT STEPS:"
	@echo "  • Start production:      cd packages/orchestrator && yarn start"
	@echo "  • Deploy to server:      See packages/orchestrator/docs/DEPLOYMENT.md"

orchestrator-dev: .yarn-installed orchestrator-check
	@echo "🚀 Starting orchestrator in development mode..."
	@echo ""
	@echo "📝 Expected behavior:"
	@echo "  - Service will run on port 8080"
	@echo "  - WebSocket server on port 8080 (path: /ws)"
	@echo "  - BASE and Ethereum monitoring will work"
	@echo "  - NEAR errors (AccountDoesNotExist) are expected if not configured"
	@echo ""
	@echo "📚 WHILE RUNNING:"
	@echo "  • View API docs:         http://localhost:8080/api-docs"
	@echo "  • Test WebSocket:        wscat -c ws://localhost:8080/ws"
	@echo "  • Create swap session:   See examples in docs/USAGE.md"
	@echo ""
	@echo "Press Ctrl+C to stop the orchestrator"
	@echo ""
	@bash scripts/run-orchestrator.sh

orchestrator-logs: .yarn-installed
	@cd packages/orchestrator && make logs
	@echo ""
	@echo "📚 LOG MANAGEMENT:"
	@echo "  • Clear logs:            rm -rf packages/orchestrator/logs/*"
	@echo "  • Monitor errors:        tail -f packages/orchestrator/logs/error.log"
	@echo "  • Check metrics:         make metrics"

# ============================================
# NEAR COMMANDS
# ============================================

# Optimized NEAR deployment commands
deploy-near-all: near-build
	@echo "🚀 Deploying all NEAR contracts to testnet..."
	@make near-deploy
	@echo "✅ All NEAR contracts deployed!"
	@make near-status

deploy-near-htlc: near-check
	@echo "🔐 Deploying NEAR HTLC contract..."
	@if [ -f ".env" ]; then \
		export $$(grep -E '^NEAR_MASTER_ACCOUNT' .env 2>/dev/null | xargs); \
	fi; \
	if [ -z "$$NEAR_MASTER_ACCOUNT" ]; then \
		echo "❌ NEAR_MASTER_ACCOUNT not set"; \
		exit 1; \
	fi; \
	cd 1balancer-near && \
	near create-account fusion-htlc.$$NEAR_MASTER_ACCOUNT --masterAccount $$NEAR_MASTER_ACCOUNT --initialBalance 10 && \
	near deploy --accountId fusion-htlc.$$NEAR_MASTER_ACCOUNT \
		--wasmFile target/wasm32-unknown-unknown/release/fusion_plus_htlc.wasm
	@echo "✅ HTLC contract deployed!"

deploy-near-solver: near-check
	@echo "🧩 Deploying NEAR solver registry..."
	@if [ -f ".env" ]; then \
		export $$(grep -E '^NEAR_MASTER_ACCOUNT' .env 2>/dev/null | xargs); \
	fi; \
	if [ -z "$$NEAR_MASTER_ACCOUNT" ]; then \
		echo "❌ NEAR_MASTER_ACCOUNT not set"; \
		exit 1; \
	fi; \
	cd 1balancer-near && \
	near create-account solver-registry.$$NEAR_MASTER_ACCOUNT --masterAccount $$NEAR_MASTER_ACCOUNT --initialBalance 5 && \
	near deploy --accountId solver-registry.$$NEAR_MASTER_ACCOUNT \
		--wasmFile target/wasm32-unknown-unknown/release/solver_registry.wasm
	@echo "✅ Solver registry deployed!"

# Check NEAR deployment gas estimates
near-gas-estimate: .yarn-installed
	@echo "⛽ Estimating deployment gas costs for NEAR testnet..."
	@echo ""
	@echo "Approximate costs:"
	@echo "  • HTLC Contract:    10 NEAR (account creation + deployment)"
	@echo "  • Solver Registry:   5 NEAR (account creation + deployment)"
	@echo "  • Total:           15 NEAR"
	@echo ""
	@echo "Note: NEAR testnet tokens are free!"
	@echo "Get them from: https://nearblocks.io/faucets"

# Check NEAR Rust dependencies
near-check:
	@if [ -d "1balancer-near" ]; then \
		if command -v rustc >/dev/null 2>&1 && command -v cargo >/dev/null 2>&1; then \
			echo "✅ Rust toolchain installed"; \
		else \
			echo "❌ Rust toolchain not found"; \
			echo ""; \
			echo "📋 To install Rust:"; \
			echo "  1. Visit https://rustup.rs/"; \
			echo "  2. Run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"; \
			echo "  3. Follow the installation prompts"; \
			echo "  4. Restart your terminal"; \
			exit 1; \
		fi \
	else \
		echo "⚠️  NEAR submodule not found. Run: make submodule-init"; \
		exit 1; \
	fi

# Build NEAR contracts
near-build: near-check
	@echo "🏗️  Building NEAR contracts..."
	@if [ -d "1balancer-near" ]; then \
		cd 1balancer-near && make build && { \
			echo ""; \
			echo "✅ NEAR contracts built successfully!"; \
			echo ""; \
			echo "📋 Build artifacts:"; \
			echo "  - fusion-plus-htlc: target/wasm32-unknown-unknown/release/fusion_plus_htlc.wasm"; \
			echo "  - solver-registry: target/wasm32-unknown-unknown/release/solver_registry.wasm"; \
			echo ""; \
		} || { \
			echo ""; \
			echo "⚠️  NEAR build encountered issues"; \
			echo ""; \
			echo "This may be due to:"; \
			echo "  1. Missing wasm target: rustup target add wasm32-unknown-unknown"; \
			echo "  2. Solver build failures (optional component)"; \
			echo "  3. Contract code that needs updating"; \
			echo ""; \
			echo "The main orchestrator functionality is not affected."; \
			echo ""; \
		}; \
	else \
		echo "⚠️  NEAR submodule not found"; \
	fi

# Test NEAR contracts
near-test: near-check
	@echo "🧪 Testing NEAR contracts..."
	@if [ -d "1balancer-near" ]; then \
		cd 1balancer-near && make test || { \
			echo ""; \
			echo "❌ NEAR tests failed"; \
			echo ""; \
			echo "📋 Please check the test output above"; \
			echo ""; \
			exit 1; \
		}; \
	else \
		echo "⚠️  NEAR submodule not found"; \
	fi

# Deploy to NEAR testnet
near-deploy: near-check
	@echo "🚀 Deploying to NEAR/Aurora..."
	@# Try to load .env file if it exists and NEAR credentials aren't already set
	@if [ -f ".env" ] && [ -z "$$NEAR_MASTER_ACCOUNT" ]; then \
		echo "📋 Checking for NEAR credentials in .env file..."; \
	fi
	@if [ -d "1balancer-near" ]; then \
		if [ -f ".env" ]; then \
			export $$(grep -E '^NEAR_MASTER_ACCOUNT|^NEAR_PRIVATE_KEY' .env 2>/dev/null | xargs) && \
			cd 1balancer-near && make deploy-testnet; \
		else \
			cd 1balancer-near && make deploy-testnet; \
		fi && { \
			echo ""; \
			echo "📋 NEAR contracts built successfully. Ready for deployment."; \
			echo ""; \
			echo "To check deployment status:"; \
			echo "  make near-status"; \
			echo ""; \
		} || { \
			echo ""; \
			echo "📋 See deployment options above"; \
			echo ""; \
			echo "Additional notes:"; \
			echo "  - For native NEAR: Install NEAR CLI with 'npm install -g near-cli'"; \
			echo "  - For Aurora EVM: Use existing Ethereum tools (Hardhat, Foundry)"; \
			echo "  - Both options support cross-chain atomic swaps"; \
			echo ""; \
			exit 1; \
		}; \
	else \
		echo "⚠️  NEAR submodule not found"; \
		echo "   Run 'make submodule-init' first"; \
	fi

# Check NEAR deployment status
near-status:
	@echo "🔍 Checking NEAR deployment status..."
	@echo ""
	@# Try to detect logged-in NEAR account
	@LOGGED_IN_ACCOUNT=""; \
	if command -v near >/dev/null 2>&1; then \
		for CRED_FILE in ~/.near-credentials/testnet/*.json; do \
			if [ -f "$$CRED_FILE" ]; then \
				ACCOUNT_NAME=$$(basename "$$CRED_FILE" .json); \
				if [ "$$ACCOUNT_NAME" != "undefined" ] && [[ ! "$$ACCOUNT_NAME" =~ ^dev-[0-9]+ ]]; then \
					LOGGED_IN_ACCOUNT="$$ACCOUNT_NAME"; \
					break; \
				fi; \
			fi; \
		done; \
	fi; \
	if [ -n "$$LOGGED_IN_ACCOUNT" ]; then \
		echo "👤 Logged in as: $$LOGGED_IN_ACCOUNT"; \
		echo ""; \
	fi; \
	\
	if [ -f "1balancer-near/.near-credentials/testnet/deploy.json" ]; then \
		echo "📋 Found deployment info:"; \
		CONTRACT_ID=$$(grep -o '"contractId":"[^"]*' 1balancer-near/.near-credentials/testnet/deploy.json 2>/dev/null | cut -d'"' -f4); \
		SOLVER_ID=$$(grep -o '"solverContract":"[^"]*' 1balancer-near/.near-credentials/testnet/deploy.json 2>/dev/null | cut -d'"' -f4); \
		if [ -n "$$CONTRACT_ID" ]; then \
			echo "  HTLC Contract: $$CONTRACT_ID"; \
			[ -n "$$SOLVER_ID" ] && echo "  Solver Contract: $$SOLVER_ID"; \
			echo ""; \
			echo "🌐 View on NEAR Explorer:"; \
			echo "  HTLC: https://testnet.nearblocks.io/address/$$CONTRACT_ID"; \
			[ -n "$$SOLVER_ID" ] && echo "  Solver: https://testnet.nearblocks.io/address/$$SOLVER_ID"; \
			echo ""; \
			echo "📡 Test your contracts:"; \
			echo "  near view $$CONTRACT_ID get_info '{}'"; \
			[ -n "$$SOLVER_ID" ] && echo "  near view $$SOLVER_ID get_info '{}'"; \
		else \
			echo "  ⚠️  No contract ID found in deployment file"; \
		fi; \
	else \
		echo "❌ No deployment info found"; \
		echo ""; \
		if [ -n "$$LOGGED_IN_ACCOUNT" ]; then \
			echo "📋 Ready to deploy! Run:"; \
			echo "  make near-deploy"; \
			echo ""; \
			echo "This will create and deploy:"; \
			echo "  - fusion-htlc.$$LOGGED_IN_ACCOUNT"; \
			echo "  - solver-registry.$$LOGGED_IN_ACCOUNT"; \
			echo ""; \
			echo "Or deploy manually:"; \
			echo "  # Create subaccount"; \
			echo "  near create-account fusion-htlc.$$LOGGED_IN_ACCOUNT --masterAccount $$LOGGED_IN_ACCOUNT --initialBalance 10"; \
			echo "  # Deploy contract"; \
			echo "  near deploy --accountId fusion-htlc.$$LOGGED_IN_ACCOUNT \\"; \
			echo "    --wasmFile 1balancer-near/target/wasm32-unknown-unknown/release/fusion_plus_htlc.wasm"; \
		else \
			echo "📋 To deploy contracts:"; \
			echo "  1. Install NEAR CLI: npm install -g near-cli"; \
			echo "  2. Login to NEAR: near login"; \
			echo "  3. Run deployment: make near-deploy"; \
			echo ""; \
			echo "⚠️  No NEAR account detected. Please login first:"; \
			echo "  near login"; \
		fi; \
	fi
	@echo ""
	@# Check network connection
	@if command -v near >/dev/null 2>&1; then \
		echo "📡 Checking NEAR network connection..."; \
		near validators current 2>/dev/null | head -n 1 && echo "✅ Connected to NEAR testnet" || echo "⚠️  Cannot connect to NEAR testnet"; \
	else \
		echo "⚠️  NEAR CLI not installed. Install with: npm install -g near-cli"; \
	fi

# Delete NEAR contracts
near-delete:
	@echo "🗑️  Delete NEAR contracts..."
	@echo ""
	@if [ -f ".env" ]; then \
		export $$(grep -E '^NEAR_MASTER_ACCOUNT' .env 2>/dev/null | xargs); \
	fi; \
	if [ -z "$$NEAR_MASTER_ACCOUNT" ]; then \
		echo "❌ NEAR_MASTER_ACCOUNT not set"; \
		echo "   Please set it in .env or export it"; \
		exit 1; \
	fi; \
	echo "⚠️  This will delete contracts and return funds to $$NEAR_MASTER_ACCOUNT"; \
	echo ""
	@if [ -f ".env" ]; then \
		export $$(grep -E '^NEAR_MASTER_ACCOUNT' .env 2>/dev/null | xargs) && \
		echo "Available contracts to delete:" && \
		if near state "fusion-htlc.$$NEAR_MASTER_ACCOUNT" 2>/dev/null | grep -q "amount:"; then \
			echo "  ✅ fusion-htlc.$$NEAR_MASTER_ACCOUNT exists"; \
		else \
			echo "  ❌ fusion-htlc.$$NEAR_MASTER_ACCOUNT not found"; \
		fi && \
		if near state "solver-registry.$$NEAR_MASTER_ACCOUNT" 2>/dev/null | grep -q "amount:"; then \
			echo "  ✅ solver-registry.$$NEAR_MASTER_ACCOUNT exists"; \
		else \
			echo "  ❌ solver-registry.$$NEAR_MASTER_ACCOUNT not found"; \
		fi && \
		echo "" && \
		echo "To delete a specific contract, run:" && \
		echo "  near delete-account CONTRACT_NAME BENEFICIARY" && \
		echo "" && \
		echo "Examples:" && \
		echo "  near delete-account fusion-htlc.$$NEAR_MASTER_ACCOUNT $$NEAR_MASTER_ACCOUNT" && \
		echo "  near delete-account solver-registry.$$NEAR_MASTER_ACCOUNT $$NEAR_MASTER_ACCOUNT"; \
	fi
	@echo ""
	@echo "To delete all contracts, run:"
	@echo "  make near-delete-all"

# Delete all NEAR contracts (with confirmation)
near-delete-all: near-check
	@echo "🗑️  Deleting ALL NEAR contracts..."
	@if [ -f ".env" ]; then \
		export $$(grep -E '^NEAR_MASTER_ACCOUNT' .env 2>/dev/null | xargs); \
	fi; \
	if [ -z "$$NEAR_MASTER_ACCOUNT" ]; then \
		echo "❌ NEAR_MASTER_ACCOUNT not set"; \
		exit 1; \
	fi; \
	echo ""; \
	echo "⚠️  WARNING: This will delete all contracts and return funds to $$NEAR_MASTER_ACCOUNT"; \
	echo ""; \
	read -p "Are you sure? Type 'yes' to confirm: " CONFIRM; \
	if [ "$$CONFIRM" = "yes" ]; then \
		if near state "fusion-htlc.$$NEAR_MASTER_ACCOUNT" 2>/dev/null | grep -q "amount:"; then \
			echo "Deleting fusion-htlc.$$NEAR_MASTER_ACCOUNT..."; \
			near delete-account "fusion-htlc.$$NEAR_MASTER_ACCOUNT" "$$NEAR_MASTER_ACCOUNT" || true; \
		fi; \
		if near state "solver-registry.$$NEAR_MASTER_ACCOUNT" 2>/dev/null | grep -q "amount:"; then \
			echo "Deleting solver-registry.$$NEAR_MASTER_ACCOUNT..."; \
			near delete-account "solver-registry.$$NEAR_MASTER_ACCOUNT" "$$NEAR_MASTER_ACCOUNT" || true; \
		fi; \
		rm -f 1balancer-near/.near-credentials/testnet/deploy.json; \
		echo "✅ All contracts deleted"; \
	else \
		echo "❌ Cancelled"; \
	fi

# NEAR development mode
near-dev:
	@echo "🔧 NEAR Development Setup..."
	@echo ""
	@echo "NEAR contracts are deployed on testnet, not run locally."
	@echo ""
	@echo "📋 Available NEAR commands:"
	@echo "  • make near-build    - Build NEAR contracts"
	@echo "  • make near-test     - Test NEAR contracts"
	@echo "  • make near-deploy   - Deploy to NEAR testnet"
	@echo "  • make near-status   - Check deployment status"
	@echo ""
	@echo "✅ NEAR is integrated via testnet - no local service needed!"

# ============================================
# FORK TESTING COMMANDS
# ============================================

fork-mainnet: .yarn-installed
	@yarn fork:mainnet

fork-sepolia: .yarn-installed
	@yarn fork:sepolia

fork-base: .yarn-installed
	@yarn fork:base

fork-base-sepolia: .yarn-installed
	@yarn fork:base-sepolia

fork-arbitrum: .yarn-installed
	@yarn fork:arbitrum

fork-arbitrum-sepolia: .yarn-installed
	@yarn fork:arbitrum-sepolia

fork-optimism: .yarn-installed
	@yarn fork:optimism

fork-optimism-sepolia: .yarn-installed
	@yarn fork:optimism-sepolia

fork-polygon: .yarn-installed
	@yarn fork:polygon

fork-polygon-mumbai: .yarn-installed
	@yarn fork:polygon-mumbai

# ============================================
# ACCOUNT MANAGEMENT
# ============================================

# View current deployer account and balances
account: .yarn-installed
	@echo "👛 Checking deployer account..."
	@# First check if DEPLOYER_PRIVATE_KEY is set in .env
	@if grep -q "^DEPLOYER_PRIVATE_KEY=0x[a-fA-F0-9]" .env 2>/dev/null; then \
		echo ""; \
		echo "Using DEPLOYER_PRIVATE_KEY from .env file"; \
		echo ""; \
		cd packages/hardhat && { \
			ADDR=$$(npx hardhat run --no-compile scripts/getAddress.js 2>&1 | grep -E "^0x[a-fA-F0-9]{40}$$" | tail -1); \
			if [ "$$ADDR" != "NO_KEY" ] && [ -n "$$ADDR" ]; then \
				echo "Public address: $$ADDR"; \
				echo ""; \
				echo "📊 Checking balances..."; \
				echo "-- localhost --"; \
				BAL=$$(npx hardhat run --no-compile scripts/checkBalance.js --network localhost 2>/dev/null || echo "0"); \
				echo "  balance: $$BAL ETH"; \
				echo "-- baseSepolia --"; \
				BAL=$$(npx hardhat run --no-compile scripts/checkBalance.js --network baseSepolia 2>/dev/null || echo "0"); \
				echo "  balance: $$BAL ETH"; \
			else \
				echo "❌ Could not derive address from private key"; \
			fi; \
		}; \
	else \
		cd packages/hardhat && { \
			yarn account 2>&1 | sed '/Loading environment/d; /Root \.env loaded/d; /Loading local overrides/d; /^$$/d' || true; \
		}; \
	fi

# Generate a new deployer account
account-generate: .yarn-installed
	@echo "🔑 Generating new deployer account..."
	@cd packages/hardhat && { \
		yarn account:generate 2>&1 | sed '/Loading environment/d; /Root \.env loaded/d; /Loading local overrides/d; /^$$/d' || true; \
	}
	@echo ""
	@echo "📚 NEXT STEPS:"
	@echo "  • Save your private key securely!"
	@echo "  • For testnet: make account-fund (get tokens from faucet)"
	@echo "  • For localhost: Account auto-funded with 10,000 ETH"
	@echo "  • Deploy contracts: make deploy"

# Import an existing private key
account-import: .yarn-installed
	@echo "📥 Importing existing account..."
	@echo ""
	@echo "⚠️  SECURITY NOTES:"
	@echo "  • Enter private key when prompted (hidden)"
	@echo "  • Key will be encrypted with password"
	@echo "  • Never share your private key!"
	@echo ""
	@cd packages/hardhat && { \
		yarn account:import 2>&1 | sed '/Loading environment/d; /Root \.env loaded/d; /Loading local overrides/d; /^$$/d' || true; \
	}

# Reveal the private key (requires password)
account-reveal-pk: .yarn-installed
	@echo "🔓 Revealing private key..."
	@echo ""
	@echo "⚠️  SECURITY WARNING:"
	@echo "  • Private key will be displayed!"
	@echo "  • Make sure no one is looking"
	@echo "  • Never share this key"
	@echo ""
	@read -p "Press Enter to continue or Ctrl+C to cancel..." _
	@cd packages/hardhat && { \
		yarn account:reveal-pk 2>&1 | sed '/Loading environment/d; /Root \.env loaded/d; /Loading local overrides/d; /^$$/d' || true; \
	}

# Quick account status check (no password required)
account-status: .yarn-installed
	@echo "📊 Account Status Check..."
	@# First check if DEPLOYER_PRIVATE_KEY is set in .env
	@if grep -q "^DEPLOYER_PRIVATE_KEY=0x[a-fA-F0-9]" .env 2>/dev/null; then \
		cd packages/hardhat && { \
			ADDR=$$(npx hardhat run --no-compile scripts/getAddress.js 2>&1 | grep -E "^0x[a-fA-F0-9]{40}$$" | tail -1); \
			if [ "$$ADDR" != "NO_KEY" ] && [ -n "$$ADDR" ]; then \
				echo "✅ Account configured in .env"; \
				echo "   Address: $$ADDR"; \
			else \
				echo "❌ Invalid private key in .env"; \
			fi; \
		}; \
	else \
		cd packages/hardhat && { \
			OUTPUT=$$(yarn account 2>&1); \
			if echo "$$OUTPUT" | grep -q "You don't have"; then \
				echo "❌ No deployer account found!"; \
				echo ""; \
				echo "📚 SETUP REQUIRED:"; \
				echo "  1. Set DEPLOYER_PRIVATE_KEY in .env"; \
				echo "  2. Or run 'make account-generate' to create one"; \
			else \
				echo "$$OUTPUT" | grep -E "(Public address:|-- localhost|-- sepolia|-- base)" | head -4 || echo "✅ Account configured (run 'make account' for details)"; \
			fi; \
		}; \
	fi
	@echo ""
	@echo "📚 ACCOUNT COMMANDS:"
	@echo "  • make account          - View full details"
	@echo "  • make account-generate - Create new account"
	@echo "  • make account-import   - Import existing key"
	@echo "  • make account-fund     - Get testnet tokens"

# Fund account with testnet tokens (shows faucet links)
account-fund: .yarn-installed
	@echo "💰 Funding Your Account"
	@echo "====================="
	@echo ""
	@echo "Get testnet tokens from these faucets:"
	@echo ""
	@echo "🔷 BASE Sepolia:"
	@echo "   https://www.alchemy.com/faucets/base-sepolia"
	@echo "   https://faucet.quicknode.com/base/sepolia"
	@echo ""
	@echo "🔷 Sepolia ETH:"
	@echo "   https://sepoliafaucet.com/"
	@echo "   https://sepolia-faucet.pk910.de/"
	@echo ""
	@echo "🔷 NEAR Testnet:"
	@echo "   https://nearblocks.io/faucets"
	@echo ""
	@# First check if DEPLOYER_PRIVATE_KEY is set in .env
	@if grep -q "^DEPLOYER_PRIVATE_KEY=0x[a-fA-F0-9]" .env 2>/dev/null; then \
		PRIVATE_KEY=$$(grep "^DEPLOYER_PRIVATE_KEY=" .env | cut -d'=' -f2); \
		cd packages/hardhat && { \
			ADDR=$$(npx hardhat run --no-compile scripts/getAddress.js 2>&1 | grep -E "^0x[a-fA-F0-9]{40}$$" | tail -1); \
			if [ -n "$$ADDR" ]; then \
				echo "📬 Your deployer address: $$ADDR"; \
				echo ""; \
				echo "Copy this address and paste it in the faucet!"; \
			else \
				echo "❌ Could not get address from private key"; \
			fi; \
		}; \
	else \
		cd packages/hardhat && { \
			OUTPUT=$$(yarn account 2>&1); \
			if echo "$$OUTPUT" | grep -q "Public address:"; then \
				ADDR=$$(echo "$$OUTPUT" | grep "Public address:" | awk '{print $$3}'); \
				echo "📬 Your address: $$ADDR"; \
				echo ""; \
				echo "Copy this address and paste it in the faucet!"; \
			else \
				echo "❌ No account found. Either:"; \
				echo "  1. Set DEPLOYER_PRIVATE_KEY in .env"; \
				echo "  2. Or run 'make account-generate' to create one"; \
			fi; \
		}; \
	fi

# Alias for account
a: account-status

# ============================================
# UTILITY COMMANDS
# ============================================

check-deps:
	@node scripts/check-dependencies.js

create-env:
	@node scripts/create-env-files.js

update-env:
	@node scripts/create-env-files.js --force

format: .yarn-installed
	@yarn format

lint: .yarn-installed
	@yarn lint

typecheck: .yarn-installed
	@yarn typecheck

verify: .yarn-installed
	@yarn verify

# ============================================
# DOCKER COMMANDS
# ============================================

docker-build:
	@cd packages/orchestrator && make docker-build

docker-run:
	@cd packages/orchestrator && make docker-run

docker-stop:
	@docker stop 1balancer-orchestrator || true

# ============================================
# CI/CD COMMANDS
# ============================================

ci:
	@echo "🔄 Running CI pipeline..."
	@yarn install:all
	@yarn lint
	@yarn typecheck
	@yarn test:unit
	@echo "✅ CI pipeline passed"

release:
	@echo "📦 Creating release..."
	@yarn version

# ============================================
# SUBMODULE COMMANDS
# ============================================

submodule-init:
	@echo "📂 Initializing submodules..."
	@git submodule update --init --recursive
	@echo ""
	@if [ -d "1balancer-near" ]; then \
		echo "✅ NEAR submodule initialized successfully"; \
		echo ""; \
		echo "📋 Next steps for NEAR integration:"; \
		echo "  1. Install Rust toolchain from https://rustup.rs/ (if not already installed)"; \
		echo "  2. make near-build     - Build NEAR contracts"; \
		echo "  3. make near-test      - Run tests"; \
		echo "  4. make near-deploy    - Deploy to testnet"; \
	else \
		echo "⚠️  Warning: NEAR submodule not found after initialization"; \
		echo "  This may mean the submodule is not configured in .gitmodules"; \
		echo ""; \
		echo "  The orchestrator will still work for BASE <-> Ethereum swaps"; \
	fi

submodule-update:
	@echo "🔄 Updating submodules..."
	@yarn submodule:update

# ============================================
# FUSION+ DEMO COMMANDS (HACKATHON SHOWCASE)
# ============================================

# Complete Fusion+ demonstration for judges
fusion-plus: .yarn-installed
	@echo ""
	@echo "🏆 1BALANCER FUSION+ DEMONSTRATION"
	@echo "================================="
	@echo ""
	@echo "This demonstration showcases our complete implementation of the"
	@echo "1inch Fusion+ protocol with cross-chain atomic swaps between"
	@echo "BASE (Ethereum L2) and NEAR Protocol."
	@echo ""
	@echo "What you'll see:"
	@echo "  ✅ Bidirectional atomic swaps (ETH ↔ NEAR)"
	@echo "  ✅ HTLC with SHA-256 hashlocks"
	@echo "  ✅ Timeout-protected refunds"
	@echo "  ✅ Live testnet transactions"
	@echo "  ✅ Complete orchestration system"
	@echo ""
	@read -p "Press Enter to begin the demonstration..." _
	@node scripts/fusion-plus-demo-real.js

# Run integration tests with live contracts
fusion-plus-test: .yarn-installed
	@echo ""
	@echo "🧪 FUSION+ INTEGRATION TESTS"
	@echo "==========================="
	@echo ""
	@echo "Running live integration tests on testnet..."
	@echo "This will perform actual atomic swaps with real contracts."
	@echo ""
	@echo "Prerequisites:"
	@echo "  - BASE Sepolia ETH (get from faucet)"
	@echo "  - NEAR Testnet tokens"
	@echo "  - Deployed contracts"
	@echo ""
	@read -p "Press Enter to start integration tests..." _
	@node scripts/fusion-integration-tests.js

# Quick demo setup for judges
fusion-plus-setup: setup
	@echo ""
	@echo "⚡ FUSION+ QUICK SETUP"
	@echo "===================="
	@echo ""
	@echo "Setting up everything needed for the demo..."
	@echo ""
	@# Deploy contracts if needed
	@if [ ! -f "packages/hardhat/deployments/baseSepolia/FusionPlusHub.json" ]; then \
		echo "📄 Deploying contracts to BASE Sepolia..."; \
		yarn deploy --network baseSepolia || echo "⚠️  Deploy manually with 'make deploy-base'"; \
	fi
	@# Check NEAR deployment
	@if [ ! -f "1balancer-near/.near-credentials/testnet/deploy.json" ]; then \
		echo "📄 NEAR contracts need deployment. Run 'make near-deploy'"; \
	fi
	@# Start orchestrator if not running
	@curl -s http://localhost:8080/health > /dev/null 2>&1 || { \
		echo "🎯 Starting orchestrator..."; \
		cd packages/orchestrator && yarn dev > ../../orchestrator.log 2>&1 & \
		sleep 5; \
	}
	@echo ""
	@echo "✅ Fusion+ demo environment ready!"
	@echo ""
	@echo "Run 'make fusion-plus' to start the demonstration"

# Show Fusion+ architecture
fusion-plus-arch:
	@clear
	@echo ""
	@echo "    🏆 1BALANCER FUSION+ ARCHITECTURE"
	@echo "    ================================="
	@echo ""
	@echo "    ┌─────────────────────────────────────────────────────────────────┐"
	@echo "    │                    1BALANCER FUSION+ SYSTEM                     │"
	@echo "    ├─────────────────────────────────────────────────────────────────┤"
	@echo "    │                                                                 │"
	@echo "    │  BASE Chain (Ethereum L2)              NEAR Protocol            │"
	@echo "    │  ┌─────────────────────┐              ┌──────────────────┐     │"
	@echo "    │  │  FusionPlusHub.sol  │              │ fusion-htlc.near │     │"
	@echo "    │  │  ┌───────────────┐  │              │ ┌──────────────┐ │     │"
	@echo "    │  │  │ Escrow System │  │◄────────────►│ │ HTLC System  │ │     │"
	@echo "    │  │  └───────────────┘  │              │ └──────────────┘ │     │"
	@echo "    │  │  ┌───────────────┐  │              │ ┌──────────────┐ │     │"
	@echo "    │  │  │ 1inch LOP    │  │              │ │ Event Monitor│ │     │"
	@echo "    │  │  └───────────────┘  │              │ └──────────────┘ │     │"
	@echo "    │  └─────────────────────┘              └──────────────────┘     │"
	@echo "    │           ▲                                    ▲                │"
	@echo "    │           │                                    │                │"
	@echo "    │           └────────────┬───────────────────────┘                │"
	@echo "    │                       │                                         │"
	@echo "    │               ┌───────────────────┐                            │"
	@echo "    │               │  Orchestration    │                            │"
	@echo "    │               │    Service        │                            │"
	@echo "    │               │ • Session Mgmt    │                            │"
	@echo "    │               │ • Secret Mgmt     │                            │"
	@echo "    │               │ • Event Monitor   │                            │"
	@echo "    │               └───────────────────┘                            │"
	@echo "    │                                                                 │"
	@echo "    └─────────────────────────────────────────────────────────────────┘"
	@echo ""
	@echo "    KEY FEATURES:"
	@echo "    ✓ Atomic Cross-Chain Swaps    ✓ No KYC Requirements"
	@echo "    ✓ SHA-256 Hashlocks          ✓ Timeout Protection"
	@echo "    ✓ 1inch Protocol Integration  ✓ Bidirectional Swaps"
	@echo ""
	@echo "Press Enter to return to menu..."
	@read _

# View recent Fusion+ transactions
fusion-plus-status:
	@echo ""
	@echo "📊 FUSION+ DEPLOYMENT STATUS"
	@echo "==========================="
	@echo ""
	@# Check BASE contracts
	@echo "BASE Sepolia Contracts:"
	@if [ -f "packages/hardhat/deployments/baseSepolia/FusionPlusHub.json" ]; then \
		HUB_ADDR=$$(jq -r .address packages/hardhat/deployments/baseSepolia/FusionPlusHub.json); \
		echo "  ✅ FusionPlusHub: $$HUB_ADDR"; \
		echo "     Explorer: https://sepolia.basescan.org/address/$$HUB_ADDR"; \
	else \
		echo "  ❌ FusionPlusHub: Not deployed"; \
	fi
	@if [ -f "packages/hardhat/deployments/baseSepolia/EscrowFactory.json" ]; then \
		ESCROW_ADDR=$$(jq -r .address packages/hardhat/deployments/baseSepolia/EscrowFactory.json); \
		echo "  ✅ EscrowFactory: $$ESCROW_ADDR"; \
		echo "     Explorer: https://sepolia.basescan.org/address/$$ESCROW_ADDR"; \
	else \
		echo "  ❌ EscrowFactory: Not deployed"; \
	fi
	@echo ""
	@# Check NEAR contracts
	@echo "NEAR Testnet Contracts:"
	@if [ -f "1balancer-near/.near-credentials/testnet/deploy.json" ]; then \
		CONTRACT_ID=$$(grep -o '"contractId":"[^"]*' 1balancer-near/.near-credentials/testnet/deploy.json | cut -d'"' -f4); \
		echo "  ✅ HTLC Contract: $$CONTRACT_ID"; \
		echo "     Explorer: https://testnet.nearblocks.io/address/$$CONTRACT_ID"; \
	else \
		echo "  ❌ HTLC Contract: Not deployed"; \
	fi
	@echo ""
	@# Check orchestrator
	@echo "Orchestrator Service:"
	@if curl -s http://localhost:8080/health > /dev/null 2>&1; then \
		echo "  ✅ Status: Running on http://localhost:8080"; \
		echo "     API Docs: http://localhost:8080/api-docs"; \
		echo "     WebSocket: ws://localhost:8080/ws"; \
	else \
		echo "  ❌ Status: Not running (start with 'make orchestrator-dev')"; \
	fi
	@echo ""

# Run Fusion+ demo on local chain (no testnet costs)
fusion-plus-local: .yarn-installed
	@echo ""
	@echo "🏠 FUSION+ LOCAL CHAIN DEMO"
	@echo "=========================="
	@echo ""
	@echo "Running Fusion+ demo on local blockchain (no testnet costs)"
	@echo ""
	@echo "📋 SETUP CHECKLIST:"
	@# Check if local chain is running
	@if ! curl -s http://localhost:8545 > /dev/null 2>&1; then \
		echo "  ❌ Local blockchain not running"; \
		echo "     Start it with: make chain"; \
		echo ""; \
		exit 1; \
	else \
		echo "  ✅ Local blockchain running"; \
	fi
	@# Check if contracts are deployed locally
	@if [ ! -f "packages/hardhat/deployments/localhost/FusionPlusHub.json" ]; then \
		echo "  ❌ Contracts not deployed locally"; \
		echo "     Deploy with: make deploy"; \
		echo ""; \
		exit 1; \
	else \
		echo "  ✅ Contracts deployed"; \
	fi
	@# Check orchestrator
	@if ! curl -s http://localhost:8080/health > /dev/null 2>&1; then \
		echo "  ⚠️  Orchestrator not running"; \
		echo "     Start with: make orchestrator-dev"; \
	else \
		echo "  ✅ Orchestrator running"; \
	fi
	@echo ""
	@echo "📚 STARTING LOCAL DEMO..."
	@echo ""
	@echo "This demo will:"
	@echo "  • Simulate BASE <-> NEAR atomic swaps"
	@echo "  • Use local test accounts (auto-funded)"
	@echo "  • Show complete swap lifecycle"
	@echo "  • No real tokens or gas fees required"
	@echo ""
	@read -p "Press Enter to begin..." _
	@# Try the demo script first, fall back to test if it fails
	@node scripts/fusion-plus-demo-local.js 2>/dev/null || { \
		echo ""; \
		echo "📋 Running test suite demonstration instead..."; \
		echo ""; \
		cd packages/hardhat && npx hardhat test test/integration/FusionPlusLocal.test.ts --network localhost; \
	}

# ============================================
# INTENT-DRIVEN WORKFLOWS
# ============================================

# Workflow: I want to test atomic swaps locally
workflow-test-swaps:
	@echo "🔄 TESTING ATOMIC SWAPS LOCALLY"
	@echo "=============================="
	@echo ""
	@echo "This workflow will guide you through testing atomic swaps on your local machine."
	@echo ""
	@echo "📋 STEPS:"
	@echo "  1. make chain           # Start local blockchain"
	@echo "  2. make account-generate # Generate deployer account"
	@echo "  3. make deploy          # Deploy contracts"
	@echo "  4. make orchestrator-dev # Start orchestrator"
	@echo "  5. make frontend        # Start UI"
	@echo "  6. make test-integration # Run swap tests"
	@echo ""
	@echo "💡 All commands should be run in separate terminals"

# Workflow: I want to integrate with 1inch protocols
workflow-1inch:
	@echo "🔌 1INCH PROTOCOL INTEGRATION"
	@echo "============================"
	@echo ""
	@echo "📋 REQUIREMENTS:"
	@echo "  • 1inch API key from ETHGlobal"
	@echo "  • Mainnet fork for testing"
	@echo ""
	@echo "📚 STEPS:"
	@echo "  1. Set API key in .env file"
	@echo "  2. make account-generate # Generate account (if needed)"
	@echo "  3. make proxy-setup     # Deploy proxy to Vercel"
	@echo "  4. make fork-base       # Fork BASE mainnet"
	@echo "  5. make deploy-fork     # Deploy to fork"
	@echo "  6. make test-fork       # Test with real protocols"
	@echo ""
	@echo "📖 See docs/sections/04-limit-order-protocol.md for details"

# Workflow: I want to build a cross-chain dApp
workflow-cross-chain:
	@echo "🌉 CROSS-CHAIN DAPP DEVELOPMENT"
	@echo "==============================="
	@echo ""
	@echo "Building a dApp with BASE ↔ NEAR atomic swaps"
	@echo ""
	@echo "📋 DEVELOPMENT FLOW:"
	@echo "  1. make guide           # Interactive setup"
	@echo "  2. make dev             # Start development"
	@echo "  3. Edit frontend in packages/nextjs/"
	@echo "  4. Edit contracts in packages/hardhat/contracts/"
	@echo "  5. make test            # Run tests"
	@echo ""
	@echo "📋 DEPLOYMENT FLOW:"
	@echo "  1. make account-generate # Generate account"
	@echo "  2. Fund account with testnet tokens"
	@echo "  3. make deploy-base     # Deploy to BASE"
	@echo "  4. make near-deploy     # Deploy to NEAR"
	@echo "  5. make orchestrator-dev # Start orchestrator"
	@echo "  6. make fusion-plus-test # Test integration"
	@echo ""
	@echo "📖 Architecture: packages/hardhat/contracts/ethereum-hub/docs/"

# Workflow: I'm debugging failed swaps
workflow-debug:
	@echo "🔍 DEBUGGING FAILED SWAPS"
	@echo "========================"
	@echo ""
	@echo "📋 DEBUGGING CHECKLIST:"
	@echo "  1. Check service health:"
	@echo "     make status"
	@echo ""
	@echo "  2. View orchestrator logs:"
	@echo "     make orchestrator-logs"
	@echo ""
	@echo "  3. Check contract events:"
	@echo "     make logs | grep -i event"
	@echo ""
	@echo "  4. Verify deployments:"
	@echo "     make fusion-plus-status"
	@echo ""
	@echo "  5. Test individual components:"
	@echo "     make test-unit"
	@echo ""
	@echo "📖 Common issues: packages/orchestrator/docs/TROUBLESHOOTING.md"

# Show all workflows
workflows:
	@echo ""
	@echo "🎯 INTENT-DRIVEN WORKFLOWS"
	@echo "========================="
	@echo ""
	@echo "Choose a workflow based on what you want to do:"
	@echo ""
	@echo "  make workflow-test-swaps    - Test atomic swaps locally"
	@echo "  make workflow-1inch         - Integrate with 1inch protocols"
	@echo "  make workflow-cross-chain   - Build a cross-chain dApp"
	@echo "  make workflow-debug         - Debug failed swaps"
	@echo ""
	@echo "💡 Each workflow provides step-by-step guidance"

# ============================================
# SHORTCUTS & ALIASES
# ============================================

# Common aliases
start: run
restart: stop run
reset: clean setup
install: setup
uninstall: clean

# Environment aliases
env: create-env
env-update: update-env

# Test aliases
t: test
tu: test-unit
ti: test-integration
tf: test-fork
tc: test-coverage

# Service aliases
c: chain
f: frontend
b: backend
p: proxy

# Quick actions
.DEFAULT_GOAL := help