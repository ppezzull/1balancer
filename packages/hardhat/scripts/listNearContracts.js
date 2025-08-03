require('../env.config');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  console.log(`\n📍 Network: NEAR Testnet`);
  console.log('─'.repeat(50));
  console.log('');
  
  // Check if deploy.json exists
  const deployPath = path.join(process.cwd(), '..', '..', '1balancer-near', '.near-credentials', 'testnet', 'deploy.json');
  
  if (!fs.existsSync(deployPath)) {
    console.log('❌ No NEAR contracts deployed');
    console.log('   Deploy contracts first with: make near-deploy');
    return;
  }
  
  // Read deployment info
  let deployInfo;
  try {
    deployInfo = JSON.parse(fs.readFileSync(deployPath, 'utf8'));
  } catch (e) {
    console.log('❌ Error reading deployment info');
    return;
  }
  
  // Get contract ID from deploy.json or fallback to env
  const contractId = deployInfo.contractId || `fusion-htlc.${process.env.NEAR_MASTER_ACCOUNT || 'rog_eth'}.testnet`;
  const masterAccount = deployInfo.masterAccount || process.env.NEAR_MASTER_ACCOUNT || 'rog_eth.testnet';
  
  // Check NEAR CLI availability
  let nearCliInstalled = false;
  try {
    execSync('which near', { stdio: 'pipe' });
    nearCliInstalled = true;
  } catch (e) {
    // NEAR CLI not installed
  }
  
  // Display HTLC Contract
  console.log(`✅ FusionPlusHTLC:`);
  console.log(`   Address: ${contractId}`);
  
  // Try to get transaction hash if NEAR CLI is available
  if (nearCliInstalled) {
    try {
      // Get account state to confirm deployment
      const stateResult = execSync(`near state ${contractId} 2>/dev/null`, { encoding: 'utf8' });
      if (stateResult.includes('code_hash')) {
        console.log(`   Status: Deployed`);
      }
    } catch (e) {
      // Contract might not exist
    }
  }
  
  console.log(`   Explorer: https://testnet.nearblocks.io/address/${contractId}`);
  console.log('');
  
  // Check for solver contract
  const solverContractId = deployInfo.solverContract || `solver-registry.${masterAccount}`;
  if (nearCliInstalled) {
    try {
      execSync(`near state ${solverContractId} 2>/dev/null`, { stdio: 'pipe' });
      console.log(`✅ SolverRegistry:`);
      console.log(`   Address: ${solverContractId}`);
      console.log(`   Explorer: https://testnet.nearblocks.io/address/${solverContractId}`);
      console.log('');
    } catch (e) {
      // Solver contract not deployed (optional)
    }
  }
  
  console.log('📝 Contract Details:');
  console.log(`   Master Account: ${masterAccount}`);
  console.log(`   Network: NEAR Testnet`);
  if (deployInfo.timestamp) {
    console.log(`   Deployed: ${new Date(deployInfo.timestamp).toLocaleString()}`);
  }
  
  console.log('\n💡 To interact with contracts:');
  console.log('   1. Use NEAR CLI: near view/call commands');
  console.log('   2. Run cross-chain test: make fusion-plus-test');
  console.log('   3. Start demo: make fusion-plus-demo');
}

main().catch(console.error);