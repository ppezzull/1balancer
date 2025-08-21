import { HardhatRuntimeEnvironment } from "hardhat/types";

export type PermitInput = {
  token: string;
  value: bigint;
  deadline: bigint;
  v: number;
  r: `0x${string}`;
  s: `0x${string}`;
};

/**
 * Build an EIP-2612 Permit signature for a given ERC20Permit token.
 */
export async function buildPermit(
  hre: HardhatRuntimeEnvironment,
  params: {
    tokenAddress: string;
    owner: string;
    spender: string;
    value: bigint;
    deadline?: bigint; // default: now + 1 hour
  },
): Promise<PermitInput> {
  const { ethers } = hre;
  const token = await ethers.getContractAt("MockERC20Permit", params.tokenAddress);
  const [name, chainId, nonce] = await Promise.all([
    token.name(),
    ethers.provider.getNetwork().then(n => n.chainId),
    token.nonces(params.owner),
  ]);

  const deadline = params.deadline ?? BigInt(Math.floor(Date.now() / 1000)) + 3600n;

  const domain = {
    name,
    version: "1",
    chainId,
    verifyingContract: params.tokenAddress as `0x${string}`,
  } as const;

  const types: Record<string, Array<{ name: string; type: string }>> = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const message = {
    owner: params.owner as `0x${string}`,
    spender: params.spender as `0x${string}`,
    value: params.value,
    nonce,
    deadline,
  } as const;

  const signer = await ethers.getSigner(params.owner);
  const sig = await signer.signTypedData(domain, types, message);
  const r = sig.slice(0, 66) as `0x${string}`;
  const s = ("0x" + sig.slice(66, 130)) as `0x${string}`;
  const v = parseInt(sig.slice(130, 132), 16);

  return {
    token: params.tokenAddress,
    value: params.value,
    deadline,
    v,
    r,
    s,
  };
}
