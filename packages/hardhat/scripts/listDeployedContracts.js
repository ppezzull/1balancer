const fs = require('fs');
const path = require('path');

async function main() {
  const network = process.argv[2] || 'localhost';
  const deploymentsPath = path.join(__dirname, '..', 'deployments', network);
  
  console.log(`\n📍 Network: ${network}`);
  console.log('─'.repeat(50));
  
  if (!fs.existsSync(deploymentsPath)) {
    console.log('❌ No deployments found for this network');
    console.log('   Deploy contracts first with: make deploy-base-all');
    return;
  }
  
  const files = fs.readdirSync(deploymentsPath);
  const jsonFiles = files.filter(f => f.endsWith('.json') && !f.includes('solcInputs'));
  
  if (jsonFiles.length === 0) {
    console.log('❌ No contracts deployed on this network');
    return;
  }
  
  console.log('');
  jsonFiles.forEach(file => {
    try {
      const deployment = JSON.parse(fs.readFileSync(path.join(deploymentsPath, file), 'utf8'));
      const contractName = file.replace('.json', '');
      
      // Skip implementation contracts for display
      if (contractName.includes('_Implementation') || contractName.includes('_Proxy')) {
        return;
      }
      
      console.log(`✅ ${contractName}:`);
      console.log(`   Address: ${deployment.address}`);
      
      if (deployment.transactionHash) {
        console.log(`   Tx Hash: ${deployment.transactionHash}`);
      }
      
      if (network === 'baseSepolia') {
        console.log(`   Explorer: https://sepolia.basescan.org/address/${deployment.address}`);
      }
      
      console.log('');
    } catch (e) {
      // Skip invalid files
    }
  });
  
  // Special handling for proxy contracts
  if (fs.existsSync(path.join(deploymentsPath, 'FusionPlusHub_Implementation.json'))) {
    const impl = JSON.parse(fs.readFileSync(path.join(deploymentsPath, 'FusionPlusHub_Implementation.json'), 'utf8'));
    console.log('📝 Implementation Details:');
    console.log(`   FusionPlusHub Implementation: ${impl.address}`);
  }
  
  if (fs.existsSync(path.join(deploymentsPath, 'DefaultProxyAdmin.json'))) {
    const admin = JSON.parse(fs.readFileSync(path.join(deploymentsPath, 'DefaultProxyAdmin.json'), 'utf8'));
    console.log(`   Proxy Admin: ${admin.address}`);
  }
  
  console.log('\n💡 To interact with contracts:');
  console.log('   1. Use the frontend: make frontend');
  console.log('   2. Run integration tests: make test-integration');
  console.log('   3. Start demo: make fusion-plus-demo');
}

main().catch(console.error);