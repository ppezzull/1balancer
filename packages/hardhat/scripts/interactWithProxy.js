require('../env.config');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

async function main() {
  const network = process.argv[2] || 'baseSepolia';
  const contractName = process.argv[3] || 'FusionPlusHub';
  const functionName = process.argv[4];
  const args = process.argv.slice(5);
  
  if (!functionName) {
    console.log('\n📖 PROXY INTERACTION HELPER');
    console.log('════════════════════════════════════════════════════════════');
    console.log('Usage: node interactWithProxy.js [network] [contract] [function] [...args]');
    console.log('');
    console.log('Example calls:');
    console.log('  node interactWithProxy.js baseSepolia FusionPlusHub protocolFee');
    console.log('  node interactWithProxy.js baseSepolia FusionPlusHub paused');
    console.log('  node interactWithProxy.js baseSepolia FusionPlusHub getContractAddresses');
    return;
  }
  
  // Load deployment
  const deploymentPath = path.join(__dirname, '..', 'deployments', network, `${contractName}.json`);
  if (!fs.existsSync(deploymentPath)) {
    console.error(`❌ No deployment found for ${contractName} on ${network}`);
    return;
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  
  // Connect to network
  const rpcUrl = network === 'baseSepolia' ? 'https://sepolia.base.org' : 
                 network === 'localhost' ? 'http://localhost:8545' : 
                 `https://eth-${network}.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`;
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // Create contract instance using proxy address with implementation ABI
  const contract = new ethers.Contract(deployment.address, deployment.abi, provider);
  
  console.log(`\n🔍 Calling ${functionName} on ${contractName}`);
  console.log(`📍 Proxy Address: ${deployment.address}`);
  console.log(`🌐 Network: ${network}`);
  console.log('');
  
  try {
    // Find function in ABI
    const func = deployment.abi.find(f => f.type === 'function' && f.name === functionName);
    if (!func) {
      console.error(`❌ Function "${functionName}" not found in ABI`);
      console.log('\nAvailable functions:');
      deployment.abi
        .filter(f => f.type === 'function')
        .forEach(f => console.log(`  • ${f.name}`));
      return;
    }
    
    // Call the function
    const result = await contract[functionName](...args);
    
    console.log('✅ Result:');
    if (typeof result === 'object' && result !== null) {
      // Handle struct returns
      if (Array.isArray(result)) {
        result.forEach((val, idx) => {
          const output = func.outputs[idx];
          console.log(`   ${output?.name || `[${idx}]`}: ${val.toString()}`);
        });
      } else {
        console.log(`   ${result.toString()}`);
      }
    } else {
      console.log(`   ${result}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('call revert exception')) {
      console.log('\n💡 This might mean:');
      console.log('   1. The contract is paused');
      console.log('   2. You need specific permissions');
      console.log('   3. The function requires different arguments');
    }
  }
}

main().catch(console.error);