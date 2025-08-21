import { HardhatRuntimeEnvironment } from "hardhat/types";
import type { Balancer } from "../../typechain-types";
import { deployBalancerFactory } from "./factory";

export type BalancerDeployArgs = {
  owner: string;
  assets: string[];
  targetPercBps: bigint[] | number[];
  initialDepositAmounts: bigint[] | number[];
  permits: any[];
};

export type DeployedBalancer = {
  address: string;
  instance: Balancer;
};

export async function deployBalancer(
  hre: HardhatRuntimeEnvironment,
  args: BalancerDeployArgs,
): Promise<DeployedBalancer> {
  const { ethers } = hre;

  // Ensure Factory exists and get instance
  const { instance: factory } = await deployBalancerFactory(hre);

  // Send tx from provided owner
  const signer = await ethers.getSigner(args.owner);
  const factoryWithSigner = factory.connect(signer);

  // Create a new Balancer via Factory
  const tx = await (factoryWithSigner as any).createBalancer(
    args.assets,
    args.targetPercBps as any,
    args.initialDepositAmounts as any,
    args.permits as any,
  );
  await tx.wait();

  // Resolve created Balancer address (take last from user's list)
  const userBalancers = await factoryWithSigner.getUserBalancers(args.owner);
  const balancerAddr = userBalancers[userBalancers.length - 1];

  const instance = (await ethers.getContractAt("Balancer", balancerAddr)) as unknown as Balancer;
  return { address: balancerAddr, instance };
}

export async function getBalancer(hre: HardhatRuntimeEnvironment, address: string): Promise<Balancer> {
  const { ethers } = hre;
  return (await ethers.getContractAt("Balancer", address)) as unknown as Balancer;
}
