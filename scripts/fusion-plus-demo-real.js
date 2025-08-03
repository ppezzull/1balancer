#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { ethers } = require('ethers');
const readline = require('readline');

// Configuration
const CONFIG = {
  BASE_LOCALHOST_RPC: 'http://localhost:8545',
  BASE_SEPOLIA_RPC: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
  NEAR_TESTNET_RPC: process.env.NEAR_TESTNET_RPC || 'https://rpc.testnet.near.org',
  ORCHESTRATOR_URL: process.env.ORCHESTRATOR_URL || 'http://localhost:8080',
};

class RealFusionPlusDemo {
  constructor() {
    this.provider = null;
    this.chainId = null;
    this.isLocalhost = false;
    this.hasAccount = false;
    this.contractsDeployed = false;
    this.orchestratorRunning = false;
  }

  async run() {
    console.log(chalk.cyan.bold('\n🔍 1BALANCER FUSION+ - REAL DEMO\n'));
    
    // Check setup
    await this.checkSetup();
    
    // Show appropriate menu based on setup
    if (this.isReady()) {
      await this.showMainMenu();
    } else {
      await this.showSetupGuide();
    }
  }

  async checkSetup() {
    console.log(chalk.blue('📋 Checking your setup...\n'));
    
    // 1. Check blockchain connection
    const chainSpinner = ora('Checking blockchain connection...').start();
    try {
      // Try localhost first
      const localProvider = new ethers.JsonRpcProvider(CONFIG.BASE_LOCALHOST_RPC);
      const localChainId = await localProvider.getNetwork().then(n => n.chainId);
      
      if (localChainId === 31337n) {
        this.provider = localProvider;
        this.chainId = 31337;
        this.isLocalhost = true;
        chainSpinner.succeed(chalk.green('Connected to localhost (chainId: 31337)'));
      }
    } catch (error) {
      // Try testnet
      try {
        const testnetProvider = new ethers.JsonRpcProvider(CONFIG.BASE_SEPOLIA_RPC);
        const testnetChainId = await testnetProvider.getNetwork().then(n => n.chainId);
        this.provider = testnetProvider;
        this.chainId = Number(testnetChainId);
        this.isLocalhost = false;
        chainSpinner.succeed(chalk.green(`Connected to BASE Sepolia (chainId: ${this.chainId})`));
      } catch (error) {
        chainSpinner.fail(chalk.red('No blockchain connection available'));
      }
    }
    
    // 2. Check account
    const accountSpinner = ora('Checking deployer account...').start();
    try {
      const result = execSync('cd packages/hardhat && yarn account', { 
        encoding: 'utf8',
        stdio: 'pipe' 
      });
      
      if (result.includes("You don't have a deployer account")) {
        this.hasAccount = false;
        accountSpinner.warn(chalk.yellow('No deployer account found'));
      } else {
        // Extract address from output
        const addressMatch = result.match(/0x[a-fA-F0-9]{40}/);
        if (addressMatch) {
          this.hasAccount = true;
          this.deployerAddress = addressMatch[0];
          accountSpinner.succeed(chalk.green(`Deployer account: ${this.deployerAddress}`));
        }
      }
    } catch (error) {
      this.hasAccount = false;
      accountSpinner.warn(chalk.yellow('No deployer account found'));
    }
    
    // 3. Check contract deployments
    const contractsSpinner = ora('Checking contract deployments...').start();
    if (this.isLocalhost) {
      // Check localhost deployments
      const deploymentPath = path.join(process.cwd(), 'packages/hardhat/deployments/localhost');
      if (fs.existsSync(deploymentPath)) {
        const files = fs.readdirSync(deploymentPath);
        const hasHub = files.some(f => f.includes('FusionPlusHub'));
        const hasEscrow = files.some(f => f.includes('EscrowFactory'));
        
        if (hasHub || hasEscrow) {
          this.contractsDeployed = true;
          contractsSpinner.succeed(chalk.green('Contracts deployed on localhost'));
          
          // Show deployed contracts
          if (hasHub) {
            const hubData = JSON.parse(fs.readFileSync(path.join(deploymentPath, files.find(f => f.includes('FusionPlusHub'))), 'utf8'));
            console.log(chalk.gray(`  • FusionPlusHub: ${hubData.address}`));
          }
          if (hasEscrow) {
            const escrowData = JSON.parse(fs.readFileSync(path.join(deploymentPath, files.find(f => f.includes('EscrowFactory'))), 'utf8'));
            console.log(chalk.gray(`  • EscrowFactory: ${escrowData.address}`));
          }
        } else {
          this.contractsDeployed = false;
          contractsSpinner.warn(chalk.yellow('No contracts deployed on localhost'));
        }
      } else {
        this.contractsDeployed = false;
        contractsSpinner.warn(chalk.yellow('No deployments directory found'));
      }
    } else {
      // Check testnet deployments
      const deploymentPath = path.join(process.cwd(), 'packages/hardhat/deployments/baseSepolia');
      if (fs.existsSync(deploymentPath)) {
        const files = fs.readdirSync(deploymentPath);
        this.contractsDeployed = files.length > 0;
        contractsSpinner.succeed(chalk.green(`Contracts deployed on BASE Sepolia (${files.length} contracts)`));
      } else {
        this.contractsDeployed = false;
        contractsSpinner.warn(chalk.yellow('No testnet deployments found'));
      }
    }
    
    // 4. Check orchestrator
    const orchSpinner = ora('Checking orchestrator service...').start();
    try {
      const response = await axios.get(`${CONFIG.ORCHESTRATOR_URL}/health`, {
        timeout: 2000
      });
      this.orchestratorRunning = response.data?.status === 'healthy';
      orchSpinner.succeed(chalk.green('Orchestrator service is running'));
    } catch (error) {
      this.orchestratorRunning = false;
      orchSpinner.warn(chalk.yellow('Orchestrator service not running'));
    }
    
    // 5. Summary
    console.log(chalk.blue('\n📊 Setup Summary:\n'));
    console.log(`  ${this.isLocalhost ? '✅' : '❌'} Local blockchain running`);
    console.log(`  ${this.hasAccount ? '✅' : '❌'} Deployer account configured`);
    console.log(`  ${this.contractsDeployed ? '✅' : '❌'} Contracts deployed`);
    console.log(`  ${this.orchestratorRunning ? '✅' : '❌'} Orchestrator service running`);
    
    // Check NEAR
    try {
      const nearCreds = fs.existsSync(path.join(process.cwd(), '1balancer-near/.near-credentials/testnet/deploy.json'));
      console.log(`  ${nearCreds ? '✅' : '⚠️'} NEAR contracts deployed`);
    } catch (error) {
      console.log(`  ⚠️  NEAR contracts status unknown`);
    }
    
    console.log('');
  }

