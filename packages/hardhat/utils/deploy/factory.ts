import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployResult } from "hardhat-deploy/types";

import type { BalancerFactory } from "../../typechain-types";

export type DeployedFactory = {
  address: string;
  instance: BalancerFactory;
  deployment: DeployResult;
};

export async function deployBalancerFactory(hre: HardhatRuntimeEnvironment): Promise<DeployedFactory> {
  const { deployments, ethers, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // On dev networks, drop previous deployment to avoid ABI/bytecode drift
  const isDev = hre.network.name === "hardhat" || hre.network.name === "localhost";
  const existing = await deployments.getOrNull("BalancerFactory");
  if (isDev && existing) {
    await deployments.delete("BalancerFactory");
  }

  const deployment = await deploy("BalancerFactory", {
    from: deployer,
    args: [],
    log: true,
    // Force redeploy to pick up ABI/signature changes during active development
    skipIfAlreadyDeployed: false,
  });

  const instance = (await ethers.getContractAt("BalancerFactory", deployment.address)) as unknown as BalancerFactory;

  return { address: deployment.address, instance, deployment };
}

export async function getBalancerFactory(hre: HardhatRuntimeEnvironment): Promise<BalancerFactory> {
  const { deployments, ethers } = hre;
  const d = await deployments.get("BalancerFactory");
  return (await ethers.getContractAt("BalancerFactory", d.address)) as unknown as BalancerFactory;
}
