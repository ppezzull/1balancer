import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the OrchestrationCoordinator contract for BASE testnet
 * This contract coordinates cross-chain atomic swaps without KYC requirements
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployOrchestrationCoordinator: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  console.log("🚀 Deploying OrchestrationCoordinator to BASE testnet...");

  // Get the deployed HTLCManager address
  const htlcManagerDeployment = await get("HTLCManager");

  // Deploy OrchestrationCoordinator
  const orchestrationDeployment = await deploy("OrchestrationCoordinator", {
    from: deployer,
    // Constructor arguments: HTLCManager address
    args: [htlcManagerDeployment.address],
    log: true,
    autoMine: true,
  });

  console.log("✅ OrchestrationCoordinator deployed to:", orchestrationDeployment.address);

  // Get the deployed contract
  const orchestrationCoordinator = await hre.ethers.getContract<Contract>("OrchestrationCoordinator", deployer);
  
  // Configure supported chains (NEAR for hackathon)
  console.log("⚙️  Configuring supported chains...");
  
  // NEAR chain ID in bytes32 format
  const NEAR_CHAIN_ID = hre.ethers.encodeBytes32String("NEAR");
  
  // Add NEAR as supported chain with 30 minute confirmation time
  const tx = await orchestrationCoordinator.addSupportedChain(
    NEAR_CHAIN_ID,
    30 * 60, // 30 minute confirmation time
    1000000, // Gas limit (example value)
    hre.ethers.parseUnits("0.1", "gwei") // Gas price (example value)
  );
  
  await tx.wait();
  console.log("✅ NEAR chain configured as supported");

  // Log deployment info
  console.log("📋 OrchestrationCoordinator Configuration:");
  console.log("   - HTLCManager:", htlcManagerDeployment.address);
  console.log("   - MIN_CONFIRMATION_TIME:", await orchestrationCoordinator.MIN_CONFIRMATION_TIME(), "seconds");
  console.log("   - MAX_CONFIRMATION_TIME:", await orchestrationCoordinator.MAX_CONFIRMATION_TIME(), "seconds");
  console.log("   - Supported Chains: NEAR");

  // Verify on BASE testnet if not localhost
  if (hre.network.name === "baseSepolia") {
    console.log("🔍 Preparing contract verification on Basescan...");
    try {
      await hre.run("verify:verify", {
        address: orchestrationDeployment.address,
        constructorArguments: [htlcManagerDeployment.address],
      });
      console.log("✅ Contract verified on Basescan");
    } catch (error) {
      console.log("❌ Verification failed:", error);
    }
  }
};

export default deployOrchestrationCoordinator;

// Tags for selective deployment
deployOrchestrationCoordinator.tags = ["OrchestrationCoordinator", "EthereumHub", "BASE"];

// Dependencies - ensure HTLCManager is deployed first
deployOrchestrationCoordinator.dependencies = ["HTLCManager"];