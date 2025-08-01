#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Integration Test Suite${NC}"
echo "=================================="

# Check if required services are installed
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js is required but not installed.${NC}" >&2; exit 1; }
command -v yarn >/dev/null 2>&1 || { echo -e "${RED}Yarn is required but not installed.${NC}" >&2; exit 1; }

# Set test environment
export NODE_ENV=test
export LOG_LEVEL=error

# Load test environment variables
if [ -f ".env.test" ]; then
  export $(cat .env.test | grep -v '^#' | xargs)
fi

# Start services
echo -e "\n${BLUE}📦 Starting local services...${NC}"

# Start local blockchain
echo "Starting Hardhat node..."
yarn chain > hardhat.log 2>&1 &
CHAIN_PID=$!
sleep 5

# Check if chain started
if ! curl -s http://localhost:8545 > /dev/null; then
  echo -e "${RED}Failed to start Hardhat node${NC}"
  cat hardhat.log
  exit 1
fi
echo -e "${GREEN}✓ Hardhat node running${NC}"

# Redis is not currently used - using in-memory storage
# Uncomment below if Redis is needed in the future
# if ! pgrep -x "redis-server" > /dev/null; then
#   echo "Starting Redis..."
#   redis-server > redis.log 2>&1 &
#   REDIS_PID=$!
#   sleep 2
# fi
echo -e "${GREEN}✓ Using in-memory session storage${NC}"

# Start orchestrator
echo "Starting Orchestrator service..."
cd packages/orchestrator
yarn dev > ../../orchestrator.log 2>&1 &
ORCHESTRATOR_PID=$!
cd ../..
sleep 5

# Check if orchestrator started
if ! curl -s http://localhost:3001/health > /dev/null; then
  echo -e "${RED}Failed to start Orchestrator${NC}"
  cat orchestrator.log
  kill $CHAIN_PID 2>/dev/null
  exit 1
fi
echo -e "${GREEN}✓ Orchestrator running${NC}"

# Function to run tests and capture results
run_test_suite() {
  local suite_name=$1
  local test_command=$2
  local working_dir=$3
  
  echo -e "\n${BLUE}🧪 Running ${suite_name}...${NC}"
  
  if [ -n "$working_dir" ]; then
    cd $working_dir
  fi
  
  if eval $test_command; then
    echo -e "${GREEN}✅ ${suite_name} passed${NC}"
    return 0
  else
    echo -e "${RED}❌ ${suite_name} failed${NC}"
    return 1
  fi
  
  if [ -n "$working_dir" ]; then
    cd - > /dev/null
  fi
}

# Initialize test results
TESTS_PASSED=0
TESTS_FAILED=0

# Run test suites
echo -e "\n${BLUE}🧪 Running test suites...${NC}"
echo "========================="

# 1. Ethereum Hub Unit Tests
if run_test_suite "Ethereum Hub Unit Tests" "yarn test test/ethereum-hub/unit/*.test.ts" "packages/hardhat"; then
  ((TESTS_PASSED++))
else
  ((TESTS_FAILED++))
fi

# 2. Orchestrator Unit Tests
if run_test_suite "Orchestrator Unit Tests" "yarn test" "packages/orchestrator"; then
  ((TESTS_PASSED++))
else
  ((TESTS_FAILED++))
fi

# 3. Orchestrator Integration Tests
if run_test_suite "Orchestrator Integration Tests" "yarn test:integration" "packages/orchestrator"; then
  ((TESTS_PASSED++))
else
  ((TESTS_FAILED++))
fi

# 4. Cross-Service Integration Tests
if run_test_suite "Cross-Service Integration Tests" "npx ts-node tests/integration/cross-service.test.ts" "."; then
  ((TESTS_PASSED++))
else
  ((TESTS_FAILED++))
fi

# Cleanup
echo -e "\n${BLUE}🧹 Cleaning up...${NC}"
kill $CHAIN_PID $ORCHESTRATOR_PID 2>/dev/null
# Redis cleanup not needed (not using Redis)
# if [ -n "$REDIS_PID" ]; then
#   kill $REDIS_PID 2>/dev/null
# fi

# Remove log files
rm -f hardhat.log orchestrator.log

# Report results
echo -e "\n${BLUE}📊 Test Results:${NC}"
echo "================"
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
echo -e "Total test suites: ${TOTAL_TESTS}"
echo -e "${GREEN}✓ Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}✗ Failed: ${TESTS_FAILED}${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "\n${GREEN}🎉 All tests passed!${NC}"
  exit 0
else
  echo -e "\n${RED}⚠️  Some tests failed. Please review the output above.${NC}"
  exit 1
fi