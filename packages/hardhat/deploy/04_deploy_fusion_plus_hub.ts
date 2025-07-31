import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the FusionPlusHub contract for BASE testnet
 * This is the main hub contract for Fusion+ cross-chain swaps
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployFusionPlusHub: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  console.log("🚀 Deploying FusionPlusHub to BASE testnet...");

  // Get deployed contract addresses
  const htlcManagerDeployment = await get("HTLCManager");
  const orchestrationDeployment = await get("OrchestrationCoordinator");

  // For hackathon demo, we'll use placeholder addresses for 1inch contracts
  // These will be replaced with actual addresses when 1inch deploys to BASE testnet
  const PLACEHOLDER_LIMIT_ORDER_PROTOCOL = "0x0000000000000000000000000000000000000001";
  const PLACEHOLDER_AGGREGATION_ROUTER = "0x0000000000000000000000000000000000000002";

  console.log("⚠️  Note: Using placeholder addresses for 1inch contracts (not yet deployed to BASE testnet)");

  // Deploy FusionPlusHub as upgradeable proxy
  const fusionPlusHubDeployment = await deploy("FusionPlusHub", {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      viaAdminContract: "DefaultProxyAdmin",
      execute: {
        init: {
          methodName: "initialize",
          args: [
            PLACEHOLDER_LIMIT_ORDER_PROTOCOL,
            PLACEHOLDER_AGGREGATION_ROUTER,
            htlcManagerDeployment.address,
            orchestrationDeployment.address,
          ],
        },
      },
    },
    log: true,
    autoMine: true,
  });

  console.log("✅ FusionPlusHub deployed to:", fusionPlusHubDeployment.address);

  // Get the deployed contract
  const fusionPlusHub = await hre.ethers.getContract<Contract>("FusionPlusHub", deployer);
  
  // Log deployment info
  console.log("📋 FusionPlusHub Configuration:");
  console.log("   - Implementation:", fusionPlusHubDeployment.implementation);
  console.log("   - Proxy Admin:", await fusionPlusHubDeployment.owner);
  console.log("   - HTLCManager:", htlcManagerDeployment.address);
  console.log("   - OrchestrationCoordinator:", orchestrationDeployment.address);
  console.log("   - Limit Order Protocol:", PLACEHOLDER_LIMIT_ORDER_PROTOCOL, "(placeholder)");
  console.log("   - Aggregation Router:", PLACEHOLDER_AGGREGATION_ROUTER, "(placeholder)");
  
  const protocolFee = await fusionPlusHub.protocolFee();
  console.log("   - Protocol Fee:", protocolFee.toString(), "basis points (", Number(protocolFee) / 100, "%)");

  // Grant roles if needed
  console.log("⚙️  Setting up roles...");
  const RESOLVER_ROLE = await fusionPlusHub.RESOLVER_ROLE();
  
  // In production, this would be a separate resolver address
  // For demo, deployer has resolver role
  const hasResolverRole = await fusionPlusHub.hasRole(RESOLVER_ROLE, deployer);
  if (!hasResolverRole) {
    const tx = await fusionPlusHub.grantRole(RESOLVER_ROLE, deployer);
    await tx.wait();
    console.log("✅ Granted RESOLVER_ROLE to deployer for testing");
  }

  // Verify on BASE testnet if not localhost
  if (hre.network.name === "baseSepolia") {
    console.log("🔍 Preparing contract verification on Basescan...");
    try {
      // Verify implementation contract
      await hre.run("verify:verify", {
        address: fusionPlusHubDeployment.implementation,
        constructorArguments: [],
      });
      console.log("✅ Implementation contract verified on Basescan");

      // Note: Proxy verification might need to be done manually on Basescan
      console.log("📝 Note: Please verify the proxy contract manually on Basescan");
      console.log("   Proxy address:", fusionPlusHubDeployment.address);
      console.log("   Implementation:", fusionPlusHubDeployment.implementation);
    } catch (error) {
      console.log("❌ Verification failed:", error);
    }
  }

  console.log("\n🎉 Ethereum Hub deployment complete!");
  console.log("📍 Contract Addresses:");
  console.log("   - HTLCManager:", htlcManagerDeployment.address);
  console.log("   - OrchestrationCoordinator:", orchestrationDeployment.address);
  console.log("   - FusionPlusHub:", fusionPlusHubDeployment.address);
  console.log("\n🔗 Ready for cross-chain atomic swaps with NEAR!");
};

export default deployFusionPlusHub;

// Tags for selective deployment
deployFusionPlusHub.tags = ["FusionPlusHub", "EthereumHub", "BASE"];

// Dependencies - ensure other contracts are deployed first
deployFusionPlusHub.dependencies = ["HTLCManager", "OrchestrationCoordinator"];