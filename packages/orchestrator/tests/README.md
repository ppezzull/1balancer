# Orchestrator Service Tests

This directory contains comprehensive tests for the 1Balancer Orchestrator Service.

## Test Structure

```
tests/
├── README.md                           # This file
├── setup.ts                           # Jest test setup
└── integration/
    └── orchestrator.test.js           # Full integration test suite
```

## Integration Tests

The main integration test suite (`integration/orchestrator.test.js`) provides comprehensive testing of:

### 🏥 Health & Connectivity Tests
- Service startup and health endpoint
- Blockchain network connectivity (BASE, Ethereum, NEAR)
- Service component initialization

### 🔐 Authentication & Authorization Tests
- API key validation
- Request rejection without authentication
- Invalid API key handling
- JWT token support (via Socket.IO)

### 💰 Quote Generation & Dutch Auction Tests
- Quote generation for cross-chain swaps
- Dutch auction price simulation
- Input validation and error handling
- Quote data structure validation

### 🔄 Session Management Tests
- Swap session creation
- Session status retrieval
- Session state transitions
- Invalid session ID handling

### 📡 Socket.IO WebSocket Tests
- Real-time connection establishment
- Authentication via Socket.IO
- Channel subscriptions (prices, sessions)
- Event broadcasting and reception

### 🚨 Error Handling & Validation Tests
- Malformed JSON request handling
- Input validation
- Concurrent request handling
- Performance benchmarking

## Running Tests

### Prerequisites
1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the service:**
   ```bash
   npm run build
   ```

3. **Configure environment:**
   - Ensure `.env` file has valid API keys (especially Alchemy)
   - Ports 8080, 8081 must be available

### Run Integration Tests
```bash
# Run full integration test suite
npm run test:integration

# Or run directly
node tests/integration/orchestrator.test.js
```

### Run All Tests
```bash
# Run both unit tests (Jest) and integration tests
npm run test:all
```

## Test Output

The integration tests provide detailed, color-coded output:

```
================================================================================
1BALANCER ORCHESTRATOR SERVICE - INTEGRATION TESTS
================================================================================

────────────────────────────────────────────────────────────────
📋 HEALTH & CONNECTIVITY TESTS
────────────────────────────────────────────────────────────────

🧪 Testing service health endpoint...
✅ Health Endpoint: Service reports healthy status
✅ Health Data Structure: Complete health data structure
✅ BASE Network Connection: Connected to BASE Sepolia
✅ NEAR Network Connection: Connected to NEAR testnet

────────────────────────────────────────────────────────────────
📋 AUTHENTICATION & AUTHORIZATION TESTS
────────────────────────────────────────────────────────────────

🧪 Testing request without authentication...
✅ Unauthenticated Request Rejection: Correctly rejected request without API key
✅ Valid API Key Acceptance: Correctly accepted valid API key
✅ Version Endpoint Response: Version endpoint returns correct service info
✅ Invalid API Key Rejection: Correctly rejected invalid API key

[... continues with all test categories ...]

================================================================================
COMPREHENSIVE TEST RESULTS REPORT
================================================================================

📊 SUMMARY
   Total Tests: 22
   Passed: 22 (100.0%)
   Failed: 0
   Duration: 15.34s
   Timestamp: 2025-08-01T03:15:42.123Z
```

## Test Categories

Each test category validates specific functionality:

| Category | Tests | Purpose |
|----------|-------|---------|
| **Health** | 4 tests | Service health and network connectivity |
| **Authentication** | 4 tests | API security and access control |
| **Quote** | 4 tests | Price generation and Dutch auction |
| **Session** | 4 tests | Swap session lifecycle management |
| **WebSocket** | 3 tests | Real-time communication via Socket.IO |
| **Error Handling** | 2 tests | Error responses and validation |
| **Performance** | 2 tests | Load handling and response times |

## Configuration

Test configuration is defined in the test file:

```javascript
const CONFIG = {
  API_BASE: 'http://localhost:8080',      // REST API endpoint
  WS_URL: 'http://localhost:8080',        // Socket.IO endpoint
  API_KEY: 'demo-secret-key',             // Test API key
  STARTUP_TIMEOUT: 30000,                 // Service startup timeout
  TEST_TIMEOUT: 120000                    // Overall test timeout
};
```

## Troubleshooting

### Common Issues

1. **Service startup timeout**
   - Check if ports 8080/8081 are available
   - Verify Alchemy API key in `.env`
   - Check BASE/NEAR RPC connectivity

2. **Authentication failures**
   - Verify API key in `.env` matches test configuration
   - Check if service is using correct security middleware

3. **WebSocket connection failures**
   - Ensure Socket.IO server is running
   - Check WebSocket path configuration (`/ws`)
   - Verify Socket.IO client version compatibility

4. **Performance issues**
   - Check system resources
   - Verify network connectivity to blockchain RPCs
   - Monitor service logs for errors

### Debug Mode

For detailed debugging, the test suite includes extensive logging:
- Service startup logs
- Request/response details
- WebSocket connection events
- Error stack traces

## Writing Additional Tests

To add new tests:

1. **Add to existing categories** by extending the test functions
2. **Create new categories** by adding new test functions
3. **Update the test report** by modifying the `generateTestReport()` function

Example test addition:
```javascript
async function testNewFeature() {
  log.section('NEW FEATURE TESTS');
  
  log.test('Testing new functionality');
  try {
    // Test implementation
    addTestResult('NewFeature', 'Test Name', true, 'Test passed');
  } catch (error) {
    addTestResult('NewFeature', 'Test Name', false, `Test failed: ${error.message}`);
  }
}
```

## Continuous Integration

These tests are designed to run in CI/CD environments:
- No external dependencies beyond configured RPC endpoints
- Deterministic test results
- Comprehensive error reporting
- Machine-readable exit codes (0 = success, 1 = failure)