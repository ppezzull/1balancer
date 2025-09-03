import { expect } from "chai";
import { ethers } from "hardhat";
import { expectValidEip1271Signature } from "../../utils/test/eip1271";
import { signBalancerProposal } from "../../utils/test/eip712";
import { setupFactoryWithMocks, createBalancerWithPermits, mintFor } from "../../utils/test/setup";

describe("Balancer: EIP-712 proposal signature compatibility and guards", () => {
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

    // EIP-712 constants exposed
    expect(await (balancer as any).EIP712_NAME()).to.equal("Balancer");
    expect(await (balancer as any).EIP712_VERSION()).to.equal("1");

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

  it("pausable gates executeSignedRebalance; unpause restores", async () => {
    const { factory, tokens } = await setupFactoryWithMocks();
    const [owner] = await ethers.getSigners();

    const assets = [await tokens.usdc.getAddress(), await tokens.dai.getAddress()];
    const targetPercBps = [6000, 4000];
    const deposits = [0, 0];
    const balancer = await createBalancerWithPermits({ factory, owner, assets, targetPercBps, deposits });
    const balancerAddr = await balancer.getAddress();

    const deltas = [
      { token: assets[0], percentageDelta: 0, newPercentage: 5000, amount: 0, isDeposit: false },
      { token: assets[1], percentageDelta: 0, newPercentage: 5000, amount: 0, isDeposit: false },
    ];
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const nonce = await balancer.nonce();
    const { signature } = await signBalancerProposal(owner, balancerAddr, deltas as any, nonce, deadline);

    await (balancer as any).connect(owner).pause();
    await expect(
      (balancer as any).connect(owner).executeSignedRebalance(deltas as any, deadline, signature),
    ).to.be.revertedWithCustomError(balancer, "EnforcedPause");

    await (balancer as any).connect(owner).unpause();
    await expect((balancer as any).connect(owner).executeSignedRebalance(deltas as any, deadline, signature)).to.emit(
      balancer,
      "ProposalExecuted",
    );
  });

  it("reverts when deltas length exceeds MAX_DELTAS", async () => {
    const { factory, tokens } = await setupFactoryWithMocks();
    const [owner] = await ethers.getSigners();
    const assets = [await tokens.usdc.getAddress(), await tokens.dai.getAddress()];
    const targetPercBps = [6000, 4000];
    const deposits = [0, 0];
    const balancer = await createBalancerWithPermits({ factory, owner, assets, targetPercBps, deposits });

    // Build >64 deltas
    const n = 65;
    const deltas = Array.from({ length: n }, (_, i) => ({
      token: assets[i % assets.length],
      percentageDelta: 0,
      newPercentage: 0,
      amount: 0,
      isDeposit: false,
    }));
    const future = BigInt(Math.floor(Date.now() / 1000) + 3600);
    await expect((balancer as any).executeSignedRebalance(deltas as any, future, "0x")).to.be.revertedWithCustomError(
      balancer,
      "MaxDeltasExceeded",
    );
  });

  it("reverts on duplicate asset in initialize", async () => {
    const { factory, tokens } = await setupFactoryWithMocks();
    const [owner] = await ethers.getSigners();
    const assets = [await tokens.usdc.getAddress(), await tokens.usdc.getAddress()];
    const targetPercBps = [5000, 5000];
    const deposits = [0, 0];
    await expect(
      factory.connect(owner).createBalancer(assets, targetPercBps, deposits, [
        ...Array(2).fill({
          token: assets[0],
          value: 0,
          deadline: 9999999999n,
          v: 27,
          r: ethers.ZeroHash,
          s: ethers.ZeroHash,
        }),
      ]),
    ).to.be.revertedWithCustomError(factory, "InvalidAsset");
  });

  it("reverts on too many assets in initialize", async () => {
    const { factory, tokens } = await setupFactoryWithMocks();
    const [owner] = await ethers.getSigners();
    const assets = Array(33).fill(await tokens.usdc.getAddress());
    const targetPercBps = Array(33).fill(303);
    const deposits = Array(33).fill(0);
    await expect(
      factory.connect(owner).createBalancer(assets, targetPercBps, deposits, [
        ...Array(33).fill({
          token: assets[0],
          value: 0,
          deadline: 9999999999n,
          v: 27,
          r: ethers.ZeroHash,
          s: ethers.ZeroHash,
        }),
      ]),
    ).to.be.revertedWithCustomError(factory, "MaxAssetsExceeded");
  });

  it("emits TargetsSumOutOfRange on initialize when sum != 10000", async () => {
    const { factory, tokens } = await setupFactoryWithMocks();
    const [owner] = await ethers.getSigners();
    const assets = [await tokens.usdc.getAddress(), await tokens.dai.getAddress()];
    const targetPercBps = [7000, 1000]; // sum = 8000
    const deposits = [0, 0];
    const tx = await (factory as any).connect(owner).createBalancer(assets, targetPercBps, deposits, [
      { token: assets[0], value: 0, deadline: 9999999999n, v: 27, r: ethers.ZeroHash, s: ethers.ZeroHash },
      { token: assets[1], value: 0, deadline: 9999999999n, v: 27, r: ethers.ZeroHash, s: ethers.ZeroHash },
    ]);
    const rc = await tx.wait();
    // Get the new balancer address from BalancerCreated
    const ev = rc!.logs.find((l: any) => (l as any).eventName === "BalancerCreated") as any;
    const balancerAddr = (factory as any).interface.parseLog(ev).args[1] as string;
    // Filter logs for that address and parse with Balancer ABI
    const balancerFactory = await ethers.getContractFactory("Balancer");
    const balIface = balancerFactory.interface;
    const balLogs = rc!.logs.filter((l: any) => (l as any).address?.toLowerCase() === balancerAddr.toLowerCase());
    const parsed = balLogs
      .map((l: any) => {
        try {
          return balIface.parseLog(l);
        } catch {
          return null;
        }
      })
      .filter(Boolean) as any[];
    expect(parsed.some(p => p.name === "TargetsSumOutOfRange")).to.equal(true);
  });
});
