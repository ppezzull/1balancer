import { ethers } from "hardhat";

// Common test helpers for balancers

export async function fastForward(seconds: number): Promise<void> {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

export async function forceStableDeviation(
  dia: { setMockUpdate: (key: string, ts: bigint, price: bigint) => Promise<any> },
  price = "0.995",
): Promise<void> {
  const now = BigInt(Math.floor(Date.now() / 1000));
  // Ensure reference stables are pegged and one deviates
  await dia.setMockUpdate("USDC/USD", now, ethers.parseUnits("1", 18));
  await dia.setMockUpdate("DAI/USD", now, ethers.parseUnits("1", 18));
  await dia.setMockUpdate("USDT/USD", now, ethers.parseUnits(price, 18));
}

export async function setForwarder(contract: any, forwarder: string): Promise<void> {
  await contract.setForwarderAddress(forwarder);
}
