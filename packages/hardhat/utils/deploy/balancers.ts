import { HardhatRuntimeEnvironment } from "hardhat/types";
import type { BalancerFactory, DriftBalancer } from "../../typechain-types";
import { EventLog } from "ethers";

export interface DriftBalancerConfig {
  assetAddresses: string[];
  percentages: bigint[];
  amounts: bigint[];
  driftPercentage: bigint;
}

export async function deployDriftBalancer(
  hre: HardhatRuntimeEnvironment,
  factory: BalancerFactory,
  config: DriftBalancerConfig,
): Promise<DriftBalancer> {
  const { ethers } = hre;

  // single-line output per request

  // Create the drift balancer through the factory
  const tx = await factory.createDriftBalancer(
    config.assetAddresses,
    config.percentages,
    config.amounts,
    config.driftPercentage,
  );

  const receipt = await tx.wait();

  // keep logs minimal

  // Find the BalancerCreated event
  const balancerCreatedEvent = receipt?.logs.find(
    (log): log is EventLog => (log as EventLog).eventName === "BalancerCreated",
  );

  if (!balancerCreatedEvent) {
    // Let's see what events we actually have
    const events = receipt?.logs.map(log => ({
      eventName: (log as EventLog).eventName,
      address: log.address,
      topics: log.topics,
    }));
    console.log("Available events:", events);
    throw new Error("BalancerCreated event not found");
  }

  // Extract the balancer address from the event
  const balancerAddress = balancerCreatedEvent.args[1]; // owner, balancer, isTimeBased
  const driftBalancer = (await ethers.getContractAt("DriftBalancer", balancerAddress)) as unknown as DriftBalancer;

  const addr = await driftBalancer.getAddress();
  const owner = await driftBalancer.owner();
  const driftPct = await driftBalancer.driftPercentage();
  console.log(`utils/balancers: DriftBalancer=${addr} Owner=${owner} DriftPct=${driftPct.toString()}`);

  return driftBalancer;
}
