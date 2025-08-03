require('../env.config');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

async function main() {
  const deploymentsPath = path.join(__dirname, '..', 'deployments', 'baseSepolia');
  
  console.log('\n📍 Network: BASE Sepolia (Chain ID: 84532)');
  console.log('📅 Status as of:', new Date().toLocaleString());
  console.log('═'.repeat(70));
  
  // Check if deployments exist
  if (!fs.existsSync(deploymentsPath)) {
    console.log('\n❌ No deployments found');
    console.log('   Run: make deploy-base-all');
    return;
  }
  
  // Connect to BASE Sepolia
  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  
  // Check deployer account
  const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (deployerKey) {
    const wallet = new ethers.Wallet(deployerKey);
    const balance = await provider.getBalance(wallet.address);
    console.log('\n👤 Deployer Account:');
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
  }
  
  console.log('\n📄 DEPLOYED CONTRACTS:');
  console.log('─'.repeat(70));
  
  // 1. FusionPlusHub
  const fusionHubFile = path.join(deploymentsPath, 'FusionPlusHub.json');
  if (fs.existsSync(fusionHubFile)) {
    const deployment = JSON.parse(fs.readFileSync(fusionHubFile, 'utf8'));
    console.log('\n1️⃣ FusionPlusHub (Main Orchestration Contract)');
    console.log('   ├─ Proxy: ' + deployment.address);
    console.log('   ├─ Explorer: https://sepolia.basescan.org/address/' + deployment.address);
    console.log('   ├─ Status: ✅ Deployed');
    console.log('   ├─ Purpose: Central hub for cross-chain atomic swaps');
    console.log('   └─ Key Functions:');
    console.log('      ├─ createFusionPlusOrder() - Create cross-chain swap orders');
    console.log('      ├─ fillOrder() - Fill orders with 1inch integration');
    console.log('      ├─ updateContracts() - Update protocol addresses');
    console.log('      ├─ pause()/unpause() - Emergency controls');
    console.log('      └─ grantRole() - Access control management');
    
    // Show implementation details
    const implFile = path.join(deploymentsPath, 'FusionPlusHub_Implementation.json');
    if (fs.existsSync(implFile)) {
      const impl = JSON.parse(fs.readFileSync(implFile, 'utf8'));
      console.log('\n   📝 Implementation Details:');
      console.log('      ├─ Implementation: ' + impl.address);
      console.log('      ├─ Version: V2 (Enhanced with order tracking)');
      console.log('      └─ Upgradeable: Yes (OpenZeppelin Proxy)');
    }
  } else {
    console.log('\n1️⃣ FusionPlusHub');
    console.log('   └─ Status: ❌ Not deployed');
  }
  
  // 2. EscrowFactory
  const escrowFile = path.join(deploymentsPath, 'EscrowFactory.json');
  if (fs.existsSync(escrowFile)) {
    const deployment = JSON.parse(fs.readFileSync(escrowFile, 'utf8'));
    console.log('\n2️⃣ EscrowFactory (Escrow Management System)');
    console.log('   ├─ Address: ' + deployment.address);
    console.log('   ├─ Explorer: https://sepolia.basescan.org/address/' + deployment.address);
    console.log('   ├─ Status: ✅ Deployed');
    console.log('   ├─ Purpose: Creates and manages escrow contracts for atomic swaps');
    console.log('   └─ Key Functions:');
    console.log('      ├─ createEscrowPair() - Deploy source & destination escrows');
    console.log('      ├─ createSrcEscrow() - Deploy source chain escrow');
    console.log('      ├─ createDstEscrow() - Deploy destination chain escrow');
    console.log('      └─ hasRole() - Check orchestrator permissions');
  } else {
    console.log('\n2️⃣ EscrowFactory');
    console.log('   └─ Status: ❌ Not deployed or deployment failed');
    console.log('      Action: Run `make deploy-base-escrow` with higher gas limit');
  }
  
  // 3. Proxy Admin
  const adminFile = path.join(deploymentsPath, 'DefaultProxyAdmin.json');
  if (fs.existsSync(adminFile)) {
    const deployment = JSON.parse(fs.readFileSync(adminFile, 'utf8'));
    console.log('\n3️⃣ DefaultProxyAdmin (Upgrade Controller)');
    console.log('   ├─ Address: ' + deployment.address);
    console.log('   ├─ Explorer: https://sepolia.basescan.org/address/' + deployment.address);
    console.log('   ├─ Status: ✅ Deployed');
    console.log('   └─ Purpose: Controls upgrades for FusionPlusHub proxy');
  }
  
  console.log('\n🔗 INTEGRATION POINTS:');
  console.log('─'.repeat(70));
  console.log('• 1inch Limit Order Protocol: Placeholder (0x0...001)');
  console.log('• 1inch Aggregation Router: Placeholder (0x0...002)');
  console.log('• Status: Awaiting 1inch deployment on BASE Sepolia');
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('─'.repeat(70));
  
  // Check what needs to be done
  let steps = [];
  if (!fs.existsSync(escrowFile)) {
    steps.push('1. Deploy EscrowFactory: make deploy-base-escrow');
  }
  if (fs.existsSync(fusionHubFile) && fs.existsSync(escrowFile)) {
    steps.push('1. Verify contracts on Basescan (if not done)');
    steps.push('2. Connect to NEAR: make deploy-near-status');
    steps.push('3. Start orchestrator: make orchestrator-dev');
    steps.push('4. Run demo: make fusion-plus-demo');
  }
  
  steps.forEach(step => console.log(step));
  
  console.log('\n💡 USEFUL COMMANDS:');
  console.log('─'.repeat(70));
  console.log('• Check account balance: make account-status');
  console.log('• Deploy missing contracts: make deploy-base-all');
  console.log('• View transaction details: make base-contracts');
  console.log('• Test integration: make test-integration');
  
  console.log('\n📚 DOCUMENTATION:');
  console.log('─'.repeat(70));
  console.log('• Architecture: packages/hardhat/contracts/ethereum-hub/docs/');
  console.log('• Integration Guide: docs/solution/fusion-plus-optimal-architecture.md');
  console.log('• Security Model: contracts/ethereum-hub/docs/07-security-architecture.md');
  
  console.log('\n');
}

main().catch(console.error);