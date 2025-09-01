import { expect } from "chai";
import { ethers } from "hardhat";
import type { Signer } from "ethers";

// EIP-1271 helpers
export async function expectValidEip1271Signature(contractWith1271: any): Promise<void> {
  const [owner] = await ethers.getSigners();
  const orderHash = ethers.keccak256(ethers.toUtf8Bytes("TEST_ORDER"));
  const messageBytes = ethers.getBytes(orderHash);
  const signed = await owner.signMessage(messageBytes);
  const digest = ethers.keccak256(
    ethers.solidityPacked(["string", "bytes32"], ["\x19Ethereum Signed Message:\n32", orderHash]),
  );
  const isValid = await contractWith1271.isValidSignature(digest as any, signed);
  expect(isValid).to.equal("0x1626ba7e");
}

export async function expectInvalidEip1271Signature(contractWith1271: any): Promise<void> {
  const orderHash = ethers.keccak256(ethers.toUtf8Bytes("TEST_ORDER"));
  const other = (await ethers.getSigners())[1];
  const wrongSig = await other.signMessage(ethers.getBytes(orderHash));
  const isValid = await contractWith1271.isValidSignature(orderHash, wrongSig);
  expect(isValid).to.equal("0xffffffff");
}

// EIP-712 signing helper for Balancer proposals
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
