/**
 * Fork-specific integration tests for the orchestrator
 */

const axios = require('axios');
const { ethers } = require('ethers');

const CONFIG = {
  API_BASE: 'http://localhost:8080',
  API_KEY: 'demo-secret-key',
  FORK_RPC: 'http://localhost:8545'
};

async function runForkIntegrationTests() {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  const runTest = async (name, testFn) => {
    results.total++;
    try {
      await testFn();
      results.passed++;
      results.tests.push({ name, passed: true });
      console.log(`  ✅ ${name}`);
    } catch (error) {
      results.failed++;
      results.tests.push({ name, passed: false, error: error.message });
      console.log(`  ❌ ${name}: ${error.message}`);
    }
  };

  console.log('\n🧪 Running fork-specific integration tests...\n');

  // Test 1: Connect to fork
  await runTest('Connect to forked network', async () => {
    const provider = new ethers.JsonRpcProvider(CONFIG.FORK_RPC);
    const network = await provider.getNetwork();
    if (!network.chainId) throw new Error('Failed to connect to fork');
  });

  // Test 2: Check orchestrator health on fork
  await runTest('Orchestrator health check on fork', async () => {
    const response = await axios.get(`${CONFIG.API_BASE}/health`);
    if (response.data.status !== 'healthy') {
      throw new Error('Orchestrator not healthy on fork');
    }
    if (!response.data.connections.base) {
      throw new Error('Not connected to BASE fork');
    }
  });

  // Test 3: Create quote with real mainnet tokens
  await runTest('Generate quote with mainnet tokens', async () => {
    const quoteRequest = {
      sourceChain: 'base',
      destinationChain: 'near',
      sourceToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Real USDC on BASE
      destinationToken: 'usdt.near',
      amount: '1000000000', // 1000 USDC
      urgency: 'normal'
    };

    const response = await axios.post(
      `${CONFIG.API_BASE}/api/v1/quote`,
      quoteRequest,
      { headers: { 'X-API-Key': CONFIG.API_KEY } }
    );

    if (!response.data.quote || !response.data.dutchAuction) {
      throw new Error('Invalid quote response');
    }
  });

  // Test 4: Simulate swap session with fork accounts
  await runTest('Create swap session on fork', async () => {
    // Get a funded account from fork
    const provider = new ethers.JsonRpcProvider(CONFIG.FORK_RPC);
    const accounts = await provider.send('eth_accounts', []);
    
    const sessionRequest = {
      sourceChain: 'base',
      destinationChain: 'near',
      sourceToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      destinationToken: 'usdt.near',
      sourceAmount: '1000000000',
      destinationAmount: '999000000',
      maker: accounts[0], // Use fork account
      taker: 'alice.near',
      slippageTolerance: 100
    };

    const response = await axios.post(
      `${CONFIG.API_BASE}/api/v1/sessions`,
      sessionRequest,
      { headers: { 'X-API-Key': CONFIG.API_KEY } }
    );

    if (!response.data.sessionId) {
      throw new Error('Failed to create session');
    }
  });

  // Test 5: Check gas estimation on fork
  await runTest('Gas estimation on forked network', async () => {
    const provider = new ethers.JsonRpcProvider(CONFIG.FORK_RPC);
    const gasPrice = await provider.getFeeData();
    
    if (!gasPrice.gasPrice || gasPrice.gasPrice === 0n) {
      throw new Error('Invalid gas price on fork');
    }
  });

  console.log(`\n📊 Fork test results: ${results.passed}/${results.total} passed\n`);
  
  return results;
}

module.exports = { runForkIntegrationTests };