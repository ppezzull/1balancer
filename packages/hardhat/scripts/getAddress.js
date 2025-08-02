const ethers = require("ethers");

// Check for private key in environment
const pk = process.env.DEPLOYER_PRIVATE_KEY || process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY;

if (pk && pk.startsWith("0x")) {
  try {
    const wallet = new ethers.Wallet(pk);
    console.log(wallet.address);
  } catch (error) {
    console.error("Invalid private key");
    process.exit(1);
  }
} else {
  console.log("NO_KEY");
}