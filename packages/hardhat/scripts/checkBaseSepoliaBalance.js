require('../env.config');
const { ethers } = require('ethers');

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ No DEPLOYER_PRIVATE_KEY found');
    process.exit(1);
  }
  
  try {
    // Multiple RPC endpoints to try
    const rpcUrls = [
      'https://sepolia.base.org',
      'https://base-sepolia.publicnode.com',
      'https://base-sepolia-rpc.publicnode.com',
      'https://base-sepolia.blockpi.network/v1/rpc/public'
    ];
    
    const wallet = new ethers.Wallet(privateKey);
    console.log(`\n🔍 Checking balance for: ${wallet.address}`);
    console.log('   on BASE Sepolia (Chain ID: 84532)\n');
    
    for (const rpcUrl of rpcUrls) {
      try {
        console.log(`Trying RPC: ${rpcUrl}`);
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const balance = await provider.getBalance(wallet.address);
        const balanceInEth = ethers.formatEther(balance);
        
        console.log(`✅ Balance: ${balanceInEth} ETH\n`);
        
        // Also check the network
        const network = await provider.getNetwork();
        console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})`);
        
        if (parseFloat(balanceInEth) > 0) {
          console.log('\n✨ Great! Your account has funds. You can now deploy.');
          break;
        }
      } catch (error) {
        console.log(`❌ Failed with this RPC: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main().catch(console.error);