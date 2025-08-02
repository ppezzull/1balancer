#!/usr/bin/env node

/**
 * Fusion+ Local Demo Script
 * 
 * This script demonstrates the complete atomic swap lifecycle
 * between BASE and NEAR on a local blockchain
 */

const { default: fetch } = require('node-fetch');
const WebSocket = require('ws');
const { ethers } = require('ethers');
const { default: chalk } = require('chalk');
const { default: ora } = require('ora');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const ORCHESTRATOR_URL = 'http://localhost:8080';
const WS_URL = 'ws://localhost:8080/ws';
const API_KEY = 'demo-api-key'; // Local demo key
const MOCK_MODE = true; // Set to true for local demo without actual blockchain operations

// Demo accounts (from Hardhat)
const MAKER_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const TAKER_ADDRESS = 'alice.near';

// Token addresses (using USDC on BASE and USDT on NEAR for demo)
const SOURCE_TOKEN = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on BASE
const DEST_TOKEN = 'usdt.near';

// Helper functions
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatAmount(amount, decimals = 6) {
  return (BigInt(amount) / BigInt(10 ** decimals)).toString();
}

async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${ORCHESTRATOR_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${error}`);
  }

  return response.json();
}

// Main demo flow
async function runDemo() {
  console.log(chalk.blue.bold('\n🏆 1BALANCER FUSION+ LOCAL DEMO\n'));
  console.log('This demo showcases atomic swaps between BASE and NEAR\n');

  const spinner = ora();

  try {
    // Step 1: Check orchestrator health
    spinner.start('Checking orchestrator status...');
    try {
      // Health endpoint doesn't require authentication
      const response = await fetch(`${ORCHESTRATOR_URL}/health`);
      const health = await response.json();
      
      if (health.status === 'healthy') {
        spinner.succeed('Orchestrator is healthy');
        console.log(chalk.gray(`  • BASE: ${health.connections.base ? '✓' : '✗'} connected`));
        console.log(chalk.gray(`  • NEAR: ${health.connections.near ? '✓' : '✗'} connected\n`));
      } else {
        throw new Error('Orchestrator unhealthy');
      }
    } catch (error) {
      spinner.fail('Orchestrator not available');
      console.log(chalk.red('Please ensure the orchestrator is running: make orchestrator-dev'));
      console.log(chalk.gray(`Error: ${error.message}`));
      process.exit(1);
    }

    // Step 2: Get a quote
    console.log(chalk.yellow('📊 Getting swap quote...\n'));
    
    const quoteRequest = {
      sourceChain: 'base',
      destinationChain: 'near',
      sourceToken: SOURCE_TOKEN,
      destinationToken: DEST_TOKEN,
      amount: '1000000000', // 1000 USDC (6 decimals)
      urgency: 'normal'
    };

    spinner.start('Requesting quote from Dutch auction simulator...');
    let quote;
    try {
      quote = await apiCall('/api/v1/quote', 'POST', quoteRequest);
      spinner.succeed('Quote received');
      console.log(chalk.gray('Quote response:', JSON.stringify(quote, null, 2)));
    } catch (error) {
      spinner.fail('Failed to get quote');
      console.log(chalk.red('Error:', error.message));
      
      // For demo purposes, use mock quote
      console.log(chalk.yellow('\nUsing mock quote for demonstration...'));
      quote = {
        sourceAmount: quoteRequest.amount,
        destinationAmount: '999000000', // 999 USDT
        slippageBps: 100,
        dutchAuction: {
          startPrice: '1.001',
          endPrice: '0.999',
          duration: 180
        }
      };
    }

    console.log(chalk.cyan('\n💱 Quote Details:'));
    const quoteData = quote.quote || quote;
    console.log(`  • Source: ${formatAmount(quoteData.sourceAmount || '0', 6)} USDC on BASE`);
    console.log(`  • Destination: ${formatAmount(quoteData.destinationAmount || '0', 6)} USDT on NEAR`);
    if (quoteData.sourceAmount && quoteData.destinationAmount) {
      console.log(`  • Exchange Rate: 1 USDC = ${(quoteData.destinationAmount / quoteData.sourceAmount).toFixed(4)} USDT`);
    }
    console.log(`  • Rate: ${quoteData.rate || 'N/A'}`);
    console.log(`  • Price Impact: ${quoteData.priceImpact || '0'}%`);
    
    if (quote.dutchAuction) {
      console.log(chalk.gray('\n📈 Dutch Auction Parameters:'));
      console.log(`  • Start Price: ${quote.dutchAuction.startPrice}`);
      console.log(`  • End Price: ${quote.dutchAuction.endPrice}`);
      console.log(`  • Duration: ${quote.dutchAuction.duration}s`);
    }

    // Step 3: Create swap session
    console.log(chalk.yellow('\n🔄 Creating swap session...\n'));

    // Extract values from the nested quote response
    const sourceAmount = quote.quote?.sourceAmount || quote.sourceAmount || quoteRequest.amount;
    const destinationAmount = quote.quote?.destinationAmount || quote.destinationAmount || '999000000';
    
    const sessionRequest = {
      sourceChain: 'base',
      destinationChain: 'near',
      sourceToken: SOURCE_TOKEN,
      destinationToken: DEST_TOKEN,
      sourceAmount: sourceAmount,
      destinationAmount: destinationAmount,
      maker: MAKER_ADDRESS,
      taker: TAKER_ADDRESS,
      slippageTolerance: 100 // 1%
    };

    spinner.start('Creating atomic swap session...');
    const session = await apiCall('/api/v1/sessions', 'POST', sessionRequest);
    spinner.succeed(`Session created: ${session.sessionId}`);

    console.log(chalk.cyan('\n🔐 Session Details:'));
    console.log(`  • Session ID: ${session.sessionId}`);
    console.log(`  • Status: ${session.status}`);
    console.log(`  • Hashlock: ${session.hashlockHash}`);
    console.log(`  • Estimated Time: ${session.estimatedCompletionTime}s`);
    console.log(`  • Expiration: ${new Date(session.expirationTime * 1000).toLocaleString()}`);

    // Step 4: Connect WebSocket for real-time updates
    console.log(chalk.yellow('\n📡 Connecting to WebSocket for real-time updates...\n'));

    const ws = new WebSocket(WS_URL);
    let wsConnected = false;

    ws.on('open', () => {
      wsConnected = true;
      // Authenticate
      ws.send(JSON.stringify({
        type: 'auth',
        apiKey: API_KEY
      }));

      // Subscribe to session updates
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'session',
        sessionId: session.sessionId
      }));
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data);
      
      if (message.type === 'session_update') {
        console.log(chalk.green(`\n✨ Real-time Update: ${message.data.status}`));
        if (message.data.phase) {
          console.log(`  • Phase: ${message.data.phase}`);
          console.log(`  • Progress: ${message.data.progress}%`);
        }
      }
    });

    ws.on('error', (error) => {
      console.log(chalk.red('WebSocket error:', error.message));
    });

    await sleep(1000); // Wait for WebSocket connection

    // Step 5: Execute the swap
    console.log(chalk.yellow('\n🚀 Executing atomic swap...\n'));

    // For local demo, we'll create a mock limit order
    const executeRequest = {
      limitOrder: {
        order: {
          salt: Date.now().toString(),
          maker: MAKER_ADDRESS,
          receiver: '0x0000000000000000000000000000000000000000',
          makerAsset: SOURCE_TOKEN,
          takerAsset: '0x0000000000000000000000000000000000000000',
          makingAmount: quote.sourceAmount,
          takingAmount: quote.destinationAmount,
          makerTraits: '0x' + '00'.repeat(32)
        },
        signature: '0x' + '00'.repeat(65) // Mock signature for local demo
      },
      confirmationLevel: 'fast'
    };

    spinner.start('Executing atomic swap...');
    await apiCall(`/api/v1/sessions/${session.sessionId}/execute`, 'POST', executeRequest);
    spinner.succeed('Swap execution initiated');

    // Step 6: Monitor swap progress
    console.log(chalk.yellow('\n📊 Monitoring swap progress...\n'));

    let completed = false;
    let lastStatus = '';

    while (!completed) {
      const status = await apiCall(`/api/v1/sessions/${session.sessionId}`);
      
      if (status.status !== lastStatus) {
        lastStatus = status.status;
        
        console.log(chalk.blue(`\n[${new Date().toLocaleTimeString()}] Status: ${status.status}`));
        
        // Show completed steps
        status.steps?.forEach(step => {
          if (step.status === 'completed') {
            console.log(chalk.green(`  ✓ ${step.step} - ${step.txHash ? `tx: ${step.txHash.slice(0, 10)}...` : 'done'}`));
          } else if (step.status === 'pending') {
            console.log(chalk.yellow(`  ⏳ ${step.step} - estimated ${step.estimatedTime}s`));
          }
        });

        if (status.currentPhase) {
          console.log(chalk.gray(`\n  Current Phase: ${status.currentPhase}`));
          console.log(chalk.gray(`  Time Remaining: ${Math.floor(status.timeRemaining / 60)}m ${status.timeRemaining % 60}s`));
        }
      }

      // Check if completed
      if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
        completed = true;

        if (status.status === 'completed') {
          console.log(chalk.green.bold('\n✅ Atomic swap completed successfully!\n'));
          
          console.log(chalk.cyan('📋 Final Details:'));
          console.log(`  • Source TX: ${status.sourceTxHash || 'N/A'}`);
          console.log(`  • Destination TX: ${status.destinationTxHash || 'N/A'}`);
          console.log(`  • Total Time: ${status.completionTime || 'N/A'}s`);
          console.log(`  • Gas Used: ${status.gasUsed || 'N/A'}`);
        } else {
          console.log(chalk.red(`\n❌ Swap ${status.status}: ${status.error || 'Unknown error'}\n`));
        }
      }

      await sleep(2000); // Poll every 2 seconds
    }

    // Close WebSocket
    if (wsConnected) {
      ws.close();
    }

    // Step 7: Demo complete
    console.log(chalk.blue.bold('\n🎉 Demo Complete!\n'));
    console.log('This demonstrated:');
    console.log('  • Quote generation with Dutch auction pricing');
    console.log('  • Session creation with HTLC parameters');
    console.log('  • Real-time monitoring via WebSocket');
    console.log('  • Complete atomic swap lifecycle');
    console.log('  • Cross-chain coordination between BASE and NEAR\n');

  } catch (error) {
    spinner.fail('Demo failed');
    console.error(chalk.red('\nError:', error.message));
    process.exit(1);
  }
}

// Interactive menu
async function showMenu() {
  console.log(chalk.blue.bold('\n🏆 1BALANCER FUSION+ DEMO\n'));
  console.log('Choose demo mode:\n');
  console.log('1. Quick Demo - Automated flow');
  console.log('2. Interactive Demo - Step by step');
  console.log('3. API Explorer - Test individual endpoints');
  console.log('4. Exit\n');

  rl.question('Select option (1-4): ', async (answer) => {
    switch (answer) {
      case '1':
        await runDemo();
        rl.close();
        break;
      case '2':
        console.log(chalk.yellow('\nInteractive demo coming soon...'));
        rl.close();
        break;
      case '3':
        console.log(chalk.yellow('\nAPI Explorer coming soon...'));
        rl.close();
        break;
      case '4':
        console.log(chalk.gray('\nGoodbye!'));
        rl.close();
        break;
      default:
        console.log(chalk.red('\nInvalid option'));
        showMenu();
    }
  });
}

// Main entry point
if (require.main === module) {
  showMenu().catch(console.error);
}

module.exports = { runDemo };