#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk').default || require('chalk');
const ora = require('ora').default || require('ora');
const { ethers } = require('ethers');

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

class CompleteDemo {
  constructor() {
    this.sessionId = null;
    this.session = null;
  }

  async createSession() {
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

  async getSessionStatus() {
    const response = await axios.get(
      `${CONFIG.ORCHESTRATOR_URL}/api/v1/sessions/${this.sessionId}`,
      {
        headers: {
          'X-API-Key': CONFIG.API_KEY
        }
      }
    );

    return response.data;
  }

  async simulateExecution() {
    console.log(chalk.yellow('\n🔄 Simulating swap execution...'));
    console.log(chalk.gray('   Note: In production, this would require a real 1inch limit order\n'));

    // Simulate the execution phases
    const phases = [
      { 
        name: 'Creating 1inch Limit Order', 
        status: 'source_locking',
        progress: 10,
        details: 'Order with hashlock: ' + this.session.hashlockHash
      },
      {
        name: 'Locking USDC on BASE',
        status: 'source_locked',
        progress: 30,
        details: 'Escrow deployed at: 0x' + ethers.randomBytes(20).toString('hex')
      },
      {
        name: 'Creating NEAR HTLC',
        status: 'destination_locking',
        progress: 50,
        details: 'NEAR HTLC ID: htlc_' + Date.now()
      },
      {
        name: 'Both chains locked',
        status: 'both_locked',
        progress: 70,
        details: 'Waiting for secret reveal'
      },
      {
        name: 'Revealing secret',
        status: 'revealing_secret',
        progress: 90,
        details: 'Alice claims NEAR tokens'
      },
      {
        name: 'Completing swap',
        status: 'completed',
        progress: 100,
        details: 'Bob claims USDC with revealed secret'
      }
    ];

    for (const phase of phases) {
      const spinner = ora(`   ${phase.name}...`).start();
      await sleep(2000);
      
      spinner.succeed(chalk.green(`   ✅ ${phase.name}`));
      console.log(chalk.gray(`      ${phase.details}`));
      console.log(chalk.cyan(`      Progress: ${phase.progress}%`));
      console.log('');
      
      // In production, these status updates would come from blockchain events
    }
  }

  async showArchitecture() {
    console.log(chalk.cyan.bold('\n📊 How It Works:\n'));
    
    console.log(chalk.white('1. Session Creation:'));
    console.log(chalk.gray('   • Orchestrator generates hashlock secret'));
    console.log(chalk.gray('   • Returns hash for 1inch order creation'));
    console.log(chalk.gray('   • Tracks session state in memory'));
    
    console.log(chalk.white('\n2. Order Execution:'));
    console.log(chalk.gray('   • User creates 1inch Limit Order with hashlock'));
    console.log(chalk.gray('   • Orchestrator monitors BASE blockchain'));
    console.log(chalk.gray('   • Automatically triggers NEAR side'));
    
    console.log(chalk.white('\n3. Atomic Swap:'));
    console.log(chalk.gray('   • Both chains have matching hashlocks'));
    console.log(chalk.gray('   • Secret reveal on one chain unlocks both'));
    console.log(chalk.gray('   • Timeout protection ensures refunds'));
    
    console.log(chalk.white('\n4. Orchestrator Role:'));
    console.log(chalk.gray('   • Monitors blockchain events'));
    console.log(chalk.gray('   • Coordinates cross-chain execution'));
    console.log(chalk.gray('   • Manages secrets and timeouts'));
    console.log(chalk.gray('   • Provides real-time status updates'));
  }

  async runDemo() {
    console.log(chalk.cyan.bold('\n🚀 1BALANCER FUSION+ COMPLETE DEMO\n'));
    console.log(chalk.white('Demonstrating the full atomic swap flow\n'));

    try {
      // Step 1: Check orchestrator
      console.log(chalk.yellow('1. Checking orchestrator health...'));
      const health = await axios.get(`${CONFIG.ORCHESTRATOR_URL}/health`);
      console.log(chalk.green('   ✅ Orchestrator healthy'));
      console.log(chalk.gray(`   • BASE: ${health.data.connections.base ? 'connected' : 'disconnected'}`));
      console.log(chalk.gray(`   • NEAR: ${health.data.connections.near ? 'connected' : 'disconnected'}`));

      // Step 2: Create session
      console.log(chalk.yellow('\n2. Creating swap session...'));
      const sessionSpinner = ora('   Initializing BASE → NEAR swap').start();
      
      this.session = await this.createSession();
      this.sessionId = this.session.sessionId;
      
      sessionSpinner.succeed(chalk.green('   ✅ Session created'));
      console.log(chalk.gray(`   • Session ID: ${this.session.sessionId}`));
      console.log(chalk.gray(`   • Hashlock: ${this.session.hashlockHash}`));
      console.log(chalk.gray(`   • Status: ${this.session.status}`));

      // Step 3: Check initial status
      console.log(chalk.yellow('\n3. Checking session status...'));
      const status = await this.getSessionStatus();
      console.log(chalk.green('   ✅ Session active'));
      console.log(chalk.gray(`   • Current status: ${status.status}`));
      console.log(chalk.gray(`   • Steps completed: ${status.steps.filter(s => s.status === 'completed').length}/${status.steps.length}`));

      // Step 4: Explain current state
      console.log(chalk.yellow('\n4. Current State Analysis:'));
      console.log(chalk.white('   The session shows 0% progress because:'));
      console.log(chalk.gray('   • Session is created but not executed'));
      console.log(chalk.gray('   • Execution requires a signed 1inch order'));
      console.log(chalk.gray('   • The order must include the session hashlock'));
      console.log(chalk.gray('   • Once executed, progress updates via blockchain events'));

      // Step 5: Simulate execution
      await this.simulateExecution();

      // Step 6: Show architecture
      await this.showArchitecture();

      // Step 7: Summary
      console.log(chalk.cyan.bold('\n📋 Summary:\n'));
      console.log(chalk.white('What we demonstrated:'));
      console.log(chalk.green('   ✅ Real session creation via orchestrator API'));
      console.log(chalk.green('   ✅ Hashlock generation for atomic swaps'));
      console.log(chalk.green('   ✅ Status tracking through swap phases'));
      console.log(chalk.green('   ✅ BASE and NEAR chain coordination'));
      
      console.log(chalk.white('\nWhat happens in production:'));
      console.log(chalk.blue('   📍 User signs real 1inch order'));
      console.log(chalk.blue('   📍 Orchestrator monitors real blockchain events'));
      console.log(chalk.blue('   📍 NEAR HTLC automatically created'));
      console.log(chalk.blue('   📍 Secret reveal triggers completion'));
      console.log(chalk.blue('   📍 WebSocket provides real-time updates'));

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
}

if (require.main === module) {
  const demo = new CompleteDemo();
  demo.runDemo().catch(error => {
    console.error(chalk.red('\n❌ Unexpected error:'), error);
    process.exit(1);
  });
}

module.exports = CompleteDemo;