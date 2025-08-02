import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployBalancerFactory: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  // Mainnet addresses for stablecoins
  const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const USDT = "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2";
  const DAI = "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb";

  // 1inch Spot Price Aggregator address on mainnet
  const SPOT_PRICE_AGGREGATOR = "0x00000000000D6FFc74A8feb35aF5827bf57f6786";

  // Deploy BalancerFactory
  const balancerFactory = await deploy("BalancerFactory", {
    from: deployer,
    args: [SPOT_PRICE_AGGREGATOR, [USDC, USDT, DAI]],
    log: true,
    autoMine: true,
  });

  console.log("✅ BalancerFactory deployed to:", balancerFactory.address);
};

export default deployBalancerFactory;
deployBalancerFactory.tags = ["BalancerFactory"];