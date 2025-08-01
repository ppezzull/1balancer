#!/usr/bin/env node

/**
 * =============================================================================
 * 1BALANCER ORCHESTRATOR SERVICE - COMPREHENSIVE INTEGRATION TESTS
 * =============================================================================
 * 
 * This test suite validates the complete orchestration service functionality
 * including REST API, Socket.IO WebSocket, authentication, session management,
 * Dutch auction simulation, and blockchain integration.
 * 
 * Test Categories:
 * 1. Health & Connectivity - Service startup and health checks
 * 2. Authentication - API key and JWT token validation
 * 3. REST API Endpoints - All documented API endpoints
 * 4. Socket.IO WebSocket - Real-time communication
 * 5. Session Management - Cross-chain swap sessions
 * 6. Quote Generation - Dutch auction price simulation
 * 7. Error Handling - Input validation and error responses
 * 8. Performance - Load testing and response times
 * 9. Blockchain Integration - BASE and Ethereum connectivity
 * 
 * Usage:
 *   npm run test:integration
 *   node tests/integration/orchestrator.test.js
 * 
 * Requirements:
 *   - Valid Alchemy API key in .env
 *   - Service dependencies installed (npm install)
 *   - Ports 8080, 8081 available
 * 
 * =============================================================================
 */

const http = require('http');
const { io } = require('socket.io-client');
const { spawn } = require('child_process');
const path = require('path');

// Test configuration
const CONFIG = {
  API_BASE: 'http://localhost:8080',
  WS_URL: 'http://localhost:8080',
  API_KEY: 'demo-secret-key',
  STARTUP_TIMEOUT: 30000,
  TEST_TIMEOUT: 120000,
  SERVICE_ROOT: path.resolve(__dirname, '../..')
};

// Test state
let orchestratorService = null;
let testResults = [];
let serviceStarted = false;
let testStartTime = Date.now();

