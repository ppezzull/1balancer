# 1Balancer Testing Guide

## Overview

This guide provides comprehensive instructions for testing the 1Balancer cross-chain atomic swap system. Our testing strategy covers unit tests, integration tests, and end-to-end testing across all services.

## Quick Start

```bash
# Run all tests
yarn test:all

# Run specific test suites
yarn hardhat:test              # Ethereum Hub unit tests
yarn orchestrator:test         # Orchestrator unit tests
yarn test:integration          # Integration tests
node scripts/test-fork.js      # Fork tests
```

## Test Architecture

```
Testing Infrastructure
├── Unit Tests
│   ├── Smart Contracts (Hardhat)
│   ├── Orchestrator Services
│   └── NEAR Contracts
├── Integration Tests
│   ├── Service-to-Service
│   ├── Chain Interactions
│   └── WebSocket Events
└── E2E Tests
    ├── Fork Testing
    ├── Cross-Chain Flows
    └── Performance Tests
```

## Environment Setup

### 1. Install Dependencies

```bash
# From project root
yarn install:all
```

### 2. Configure Test Environment

Create `.env.test` files in each package:

```bash
# Copy test environment templates
cp packages/hardhat/.env.test.example packages/hardhat/.env.test
cp packages/orchestrator/.env.test.example packages/orchestrator/.env.test

# Edit with your test values
# IMPORTANT: Add your Alchemy API key for fork testing
```

### 3. Start Test Infrastructure

```bash
# Start Redis (required for orchestrator tests)
redis-server

# For integration tests, services will be started automatically
```

## Test Suites

### 1. Ethereum Hub Tests

#### Unit Tests
Location: `packages/hardhat/test/ethereum-hub/unit/`

```bash
# Run all unit tests
cd packages/hardhat
yarn test

# Run specific test file
yarn test test/ethereum-hub/unit/AtomicSwapERC20.test.ts

# Run with coverage
yarn test:coverage
```

Tests include:
- Contract deployment and initialization
- Swap creation with dynamic values
- Secret revelation and completion
- Timeout and refund scenarios
- Fee calculations
- Batch operations
- Access control

#### Fork Tests
Location: `packages/hardhat/test/ethereum-hub/fork/`

```bash
# Run fork tests (requires Alchemy API key)
node scripts/test-fork.js

# Or manually:
yarn fork  # In one terminal
yarn hardhat:test test/ethereum-hub/fork/*.test.ts --network localhost
```

Fork tests verify:
- Interaction with real BASE mainnet tokens
- Gas consumption measurements
- Integration with existing DeFi protocols
- Real token transfers and approvals

### 2. Orchestrator Tests

#### Unit Tests
Location: `packages/orchestrator/tests/unit/`

```bash
cd packages/orchestrator
yarn test

# Watch mode
yarn test:watch
```

Tests include:
- Session management lifecycle
- Secret generation and encryption
- State transitions
- Event handling
- Error scenarios

#### Integration Tests
Location: `packages/orchestrator/tests/integration/`

```bash
# Run orchestrator integration tests
yarn test:integration

# Or from root:
yarn orchestrator:test:integration
```

Integration tests verify:
- REST API endpoints
- WebSocket connections
- Health checks
- Rate limiting
- Concurrent request handling

### 3. Cross-Service Integration Tests

Location: `tests/integration/`

```bash
# Run all integration tests
./scripts/run-integration-tests.sh

# Run specific integration test
npx ts-node tests/integration/cross-service.test.ts
```

These tests verify:
- Complete swap flow across services
- Event propagation
- Error handling between services
- Timeout coordination

## Test Configuration

### Dynamic Test Values

All test values are configured in `test-config.json` files:

```json
{
  "chains": {
    "base": {
      "chainId": 84532,
      "tokens": {
        "USDC": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "WETH": "0x4200000000000000000000000000000000000006"
      }
    },
    "near": {
      "tokens": {
        "USDC": "usdc.fakes.testnet",
        "wNEAR": "wrap.testnet"
      }
    }
  }
}
```

### No Hardcoded Values

Tests use configuration files and environment variables:
- Contract addresses from config
- Private keys from test accounts
- Timeouts calculated dynamically
- Amounts based on token decimals

## Running Tests in Different Modes

### 1. Development Mode

```bash
# Watch mode for TDD
yarn test:watch

# Run specific test suite
yarn test SessionManager
```

### 2. CI/CD Mode

```bash
# Run all tests with coverage
yarn test:ci

# Generate coverage reports
yarn test:coverage
open coverage/lcov-report/index.html
```

### 3. Performance Testing

```bash
# Run performance benchmarks
yarn test:perf

# Load testing
yarn test:load
```

## Test Scenarios

