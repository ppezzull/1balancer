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
    try {
      // If bytecode is missing, or to force fresh deploy each run, delete the record
      const code = await ethers.provider.getCode(existing.address);
      if (code === "0x" || code.length <= 2) {
        console.log("⚠️  Detected stale BalancerFactory deployment without code. Deleting before redeploy...");
      }
    } catch {
      // ignore
    }
    await deployments.delete("BalancerFactory");
  }

  // 1) Deploy or reuse Balancer implementation to be cloned by the factory
  const impl = await deploy("Balancer", {
    from: deployer,
    args: [],
    log: true,
    skipIfAlreadyDeployed: false,
  });

  const implAddr = impl.address;
  console.log(`Balancer implementation deployed at: ${implAddr}`);

  // 2) Deploy Factory pointing at implementation
  const deployment = await deploy("BalancerFactory", {
    from: deployer,
    args: [implAddr],
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
