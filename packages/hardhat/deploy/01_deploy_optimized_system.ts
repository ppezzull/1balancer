import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployLibraries } from "../utils/deploy/libs";
import {
  getOrDeployMockTokens,
  getOrDeploySpotPriceAggregator,
  configureSpotPrices,
  getOrDeployLimitOrderProtocol,
} from "../utils/deploy/mocks/index";
import { deployOptimizedBalancerFactory } from "../utils/deploy/factory";

const deployOptimizedSystem: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  console.log("🚀 Starting OptimizedBalancerFactory deployment...");
  console.log("Deployer:", deployer);

  try {
    // Step 1: Deploy libraries
    console.log("📚 Step 1: Deploying libraries...");
    const libraries = await deployLibraries(hre);

    // Step 2: Deploy or get mock tokens
    console.log("🪙 Step 2: Deploying/getting mock tokens...");
    const tokens = await getOrDeployMockTokens(hre);

    // Step 3: Deploy or get spot price aggregator
    console.log("🔧 Step 3: Deploying/getting spot price aggregator...");
    const mockPriceAggregator = await getOrDeploySpotPriceAggregator(hre);

    // Step 4: Deploy or get limit order protocol
    console.log("📋 Step 4: Deploying/getting limit order protocol...");
    const mockLimitOrderProtocol = await getOrDeployLimitOrderProtocol(hre);

    // Step 5: Configure spot prices with deployed tokens
    console.log("💰 Step 5: Configuring spot prices...");
    await configureSpotPrices(mockPriceAggregator, tokens);

    // Step 6: Deploy OptimizedBalancerFactory with stablecoin addresses
    console.log("🏭 Step 6: Deploying OptimizedBalancerFactory...");
    const stablecoinAddresses = [
      await tokens.mockUSDC.getAddress(),
      await tokens.mockUSDT.getAddress(),
      await tokens.mockDAI.getAddress(),
    ];

    const factory = await deployOptimizedBalancerFactory(
      hre,
      {
        limitOrderLib: libraries.limitOrderLib,
        stablecoinGridLib: libraries.stablecoinGridLib,
      },
      { mockPriceAggregator, mockLimitOrderProtocol },
      stablecoinAddresses,
    );

    console.log("✅ OptimizedBalancerFactory deployment complete!");
    console.log("Factory address:", await factory.getAddress());
    console.log("Stablecoins configured:", stablecoinAddresses);
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
};

export default deployOptimizedSystem;
deployOptimizedSystem.tags = ["OptimizedBalancerFactory"];
