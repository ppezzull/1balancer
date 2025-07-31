import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the HTLCManager contract for BASE testnet
 * This contract manages Hashed Timelock Contracts for atomic swaps
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployHTLCManager: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("🚀 Deploying HTLCManager to BASE testnet...");

  // Deploy HTLCManager with timeout configuration
  const htlcManagerDeployment = await deploy("HTLCManager", {
    from: deployer,
    // Constructor arguments: minTimeout (30 minutes), maxTimeout (7 days)
    args: [
      30 * 60,        // 30 minutes minimum timeout
      7 * 24 * 60 * 60 // 7 days maximum timeout
    ],
    log: true,
    autoMine: true,
  });

  console.log("✅ HTLCManager deployed to:", htlcManagerDeployment.address);

  // Get the deployed contract
  const htlcManager = await hre.ethers.getContract<Contract>("HTLCManager", deployer);
  
  // Log deployment info
  console.log("📋 HTLCManager Configuration:");
  console.log("   - MIN_TIMEOUT:", await htlcManager.MIN_TIMEOUT(), "seconds");
  console.log("   - MAX_TIMEOUT:", await htlcManager.MAX_TIMEOUT(), "seconds");
  console.log("   - Deployer has DEFAULT_ADMIN_ROLE");

  // Verify on BASE testnet if not localhost
  if (hre.network.name === "baseSepolia") {
    console.log("🔍 Preparing contract verification on Basescan...");
    try {
      await hre.run("verify:verify", {
        address: htlcManagerDeployment.address,
        constructorArguments: [30 * 60, 7 * 24 * 60 * 60],
      });
      console.log("✅ Contract verified on Basescan");
    } catch (error) {
      console.log("❌ Verification failed:", error);
    }
  }
};

export default deployHTLCManager;

// Tags for selective deployment
deployHTLCManager.tags = ["HTLCManager", "EthereumHub", "BASE"];