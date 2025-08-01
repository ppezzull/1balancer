.PHONY: help install test test-integration test-unit deploy-local clean status stop all

# Default target
help:
	@echo "1Balancer - Cross-Chain Atomic Swap Protocol"
	@echo "==========================================="
	@echo ""
	@echo "Quick Start:"
	@echo "  make all            - Full setup and run everything"
	@echo "  make deploy-local   - Deploy NEAR integration locally"
	@echo "  make test-integration - Run integration test suite"
	@echo ""
	@echo "Development:"
	@echo "  make install        - Install all dependencies"
	@echo "  make test          - Run all tests"
	@echo "  make test-unit     - Run unit tests only"
	@echo "  make status        - Check service status"
	@echo "  make stop          - Stop all services"
	@echo "  make clean         - Clean all build artifacts"
	@echo ""
	@echo "Individual Services:"
	@echo "  make chain         - Start local blockchain"
	@echo "  make orchestrator  - Start orchestrator service"
	@echo "  make frontend      - Start frontend"
	@echo "  make proxy         - Start proxy server"
	@echo ""
	@echo "NEAR Configuration (Optional):"
	@echo "============================================"
	@echo "The following environment variables can be set in the root .env file:"
	@echo ""
	@echo "  NEAR_NETWORK_ID     - Network to use (default: 'testnet')"
	@echo "                        Options: 'testnet', 'mainnet', 'localnet'"
	@echo ""
	@echo "  NEAR_HTLC_CONTRACT  - HTLC contract address (default: 'fusion-htlc.testnet')"
	@echo "                        This is pre-deployed on testnet, no action needed"
	@echo ""
	@echo "  NEAR_MASTER_ACCOUNT - Your NEAR account (optional)"
	@echo "                        Only needed if you want to deploy your own contracts"
	@echo "                        Example: 'myaccount.testnet'"
	@echo ""
	@echo "  NEAR_PRIVATE_KEY    - Your account's private key (optional)"
	@echo "                        Only needed with NEAR_MASTER_ACCOUNT"
	@echo "                        Format: 'ed25519:base58encodedkey...'"
	@echo ""
	@echo "Note: For local development, the default values work without any configuration."
	@echo "      These variables are only needed for testnet/mainnet deployments."

# Complete setup and run
all: install deploy-local
	@echo "✅ 1Balancer is ready! Services are running."

# Install all dependencies
install:
	@echo "📦 Installing dependencies..."
	@yarn install:all

# Deploy local environment (including NEAR)
deploy-local:
	@echo "🚀 Deploying local environment..."
	@cd 1balancer-near && ./scripts/deploy-local.sh

# Run integration tests
test-integration:
	@echo "🧪 Running integration tests..."
	@./scripts/run-integration-tests.sh

# Run all tests
test: test-unit test-integration
	@echo "✅ All tests completed"

# Run unit tests
test-unit:
	@echo "🧪 Running unit tests..."
	@yarn test:unit

# Start local blockchain
chain:
	@echo "⛓️  Starting local blockchain..."
	@yarn chain

# Start orchestrator
orchestrator:
	@echo "🎯 Starting orchestrator..."
	@cd packages/orchestrator && yarn dev

# Start frontend
frontend:
	@echo "🌐 Starting frontend..."
	@yarn start

# Start proxy
proxy:
	@echo "🔌 Starting proxy..."
	@yarn proxy:dev

# Check status
status:
	@echo "📊 Checking service status..."
	@yarn status

# Stop all services
stop:
	@echo "🛑 Stopping all services..."
	@yarn stop

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	@yarn clean:all

# Development shortcuts
dev: deploy-local
	@echo "🚀 Starting development environment..."
	@yarn dev:all

# Fork testing
test-fork:
	@echo "🔱 Running fork tests..."
	@yarn test:fork

# Quick health check
health:
	@echo "🏥 Running health checks..."
	@yarn test:health

# Orchestrator specific targets
orchestrator-test:
	@cd packages/orchestrator && yarn test

orchestrator-build:
	@cd packages/orchestrator && yarn build

# NEAR specific targets
near-build:
	@echo "🏗️  Building NEAR integration..."
	@yarn near:build

near-test:
	@echo "🧪 Testing NEAR integration..."
	@yarn near:test

# Documentation
docs:
	@echo "📚 Opening documentation..."
	@open https://github.com/1balancer/docs

# Environment setup
setup-env:
	@echo "🔧 Setting up environment..."
	@yarn create:envs

# Update environment files
update-env:
	@echo "🔄 Updating environment files..."
	@yarn update:envs

# CI/CD helpers
ci: install test-unit
	@echo "✅ CI checks passed"

# Production build
build: install
	@echo "🏗️  Building for production..."
	@yarn build
	@cd packages/orchestrator && yarn build

# Docker helpers (future implementation)
docker-build:
	@echo "🐳 Docker support coming soon..."

docker-run:
	@echo "🐳 Docker support coming soon..."