  isReady() {
    return this.provider && this.hasAccount && this.contractsDeployed && this.orchestratorRunning;
  }

  async showSetupGuide() {
    console.log(chalk.yellow.bold('⚠️  Setup Required\n'));
    console.log(chalk.white('To run the Fusion+ demo, you need to:\n'));
    
    if (!this.isLocalhost && !this.provider) {
      console.log(chalk.cyan('1. Start local blockchain:'));
      console.log(chalk.gray('   make chain\n'));
    }
    
    if (!this.hasAccount) {
      console.log(chalk.cyan('2. Generate deployer account:'));
      console.log(chalk.gray('   make account-generate'));
      console.log(chalk.gray('   # Save the generated address and private key!\n'));
    }
    
    if (!this.contractsDeployed) {
      console.log(chalk.cyan('3. Deploy contracts:'));
      if (this.isLocalhost) {
        console.log(chalk.gray('   make deploy'));
      } else {
        console.log(chalk.gray('   make deploy-sepolia'));
      }
      console.log('');
    }
    
    if (!this.orchestratorRunning) {
      console.log(chalk.cyan('4. Start orchestrator:'));
      console.log(chalk.gray('   make backend\n'));
    }
    
    console.log(chalk.yellow('Or to use testnet mode:'));
    console.log(chalk.gray('   1. Stop local chain: make stop'));
    console.log(chalk.gray('   2. Configure .env with testnet RPC'));
    console.log(chalk.gray('   3. Deploy to testnet: make deploy-sepolia'));
    console.log(chalk.gray('   4. Deploy NEAR: make near-deploy\n'));
    
    await this.askToContinue();
  }

  async showMainMenu() {
    console.log(chalk.green.bold('✅ System Ready!\n'));
    console.log(chalk.blue('📋 Select action:\n'));
    
    console.log(chalk.white('  1. 🔄 Execute ETH → NEAR swap'));
    console.log(chalk.white('  2. 🔄 Execute NEAR → ETH swap'));
    console.log(chalk.white('  3. 📊 View deployed contracts'));
    console.log(chalk.white('  4. 💰 Check balances'));
    console.log(chalk.white('  5. 🔍 Monitor swap session'));
    console.log(chalk.white('  6. 🚪 Exit\n'));
    
    const choice = await this.askQuestion('Enter your choice (1-6): ');
    
    switch (choice) {
      case '1':
        await this.executeEthToNearSwap();
        break;
      case '2':
        await this.executeNearToEthSwap();
        break;
      case '3':
        await this.viewContracts();
        break;
      case '4':
        await this.checkBalances();
        break;
      case '5':
        await this.monitorSession();
        break;
      case '6':
        console.log(chalk.green('\n✨ Goodbye!\n'));
        process.exit(0);
      default:
        console.log(chalk.red('Invalid choice'));
        await this.showMainMenu();
    }
  }

