require('../env.config');
const { ethers } = require('ethers');

async function main() {
  // Get the private key from env
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ No DEPLOYER_PRIVATE_KEY found in environment');
    process.exit(1);
  }
  
  try {
    // Create wallet from private key
    const wallet = new ethers.Wallet(privateKey);
    const deployerAddress = wallet.address;
    
    console.log('\n📋 Address Information:');
    console.log('────────────────────────────────────────────────');
    console.log(`Deployer Address (from .env): ${deployerAddress}`);
    console.log('\n⚠️  Please check your MetaMask:');
    console.log('1. Open MetaMask');
    console.log('2. Make sure you\'re on BASE Sepolia network');
    console.log('3. Check which account has the 0.35 ETH');
    console.log('4. Compare that address with the one above');
    console.log('\n💡 If the addresses don\'t match, you have two options:');
    console.log('   Option A: Send 0.35 ETH from MetaMask to the deployer address above');
    console.log('   Option B: Export the private key from MetaMask and update DEPLOYER_PRIVATE_KEY in .env');
    console.log('────────────────────────────────────────────────\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main().catch(console.error);