#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk').default || require('chalk');

const ORCHESTRATOR_URL = 'http://localhost:8080';
const API_KEY = 'demo-secret-key';

async function createCorrectSession() {
  console.log(chalk.cyan.bold('🔧 Creating Correctly Configured Session\n'));
  
  // CORRECT address mapping for BASE → NEAR atomic swap
  const sessionData = {
    sourceChain: 'base',
    destinationChain: 'near',
    sourceToken: '0x0000000000000000000000000000000000000000', // ETH
    destinationToken: 'near',
    sourceAmount: '1000000000000000', // 0.001 ETH
    destinationAmount: '100000000000000000000000', // 0.1 NEAR
    maker: '0x742d35Cc6634c0532925a3B844BC9E7595f2bd4e', // BASE maker (deposits ETH)
    taker: '0x3861C9ff421C9b2Af29811B5030122E0c23Ea74C', // BASE taker (receives ETH) ✅ FIXED
    destinationAddress: 'alice.testnet', // NEAR receiver (gets NEAR tokens)
    slippageTolerance: 50 // 0.5%
  };

  console.log(chalk.white('📋 Session Configuration:'));
  console.log(chalk.gray('Source Chain: BASE Sepolia'));
  console.log(chalk.gray('Destination Chain: NEAR Testnet'));
  console.log(chalk.gray(''));
  console.log(chalk.green('✅ BASE Side (Source):'));
  console.log(chalk.gray('  Maker (deposits):', sessionData.maker));
  console.log(chalk.gray('  Taker (receives):', sessionData.taker, '← Your address!'));
  console.log(chalk.gray('  Token: ETH'));
  console.log(chalk.gray('  Amount: 0.001 ETH'));
  console.log(chalk.gray(''));
  console.log(chalk.blue('✅ NEAR Side (Destination):'));
  console.log(chalk.gray('  Receiver:', sessionData.destinationAddress));
  console.log(chalk.gray('  Token: NEAR'));
  console.log(chalk.gray('  Amount: 0.1 NEAR'));
  console.log(chalk.gray(''));

  try {
    console.log(chalk.yellow('🚀 Creating session...'));
    
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

    console.log(chalk.green('✅ Session created successfully!'));
    console.log(chalk.white('Session ID:'), response.data.sessionId);
    console.log(chalk.white('Status:'), response.data.status);
    console.log(chalk.white('Hashlock:'), response.data.hashlockHash);
    console.log(chalk.white('Expiration:'), new Date(response.data.expirationTime).toLocaleString());
    
    console.log(chalk.cyan('\n📊 Next Steps:'));
    console.log(chalk.white('1. Execute the session:'));
    console.log(chalk.gray(`   POST ${ORCHESTRATOR_URL}/api/v1/sessions/${response.data.sessionId}/execute`));
    console.log(chalk.white('2. Monitor progress:'));
    console.log(chalk.gray(`   GET ${ORCHESTRATOR_URL}/api/v1/sessions/${response.data.sessionId}`));
    console.log(chalk.white('3. Get secret for withdrawal:'));
    console.log(chalk.gray(`   GET ${ORCHESTRATOR_URL}/api/v1/sessions/${response.data.sessionId}/secret?walletAddress=${sessionData.taker}`));
    
    return response.data;
    
  } catch (error) {
    console.error(chalk.red('❌ Error creating session:'));
    if (error.response) {
      console.error(chalk.red('Status:'), error.response.status);
      console.error(chalk.red('Data:'), JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(chalk.red('Message:'), error.message);
    }
    throw error;
  }
}

async function main() {
  console.log(chalk.cyan.bold('🔄 Cross-Chain Atomic Swap - Correct Configuration\n'));
  
  console.log(chalk.yellow('📝 Previous Issue Summary:'));
  console.log(chalk.red('❌ Old taker: alice.testnet (NEAR address on BASE contract)'));
  console.log(chalk.green('✅ New taker: 0x3861C9ff421C9b2Af29811B5030122E0c23Ea74C (BASE address)'));
  console.log(chalk.blue('ℹ️  NEAR receiver: alice.testnet (separate field)'));
  console.log('');
  
  try {
    const session = await createCorrectSession();
    
    console.log(chalk.green.bold('\n🎉 SUCCESS! Session created with correct address mapping.'));
    console.log(chalk.white('Now you can execute the swap and withdraw tokens to your BASE address.'));
    
  } catch (error) {
    console.error(chalk.red.bold('\n💥 Failed to create session.'));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createCorrectSession };