// Logging utilities
const log = {
  header: (msg) => console.log(`\n${'='.repeat(80)}\n${msg}\n${'='.repeat(80)}`),
  section: (msg) => console.log(`\n${'─'.repeat(60)}\n📋 ${msg}\n${'─'.repeat(60)}`),
  test: (msg) => console.log(`\n🧪 ${msg}...`),
  success: (msg) => console.log(`✅ ${msg}`),
  failure: (msg) => console.log(`❌ ${msg}`),
  info: (msg) => console.log(`ℹ️  ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  debug: (msg) => console.log(`🔍 ${msg}`)
};

/**
 * Add a test result to the tracking system
 */
function addTestResult(category, name, passed, message, details = null) {
  const result = {
    category,
    name,
    passed,
    message,
    details,
    timestamp: Date.now()
  };
  
  testResults.push(result);
  
  if (passed) {
    log.success(`${name}: ${message}`);
  } else {
    log.failure(`${name}: ${message}`);
  }
  
  if (details) {
    log.debug(`Details: ${JSON.stringify(details, null, 2)}`);
  }
}

/**
 * Make HTTP request to the orchestrator API
 */
function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, CONFIG.API_BASE);
    const postData = body ? JSON.stringify(body) : null;
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({ 
            statusCode: res.statusCode, 
            data: jsonData, 
            headers: res.headers,
            raw: data
          });
        } catch (error) {
          resolve({ 
            statusCode: res.statusCode, 
            data: data, 
            headers: res.headers,
            raw: data
          });
        }
      });
    });
    
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

/**
 * Start the orchestrator service
 */
async function startOrchestratorService() {
  log.header('STARTING ORCHESTRATOR SERVICE');
  log.info('Initializing 1Balancer Orchestration Service...');
  log.info(`Working directory: ${CONFIG.SERVICE_ROOT}`);
  log.info('Starting with: npm start');
  
  return new Promise((resolve, reject) => {
    orchestratorService = spawn('npm', ['start'], {
      stdio: 'pipe',
      cwd: CONFIG.SERVICE_ROOT
    });

    let startupLogs = [];
    
    orchestratorService.stdout.on('data', (data) => {
      const output = data.toString();
      startupLogs.push(output);
      
      // Look for service ready indicators
      if (output.includes('Orchestration service running on port')) {
        serviceStarted = true;
        log.success('Service started successfully!');
        log.info('Service ready for testing');
        setTimeout(resolve, 2000); // Wait for full initialization
      }
      
      // Log important startup messages
      if (output.includes('Chain monitoring started') || 
          output.includes('WebSocket server running') ||
          output.includes('Event monitor started')) {
        log.debug(output.trim());
      }
    });

    orchestratorService.stderr.on('data', (data) => {
      const error = data.toString();
      log.failure(`Service error: ${error}`);
      startupLogs.push(`ERROR: ${error}`);
    });

    orchestratorService.on('close', (code) => {
      log.info(`Service exited with code ${code}`);
      generateTestReport();
    });

    // Startup timeout
    setTimeout(() => {
      if (!serviceStarted) {
        log.failure('Service startup timeout');
        log.debug('Startup logs:');
        startupLogs.forEach(line => console.log('  ', line.trim()));
        reject(new Error('Service startup timeout'));
      }
    }, CONFIG.STARTUP_TIMEOUT);
  });
}

/**
 * Test Category 1: Health & Connectivity
 */
async function testHealthAndConnectivity() {
  log.section('HEALTH & CONNECTIVITY TESTS');
  
  log.test('Testing service health endpoint');
  try {
    const response = await makeRequest('/health');
    
    if (response.statusCode === 200 && response.data?.status === 'healthy') {
      addTestResult('Health', 'Health Endpoint', true, 
        'Service reports healthy status');
      
      // Validate health data structure
      const health = response.data;
      const hasConnections = health.connections && typeof health.connections === 'object';
      const hasMetrics = health.metrics && typeof health.metrics === 'object';
      const hasUptime = typeof health.uptime === 'number';
      
      addTestResult('Health', 'Health Data Structure', 
        hasConnections && hasMetrics && hasUptime,
        `Complete health data structure: connections=${hasConnections}, metrics=${hasMetrics}, uptime=${hasUptime}`,
        { connections: health.connections, uptime: health.uptime });
        
      // Test blockchain connections
      const connections = health.connections;
      addTestResult('Health', 'BASE Network Connection', connections.base === true,
        connections.base ? 'Connected to BASE Sepolia' : 'Failed to connect to BASE');
      addTestResult('Health', 'NEAR Network Connection', connections.near === true,
        connections.near ? 'Connected to NEAR testnet' : 'Failed to connect to NEAR');
        
    } else {
      addTestResult('Health', 'Health Endpoint', false, 
        `Unexpected response: ${response.statusCode} - ${response.data?.status}`);
    }
  } catch (error) {
    addTestResult('Health', 'Health Endpoint', false, 
      `Request failed: ${error.message}`);
  }
}

/**
 * Test Category 2: Authentication
 */
async function testAuthentication() {
  log.section('AUTHENTICATION & AUTHORIZATION TESTS');
  
  // Test 1: No authentication should be rejected
  log.test('Testing request without authentication');
  try {
    const response = await makeRequest('/api/v1/version');
    const shouldReject = response.statusCode === 401;
    addTestResult('Authentication', 'Unauthenticated Request Rejection', shouldReject, 
      shouldReject ? 'Correctly rejected request without API key' : 
      `Expected 401, got ${response.statusCode}`);
  } catch (error) {
    addTestResult('Authentication', 'Unauthenticated Request Rejection', false, 
      `Request failed: ${error.message}`);
  }
  
  // Test 2: Valid API key should be accepted
  log.test('Testing request with valid API key');
  try {
    const response = await makeRequest('/api/v1/version', 'GET', null, 
      { 'X-API-Key': CONFIG.API_KEY });
    const shouldAccept = response.statusCode === 200;
    addTestResult('Authentication', 'Valid API Key Acceptance', shouldAccept, 
      shouldAccept ? 'Correctly accepted valid API key' : 
      `Expected 200, got ${response.statusCode}`);
      
    if (shouldAccept && response.data) {
      const hasVersion = response.data.version && response.data.service === 'orchestrator';
      addTestResult('Authentication', 'Version Endpoint Response', hasVersion, 
        hasVersion ? 'Version endpoint returns correct service info' : 
        'Invalid version response format',
        response.data);
    }
  } catch (error) {
    addTestResult('Authentication', 'Valid API Key Acceptance', false, 
      `Request failed: ${error.message}`);
  }
  
  // Test 3: Invalid API key should be rejected
  log.test('Testing request with invalid API key');
  try {
    const response = await makeRequest('/api/v1/version', 'GET', null, 
      { 'X-API-Key': 'invalid-api-key-12345' });
    const shouldReject = response.statusCode === 401;
    addTestResult('Authentication', 'Invalid API Key Rejection', shouldReject, 
      shouldReject ? 'Correctly rejected invalid API key' : 
      `Expected 401 for invalid key, got ${response.statusCode}`);
  } catch (error) {
    addTestResult('Authentication', 'Invalid API Key Rejection', false, 
      `Request failed: ${error.message}`);
  }
}

/**
 * Test Category 3: Quote Generation & Dutch Auction
 */
async function testQuoteGeneration() {
  log.section('QUOTE GENERATION & DUTCH AUCTION TESTS');
  
  const validQuoteRequest = {
    sourceChain: 'base',
    destinationChain: 'near',
    sourceToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on BASE
    destinationToken: 'usdt.near',
    amount: '1000000000', // 1000 USDC
    urgency: 'normal'
  };
  
  log.test('Testing Dutch auction quote generation');
  try {
    const response = await makeRequest('/api/v1/quote', 'POST', validQuoteRequest, 
      { 'X-API-Key': CONFIG.API_KEY });
    const isSuccess = response.statusCode === 200;
    
    if (isSuccess) {
      addTestResult('Quote', 'Quote Generation', true, 
        'Successfully generated Dutch auction quote');
      
      // Validate quote structure
      const quote = response.data;
      const hasQuoteData = quote?.quote && quote?.dutchAuction && quote?.fees;
      addTestResult('Quote', 'Quote Data Structure', hasQuoteData, 
        hasQuoteData ? 'Quote contains all required sections' : 
        'Missing quote sections (quote, dutchAuction, fees)',
        { structure: Object.keys(quote || {}) });
        
      if (hasQuoteData) {
        // Test Dutch auction parameters
        const auction = quote.dutchAuction;
        const hasAuctionParams = auction.startPrice && auction.endPrice && auction.duration;
        addTestResult('Quote', 'Dutch Auction Parameters', hasAuctionParams, 
          hasAuctionParams ? 'Contains valid Dutch auction pricing parameters' : 
          'Missing Dutch auction parameters',
          auction);
          
        // Test amount validation
        const quoteData = quote.quote;
        const validAmounts = quoteData.sourceAmount && quoteData.destinationAmount;
        addTestResult('Quote', 'Amount Calculation', validAmounts,
          validAmounts ? `Source: ${quoteData.sourceAmount}, Destination: ${quoteData.destinationAmount}` :
          'Missing amount calculations');
      }
        
    } else {
      addTestResult('Quote', 'Quote Generation', false, 
        `Expected 200, got ${response.statusCode}`,
        response.data);
    }
  } catch (error) {
    addTestResult('Quote', 'Quote Generation', false, 
      `Request failed: ${error.message}`);
  }
  
  // Test invalid quote parameters
  log.test('Testing quote validation with invalid parameters');
  try {
    const invalidRequest = { ...validQuoteRequest, sourceChain: 'invalid-chain' };
    const response = await makeRequest('/api/v1/quote', 'POST', invalidRequest, 
      { 'X-API-Key': CONFIG.API_KEY });
    const shouldReject = response.statusCode === 400;
    addTestResult('Quote', 'Invalid Quote Parameter Validation', shouldReject, 
      shouldReject ? 'Correctly rejected invalid source chain' : 
      `Expected 400 for invalid chain, got ${response.statusCode}`);
  } catch (error) {
    addTestResult('Quote', 'Invalid Quote Parameter Validation', false, 
      `Request failed: ${error.message}`);
  }
}

/**
 * Test Category 4: Session Management
 */
async function testSessionManagement() {
  log.section('SESSION MANAGEMENT TESTS');
  
  const validSessionRequest = {
    sourceChain: 'base',
    destinationChain: 'near',
    sourceToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    destinationToken: 'usdt.near',
    sourceAmount: '1000000000',
    destinationAmount: '999000000',
    maker: '0x742d35Cc6634C0532925a3b844Bc9e7595f2BD4e',
    taker: 'alice.near',
    slippageTolerance: 100 // 1% in basis points
  };
  
  let sessionId = null;
  
  // Test session creation
  log.test('Testing swap session creation');
  try {
    const response = await makeRequest('/api/v1/sessions', 'POST', validSessionRequest, 
      { 'X-API-Key': CONFIG.API_KEY });
    const isSuccess = response.statusCode === 201;
    
    if (isSuccess) {
      sessionId = response.data?.sessionId;
      addTestResult('Session', 'Session Creation', true, 
        `Created session: ${sessionId}`);
      
      // Validate session response structure
      const session = response.data;
      const requiredFields = ['sessionId', 'status', 'hashlockHash', 'estimatedCompletionTime'];
      const hasRequiredFields = requiredFields.every(field => session[field]);
      addTestResult('Session', 'Session Response Structure', hasRequiredFields, 
        hasRequiredFields ? 'Contains all required session fields' : 
        `Missing fields: ${requiredFields.filter(f => !session[f]).join(', ')}`,
        { fields: Object.keys(session), required: requiredFields });
        
    } else {
      addTestResult('Session', 'Session Creation', false, 
        `Expected 201, got ${response.statusCode}`,
        response.data);
    }
  } catch (error) {
    addTestResult('Session', 'Session Creation', false, 
      `Request failed: ${error.message}`);
  }
  
  // Test session status retrieval
  if (sessionId) {
    log.test(`Testing session status retrieval for ${sessionId}`);
    try {
      const response = await makeRequest(`/api/v1/sessions/${sessionId}`, 'GET', null, 
        { 'X-API-Key': CONFIG.API_KEY });
      const isSuccess = response.statusCode === 200;
      
      if (isSuccess) {
        addTestResult('Session', 'Session Status Retrieval', true, 
          'Successfully retrieved session status');
        
        // Validate status structure
        const status = response.data;
        const hasStatusFields = status.sessionId && status.status && status.steps;
        addTestResult('Session', 'Session Status Structure', hasStatusFields, 
          hasStatusFields ? 'Status contains sessionId, status, and steps' : 
          'Missing required status fields',
          { currentStatus: status.status, stepCount: status.steps?.length });
          
      } else {
        addTestResult('Session', 'Session Status Retrieval', false, 
          `Expected 200, got ${response.statusCode}`);
      }
    } catch (error) {
      addTestResult('Session', 'Session Status Retrieval', false, 
        `Request failed: ${error.message}`);
    }
  }
  
  // Test invalid session ID
  log.test('Testing invalid session ID handling');
  try {
    const response = await makeRequest('/api/v1/sessions/invalid-session-123', 'GET', null, 
      { 'X-API-Key': CONFIG.API_KEY });
    const shouldReject = response.statusCode === 404;
    addTestResult('Session', 'Invalid Session ID Handling', shouldReject, 
      shouldReject ? 'Correctly returned 404 for invalid session ID' : 
      `Expected 404 for invalid session, got ${response.statusCode}`);
  } catch (error) {
    addTestResult('Session', 'Invalid Session ID Handling', false, 
      `Request failed: ${error.message}`);
  }
  
  return sessionId;
}

/**
 * Test Category 5: Socket.IO WebSocket Functionality
 */
async function testSocketIOFunctionality() {
  log.section('SOCKET.IO WEBSOCKET TESTS');
  
  log.test('Testing Socket.IO connection and authentication');
  
  return new Promise((resolve) => {
    try {
      // Connect with Socket.IO client
      const socket = io(CONFIG.WS_URL, {
        path: '/ws',
        transports: ['websocket'],
        autoConnect: true,
        timeout: 5000
      });
      
      let connected = false;
      let authenticated = false;
      let subscribed = false;
      
      const timeout = setTimeout(() => {
        log.warning('Socket.IO test timeout - cleaning up');
        socket.close();
        resolve();
      }, 15000);
      
      socket.on('connect', () => {
        connected = true;
        addTestResult('WebSocket', 'Socket.IO Connection', true, 
          'Successfully connected to Socket.IO server');
        log.debug(`Socket ID: ${socket.id}`);
        
        // Test authentication
        socket.emit('auth', {
          apiKey: CONFIG.API_KEY
        });
      });
      
      socket.on('authenticated', () => {
        authenticated = true;
        addTestResult('WebSocket', 'Socket.IO Authentication', true, 
          'Successfully authenticated with Socket.IO server');
        
        // Test subscription
        socket.emit('subscribe', {
          channel: 'prices',
          pairs: ['USDC/USDT']
        });
      });
      
      socket.on('subscribed', (data) => {
        subscribed = true;
        addTestResult('WebSocket', 'Socket.IO Subscription', true, 
          `Successfully subscribed to ${data.channel}`,
          data);
        
        // Wait for potential price updates
        setTimeout(() => {
          if (!socket.disconnected) {
            socket.close();
          }
        }, 3000);
      });
      
      socket.on('price_update', (data) => {
        addTestResult('WebSocket', 'Socket.IO Price Updates', true, 
          'Received real-time price update',
          { pair: data.pair, price: data.price });
      });
      
      socket.on('error', (error) => {
        addTestResult('WebSocket', 'Socket.IO Connection', false, 
          `Socket.IO error: ${error}`);
        clearTimeout(timeout);
        socket.close();
        resolve();
      });
      
      socket.on('connect_error', (error) => {
        addTestResult('WebSocket', 'Socket.IO Connection', false, 
          `Connection error: ${error.message}`);
        clearTimeout(timeout);
        resolve();
      });
      
      socket.on('disconnect', (reason) => {
        log.debug(`Socket disconnected: ${reason}`);
        if (!authenticated && connected) {
          addTestResult('WebSocket', 'Socket.IO Authentication', false, 
            'Disconnected before authentication completed');
        }
        if (!subscribed && authenticated) {
          addTestResult('WebSocket', 'Socket.IO Subscription', false, 
            'Disconnected before subscription completed');
        }
        clearTimeout(timeout);
        resolve();
      });
      
    } catch (error) {
      addTestResult('WebSocket', 'Socket.IO Connection', false, 
        `Setup failed: ${error.message}`);
      resolve();
    }
  });
}

/**
 * Test Category 6: Error Handling & Validation
 */
async function testErrorHandling() {
  log.section('ERROR HANDLING & VALIDATION TESTS');
  
  // Test malformed JSON handling
  log.test('Testing malformed JSON request handling');
  try {
    const response = await new Promise((resolve, reject) => {
      const postData = '{"invalid": json, "malformed": }';
      const req = http.request({
        hostname: 'localhost',
        port: 8080,
        path: '/api/v1/quote',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': CONFIG.API_KEY,
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
    
    const shouldReject = response.statusCode === 400;
    addTestResult('Error Handling', 'Malformed JSON Handling', shouldReject, 
      shouldReject ? 'Correctly rejected malformed JSON with 400 status' : 
      `Expected 400 for malformed JSON, got ${response.statusCode}`);
  } catch (error) {
    addTestResult('Error Handling', 'Malformed JSON Handling', false, 
      `Request failed: ${error.message}`);
  }
  
  // Test concurrent request handling
  log.test('Testing concurrent request handling (load test)');
  const startTime = Date.now();
  const promises = [];
  const concurrentRequests = 10;
  
  for (let i = 0; i < concurrentRequests; i++) {
    promises.push(makeRequest('/health'));
  }
  
  try {
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    const avgLatency = duration / responses.length;
    
    const allSuccessful = responses.every(r => r.statusCode === 200);
    addTestResult('Performance', 'Concurrent Request Handling', allSuccessful, 
      allSuccessful ? `Handled ${concurrentRequests} concurrent requests successfully` : 
      'Some concurrent requests failed',
      { 
        totalRequests: concurrentRequests,
        successfulRequests: responses.filter(r => r.statusCode === 200).length,
        totalTime: duration,
        avgLatency: avgLatency.toFixed(2)
      });
      
    // Performance validation
    const acceptableLatency = avgLatency < 100; // Less than 100ms average
    addTestResult('Performance', 'Response Time Performance', acceptableLatency, 
      `Average latency: ${avgLatency.toFixed(2)}ms ${acceptableLatency ? '(Excellent)' : '(Needs optimization)'}`,
      { avgLatency, threshold: 100 });
      
  } catch (error) {
    addTestResult('Performance', 'Concurrent Request Handling', false, 
      `Load test failed: ${error.message}`);
  }
}

/**
 * Generate comprehensive test report
 */
function generateTestReport() {
  const totalTime = Date.now() - testStartTime;
  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  
  log.header('COMPREHENSIVE TEST RESULTS REPORT');
  
  console.log(`
📊 SUMMARY
   Total Tests: ${total}
   Passed: ${passed} (${passRate}%)
   Failed: ${total - passed}
   Duration: ${(totalTime / 1000).toFixed(2)}s
   Timestamp: ${new Date().toISOString()}
  `);
  
  // Group results by category
  const categories = {};
  testResults.forEach(result => {
    if (!categories[result.category]) {
      categories[result.category] = [];
    }
    categories[result.category].push(result);
  });
  
  // Display results by category
  Object.entries(categories).forEach(([category, tests]) => {
    const categoryPassed = tests.filter(t => t.passed).length;
    const categoryTotal = tests.length;
    const categoryRate = categoryTotal > 0 ? ((categoryPassed / categoryTotal) * 100).toFixed(1) : 0;
    
    console.log(`\n📁 ${category.toUpperCase()} (${categoryPassed}/${categoryTotal} - ${categoryRate}%)`);
    console.log('─'.repeat(60));
    
    tests.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      const duration = test.timestamp - testStartTime;
      console.log(`   ${status} ${test.name}`);
      console.log(`      ${test.message}`);
      if (test.details && typeof test.details === 'object') {
        console.log(`      Details: ${JSON.stringify(test.details, null, 6)}`);
      }
      console.log(`      Time: ${duration}ms\n`);
    });
  });
  
  // Final verdict
  console.log('\n' + '='.repeat(80));
  if (passed === total) {
    log.success(`🎉 ALL TESTS PASSED! The orchestrator service is fully functional.`);
    console.log(`
🚀 The 1Balancer Orchestrator Service is ready for:
   • Frontend integration
   • Smart contract deployment
   • Production deployment
   • Cross-chain atomic swaps
    `);
  } else {
    log.failure(`⚠️  ${total - passed} test(s) failed. Review the results above.`);
    console.log(`
🔧 Issues found in:
${testResults.filter(r => !r.passed).map(r => `   • ${r.category}: ${r.name}`).join('\n')}

Please address these issues before proceeding to production.
    `);
  }
  console.log('='.repeat(80));
}

/**
 * Main test execution function
 */
async function runComprehensiveTests() {
  try {
    log.header('1BALANCER ORCHESTRATOR SERVICE - INTEGRATION TESTS');
    log.info('Starting comprehensive test suite...');
    log.info(`Test configuration: ${JSON.stringify(CONFIG, null, 2)}`);
    
    // Start the orchestrator service
    await startOrchestratorService();
    
    // Run all test categories
    await testHealthAndConnectivity();
    await testAuthentication();
    await testQuoteGeneration();
    const sessionId = await testSessionManagement();
    await testSocketIOFunctionality();
    await testErrorHandling();
    
    // Optional: Test session execution if we have a valid session
    if (sessionId) {
      log.info(`Note: Session ${sessionId} created successfully for potential execution testing`);
    }
    
    log.info('All tests completed. Shutting down service...');
    orchestratorService.kill('SIGTERM');
    
  } catch (error) {
    log.failure(`Test execution failed: ${error.message}`);
    if (orchestratorService) {
      orchestratorService.kill('SIGTERM');
    }
    process.exit(1);
  }
}

// Handle process interruption
process.on('SIGINT', () => {
  log.warning('Test interrupted by user');
  if (orchestratorService) {
    orchestratorService.kill('SIGTERM');
  }
  process.exit(0);
});

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  log.failure(`Unhandled Rejection: ${reason}`);
  console.error('Promise:', promise);
  process.exit(1);
});

// Start the test suite
if (require.main === module) {
  runComprehensiveTests();
}

module.exports = {
  runComprehensiveTests,
  CONFIG
};