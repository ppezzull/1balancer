#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk').default || require('chalk');
const ora = require('ora').default || require('ora');

const CONFIG = {
  ORCHESTRATOR_URL: 'http://localhost:8080',
  API_KEY: 'demo-secret-key',
  BASE_EXPLORER: 'https://sepolia.basescan.org',
  NEAR_EXPLORER: 'https://testnet.nearblocks.io',
  CONTRACTS: {
    BASE: {
      escrowFactory: '0x135aCf86351F2113726318dE6b4ca66FA90d54Fd',
      fusionPlusHub: '0x5938297bfdeeF3ac56EB4198E0B484b2A0B3adD8'
    },
    NEAR: {
      htlc: 'fusion-htlc.rog_eth.testnet'
    }
  }
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createSession() {
  const sessionData = {
    sourceChain: 'base',
    destinationChain: 'near',
    sourceToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    destinationToken: 'near',
    sourceAmount: '100000000', // 100 USDC
    destinationAmount: '50000000000000000000000000', // 50 NEAR
    maker: '0x742d35Cc6634C0532925a3b844Bc9e7595f2BD4e',
    taker: 'alice.testnet',
    slippageTolerance: 50
  };

  const response = await axios.post(
    `${CONFIG.ORCHESTRATOR_URL}/api/v1/sessions`,
    sessionData,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CONFIG.API_KEY
      }
    }
  );

  return response.data;
}

async function getSessionStatus(sessionId) {
  const response = await axios.get(
    `${CONFIG.ORCHESTRATOR_URL}/api/v1/sessions/${sessionId}`,
    {
      headers: {
        'X-API-Key': CONFIG.API_KEY
      }
    }
  );

  return response.data;
}

async function runDemo() {
  console.log(chalk.cyan.bold('\n🚀 1BALANCER FUSION+ LIVE DEMO\n'));
  console.log(chalk.white('Demonstrating BASE <-> NEAR atomic swaps with real orchestrator\n'));

  try {
    // Check orchestrator health
    console.log(chalk.yellow('1. Checking orchestrator health...'));
    const health = await axios.get(`${CONFIG.ORCHESTRATOR_URL}/health`);
    console.log(chalk.green('   ✅ Orchestrator healthy'));
    console.log(chalk.gray(`   • BASE: ${health.data.connections.base ? 'connected' : 'disconnected'}`));
    console.log(chalk.gray(`   • NEAR: ${health.data.connections.near ? 'connected' : 'disconnected'}`));

    // Show contract addresses
    console.log(chalk.yellow('\n2. Deployed contracts:'));
    console.log(chalk.gray(`   • BASE EscrowFactory: ${CONFIG.CONTRACTS.BASE.escrowFactory}`));
    console.log(chalk.gray(`   • BASE FusionPlusHub: ${CONFIG.CONTRACTS.BASE.fusionPlusHub}`));
    console.log(chalk.gray(`   • NEAR HTLC: ${CONFIG.CONTRACTS.NEAR.htlc}`));

    // Create swap session
    console.log(chalk.yellow('\n3. Creating swap session...'));
    const sessionSpinner = ora('   Initializing BASE → NEAR swap (100 USDC for 50 NEAR)').start();
    
    const session = await createSession();
    sessionSpinner.succeed(chalk.green('   ✅ Session created'));
    console.log(chalk.gray(`   • Session ID: ${session.sessionId}`));
    console.log(chalk.gray(`   • Hashlock: ${session.hashlockHash}`));
    console.log(chalk.gray(`   • Status: ${session.status}`));
    console.log(chalk.gray(`   • Expires: ${new Date(session.expirationTime).toLocaleString()}`));

    // Check session status
    console.log(chalk.yellow('\n4. Monitoring swap progress...'));
    await sleep(2000);
    
    const status = await getSessionStatus(session.sessionId);
    console.log(chalk.green('   ✅ Session active'));
    console.log(chalk.gray(`   • Current status: ${status.status}`));
    console.log(chalk.gray(`   • Phase: ${status.phase || 'initialized'}`));
    console.log(chalk.gray(`   • Progress: ${status.progress || 0}%`));

    // Show next steps
    console.log(chalk.yellow('\n5. Next steps in production:'));
    console.log(chalk.white('   • Create 1inch Limit Order with session hashlock'));
    console.log(chalk.white('   • Sign and submit order to FusionPlusHub'));
    console.log(chalk.white('   • NEAR side creates matching HTLC'));
    console.log(chalk.white('   • Orchestrator coordinates cross-chain execution'));
    console.log(chalk.white('   • Atomic swap completes or refunds on timeout'));

    // Show explorers
    console.log(chalk.cyan('\n📊 View transactions on:'));
    console.log(chalk.white(`   • BASE: ${CONFIG.BASE_EXPLORER}`));
    console.log(chalk.white(`   • NEAR: ${CONFIG.NEAR_EXPLORER}`));

    console.log(chalk.green.bold('\n✅ Demo completed successfully!\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Demo failed:'));
    if (error.response) {
      console.error(chalk.red(`   Status: ${error.response.status}`));
      console.error(chalk.red(`   Error: ${JSON.stringify(error.response.data, null, 2)}`));
    } else {
      console.error(chalk.red(`   ${error.message}`));
    }
    process.exit(1);
  }
}

if (require.main === module) {
  runDemo().catch(error => {
    console.error(chalk.red('\n❌ Unexpected error:'), error);
    process.exit(1);
  });
}

module.exports = { runDemo };