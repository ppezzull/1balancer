import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployBalancerFactory as deployFactory } from "../utils/deploy/factory";

const deployBalancerFactory: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  await deployFactory(hre);
};

export default deployBalancerFactory;
deployBalancerFactory.tags = ["BalancerFactory"];
