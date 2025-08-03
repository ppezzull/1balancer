require('../env.config');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  const network = process.argv[2] || 'baseSepolia';
  const contractName = process.argv[3] || 'FusionPlusHub';
  
  console.log('\n🔧 PROXY VERIFICATION HELPER');
  console.log('════════════════════════════════════════════════════════════');
  console.log('Network:', network);
  console.log('Contract:', contractName);
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
  
  console.log('📋 CONTRACT ADDRESSES:');
  console.log('─'.repeat(60));
  console.log(`Proxy: ${deployment.address}`);
  console.log(`Implementation: ${implementation ? implementation.address : 'N/A'}`);
  console.log('');
  
  console.log('⚠️  KNOWN BASESCAN LIMITATIONS (2025):');
  console.log('─'.repeat(60));
  console.log('• "Contract ABI" section may not appear for proxies');
  console.log('• "Write as Proxy" feature often unavailable');
  console.log('• Manual verification sometimes buggy');
  console.log('');
  
  console.log('✅ RECOMMENDED INTERACTION METHODS:');
  console.log('─'.repeat(60));
  
  console.log('\n1️⃣ Using Remix IDE (Recommended):');
  console.log('   a) Go to https://remix.ethereum.org');
  console.log('   b) Create new file and paste this ABI:');
  console.log(`      ${path.join('deployments', network, `${contractName}_ABI.json`)}`);
  console.log('   c) Go to "Deploy & Run" tab');
  console.log('   d) Select "Injected Provider - MetaMask"');
  console.log('   e) At bottom, paste proxy address in "At Address" field:');
  console.log(`      ${deployment.address}`);
  console.log('   f) Click "At Address" button');
  console.log('   g) Now you can interact with all functions!');
  
  console.log('\n2️⃣ Using Hardhat Console:');
  console.log('   ```bash');
  console.log('   npx hardhat console --network baseSepolia');
  console.log('   ```');
  console.log('   Then in console:');
  console.log('   ```javascript');
  console.log(`   const contract = await ethers.getContractAt("${contractName}", "${deployment.address}");`);
  console.log('   await contract.paused(); // or any function');
  console.log('   ```');
  
  console.log('\n3️⃣ Using Our CLI Tools:');
  console.log('   ```bash');
  console.log('   # Read functions');
  console.log(`   make proxy-call NETWORK=${network} CONTRACT=${contractName} FUNCTION=paused`);
  console.log(`   make proxy-call NETWORK=${network} CONTRACT=${contractName} FUNCTION=protocolFee`);
  console.log('   ```');
  
  console.log('\n4️⃣ Using Cast (Foundry):');
  console.log('   ```bash');
  console.log('   # Read function');
  console.log(`   cast call ${deployment.address} "paused()" --rpc-url https://sepolia.base.org`);
  console.log('   # Decode result');
  console.log(`   cast call ${deployment.address} "protocolFee()" --rpc-url https://sepolia.base.org | cast --to-dec`);
  console.log('   ```');
  
  console.log('\n5️⃣ Programmatic Access:');
  console.log('   ```javascript');
  console.log('   // Load ABI');
  console.log(`   const abi = require('./deployments/${network}/${contractName}_ABI.json');`);
  console.log('   // Create contract instance');
  console.log(`   const contract = new ethers.Contract("${deployment.address}", abi, provider);`);
  console.log('   ```');
  
  // Export ABI in different formats
  const abiExportPath = path.join(__dirname, '..', 'exports');
  if (!fs.existsSync(abiExportPath)) {
    fs.mkdirSync(abiExportPath, { recursive: true });
  }
  
  // Human readable ABI
  const humanAbi = deployment.abi.map(item => {
    if (item.type === 'function') {
      const inputs = item.inputs.map(i => `${i.type} ${i.name}`).join(', ');
      const outputs = item.outputs?.map(o => o.type).join(', ');
      return `${item.name}(${inputs})${outputs ? ` returns (${outputs})` : ''}`;
    }
    return null;
  }).filter(Boolean);
  
  fs.writeFileSync(
    path.join(abiExportPath, `${contractName}_human_readable.txt`),
    humanAbi.join('\n')
  );
  
  console.log('\n💾 EXPORTED FILES:');
  console.log('─'.repeat(60));
  console.log(`• Full ABI: deployments/${network}/${contractName}_ABI.json`);
  console.log(`• Human Readable: exports/${contractName}_human_readable.txt`);
  
  console.log('\n🔍 TO VERIFY IMPLEMENTATION:');
  console.log('─'.repeat(60));
  if (implementation) {
    console.log('Try manual verification at:');
    console.log(`https://sepolia.basescan.org/verifyContract?a=${implementation.address}`);
    console.log('');
    console.log('Or use Hardhat:');
    console.log('```bash');
    console.log(`npx hardhat verify --network baseSepolia ${implementation.address}`);
    console.log('```');
  }
  
  console.log('\n');
}

main().catch(console.error);