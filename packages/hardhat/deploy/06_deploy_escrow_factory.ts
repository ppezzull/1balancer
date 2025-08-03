import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the EscrowFactory contract for BASE testnet
 * This factory creates and manages escrow contracts for cross-chain atomic swaps
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployEscrowFactory: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  console.log("🏭 Deploying EscrowFactory to BASE Sepolia testnet...");
  console.log("📍 Deployer address:", deployer);

  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer);
  console.log("💰 Deployer balance:", hre.ethers.formatEther(balance), "ETH");

  // Get FusionPlusHub address (it should be deployed first)
  let fusionPlusHubAddress;
  try {
    const fusionPlusHub = await get("FusionPlusHub");
    fusionPlusHubAddress = fusionPlusHub.address;
    console.log("✅ Found FusionPlusHub at:", fusionPlusHubAddress);
  } catch (error) {
    console.log("⚠️  FusionPlusHub not found, using deployer as admin");
    fusionPlusHubAddress = deployer;
  }

  // For BASE Sepolia, 1inch hasn't deployed yet, so we use placeholder
  const PLACEHOLDER_LIMIT_ORDER_PROTOCOL = "0x0000000000000000000000000000000000000001";

  console.log("\n⚠️  Note: Using placeholder address for 1inch Limit Order Protocol");

  // Deploy EscrowFactory with gas optimization
  const escrowFactoryDeployment = await deploy("EscrowFactory", {
    from: deployer,
    args: [
      PLACEHOLDER_LIMIT_ORDER_PROTOCOL,
      fusionPlusHubAddress, // Admin address for the factory
    ],
    log: true,
    autoMine: true,
    // Gas optimization for BASE Sepolia
    gasPrice: hre.ethers.parseUnits("0.1", "gwei"), // Very low gas price on testnet
    gasLimit: 8000000, // Increase gas limit for factory deployment (deploys implementations)
  });

  console.log("✅ EscrowFactory deployed to:", escrowFactoryDeployment.address);
  console.log("   Gas used:", escrowFactoryDeployment.receipt?.gasUsed.toString());

  // Get the deployed contract
  const escrowFactory = await hre.ethers.getContract<Contract>("EscrowFactory", deployer);
  
  // Get implementation addresses
  const srcImpl = await escrowFactory.escrowSrcImplementation();
  const dstImpl = await escrowFactory.escrowDstImplementation();
  
  console.log("\n📋 EscrowFactory Configuration:");
  console.log("   - Factory Address:", escrowFactoryDeployment.address);
  console.log("   - EscrowSrc Implementation:", srcImpl);
  console.log("   - EscrowDst Implementation:", dstImpl);
  console.log("   - Limit Order Protocol:", PLACEHOLDER_LIMIT_ORDER_PROTOCOL, "(placeholder)");
  console.log("   - Admin:", fusionPlusHubAddress);

  // Grant orchestrator role to deployer for testing
  console.log("\n⚙️  Setting up roles...");
  const ORCHESTRATOR_ROLE = await escrowFactory.ORCHESTRATOR_ROLE();
  
  const hasOrchestratorRole = await escrowFactory.hasRole(ORCHESTRATOR_ROLE, deployer);
  if (!hasOrchestratorRole) {
    console.log("   Granting ORCHESTRATOR_ROLE to deployer...");
    const tx = await escrowFactory.grantRole(ORCHESTRATOR_ROLE, deployer);
    await tx.wait();
    console.log("   ✅ ORCHESTRATOR_ROLE granted");
  }

  // Update FusionPlusHub with the EscrowFactory address if deployed
  if (fusionPlusHubAddress !== deployer) {
    try {
      console.log("\n🔗 Updating FusionPlusHub with EscrowFactory address...");
      const fusionPlusHub = await hre.ethers.getContract<Contract>("FusionPlusHub", deployer);
      
      // Check if we need to update
      const currentFactory = (await fusionPlusHub.getContractAddresses())[2];
      if (currentFactory === "0x0000000000000000000000000000000000000003") {
        const tx = await fusionPlusHub.updateContracts(
          "0x0000000000000000000000000000000000000000", // Don't update LOP
          "0x0000000000000000000000000000000000000000", // Don't update router
          escrowFactoryDeployment.address // Update factory
        );
        await tx.wait();
        console.log("   ✅ FusionPlusHub updated with EscrowFactory address");
      } else {
        console.log("   ℹ️  FusionPlusHub already has a factory address");
      }
    } catch (error) {
      console.log("   ⚠️  Could not update FusionPlusHub:", error);
    }
  }

  // Verify on BASE Sepolia if not localhost
  if (hre.network.name === "baseSepolia" && process.env.BASESCAN_API_KEY) {
    console.log("\n🔍 Preparing contract verification on Basescan...");
    
    // Wait a bit for Basescan to index the contracts
    console.log("   Waiting 30s for Basescan to index the contracts...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    try {
      // Verify main factory contract
      await hre.run("verify:verify", {
        address: escrowFactoryDeployment.address,
        constructorArguments: [
          PLACEHOLDER_LIMIT_ORDER_PROTOCOL,
          fusionPlusHubAddress,
        ],
        contract: "contracts/ethereum-hub/escrow/EscrowFactory.sol:EscrowFactory"
      });
      console.log("   ✅ EscrowFactory verified on Basescan");

      // Verify implementation contracts
      console.log("   Verifying EscrowSrc implementation...");
      await hre.run("verify:verify", {
        address: srcImpl,
        constructorArguments: [],
        contract: "contracts/ethereum-hub/escrow/EscrowSrc.sol:EscrowSrc"
      });
      console.log("   ✅ EscrowSrc implementation verified");

      console.log("   Verifying EscrowDst implementation...");
      await hre.run("verify:verify", {
        address: dstImpl,
        constructorArguments: [],
        contract: "contracts/ethereum-hub/escrow/EscrowDst.sol:EscrowDst"
      });
      console.log("   ✅ EscrowDst implementation verified");

    } catch (error: any) {
      if (error.message.includes("already verified")) {
        console.log("   ℹ️  Contracts already verified");
      } else {
        console.log("   ❌ Verification failed:", error.message);
        console.log("   You can verify manually later with:");
        console.log(`   yarn hardhat verify --network baseSepolia ${escrowFactoryDeployment.address} ${PLACEHOLDER_LIMIT_ORDER_PROTOCOL} ${fusionPlusHubAddress}`);
      }
    }
  }

  console.log("\n🎉 EscrowFactory deployment complete!");
  console.log("\n📍 Contract Addresses:");
  console.log("   - EscrowFactory:", escrowFactoryDeployment.address);
  console.log("   - EscrowSrc Implementation:", srcImpl);
  console.log("   - EscrowDst Implementation:", dstImpl);
  console.log("\n💾 Deployment saved to: deployments/baseSepolia/EscrowFactory.json");
  console.log("\n🔗 Escrow system ready for cross-chain atomic swaps!");
  console.log("\n📝 Next steps:");
  console.log("   1. Update placeholder addresses when 1inch deploys to BASE");
  console.log("   2. Start orchestration service");
  console.log("   3. Connect with NEAR HTLC contracts");
};

export default deployEscrowFactory;

// Tags for selective deployment
deployEscrowFactory.tags = ["EscrowFactory", "EthereumHub", "BASE"];

// Deploy after FusionPlusHub
deployEscrowFactory.dependencies = ["FusionPlusHub"];