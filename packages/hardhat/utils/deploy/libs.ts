import { HardhatRuntimeEnvironment } from "hardhat/types";
import { LimitOrderLib, StablecoinGridLib, PortfolioCoreLib } from "../../typechain-types";

export async function deployLibraries(hre: HardhatRuntimeEnvironment): Promise<{
  limitOrderLib: LimitOrderLib;
  stablecoinGridLib: StablecoinGridLib;
  portfolioAnalysisLib: PortfolioCoreLib;
}> {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  // single-line output per request

  await deploy("LimitOrderLib", {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: true,
  });

  await deploy("StablecoinGridLib", {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: true,
  });

  await deploy("PortfolioAnalysisLib", {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: true,
  });

  const limitOrderLib = (await ethers.getContractAt(
    "LimitOrderLib",
    (await get("LimitOrderLib")).address,
  )) as unknown as LimitOrderLib;

  const stablecoinGridLib = (await ethers.getContractAt(
    "StablecoinGridLib",
    (await get("StablecoinGridLib")).address,
  )) as unknown as StablecoinGridLib;

  const portfolioAnalysisLib = (await ethers.getContractAt(
    "PortfolioAnalysisLib",
    (await get("PortfolioAnalysisLib")).address,
  )) as unknown as PortfolioCoreLib;

  const lAddr = await limitOrderLib.getAddress();
  const sAddr = await stablecoinGridLib.getAddress();
  const pAddr = await portfolioAnalysisLib.getAddress();
  console.log(`utils/libs: LimitOrderLib=${lAddr} StablecoinGridLib=${sAddr} PortfolioAnalysisLib=${pAddr}`);

  return { limitOrderLib, stablecoinGridLib, portfolioAnalysisLib };
}
