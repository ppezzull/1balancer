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
	@echo "    make fusion+         - Run complete Fusion+ demonstration"
	@echo "    make fusion+-test    - Run integration tests on testnet"
	@echo "    make fusion+-setup   - Quick setup for demo"
	@echo "    make fusion+-arch    - View system architecture"
	@echo "    make fusion+-status  - Check deployment status"
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
	@echo "  FORK TESTING:"
	@echo "    make fork-mainnet    - Fork Ethereum mainnet"
	@echo "    make fork-base       - Fork Base network"
	@echo "    make fork-arbitrum   - Fork Arbitrum"
	@echo "    make fork-optimism   - Fork Optimism"
	@echo "    make fork-polygon    - Fork Polygon"
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
	@echo "  UTILITIES:"
	@echo "    make account         - View current account"
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
	@echo "    make account                - View current account"
	@echo "    make account-generate       - Generate new account"
	@echo "    make account-import         - Import existing account"
	@echo "    make account-reveal-pk      - Reveal private key"
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
# ESSENTIAL COMMANDS (New Users)
# ============================================

# Complete setup and run
all: setup run
	@echo "✅ 1Balancer is ready!"

# First-time setup - installs everything needed
setup: .yarn-installed
	@echo "🚀 Setting up 1Balancer..."
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
		echo "⚠️  Proxy setup skipped - Set your 1inch API key in .env file first"; \
		echo "   Get your API key from: https://portal.1inch.dev/"; \
		echo "   Then run 'make proxy-setup' to deploy the proxy"; \
	else \
		node scripts/setup-proxy.js > /dev/null 2>&1 || echo "⚠️  Proxy setup failed - Run 'make proxy-setup' manually"; \
	fi
	@echo ""
	@echo "✅ Setup complete! Run 'make run' to start."

# Start everything
run: .yarn-installed
	@echo "🚀 Starting 1Balancer..."
	@echo ""
	@echo "⛓️  Starting local blockchain..."
	@yarn chain > hardhat.log 2>&1 &
	@sleep 5
	@echo "📄 Deploying contracts..."
	@yarn deploy --network localhost > /dev/null 2>&1 || true
	@echo "🎯 Starting all services..."
	@yarn dev:all > services.log 2>&1 &
	@sleep 3
	@echo ""
	@echo "✅ 1Balancer is running!"
	@echo ""
	@echo "  Frontend:     http://localhost:3000"
	@echo "  Blockchain:   http://localhost:8545"
	@echo "  Orchestrator: http://localhost:3001"
	@echo "  API Docs:     http://localhost:3001/api-docs"
	@echo ""
	@echo "Use 'make stop' to stop all services."
	@echo "Use 'make logs' to view logs."

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
	@yarn deploy --network localhost

# Deploy to forked mainnet
deploy-fork: .yarn-installed
	@echo "📄 Deploying to forked mainnet..."
	@yarn deploy:fork

# Deploy to Sepolia testnet
deploy-sepolia: .yarn-installed
	@echo "📄 Deploying to Sepolia testnet..."
	@yarn deploy --network sepolia

# Deploy to Base
deploy-base: .yarn-installed
	@echo "📄 Deploying to Base..."
	@yarn deploy --network base

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
	@echo "🔍 Checking orchestrator prerequisites..."
	@echo ""
	@# Check if submodule exists
	@if [ ! -d "1balancer-near" ]; then \
		echo "❌ NEAR submodule not initialized"; \
		echo ""; \
		echo "📋 To fix this, run these commands in order:"; \
		echo "  1. make submodule-init"; \
		echo "  2. make near-install"; \
		echo "  3. make near-build"; \
		echo "  4. make near-deploy"; \
		echo ""; \
		echo "⚠️  Note: The orchestrator will still work for BASE <-> Ethereum swaps"; \
		echo "         NEAR errors are non-critical and only affect NEAR swaps"; \
		echo ""; \
	else \
		echo "✅ NEAR submodule found"; \
	fi
	@# Check environment variables (try loading from .env first)
	@if [ -f ".env" ]; then \
		eval "$$(grep -E '^NEAR_MASTER_ACCOUNT|^NEAR_PRIVATE_KEY' .env 2>/dev/null | sed 's/^/: $${/' | sed 's/$$/}/')"; \
	fi
	@if [ -z "$$NEAR_MASTER_ACCOUNT" ] || [ -z "$$NEAR_PRIVATE_KEY" ]; then \
		echo "⚠️  NEAR credentials not configured"; \
		echo ""; \
		echo "📋 You have two options for NEAR functionality:"; \
		echo ""; \
		echo "Option 1: Native NEAR (Recommended)"; \
		echo "  1. Create account at https://wallet.testnet.near.org"; \
		echo "  2. Export credentials:"; \
		echo "     export NEAR_MASTER_ACCOUNT=your-account.testnet"; \
		echo "     export NEAR_PRIVATE_KEY=ed25519:your-private-key"; \
		echo ""; \
		echo "Option 2: Aurora EVM (MetaMask compatible)"; \
		echo "  - No NEAR account needed"; \
		echo "  - Use MetaMask with Aurora Testnet"; \
		echo "  - Deploy EVM contracts instead"; \
		echo ""; \
		echo "⚠️  Note: The orchestrator works without these, but NEAR swaps will be disabled"; \
		echo ""; \
	else \
		echo "✅ NEAR credentials configured"; \
	fi
	@# Check if NEAR contract is deployed
	@if [ -f "1balancer-near/.near-credentials/testnet/deploy.json" ]; then \
		echo "✅ NEAR contract deployment found"; \
		echo "   The orchestrator will read from: 1balancer-near/.near-credentials/testnet/deploy.json"; \
	elif [ -n "$$NEAR_HTLC_CONTRACT" ]; then \
		echo "✅ NEAR HTLC contract manually configured: $$NEAR_HTLC_CONTRACT"; \
	else \
		echo "⚠️  NEAR HTLC contract not deployed"; \
		echo ""; \
		echo "📋 After setting up NEAR credentials, simply run:"; \
		echo "   make near-deploy"; \
		echo ""; \
		echo "   The orchestrator will automatically use the deployed address"; \
		echo ""; \
	fi
	@echo ""
	@echo "✅ Orchestrator can run now. NEAR errors are expected if not fully configured."
	@echo ""

