import { ethers } from "hardhat";
import type { Signer } from "ethers";

// EIP-712 signing helper for Balancer proposals (typed)
export async function signBalancerProposal(
  signer: Signer,
  balancerAddr: string,
  deltas: Array<{
    token: string;
    percentageDelta: number | bigint;
    newPercentage: number | bigint;
    amount: number | bigint;
    isDeposit: boolean;
  }>,
  nonce: bigint,
  deadline: bigint,
) {
  const domain = {
    name: "Balancer",
    version: "1",
    chainId: (await ethers.provider.getNetwork()).chainId,
    verifyingContract: balancerAddr as `0x${string}`,
  } as const;

  const types: Record<string, Array<{ name: string; type: string }>> = {
    OrderDelta: [
      { name: "token", type: "address" },
      { name: "percentageDelta", type: "int256" },
      { name: "newPercentage", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "isDeposit", type: "bool" },
    ],
    Proposal: [
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "deltas", type: "OrderDelta[]" },
    ],
  };

  const message = { nonce, deadline, deltas } as const;
  const signature = await (signer as any).signTypedData(domain, types, message);
  return { signature, domain, types, message };
}
