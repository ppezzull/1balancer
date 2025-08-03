#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk').default || require('chalk');
const ora = require('ora').default || require('ora');
const inquirer = require('inquirer').default || require('inquirer');
const io = require('socket.io-client');

const CONFIG = {
  ORCHESTRATOR_URL: 'http://localhost:8080',
  API_KEY: 'demo-secret-key',
  BASE_EXPLORER: 'https://sepolia.basescan.org',
  NEAR_EXPLORER: 'https://testnet.nearblocks.io',
  CONTRACTS: {
    FusionPlusHub: '0x5938297bfdeeF3ac56EB4198E0B484b2A0B3adD8',
    EscrowFactory: '0x135aCf86351F2113726318dE6b4ca66FA90d54Fd',
    NEARContract: 'fusion-htlc.rog_eth.testnet'
  }
};

class TransparentDemo {
  constructor() {
    this.sessionId = null;
    this.ws = null;
    this.executionSteps = [];
  }

  async displayBanner() {
    console.clear();
    console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║    1BALANCER FUSION+ TRANSPARENT EXECUTION DEMO              ║
║    Real Blockchain Transactions with Full Transparency       ║
║                                                               ║
║    🔍 Every function call is shown                          ║
║    💰 Minimal amounts (0.001 ETH / 0.1 NEAR)              ║
║    📊 Real-time execution monitoring                        ║
║    🔒 Actual smart contract interactions                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`));
  }

  async checkPrerequisites() {
    console.log(chalk.yellow('\n📋 Checking Prerequisites...\n'));
    
    const checks = [
      { name: 'Orchestrator Service', url: `${CONFIG.ORCHESTRATOR_URL}/health`, required: true },
      { name: 'WebSocket Connection', test: this.testWebSocket.bind(this), required: true },
      { name: 'BASE RPC', test: this.testBaseRPC.bind(this), required: true },
      { name: 'NEAR RPC', test: this.testNearRPC.bind(this), required: true }
    ];

    let allPassed = true;
    
    for (const check of checks) {
      const spinner = ora(`Checking ${check.name}...`).start();
      
      try {
        if (check.url) {
          await axios.get(check.url);
        } else if (check.test) {
          await check.test();
        }
        spinner.succeed(chalk.green(`✅ ${check.name}: Ready`));
      } catch (error) {
        spinner.fail(chalk.red(`❌ ${check.name}: Failed`));
        if (check.required) allPassed = false;
      }
    }

    return allPassed;
  }

  async testWebSocket() {
    return new Promise((resolve, reject) => {
      const socket = io(CONFIG.ORCHESTRATOR_URL, {
        path: '/ws',
        autoConnect: true,
        transports: ['websocket', 'polling']
      });
      
      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('WebSocket connection timeout'));
      }, 3000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        socket.disconnect();
        resolve();
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        reject(new Error('WebSocket connection failed: ' + error.message));
      });
    });
  }

  async testBaseRPC() {
    const response = await axios.post('https://sepolia.base.org', {
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1
    });
    if (!response.data.result) throw new Error('Invalid RPC response');
  }

  async testNearRPC() {
    const response = await axios.post('https://rpc.testnet.near.org', {
      jsonrpc: '2.0',
      method: 'status',
      params: [],
      id: 1
    });
    if (!response.data.result) throw new Error('Invalid RPC response');
  }

  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      this.ws = io(CONFIG.ORCHESTRATOR_URL, {
        path: '/ws',
        autoConnect: true,
        transports: ['websocket', 'polling']
      });
      
      this.ws.on('connect', () => {
        // Authenticate
        this.ws.emit('auth', {
          apiKey: CONFIG.API_KEY
        });
        resolve();
      });

      this.ws.on('authenticated', (data) => {
        this.handleWebSocketMessage({ type: 'authenticated', ...data });
      });

      this.ws.on('session_update', (data) => {
        this.handleWebSocketMessage(data);
      });

      this.ws.on('execution_step', (data) => {
        this.handleWebSocketMessage(data);
      });

      this.ws.on('execution_step_update', (data) => {
        this.handleWebSocketMessage(data);
      });

      this.ws.on('connect_error', (error) => {
        console.error(chalk.red('WebSocket error:'), error.message);
      });

      this.ws.on('disconnect', () => {
        console.log(chalk.gray('\nWebSocket connection closed'));
      });

      setTimeout(() => {
        if (!this.ws.connected) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 5000);
    });
  }

  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'authenticated':
        if (message.success && this.sessionId) {
          // Subscribe to session updates
          this.ws.emit('subscribe', {
            channel: 'session',
            sessionId: this.sessionId
          });
        }
        break;

      case 'session_update':
        this.displaySessionUpdate(message);
        break;

      case 'execution_step':
      case 'execution_step_update':
        this.displayExecutionStep(message.data.step);
        break;

      default:
        console.log(chalk.gray(`[WS] ${message.type}:`, JSON.stringify(message.data)));
    }
  }

  displaySessionUpdate(message) {
    const { status, data } = message;
    
    console.log(chalk.blue(`\n📡 Session Update: ${status}`));
    console.log(chalk.gray(`   Progress: ${data.progress}%`));
    
    if (data.txHash) {
      console.log(chalk.cyan(`   Transaction: ${data.txHash}`));
      console.log(chalk.cyan(`   Explorer: ${data.explorer}`));
    }
    
    if (data.escrowAddress) {
      console.log(chalk.green(`   Escrow: ${data.escrowAddress}`));
    }
    
    if (data.nearHTLCId) {
      console.log(chalk.green(`   NEAR HTLC: ${data.nearHTLCId}`));
    }
  }

  displayExecutionStep(step) {
    console.log(chalk.yellow(`\n🔧 Execution Step:`));
    console.log(chalk.white(`   Function: ${step.function}`));
    console.log(chalk.white(`   Contract: ${step.contract}`));
    console.log(chalk.white(`   Status: ${step.status}`));
    
    if (step.params) {
      console.log(chalk.gray(`   Parameters:`));
      this.displayParams(step.params, '      ');
    }
    
    if (step.txHash) {
      console.log(chalk.cyan(`   Tx Hash: ${step.txHash}`));
    }
    
    if (step.gasUsed) {
      console.log(chalk.gray(`   Gas Used: ${step.gasUsed}`));
    }
    
    if (step.error) {
      console.log(chalk.red(`   Error: ${step.error}`));
    }
  }

  displayParams(params, indent = '') {
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'object' && value !== null) {
        console.log(chalk.gray(`${indent}${key}:`));
        this.displayParams(value, indent + '  ');
      } else {
        console.log(chalk.gray(`${indent}${key}: ${value}`));
      }
    }
  }

  async createMinimalSession() {
    console.log(chalk.yellow('\n🎯 Creating Minimal Test Session...\n'));
    
    const spinner = ora('Creating session with minimal amounts...').start();
    
    try {
      const response = await axios.post(
        `${CONFIG.ORCHESTRATOR_URL}/api/v1/demo/create-minimal-session`,
        {},
        {
          headers: {
            'X-API-Key': CONFIG.API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      this.sessionId = response.data.sessionId;
      spinner.succeed(chalk.green('✅ Session created'));
      
      console.log(chalk.cyan(`\n📄 Session Details:`));
      console.log(chalk.white(`   Session ID: ${response.data.sessionId}`));
      console.log(chalk.white(`   Hashlock: ${response.data.hashlockHash}`));
      console.log(chalk.white(`   Source: ${response.data.amounts.source} (BASE Sepolia)`));
      console.log(chalk.white(`   Destination: ${response.data.amounts.destination} (NEAR Testnet)`));
      
      return response.data;
    } catch (error) {
      spinner.fail(chalk.red('Failed to create session'));
      throw error;
    }
  }

  async executeRealSwap() {
    console.log(chalk.yellow('\n🚀 Starting Real Blockchain Execution...\n'));
    
    console.log(chalk.cyan('📍 Contract Addresses:'));
    console.log(chalk.white(`   FusionPlusHub: ${CONFIG.CONTRACTS.FusionPlusHub}`));
    console.log(chalk.white(`   EscrowFactory: ${CONFIG.CONTRACTS.EscrowFactory}`));
    console.log(chalk.white(`   NEAR Contract: ${CONFIG.CONTRACTS.NEARContract}`));
    
    const response = await axios.post(
      `${CONFIG.ORCHESTRATOR_URL}/api/v1/demo/execute/${this.sessionId}`,
      {},
      {
        headers: {
          'X-API-Key': CONFIG.API_KEY
        }
      }
    );

    console.log(chalk.green('\n✅ Execution started'));
    console.log(chalk.gray('   Monitor the steps below for real blockchain interactions...'));
    
    return response.data;
  }

  async monitorExecution(duration = 60000) {
    console.log(chalk.yellow(`\n👀 Monitoring Execution (${duration/1000} seconds)...\n`));
    
    // Poll for execution steps
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(
          `${CONFIG.ORCHESTRATOR_URL}/api/v1/demo/execution-steps/${this.sessionId}`,
          {
            headers: {
              'X-API-Key': CONFIG.API_KEY
            }
          }
        );

        if (response.data.steps.length !== this.executionSteps.length) {
          this.executionSteps = response.data.steps;
          // New steps will be displayed via WebSocket
        }

        // Check if all steps are completed or failed
        const allDone = response.data.steps.every(s => 
          s.status === 'completed' || s.status === 'failed'
        );

        if (allDone) {
          clearInterval(pollInterval);
          this.displayFinalSummary();
        }
      } catch (error) {
        console.error(chalk.red('Error polling execution steps:', error.message));
      }
    }, 2000);

    // Stop monitoring after duration
    setTimeout(() => {
      clearInterval(pollInterval);
      this.displayFinalSummary();
    }, duration);

    await new Promise(resolve => setTimeout(resolve, duration));
  }

  displayFinalSummary() {
    console.log(chalk.cyan.bold('\n\n📊 Execution Summary\n'));
    console.log('═'.repeat(80));
    
    const completed = this.executionSteps.filter(s => s.status === 'completed');
    const failed = this.executionSteps.filter(s => s.status === 'failed');
    
    console.log(chalk.white(`Total Steps: ${this.executionSteps.length}`));
    console.log(chalk.green(`Completed: ${completed.length}`));
    console.log(chalk.red(`Failed: ${failed.length}`));
    
    console.log(chalk.cyan('\n📋 Detailed Execution Steps:\n'));
    
    this.executionSteps.forEach((step, index) => {
      const status = step.status === 'completed' ? '✅' : 
                    step.status === 'failed' ? '❌' : '⏳';
      
      // Main step header
      console.log(chalk.white.bold(`${index + 1}. ${status} ${step.function} on ${step.contract}`));
      
      // Add detailed microtasks based on the step type
      this.displayStepMicrotasks(step, index + 1);
      
      // Transaction link with enhanced formatting
      if (step.txHash) {
        // Determine explorer based on multiple factors
        const isNearTransaction = 
          step.contract.includes('.near') || 
          step.contract.includes('testnet') ||
          step.function === 'reveal_secret_and_complete_swap' ||
          step.function === 'withdraw' ||
          (step.result && step.result.explorer && step.result.explorer.includes('nearblocks')) ||
          (step.txHash && !step.txHash.startsWith('0x')); // NEAR txHashes don't start with 0x
        
        const explorer = isNearTransaction ? CONFIG.NEAR_EXPLORER : CONFIG.BASE_EXPLORER;
        const explorerName = isNearTransaction ? 'NEAR Explorer' : 'BaseScan';
        const explorerPath = isNearTransaction ? 'txns' : 'tx'; // NEAR uses /txns/, BASE uses /tx/
        
        console.log(chalk.cyan(`     🔗 ${explorerName}: ${explorer}/${explorerPath}/${step.txHash}`));
      }
      
      // Add gas usage and result summary if available
      if (step.gasUsed) {
        console.log(chalk.gray(`     ⛽ Gas Used: ${step.gasUsed}`));
      }
      
      if (step.result) {
        this.displayStepResult(step);
      }
      
      if (step.error) {
        console.log(chalk.red(`     ❌ Error: ${step.error}`));
      }
      
      console.log(''); // Add spacing between steps
    });
    
    console.log('═'.repeat(80));
  }

  displayStepMicrotasks(step, stepNumber) {
    const microtasks = this.getMicrotasksForStep(stepNumber);
    
    microtasks.forEach((task) => {
      const taskStatus = step.status === 'completed' ? '✓' : 
                        step.status === 'failed' ? '✗' : '○';
      console.log(chalk.gray(`     ${taskStatus} ${task}`));
    });
  }

  getMicrotasksForStep(stepNumber) {
    switch (stepNumber) {
      case 1: // createSrcEscrow on EscrowFactory
        return [
          'Generate unique secret and compute SHA-256 hashlock',
          'Calculate optimal timelock parameters for cross-chain safety',
          'Deploy escrow contract with maker deposit (0.001 ETH)',
          'Set hashlock for atomic swap coordination',
          'Configure withdrawal timeouts for Bob (5 min) and public (8 min)',
          'Lock maker funds pending secret revelation'
        ];
        
      case 2: // create_htlc on NEAR
        return [
          'Convert hex hashlock to base64 for NEAR contract compatibility',
          'Set up HTLC parameters with 0.1 NEAR token amount',
          'Configure Alice as receiver with 3-minute withdrawal window',
          'Deploy HTLC to fusion-htlc.rog_eth.testnet contract',
          'Lock NEAR tokens pending secret revelation',
          'Establish cross-chain coordination with BASE escrow'
        ];
        
      case 3: // reveal_secret_and_complete_swap
        return [
          'Wait for both chains to confirm locked state (BASE + NEAR)',
          'Alice withdraws NEAR HTLC by revealing the secret',
          'Secret becomes publicly visible on NEAR blockchain',
          'Extract revealed secret from NEAR transaction logs',
          'Validate secret matches original hashlock commitment'
        ];
        
      case 4: // withdraw on BASE escrow
        return [
          'Bob monitors NEAR for secret revelation event',
          'Extract revealed secret from NEAR withdrawal transaction',
          'Use revealed secret to unlock BASE escrow contract',
          'Bob withdraws maker\'s 0.001 ETH deposit',
          'Complete atomic swap - both parties receive intended tokens',
          'Atomic swap successfully completed across BASE and NEAR'
        ];
        
      default:
        return ['Execute contract function', 'Process transaction', 'Update state'];
    }
  }

  displayStepResult(step) {
    if (step.result) {
      if (step.result.secretRevealed) {
        console.log(chalk.green(`     ✨ Secret successfully revealed and tokens claimed`));
      }
      if (step.result.escrowAddress) {
        console.log(chalk.yellow(`     📍 Escrow Address: ${step.result.escrowAddress}`));
      }
      if (step.result.htlcId) {
        console.log(chalk.yellow(`     🔑 HTLC ID: ${step.result.htlcId}`));
      }
      if (step.result.amount) {
        console.log(chalk.yellow(`     💰 Amount: ${step.result.amount} tokens`));
      }
    }
  }

  async runDemo() {
    await this.displayBanner();
    
    // Check prerequisites
    const ready = await this.checkPrerequisites();
    if (!ready) {
      console.log(chalk.red('\n❌ Prerequisites not met. Please ensure all services are running.'));
      console.log(chalk.yellow('   Run: make run'));
      process.exit(1);
    }

    // Connect WebSocket
    console.log(chalk.yellow('\n🔌 Connecting WebSocket...'));
    try {
      await this.connectWebSocket();
      console.log(chalk.green('✅ WebSocket connected'));
    } catch (error) {
      console.log(chalk.red('❌ WebSocket connection failed'));
      process.exit(1);
    }

    // Menu
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select demo mode:',
        choices: [
          { name: '🚀 Real Execution (uses real funds)', value: 'real' },
          { name: '🎮 Simulation (no real funds)', value: 'simulation' },
          { name: '📊 View Contract Info', value: 'info' }
        ]
      }
    ]);

    if (action === 'info') {
      this.displayContractInfo();
      return;
    }

    // Create minimal session
    await this.createMinimalSession();

    if (action === 'real') {
      // Confirm real execution
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'This will use real funds (0.001 ETH + gas). Continue?',
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow('\n⚠️  Real execution cancelled'));
        process.exit(0);
      }

      // Execute real swap
      await this.executeRealSwap();
      await this.monitorExecution();
    } else {
      // Run simulation
      await this.runSimulation();
    }

    // Cleanup
    if (this.ws) {
      this.ws.disconnect();
    }
  }

  async runSimulation() {
    console.log(chalk.yellow('\n🎮 Running Simulation...\n'));
    
    await axios.post(
      `${CONFIG.ORCHESTRATOR_URL}/api/v1/demo/simulate/${this.sessionId}`,
      {},
      {
        headers: {
          'X-API-Key': CONFIG.API_KEY
        }
      }
    );

    console.log(chalk.green('✅ Simulation started'));
    
    // Show what would happen
    console.log(chalk.cyan('\n📋 Expected Execution Flow:'));
    console.log(chalk.white('1. Deploy Escrow on BASE'));
    console.log(chalk.gray('   - Call: EscrowFactory.createSrcEscrowWithoutOrderValidation()'));
    console.log(chalk.gray('   - Gas: ~300,000'));
    console.log(chalk.gray('   - Safety Deposit: 0.0001 ETH'));
    
    console.log(chalk.white('\n2. Create HTLC on NEAR'));
    console.log(chalk.gray('   - Call: fusion-htlc.create_htlc()'));
    console.log(chalk.gray('   - Gas: 30 TGas'));
    console.log(chalk.gray('   - Storage: 0.01 NEAR'));
    
    console.log(chalk.white('\n3. Monitor for Secret Reveal'));
    console.log(chalk.gray('   - Watch BASE escrow for Withdrawn event'));
    console.log(chalk.gray('   - Watch NEAR HTLC for secret_revealed event'));
    
    console.log(chalk.white('\n4. Complete Cross-Chain Swap'));
    console.log(chalk.gray('   - Withdraw on opposite chain using revealed secret'));
    
    // Monitor simulation
    await new Promise(resolve => setTimeout(resolve, 15000));
  }

  displayContractInfo() {
    console.log(chalk.cyan.bold('\n📊 Contract Information\n'));
    
    console.log(chalk.yellow('BASE Sepolia Contracts:'));
    console.log(chalk.white(`  FusionPlusHub: ${CONFIG.CONTRACTS.FusionPlusHub}`));
    console.log(chalk.gray(`  ${CONFIG.BASE_EXPLORER}/address/${CONFIG.CONTRACTS.FusionPlusHub}`));
    console.log(chalk.white(`  EscrowFactory: ${CONFIG.CONTRACTS.EscrowFactory}`));
    console.log(chalk.gray(`  ${CONFIG.BASE_EXPLORER}/address/${CONFIG.CONTRACTS.EscrowFactory}`));
    
    console.log(chalk.yellow('\nNEAR Testnet Contract:'));
    console.log(chalk.white(`  HTLC Contract: ${CONFIG.CONTRACTS.NEARContract}`));
    console.log(chalk.gray(`  ${CONFIG.NEAR_EXPLORER}/address/${CONFIG.CONTRACTS.NEARContract}`));
    
    console.log(chalk.cyan('\n💰 Cost Breakdown:'));
    console.log(chalk.white('  BASE Sepolia:'));
    console.log(chalk.gray('    - Safety Deposit: 0.0001 ETH'));
    console.log(chalk.gray('    - Gas (escrow): ~300,000 @ 0.01 gwei'));
    console.log(chalk.gray('    - Total: ~0.0001 ETH + gas'));
    
    console.log(chalk.white('  NEAR Testnet:'));
    console.log(chalk.gray('    - Storage: 0.01 NEAR'));
    console.log(chalk.gray('    - Gas: 30 TGas'));
    console.log(chalk.gray('    - Total: ~0.01 NEAR'));
  }
}

// Run the demo
if (require.main === module) {
  const demo = new TransparentDemo();
  demo.runDemo().catch(error => {
    console.error(chalk.red('\n❌ Demo failed:'), error.message);
    process.exit(1);
  });
}

module.exports = TransparentDemo;