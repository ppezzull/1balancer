import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployLibrariesScript: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("🚀 Deploying library contracts...");
  console.log("Deployer:", deployer);

  // Set high gas limit for all deployments
  const gasLimit = 100000000;

  try {
    // Deploy LimitOrderLib
    console.log("Deploying LimitOrderLib...");
    const limitOrderLib = await deploy("LimitOrderLib", {
      from: deployer,
      args: [],
      log: true,
      autoMine: true,
      skipIfAlreadyDeployed: false,
      gasLimit: gasLimit,
    });
    console.log("✅ LimitOrderLib deployed to:", limitOrderLib.address);

    // Deploy StablecoinGridLib
    console.log("Deploying StablecoinGridLib...");
    const stablecoinGridLib = await deploy("StablecoinGridLib", {
      from: deployer,
      args: [],
      log: true,
      autoMine: true,
      skipIfAlreadyDeployed: false,
      gasLimit: gasLimit,
    });
    console.log("✅ StablecoinGridLib deployed to:", stablecoinGridLib.address);

    // Deploy PortfolioAnalysisLib
    console.log("Deploying PortfolioAnalysisLib...");
    const portfolioAnalysisLib = await deploy("PortfolioAnalysisLib", {
      from: deployer,
      args: [],
      log: true,
      autoMine: true,
      skipIfAlreadyDeployed: false,
      gasLimit: gasLimit,
    });
    console.log("✅ PortfolioAnalysisLib deployed to:", portfolioAnalysisLib.address);

    console.log("✅ All libraries deployed and saved to deployments");

    return true;
  } catch (error) {
    console.error("❌ Library deployment failed:", error);
    throw error;
  }
};

export default deployLibrariesScript;
deployLibrariesScript.tags = ["Libraries"];
deployLibrariesScript.id = "deploy_libraries";
