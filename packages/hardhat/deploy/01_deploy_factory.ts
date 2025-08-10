import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployLibraries } from "../utils/deploy/libs";
import {
  getOrDeployMockTokens,
  getOrDeployLimitOrderProtocol,
  getOrDeployDiaOracle,
  configureDiaPrices,
  wireAdapterKeys,
} from "../utils/deploy/mocks/index";
import { deployBalancerFactory } from "../utils/deploy/factory";

const deployBalancerFactoryScript: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
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

    // Step 3: Deploy or get DIA oracle + adapter
    console.log("🔧 Step 3: Deploying/getting DIA oracle + adapter...");
    const { adapter, dia } = await getOrDeployDiaOracle(hre);

    // Step 4: Deploy or get limit order protocol
    console.log("📋 Step 4: Deploying/getting limit order protocol...");
    const mockLimitOrderProtocol = await getOrDeployLimitOrderProtocol(hre);

    // Step 5: Configure DIA mock prices and wire adapter keys
    console.log("💰 Step 5: Configuring DIA prices + adapter keys...");
    await configureDiaPrices(dia, tokens);
    await wireAdapterKeys(adapter, tokens);

    // Step 6: Deploy OptimizedBalancerFactory with stablecoin addresses
    console.log("🏭 Step 6: Deploying OptimizedBalancerFactory...");
    const stablecoinAddresses = [
      await tokens.mockUSDC.getAddress(),
      await tokens.mockUSDT.getAddress(),
      await tokens.mockDAI.getAddress(),
    ];

    const factory = await deployBalancerFactory(
      hre,
      {
        limitOrderLib: libraries.limitOrderLib,
        stablecoinGridLib: libraries.stablecoinGridLib,
      },
      { priceFeedAdapter: adapter, mockLimitOrderProtocol },
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

export default deployBalancerFactoryScript;
deployBalancerFactoryScript.tags = ["BalancerFactory"];
