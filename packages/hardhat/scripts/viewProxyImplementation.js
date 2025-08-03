require('../env.config');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

async function main() {
  const network = process.argv[2] || 'baseSepolia';
  const contractName = process.argv[3] || 'FusionPlusHub';
  
  console.log('\n🔍 PROXY CONTRACT VIEWER');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`Network: ${network}`);
  console.log(`Contract: ${contractName}`);
  console.log('');
  
  // Load deployment files
  const deploymentPath = path.join(__dirname, '..', 'deployments', network, `${contractName}.json`);
  const implPath = path.join(__dirname, '..', 'deployments', network, `${contractName}_Implementation.json`);
  
  if (!fs.existsSync(deploymentPath)) {
    console.error(`❌ No deployment found for ${contractName} on ${network}`);
    return;
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const implementation = fs.existsSync(implPath) ? JSON.parse(fs.readFileSync(implPath, 'utf8')) : null;
  
  console.log('📋 DEPLOYMENT INFO:');
  console.log('─'.repeat(60));
  console.log(`Proxy Address: ${deployment.address}`);
  console.log(`Implementation: ${implementation ? implementation.address : 'N/A'}`);
  console.log('');
  
  console.log('🔗 EXPLORER LINKS:');
  console.log('─'.repeat(60));
  const explorerBase = network === 'baseSepolia' ? 'https://sepolia.basescan.org' : 'https://etherscan.io';
  console.log(`Proxy Contract: ${explorerBase}/address/${deployment.address}`);
  if (implementation) {
    console.log(`Implementation: ${explorerBase}/address/${implementation.address}#code`);
    console.log('');
    console.log('💡 TIP: View the implementation link above to see your actual contract code!');
  }
  
  console.log('\n📜 AVAILABLE FUNCTIONS:');
  console.log('─'.repeat(60));
  
  // Parse ABI to show functions
  const abi = deployment.abi;
  const functions = abi.filter(item => item.type === 'function' && !item.name.startsWith('__'));
  
  // Group by read/write
  const readFunctions = functions.filter(f => f.stateMutability === 'view' || f.stateMutability === 'pure');
  const writeFunctions = functions.filter(f => f.stateMutability !== 'view' && f.stateMutability !== 'pure');
  
  if (readFunctions.length > 0) {
    console.log('\n📖 READ FUNCTIONS (no gas required):');
    readFunctions.forEach(func => {
      const params = func.inputs.map(i => `${i.type} ${i.name}`).join(', ');
      const returns = func.outputs.map(o => o.type).join(', ');
      console.log(`   • ${func.name}(${params})${returns ? ` → ${returns}` : ''}`);
    });
  }
  
  if (writeFunctions.length > 0) {
    console.log('\n✏️  WRITE FUNCTIONS (requires gas):');
    writeFunctions.forEach(func => {
      const params = func.inputs.map(i => `${i.type} ${i.name}`).join(', ');
      console.log(`   • ${func.name}(${params})`);
    });
  }
  
  console.log('\n🛠️  HOW TO INTERACT WITH THE PROXY:');
  console.log('─'.repeat(60));
  console.log('1. Via Etherscan/BaseScan:');
  console.log('   a) Go to the implementation address above');
  console.log('   b) Copy the ABI from "Contract ABI" section');
  console.log('   c) Go to your proxy address');
  console.log('   d) Click "Write as Proxy" or "Custom ABI"');
  console.log('   e) Paste the implementation ABI');
  console.log('');
  console.log('2. Via Hardhat/Scripts:');
  console.log('   ```javascript');
  console.log('   const contract = await ethers.getContractAt(');
  console.log(`     "${contractName}",`);
  console.log(`     "${deployment.address}"`);
  console.log('   );');
  console.log('   // Now use any function from the implementation');
  console.log('   const result = await contract.yourFunction();');
  console.log('   ```');
  console.log('');
  console.log('3. Via Web3/Ethers directly:');
  console.log('   ```javascript');
  console.log('   const abi = implementationABI; // From deployment file');
  console.log(`   const proxyAddress = "${deployment.address}";`);
  console.log('   const contract = new ethers.Contract(proxyAddress, abi, signer);');
  console.log('   ```');
  
  // Generate ABI file
  const abiPath = path.join(__dirname, '..', 'deployments', network, `${contractName}_ABI.json`);
  fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
  console.log(`\n💾 ABI saved to: deployments/${network}/${contractName}_ABI.json`);
  
  console.log('\n🎯 QUICK ACTIONS:');
  console.log('─'.repeat(60));
  console.log(`• Verify on explorer: make verify-proxy CONTRACT=${contractName}`);
  console.log(`• Interact via CLI: make proxy-call CONTRACT=${contractName} FUNCTION=yourFunction`);
  console.log(`• Get function sig: make proxy-sig CONTRACT=${contractName} FUNCTION=yourFunction`);
  console.log('');
}

main().catch(console.error);