orchestrator-test: .yarn-installed orchestrator-check
	@echo "🧪 Running orchestrator tests..."
	@if [ -f ".env" ]; then \
		export $$(grep -E '^NEAR_' .env 2>/dev/null | xargs) && \
		cd packages/orchestrator && yarn test; \
	else \
		cd packages/orchestrator && yarn test; \
	fi

orchestrator-build: .yarn-installed orchestrator-check
	@echo "🏗️  Building orchestrator..."
	@if [ -f ".env" ]; then \
		export $$(grep -E '^NEAR_' .env 2>/dev/null | xargs) && \
		cd packages/orchestrator && yarn build; \
	else \
		cd packages/orchestrator && yarn build; \
	fi

orchestrator-dev: .yarn-installed orchestrator-check
	@echo "🚀 Starting orchestrator in development mode..."
	@echo ""
	@echo "📝 Expected behavior:"
	@echo "  - Service will run on port 8080"
	@echo "  - WebSocket server on port 8080 (path: /ws)"
	@echo "  - BASE and Ethereum monitoring will work"
	@echo "  - NEAR errors (AccountDoesNotExist) are expected if not configured"
	@echo ""
	@echo "Press Ctrl+C to stop the orchestrator"
	@echo ""
	@if [ -f ".env" ]; then \
		export $$(grep -E '^NEAR_' .env 2>/dev/null | xargs) && \
		cd packages/orchestrator && yarn dev; \
	else \
		cd packages/orchestrator && yarn dev; \
	fi

orchestrator-logs: .yarn-installed
	@cd packages/orchestrator && make logs

# ============================================
# NEAR COMMANDS
# ============================================

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
	@echo "🔧 Starting NEAR development..."
	@yarn near:dev

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

account: .yarn-installed
	@yarn account

account-generate: .yarn-installed
	@yarn account:generate

account-import: .yarn-installed
	@yarn account:import

account-reveal-pk: .yarn-installed
	@yarn account:reveal-pk

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
fusion+: .yarn-installed
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
	@node scripts/fusion-plus-demo.js

# Run integration tests with live contracts
fusion+-test: .yarn-installed
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
fusion+-setup: setup
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
	@echo "Run 'make fusion+' to start the demonstration"

# Show Fusion+ architecture
fusion+-arch:
	@clear
	@echo ""
	@cat << 'EOF'

    🏆 1BALANCER FUSION+ ARCHITECTURE
    =================================

    ┌─────────────────────────────────────────────────────────────────┐
    │                    1BALANCER FUSION+ SYSTEM                     │
    ├─────────────────────────────────────────────────────────────────┤
    │                                                                 │
    │  BASE Chain (Ethereum L2)              NEAR Protocol            │
    │  ┌─────────────────────┐              ┌──────────────────┐     │
    │  │  FusionPlusHub.sol  │              │ fusion-htlc.near │     │
    │  │  ┌───────────────┐  │              │ ┌──────────────┐ │     │
    │  │  │ Escrow System │  │◄────────────►│ │ HTLC System  │ │     │
    │  │  └───────────────┘  │              │ └──────────────┘ │     │
    │  │  ┌───────────────┐  │              │ ┌──────────────┐ │     │
    │  │  │ 1inch LOP    │  │              │ │ Event Monitor│ │     │
    │  │  └───────────────┘  │              │ └──────────────┘ │     │
    │  └─────────────────────┘              └──────────────────┘     │
    │           ▲                                    ▲                │
    │           │                                    │                │
    │           └────────────┬───────────────────────┘                │
    │                       │                                         │
    │               ┌───────────────────┐                            │
    │               │  Orchestration    │                            │
    │               │    Service        │                            │
    │               │ • Session Mgmt    │                            │
    │               │ • Secret Mgmt     │                            │
    │               │ • Event Monitor   │                            │
    │               └───────────────────┘                            │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘

    KEY FEATURES:
    ✓ Atomic Cross-Chain Swaps    ✓ No KYC Requirements
    ✓ SHA-256 Hashlocks          ✓ Timeout Protection
    ✓ 1inch Protocol Integration  ✓ Bidirectional Swaps

EOF
	@echo ""
	@echo "Press Enter to return to menu..."
	@read _

# View recent Fusion+ transactions
fusion+-status:
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