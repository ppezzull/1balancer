#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 1Balancer NEAR Local Deployment${NC}"
echo "===================================="

# Since NEAR functionality is integrated into the orchestrator,
# this script ensures the orchestrator is properly configured for NEAR

# Check if we're in the right directory
if [ ! -f "../package.json" ]; then
    echo -e "${RED}Error: This script should be run from the 1balancer-near directory${NC}"
    exit 1
fi

# Move to project root
cd ..

echo -e "\n${BLUE}📋 Checking NEAR configuration...${NC}"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    yarn create:envs
fi

# Source the .env file to check NEAR config
if [ -f ".env" ]; then
    export $(cat .env | grep -E '^NEAR_|^TESTNET_' | grep -v '^#' | xargs)
fi

# Check NEAR configuration
if [ -z "$NEAR_NETWORK_ID" ]; then
    echo -e "${YELLOW}⚠️  NEAR_NETWORK_ID not set, using default: testnet${NC}"
    export NEAR_NETWORK_ID="testnet"
fi

if [ -z "$NEAR_HTLC_CONTRACT" ]; then
    echo -e "${YELLOW}⚠️  NEAR_HTLC_CONTRACT not set, using default: fusion-htlc.testnet${NC}"
    export NEAR_HTLC_CONTRACT="fusion-htlc.testnet"
fi

echo -e "\n${BLUE}🔧 NEAR Configuration:${NC}"
echo "  Network: ${NEAR_NETWORK_ID}"
echo "  HTLC Contract: ${NEAR_HTLC_CONTRACT}"
echo "  RPC URL: ${NEAR_RPC_URL:-https://rpc.testnet.near.org}"

# Build orchestrator if needed
echo -e "\n${BLUE}🏗️  Building orchestrator service...${NC}"
cd packages/orchestrator
if [ ! -d "dist" ]; then
    yarn build
fi
cd ../..

# Check if local services are running
echo -e "\n${BLUE}🔍 Checking local services...${NC}"

# Redis check - not currently required (using in-memory storage)
echo -e "${GREEN}✓ Using in-memory session storage (Redis not required)${NC}"

# Check if Hardhat node is running
if ! curl -s http://localhost:8545 > /dev/null 2>&1; then
    echo -e "${YELLOW}Starting Hardhat node...${NC}"
    yarn chain > /dev/null 2>&1 &
    sleep 5
    if curl -s http://localhost:8545 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Hardhat node started${NC}"
    else
        echo -e "${RED}❌ Failed to start Hardhat node${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Hardhat node already running${NC}"
fi

# Deploy contracts if needed
echo -e "\n${BLUE}📄 Deploying contracts...${NC}"
if [ ! -f "packages/hardhat/deployments/localhost/EscrowFactory.json" ]; then
    yarn deploy --network localhost
else
    echo -e "${GREEN}✓ Contracts already deployed${NC}"
fi

# Start orchestrator with NEAR support
echo -e "\n${BLUE}🎯 Starting orchestrator with NEAR support...${NC}"

# Check if orchestrator is already running
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Orchestrator already running${NC}"
else
    cd packages/orchestrator
    yarn dev > ../../orchestrator-near.log 2>&1 &
    ORCHESTRATOR_PID=$!
    cd ../..
    
    # Wait for orchestrator to start
    echo -n "Waiting for orchestrator to start"
    for i in {1..30}; do
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            echo -e "\n${GREEN}✓ Orchestrator started successfully${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    
    if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "\n${RED}❌ Failed to start orchestrator${NC}"
        echo "Check orchestrator-near.log for details"
        exit 1
    fi
fi

# Verify NEAR integration
echo -e "\n${BLUE}🔗 Verifying NEAR integration...${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health)
if echo "$HEALTH_RESPONSE" | grep -q "near.*true"; then
    echo -e "${GREEN}✅ NEAR integration is active${NC}"
else
    echo -e "${YELLOW}⚠️  NEAR integration status unclear${NC}"
    echo "Health response: $HEALTH_RESPONSE"
fi

echo -e "\n${GREEN}🎉 NEAR local deployment complete!${NC}"
echo -e "\n${BLUE}📊 Service Status:${NC}"
echo "  • Hardhat:     http://localhost:8545"
echo "  • Orchestrator: http://localhost:3001"
echo "  • Storage:     In-memory (Redis not required)"
echo "  • NEAR:        ${NEAR_NETWORK_ID} (${NEAR_RPC_URL:-https://rpc.testnet.near.org})"

echo -e "\n${BLUE}🔧 Next Steps:${NC}"
echo "  1. Check orchestrator logs: tail -f orchestrator-near.log"
echo "  2. Run integration tests: yarn test:integration"
echo "  3. Access API docs: http://localhost:3001/api-docs"

echo -e "\n${YELLOW}💡 Tips:${NC}"
echo "  • To stop all services: yarn stop"
echo "  • To check status: yarn status"
echo "  • To view logs: yarn logs"