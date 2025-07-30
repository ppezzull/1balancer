import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployBalancerFactory: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("BalancerFactory", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const balancerFactory = await hre.ethers.getContract("BalancerFactory", deployer);
  console.log("✅ BalancerFactory deployed to:", await balancerFactory.getAddress());
};

export default deployBalancerFactory;

deployBalancerFactory.tags = ["BalancerFactory"];