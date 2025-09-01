import { expect } from "chai";
import { ethers } from "hardhat";
import { expectValidEip1271Signature } from "../../utils/test/eip1271";
import { signBalancerProposal } from "../../utils/test/eip712";
import { setupFactoryWithMocks, createBalancerWithPermits, mintFor } from "../../utils/test/setup";

describe("Balancer: EIP-712 proposal signature compatibility", () => {
  it("hashProposal matches EIP-712 off-chain typed data and executes; EIP-1271 happy path; allowances checked", async () => {
    const { factory, tokens } = await setupFactoryWithMocks();
    const [owner] = await ethers.getSigners();

    const e6 = 10n ** 6n;
    const e18 = 10n ** 18n;

    await mintFor(owner.address, { usdc: 5_000n * e6, dai: 10_000n * e18 });

    const assets = [await tokens.usdc.getAddress(), await tokens.dai.getAddress()];
    const targetPercBps = [6000, 4000];
    const deposits = [2_000n * e6, 4_000n * e18];

    const balancer = await createBalancerWithPermits({ factory, owner, assets, targetPercBps, deposits });
    const balancerAddr = await balancer.getAddress();

    // Check allowances: after create, Factory should not retain allowance beyond used amount (mock may keep exact value, but transferFrom consumed funds). We assert Balancer has zero allowance to pull from owner unless later permitted.
    const usdc = await ethers.getContractAt("MockERC20Permit", assets[0]);
    const dai = await ethers.getContractAt("MockERC20Permit", assets[1]);
    expect(await usdc.allowance(owner.address, await factory.getAddress())).to.equal(0n);
    expect(await dai.allowance(owner.address, await factory.getAddress())).to.equal(0n);
    expect(await usdc.allowance(owner.address, balancerAddr)).to.equal(0n);
    expect(await dai.allowance(owner.address, balancerAddr)).to.equal(0n);

    // Build a proposal off-chain
    const deltas = [
      {
        token: assets[0],
        percentageDelta: 0,
        newPercentage: 5000,
        amount: 0,
        isDeposit: false,
      },
      {
        token: assets[1],
        percentageDelta: 0,
        newPercentage: 5000,
        amount: 0,
        isDeposit: false,
      },
    ];
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

    // Sign with helper (EIP-712)
    const nonce = await balancer.nonce();
    const { signature } = await signBalancerProposal(owner, balancerAddr, deltas as any, nonce, deadline);

    // Verify on-chain executes
    await expect(balancer.connect(owner).executeSignedRebalance(deltas as any, deadline, signature)).to.emit(
      balancer,
      "ProposalExecuted",
    );

    // Targets should now be ~50/50
    expect(await balancer.targetPercentageBps(assets[0])).to.equal(5000);
    expect(await balancer.targetPercentageBps(assets[1])).to.equal(5000);

    // EIP-1271 sanity: contract validates owner EOA sig via EIP-1271 path when queried
    await expectValidEip1271Signature(balancer);
  });
});
