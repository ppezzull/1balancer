import { expect } from "chai";
import { ethers } from "hardhat";
import type { Signer } from "ethers";
import { getOwnerSignerOf, log } from "./setup";

export async function expectValidEip1271Signature(driftBalancer: any): Promise<void> {
  const ownerSigner = await getOwnerSignerOf(driftBalancer);
  const ownerAddr = await driftBalancer.owner();

  const orderHash = ethers.keccak256(ethers.toUtf8Bytes("TEST_ORDER"));
  const messageBytes = ethers.getBytes(orderHash);
  const signed = await ownerSigner.signMessage(messageBytes);

  const recovered = ethers.verifyMessage(messageBytes, signed);
  log("Recovered signer:", recovered, "Expected owner:", ownerAddr);
  expect(recovered.toLowerCase()).to.equal(ownerAddr.toLowerCase());

  const digest = ethers.keccak256(
    ethers.solidityPacked(["string", "bytes32"], ["\x19Ethereum Signed Message:\n32", orderHash]),
  );
  const isValid = await driftBalancer.isValidSignature(digest as any, signed);
  expect(isValid).to.equal("0x1626ba7e");
}

export async function expectInvalidEip1271Signature(driftBalancer: any): Promise<void> {
  const orderHash = ethers.keccak256(ethers.toUtf8Bytes("TEST_ORDER"));
  const other = (await ethers.getSigners())[0];
  const wrongSig = await other.signMessage(ethers.getBytes(orderHash));

  const isValid = await driftBalancer.isValidSignature(orderHash, wrongSig);
  expect(isValid).to.equal("0xffffffff");
}

export async function expectCreatesEip712Order(
  driftBalancer: any,
  user: Signer,
  tokenIn: string,
  tokenOut: string,
): Promise<void> {
  const sellAmount = ethers.parseUnits("100", 6);
  const buyAmount = ethers.parseUnits("100", 6);

  const tx = await driftBalancer.connect(user).createRebalanceOrder(tokenIn, tokenOut, sellAmount, buyAmount, 50);
  const receipt = await tx.wait();
  const orderEvent = receipt?.logs.find((log: any) => (log as any).eventName === "RebalanceOrderCreated");
  expect(orderEvent).to.not.equal(undefined);

  const parsedEvent = driftBalancer.interface.parseLog(orderEvent as any);
  const orderHash = (parsedEvent as any).args[0];
  expect(orderHash).to.not.equal(ethers.ZeroHash);
  expect(orderHash.length).to.equal(66);
}
