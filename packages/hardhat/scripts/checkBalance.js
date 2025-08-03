const { ethers } = require("hardhat");

async function main() {
  try {
    // Get the signer
    const [signer] = await ethers.getSigners();
    
    // Get balance
    const balance = await ethers.provider.getBalance(signer.address);
    
    // Format and print balance
    console.log(ethers.formatEther(balance));
  } catch (error) {
    console.log("0");
  }
}

main().catch(() => {
  console.log("0");
  process.exit(0);
});