### 1. Happy Path Testing

```typescript
// Example: Complete swap flow
it('should complete cross-chain swap successfully', async () => {
  // 1. Create session
  const session = await createSwapSession();
  
  // 2. Lock on source chain
  await lockSourceChain(session.secretHash);
  
  // 3. Lock on destination chain
  await lockDestinationChain(session.secretHash);
  
  // 4. Complete swap
  await completeSwap(session.secret);
  
  // Verify final state
  expect(session.status).toBe('completed');
});
```

### 2. Error Scenarios

```typescript
// Example: Timeout handling
it('should refund after timeout', async () => {
  // Create swap with short timeout
  const swap = await createSwapWithTimeout(300); // 5 minutes
  
  // Advance time
  await time.increase(301);
  
  // Attempt refund
  await refundSwap(swap.id);
  
  // Verify refund
  expect(swap.status).toBe('refunded');
});
```

### 3. Edge Cases

```typescript
// Example: Concurrent operations
it('should handle concurrent swap creation', async () => {
  const promises = Array(10).fill(null).map(() => 
    createSwapSession()
  );
  
  const sessions = await Promise.all(promises);
  
  // All should succeed with unique IDs
  const uniqueIds = new Set(sessions.map(s => s.id));
  expect(uniqueIds.size).toBe(10);
});
```

## Debugging Tests

### 1. Enable Debug Logging

```bash
# Set debug environment
export DEBUG=1balancer:*
export LOG_LEVEL=debug

# Run tests with verbose output
yarn test --verbose
```

### 2. Inspect Test State

```typescript
// Add debug helpers in tests
beforeEach(() => {
  console.log('Test state:', {
    accounts: testAccounts,
    contracts: deployedContracts,
    config: currentConfig
  });
});
```

### 3. Transaction Debugging

```typescript
// Capture and log transaction details
const tx = await contract.method();
const receipt = await tx.wait();
console.log('Gas used:', receipt.gasUsed.toString());
console.log('Events:', receipt.events);
```

## Test Best Practices

### 1. Test Structure

```typescript
describe('Component', () => {
  // Setup
  beforeEach(async () => {
    // Fresh state for each test
  });

  describe('Feature', () => {
    it('should behave correctly', async () => {
      // Arrange
      const input = prepareTestData();
      
      // Act
      const result = await performAction(input);
      
      // Assert
      expect(result).toMatchExpectation();
    });
  });
});
```

### 2. Async Testing

```typescript
// Always use async/await
it('should handle async operations', async () => {
  const result = await asyncOperation();
  expect(result).toBeDefined();
});

// Handle promises properly
it('should reject on error', async () => {
  await expect(failingOperation()).rejects.toThrow('Expected error');
});
```

### 3. Test Isolation

```typescript
// Use fixtures for consistent setup
async function deployFixture() {
  const [owner, user1, user2] = await ethers.getSigners();
  const contract = await deployContract();
  return { contract, owner, user1, user2 };
}

// Load fixture in each test
it('test case', async () => {
  const { contract, user1 } = await loadFixture(deployFixture);
  // Test logic
});
```

## Monitoring Test Health

```bash
# Check test health
node scripts/test-health.js

# View coverage trends
yarn test:coverage:history

# Generate test reports
yarn test:report
```

## Troubleshooting

### Common Issues

1. **Fork tests failing**
   - Ensure `ALCHEMY_API_KEY` is set
   - Check network connectivity
   - Verify block number is recent

2. **Integration tests timeout**
   - Increase timeout in test config
   - Check service startup logs
   - Ensure Redis is running

3. **WebSocket tests flaky**
   - Add proper connection wait
   - Use event promises
   - Check for race conditions

### Debug Commands

```bash
# Check service health
curl http://localhost:3001/health

# View service logs
tail -f orchestrator.log

# Monitor Redis
redis-cli MONITOR

# Check port usage
lsof -i :3001,3002,8545
```

## Continuous Improvement

### Adding New Tests

1. Create test file in appropriate directory
2. Follow naming convention: `*.test.ts` or `*.test.js`
3. Include in test suite configuration
4. Update this documentation

### Coverage Goals

- Unit Tests: > 80% coverage
- Integration Tests: All critical paths
- E2E Tests: Main user flows

### Performance Benchmarks

Track and improve:
- Contract gas usage
- API response times
- WebSocket latency
- Concurrent request handling

## Resources

- [Hardhat Testing Guide](https://hardhat.org/tutorial/testing-contracts)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Chai Assertions](https://www.chaijs.com/api/bdd/)
- [Socket.IO Testing](https://socket.io/docs/v4/testing/)

---

For questions or issues, check the logs in the respective package directories or run tests with increased verbosity.