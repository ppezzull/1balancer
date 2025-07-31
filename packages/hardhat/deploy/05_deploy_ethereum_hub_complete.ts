import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Master deployment script for the complete Ethereum Hub on BASE testnet
 * Deploys all contracts in the correct order and sets up the infrastructure
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployEthereumHubComplete: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  
  console.log("🏗️  Starting Ethereum Hub deployment to BASE testnet");
  console.log("📍 Network:", hre.network.name);
  console.log("👤 Deployer:", deployer);
  console.log("💰 Deployer balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer)), "ETH");
  
  // Check if we're on BASE testnet
  if (hre.network.name === "baseSepolia") {
    const chainId = await hre.ethers.provider.getNetwork().then(n => n.chainId);
    console.log("🔗 Chain ID:", chainId);
    
    if (chainId !== 84532n) {
      console.error("❌ Error: Expected BASE Sepolia chain ID 84532, got", chainId);
      throw new Error("Wrong network - please connect to BASE Sepolia testnet");
    }
  }

  console.log("\n=== Deployment Summary ===");
  console.log("This script will deploy:");
  console.log("1. HTLCManager - Atomic swap implementation");
  console.log("2. OrchestrationCoordinator - Cross-chain coordination");
  console.log("3. FusionPlusHub - Main integration hub (upgradeable)");
  console.log("========================\n");

  // The actual deployment is handled by the individual scripts
  // This script just provides a convenient entry point
  console.log("📦 Deploying contracts...");
  
  // Note: Dependencies are handled automatically by hardhat-deploy
  // HTLCManager -> OrchestrationCoordinator -> FusionPlusHub
};

export default deployEthereumHubComplete;

// This tag allows deploying all Ethereum Hub contracts at once
deployEthereumHubComplete.tags = ["EthereumHub"];

// Ensure all sub-deployments run
deployEthereumHubComplete.dependencies = ["HTLCManager", "OrchestrationCoordinator", "FusionPlusHub"];

/**
 * DEPLOYMENT INSTRUCTIONS:
 * 
 * 1. Set up environment:
 *    - Ensure you have BASE Sepolia ETH (get from faucet)
 *    - Set DEPLOYER_PRIVATE_KEY in .env
 *    - Optionally set BASESCAN_API_KEY for verification
 * 
 * 2. Deploy to BASE testnet:
 *    yarn deploy --network baseSepolia --tags EthereumHub
 * 
 * 3. Or deploy individual contracts:
 *    yarn deploy --network baseSepolia --tags HTLCManager
 *    yarn deploy --network baseSepolia --tags OrchestrationCoordinator
 *    yarn deploy --network baseSepolia --tags FusionPlusHub
 * 
 * 4. Verify contracts (if BASESCAN_API_KEY is set):
 *    Verification runs automatically after deployment
 * 
 * 5. Check deployment:
 *    - Contract addresses are saved in deployments/baseSepolia/
 *    - Frontend automatically uses deployed addresses
 */