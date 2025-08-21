import hre, { ethers } from "hardhat";
import type { Signer, EventLog } from "ethers";
import type { Balancer, BalancerFactory, MockERC20Permit } from "../../typechain-types";
import { deployBalancerFactory, getBalancer } from "..";
import { getOrDeployMockTokens, mintTestTokens } from "../deploy/mocks/tokens";
import { buildPermit } from "../deploy/mocks/permits";

export const shouldLog = process.env.TEST_LOG === "1";
export const log = (...args: any[]) => {
  if (shouldLog) console.log(...args);
};

export async function getOwnerSignerOf(contract: { owner: () => Promise<string> }): Promise<Signer> {
  const ownerAddr = await contract.owner();
  const allSigners = await ethers.getSigners();
  const ownerSigner = allSigners.find(s => s.address.toLowerCase() === ownerAddr.toLowerCase());
  if (!ownerSigner) throw new Error("Owner signer not found");
  return ownerSigner;
}

export function findEvent(receipt: any, eventName: string): EventLog | undefined {
  return receipt?.logs.find((log: any): log is EventLog => (log as any).eventName === eventName);
}

// High-level helpers used by tests
export async function setupFactoryWithMocks(): Promise<{
  factory: BalancerFactory;
  tokens: {
    usdc: MockERC20Permit;
    usdt: MockERC20Permit;
    dai: MockERC20Permit;
  };
}> {
  const { instance: factory } = await deployBalancerFactory(hre);
  const mocks = await getOrDeployMockTokens(hre);
  return {
    factory,
    tokens: {
      usdc: mocks.mockUSDC_Permit as unknown as MockERC20Permit,
      usdt: mocks.mockUSDT_Permit as unknown as MockERC20Permit,
      dai: mocks.mockDAI_Permit as unknown as MockERC20Permit,
    },
  };
}

export async function createBalancerWithPermits(params: {
  factory: BalancerFactory;
  owner: Signer;
  assets: string[];
  targetPercBps: Array<number | bigint>;
  deposits: Array<number | bigint>;
}): Promise<Balancer> {
  const { factory, owner, assets, targetPercBps, deposits } = params;
  const factoryAddr = await factory.getAddress();
  const permits = [] as any[];
  for (let i = 0; i < assets.length; i++) {
    const p = await buildPermit(hre, {
      tokenAddress: assets[i],
      owner: await owner.getAddress(),
      spender: factoryAddr,
      value: BigInt(deposits[i].toString()),
    });
    permits.push(p);
  }
  const tx = await (factory as any).connect(owner).createBalancer(assets, targetPercBps, deposits, permits);
  const rc = await tx.wait();
  const ev = rc!.logs.find((l: any) => (l as any).eventName === "BalancerCreated") as any;
  const balancerAddr = (factory as any).interface.parseLog(ev).args[1] as string;
  return (await getBalancer(hre, balancerAddr)) as unknown as Balancer;
}

export async function mintFor(owner: string, amounts: { usdc?: bigint; usdt?: bigint; dai?: bigint }) {
  const mocks = await getOrDeployMockTokens(hre);
  await mintTestTokens(mocks, owner, {
    USDC: amounts.usdc ?? 0n,
    USDT: amounts.usdt ?? 0n,
    DAI: amounts.dai ?? 0n,
  });
}
