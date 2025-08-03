require('../env.config');
const { ethers } = require('ethers');

async function main() {
  const txHash = process.argv[2] || '0x9c18286f5f66fb363040b6f10681cbdb33f0db37baca7c396e11c466ca1e358c';
  
  console.log(`\n🔍 Checking transaction: ${txHash}`);
  console.log('─'.repeat(70));
  
  try {
    const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      console.log('⏳ Transaction is still pending or not found');
      console.log('\nCheck on explorer:');
      console.log(`https://sepolia.basescan.org/tx/${txHash}`);
      return;
    }
    
    console.log('\n✅ Transaction confirmed!');
    console.log(`   Block Number: ${receipt.blockNumber}`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`   Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
    
    if (receipt.contractAddress) {
      console.log(`\n📋 Contract Deployed:`);
      console.log(`   Address: ${receipt.contractAddress}`);
      console.log(`   Explorer: https://sepolia.basescan.org/address/${receipt.contractAddress}`);
      
      // Save to deployments if EscrowFactory
      if (txHash === '0x9c18286f5f66fb363040b6f10681cbdb33f0db37baca7c396e11c466ca1e358c') {
        console.log('\n💾 This is the EscrowFactory deployment!');
        console.log(`   Contract Address: ${receipt.contractAddress}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main().catch(console.error);