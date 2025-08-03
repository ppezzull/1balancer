#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk').default || require('chalk');

const ORCHESTRATOR_URL = 'http://localhost:8080';
const API_KEY = 'demo-secret-key';

async function testOrchestratorAPI() {
  console.log(chalk.cyan.bold('\n🧪 Testing Orchestrator API\n'));

  // Test 1: Health endpoint
  try {
    console.log(chalk.yellow('Testing health endpoint...'));
    const health = await axios.get(`${ORCHESTRATOR_URL}/health`);
    console.log(chalk.green('✅ Health check passed'));
    console.log(chalk.gray(JSON.stringify(health.data, null, 2)));
  } catch (error) {
    console.log(chalk.red('❌ Health check failed:'), error.message);
  }

  // Test 2: Create session endpoint
  try {
    console.log(chalk.yellow('\nTesting session creation...'));
    const sessionData = {
      sourceChain: 'base',
      destinationChain: 'near',
      sourceToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC address
      destinationToken: 'near', // NEAR native token
      sourceAmount: '1000000', // 1 USDC
      destinationAmount: '1000000000000000000000000', // 1 NEAR
      maker: '0x742d35Cc6634C0532925a3b844Bc9e7595f2BD4e',
      taker: 'alice.testnet',
      slippageTolerance: 50 // 0.5%
    };

    const response = await axios.post(
      `${ORCHESTRATOR_URL}/api/v1/sessions`,
      sessionData,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        }
      }
    );
    
    console.log(chalk.green('✅ Session created successfully'));
    console.log(chalk.gray(JSON.stringify(response.data, null, 2)));
  } catch (error) {
    console.log(chalk.red('❌ Session creation failed:'));
    if (error.response) {
      console.log(chalk.red('   Status:'), error.response.status);
      console.log(chalk.red('   Error:'), error.response.data);
    } else {
      console.log(chalk.red('   Error:'), error.message);
    }
  }

  // Test 3: Check available endpoints
  try {
    console.log(chalk.yellow('\nChecking API endpoints...'));
    // Try to get API docs or routes
    const endpoints = [
      '/api/v1/quotes',
      '/api/v1/sessions',
      '/api/v1/status'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${ORCHESTRATOR_URL}${endpoint}`, {
          headers: { 'X-API-Key': API_KEY },
          validateStatus: () => true
        });
        console.log(chalk.gray(`  ${endpoint}: ${response.status} ${response.statusText}`));
      } catch (error) {
        console.log(chalk.gray(`  ${endpoint}: Failed`));
      }
    }
  } catch (error) {
    console.log(chalk.red('❌ Endpoint check failed:'), error.message);
  }

  console.log(chalk.cyan.bold('\n✨ API test complete\n'));
}

if (require.main === module) {
  testOrchestratorAPI().catch(error => {
    console.error(chalk.red('\n❌ Test error:'), error);
    process.exit(1);
  });
}

module.exports = { testOrchestratorAPI };