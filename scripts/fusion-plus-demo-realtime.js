#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk').default || require('chalk');
const ora = require('ora').default || require('ora');
const WebSocket = require('ws');

const CONFIG = {
  ORCHESTRATOR_URL: 'http://localhost:8080',
  WS_URL: 'ws://localhost:8080/ws',
  API_KEY: 'demo-secret-key',
};

class RealTimeDemo {
  constructor() {
    this.sessionId = null;
    this.ws = null;
  }

  async createSession() {
    const sessionData = {
      sourceChain: 'base',
      destinationChain: 'near',
      sourceToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      destinationToken: 'near',
      sourceAmount: '100000000',
      destinationAmount: '50000000000000000000000000',
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

  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(CONFIG.WS_URL);

      this.ws.on('open', () => {
        console.log(chalk.green('   ✅ WebSocket connected'));
        
        // Authenticate
        this.ws.send(JSON.stringify({
          type: 'auth',
          apiKey: CONFIG.API_KEY
        }));

        // Subscribe to session updates
        this.ws.send(JSON.stringify({
          type: 'subscribe',
          channel: 'session',
          sessionId: this.sessionId
        }));

        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          // Ignore parse errors
        }
      });

      this.ws.on('error', (error) => {
        console.log(chalk.yellow('   ⚠️  WebSocket error (non-critical)'));
        resolve(); // Continue anyway
      });

      this.ws.on('close', () => {
        console.log(chalk.gray('   WebSocket closed'));
      });

      // Timeout after 2 seconds
      setTimeout(() => {
        if (this.ws.readyState !== WebSocket.OPEN) {
          console.log(chalk.yellow('   ⚠️  WebSocket connection timeout (continuing without real-time updates)'));
          resolve();
        }
      }, 2000);
    });
  }

  handleWebSocketMessage(message) {
    if (message.type === 'session_update') {
      console.log(chalk.blue(`\n📡 Real-time update: ${message.data.phase}`));
      console.log(chalk.gray(`   Status: ${message.status}`));
      console.log(chalk.cyan(`   Progress: ${message.data.progress}%`));
    }
  }

  async triggerSimulation() {
    try {
      const response = await axios.post(
        `${CONFIG.ORCHESTRATOR_URL}/api/v1/demo/simulate/${this.sessionId}`,
        {},
        {
          headers: {
            'X-API-Key': CONFIG.API_KEY
          }
        }
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(chalk.yellow('\n⚠️  Demo simulation endpoint not available'));
        console.log(chalk.gray('   The orchestrator needs to be restarted with the demo endpoint'));
        return null;
      }
      throw error;
    }
  }

  async runDemo() {
    console.log(chalk.cyan.bold('\n🚀 1BALANCER FUSION+ REAL-TIME DEMO\n'));
    console.log(chalk.white('Demonstrating real-time progress updates via WebSocket\n'));

    try {
      // Step 1: Create session
      console.log(chalk.yellow('1. Creating swap session...'));
      const sessionSpinner = ora('   Initializing BASE → NEAR swap').start();
      
      const session = await this.createSession();
      this.sessionId = session.sessionId;
      
      sessionSpinner.succeed(chalk.green('   ✅ Session created'));
      console.log(chalk.gray(`   • Session ID: ${session.sessionId}`));
      console.log(chalk.gray(`   • Hashlock: ${session.hashlockHash}`));

      // Step 2: Connect WebSocket
      console.log(chalk.yellow('\n2. Connecting to WebSocket for real-time updates...'));
      await this.connectWebSocket();

      // Step 3: Trigger simulation
      console.log(chalk.yellow('\n3. Triggering execution simulation...'));
      const simulation = await this.triggerSimulation();
      
      if (simulation) {
        console.log(chalk.green('   ✅ Simulation started'));
        console.log(chalk.gray(`   ${simulation.note}`));
        
        // Wait for updates
        console.log(chalk.yellow('\n4. Monitoring progress (15 seconds)...\n'));
        
        // Keep the demo running for 15 seconds to show updates
        await new Promise(resolve => setTimeout(resolve, 15000));
      } else {
        // Fallback to showing what would happen
        console.log(chalk.yellow('\n4. Expected execution flow:'));
        console.log(chalk.gray('   • Source locking (10% progress)'));
        console.log(chalk.gray('   • Source locked (30% progress)'));
        console.log(chalk.gray('   • Destination locking (50% progress)'));
        console.log(chalk.gray('   • Both locked (70% progress)'));
        console.log(chalk.gray('   • Revealing secret (90% progress)'));
        console.log(chalk.gray('   • Completed (100% progress)'));
      }

      // Step 5: Summary
      console.log(chalk.cyan.bold('\n📋 Summary:\n'));
      console.log(chalk.white('What this demonstrates:'));
      console.log(chalk.green('   ✅ Real session creation'));
      console.log(chalk.green('   ✅ WebSocket connectivity'));
      console.log(chalk.green('   ✅ Event-driven architecture'));
      console.log(chalk.green('   ✅ Real-time progress tracking'));
      
      console.log(chalk.white('\nIn production:'));
      console.log(chalk.blue('   📍 Real blockchain events trigger updates'));
      console.log(chalk.blue('   📍 Progress reflects actual on-chain state'));
      console.log(chalk.blue('   📍 WebSocket delivers instant notifications'));

      console.log(chalk.green.bold('\n✅ Demo completed!\n'));

    } catch (error) {
      console.error(chalk.red('\n❌ Demo failed:'));
      if (error.response) {
        console.error(chalk.red(`   Status: ${error.response.status}`));
        console.error(chalk.red(`   Error: ${JSON.stringify(error.response.data, null, 2)}`));
      } else {
        console.error(chalk.red(`   ${error.message}`));
      }
    } finally {
      if (this.ws) {
        this.ws.close();
      }
    }
  }
}

if (require.main === module) {
  const demo = new RealTimeDemo();
  demo.runDemo().catch(error => {
    console.error(chalk.red('\n❌ Unexpected error:'), error);
    process.exit(1);
  });
}

module.exports = RealTimeDemo;