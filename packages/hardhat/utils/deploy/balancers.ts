import { HardhatRuntimeEnvironment } from "hardhat/types";
import { OptimizedBalancerFactory, OptimizedDriftBalancer } from "../../typechain-types";
import { EventLog } from "ethers";

export interface DriftBalancerConfig {
  assetAddresses: string[];
  percentages: bigint[];
  amounts: bigint[];
  driftPercentage: bigint;
}

export async function deployDriftBalancer(
  hre: HardhatRuntimeEnvironment,
  factory: OptimizedBalancerFactory,
  config: DriftBalancerConfig,
): Promise<OptimizedDriftBalancer> {
  const { ethers } = hre;

  console.log("🏊 Deploying OptimizedDriftBalancer via factory...");

  // Create the drift balancer through the factory
  const tx = await factory.createDriftBalancer(
    config.assetAddresses,
    config.percentages,
    config.amounts,
    config.driftPercentage,
  );

  const receipt = await tx.wait();

  console.log("Transaction successful, checking events...");
  console.log("All logs:", receipt?.logs);

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
  const driftBalancer = (await ethers.getContractAt(
    "OptimizedDriftBalancer",
    balancerAddress,
  )) as unknown as OptimizedDriftBalancer;

  console.log("✅ OptimizedDriftBalancer deployed at:", await driftBalancer.getAddress());
  console.log("  Owner:", await driftBalancer.owner());
  console.log("  Drift Percentage:", await driftBalancer.driftPercentage());

  return driftBalancer;
}