  async executeEthToNearSwap() {
    console.log(chalk.blue.bold('\n🔄 ETH → NEAR Swap\n'));
    
    try {
      // Create real session via orchestrator
      const sessionData = {
        sourceChain: 'base',
        destinationChain: 'near',
        sourceToken: '0x0000000000000000000000000000000000000000', // ETH
        destinationToken: 'near',
        sourceAmount: '1000000000000000', // 0.001 ETH
        destinationAmount: '10000000000000000000000', // 0.01 NEAR (testing amount)
        maker: this.deployerAddress,
        taker: 'test.near'
      };
      
      console.log(chalk.gray('Creating swap session...'));
      const response = await axios.post(
        `${CONFIG.ORCHESTRATOR_URL}/api/v1/sessions`,
        sessionData
      );
      
      const session = response.data;
      console.log(chalk.green(`✅ Session created: ${session.sessionId}`));
      console.log(chalk.gray(`   Hashlock: ${session.hashlockHash}`));
      console.log(chalk.gray(`   Status: ${session.status}`));
      
      // Show next steps
      console.log(chalk.yellow('\nNext steps:'));
      console.log(chalk.gray('1. Execute the swap: POST /api/v1/sessions/:id/execute'));
      console.log(chalk.gray('2. Monitor status: GET /api/v1/sessions/:id'));
      console.log(chalk.gray('3. Or use WebSocket for real-time updates'));
      
    } catch (error) {
      console.error(chalk.red('Failed to create swap:'), error.message);
      if (error.response) {
        console.error(chalk.red('Response:'), error.response.data);
      }
    }
    
    await this.askToContinue();
  }

  async executeNearToEthSwap() {
    console.log(chalk.blue.bold('\n🔄 NEAR → ETH Swap\n'));
    console.log(chalk.yellow('This requires NEAR contracts to be deployed.'));
    console.log(chalk.gray('Run: make near-deploy'));
    await this.askToContinue();
  }

  async viewContracts() {
    console.log(chalk.blue.bold('\n📊 Deployed Contracts\n'));
    
    const deploymentDir = this.isLocalhost 
      ? 'packages/hardhat/deployments/localhost'
      : 'packages/hardhat/deployments/baseSepolia';
    
    try {
      const files = fs.readdirSync(deploymentDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = JSON.parse(fs.readFileSync(path.join(deploymentDir, file), 'utf8'));
          console.log(chalk.green(`${file.replace('.json', '')}:`));
          console.log(chalk.gray(`  Address: ${data.address}`));
          console.log(chalk.gray(`  Block: ${data.receipt?.blockNumber || 'N/A'}`));
          console.log('');
        }
      }
    } catch (error) {
      console.log(chalk.red('No deployments found'));
    }
    
    await this.askToContinue();
  }

  async checkBalances() {
    console.log(chalk.blue.bold('\n💰 Account Balances\n'));
    
    if (!this.deployerAddress) {
      console.log(chalk.red('No deployer account configured'));
      await this.askToContinue();
      return;
    }
    
    try {
      const balance = await this.provider.getBalance(this.deployerAddress);
      console.log(chalk.green(`Deployer (${this.deployerAddress}):`));
      console.log(chalk.gray(`  ETH Balance: ${ethers.formatEther(balance)} ETH`));
      
      // TODO: Check token balances if contracts are deployed
      
    } catch (error) {
      console.error(chalk.red('Failed to check balances:'), error.message);
    }
    
    await this.askToContinue();
  }

  async monitorSession() {
    const sessionId = await this.askQuestion('Enter session ID to monitor: ');
    
    try {
      const response = await axios.get(`${CONFIG.ORCHESTRATOR_URL}/api/v1/sessions/${sessionId}`);
      const session = response.data;
      
      console.log(chalk.blue.bold(`\n📊 Session ${sessionId}\n`));
      console.log(chalk.gray(`Status: ${session.status}`));
      console.log(chalk.gray(`Created: ${new Date(session.createdAt).toLocaleString()}`));
      
      if (session.steps) {
        console.log(chalk.yellow('\nSteps:'));
        for (const step of session.steps) {
          const icon = step.status === 'completed' ? '✅' : step.status === 'pending' ? '⏳' : '❌';
          console.log(`  ${icon} ${step.step}: ${step.status}`);
        }
      }
      
    } catch (error) {
      console.error(chalk.red('Failed to fetch session:'), error.message);
    }
    
    await this.askToContinue();
  }

  async askQuestion(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question(chalk.yellow(question), (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  async askToContinue() {
    await this.askQuestion('\nPress Enter to continue...');
    if (this.isReady()) {
      await this.showMainMenu();
    } else {
      process.exit(0);
    }
  }
}

// Run the demo
if (require.main === module) {
  const demo = new RealFusionPlusDemo();
  demo.run().catch(error => {
    console.error(chalk.red('\n❌ Error:'), error);
    process.exit(1);
  });
}

module.exports = RealFusionPlusDemo;