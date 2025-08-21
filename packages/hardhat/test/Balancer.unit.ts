import { expect } from "chai";
import { ethers } from "hardhat";

describe("Balancer (unit)", () => {
  async function deployBasic() {
    const [owner, user] = await ethers.getSigners();
    const USDC = await ethers.getContractFactory("MockERC20");
    const usdc = await USDC.deploy("USD Coin", "USDC", 6);
    await usdc.waitForDeployment();

    const assets = [await usdc.getAddress()];
    const targets = [10_000n];
    const deposits = [0n];

    const Balancer = await ethers.getContractFactory("Balancer");
    const balancer = await Balancer.deploy(owner.address, assets, targets, deposits, "Test", "Desc");
    await balancer.waitForDeployment();

    return { owner, user, usdc, balancer };
  }

  it("accepts EOA signature to executeSignedRebalance and updates state", async () => {
    const { owner, balancer, usdc } = await deployBasic();

    await usdc.mint(await owner.getAddress(), 1_000_000n);

    const deltas = [
      { token: await usdc.getAddress(), percentageDelta: 0n, newPercentage: 8_000n, amount: 100_000n, isDeposit: true },
    ];

    const nonce: bigint = await balancer.nonce();
    const latest = await ethers.provider.getBlock("latest");
    const deadline = BigInt((latest?.timestamp ?? 0) + 3600);

    const network = await ethers.provider.getNetwork();
    const domain = {
      name: "Balancer",
      version: "1",
      chainId: Number(network.chainId),
      verifyingContract: await balancer.getAddress(),
    };
    const types = {
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
    const value = { nonce, deadline, deltas };
    const signature = await owner.signTypedData(domain, types, value);

    await usdc.connect(owner).approve(await balancer.getAddress(), 100_000n);

    await expect(balancer.executeSignedRebalance(deltas, deadline, signature)).to.emit(balancer, "ProposalExecuted");

    expect(await balancer.targetPercentageBps(await usdc.getAddress())).to.equal(8_000n);
    expect(await usdc.balanceOf(await balancer.getAddress())).to.equal(100_000n);
  });

  it("rejects expired deadline", async () => {
    const { owner, balancer, usdc } = await deployBasic();
    await usdc.mint(await owner.getAddress(), 1_000_000n);

    const deltas = [
      { token: await usdc.getAddress(), percentageDelta: 0n, newPercentage: 9_000n, amount: 0n, isDeposit: true },
    ];

    const nonce: bigint = await balancer.nonce();
    const latest = await ethers.provider.getBlock("latest");
    const deadline = BigInt((latest?.timestamp ?? 0) - 1);

    const network = await ethers.provider.getNetwork();
    const domain = {
      name: "Balancer",
      version: "1",
      chainId: Number(network.chainId),
      verifyingContract: await balancer.getAddress(),
    };
    const types = {
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
    const value = { nonce, deadline, deltas };
    const signature = await owner.signTypedData(domain, types, value);
    await expect(balancer.executeSignedRebalance(deltas, deadline, signature)).to.be.revertedWithCustomError(
      balancer,
      "Expired",
    );
  });

  it("accepts signature via EIP-1271 when contract is the owner", async () => {
    const [owner] = await ethers.getSigners();

    const USDC = await ethers.getContractFactory("MockERC20");
    const usdc = await USDC.deploy("USD Coin", "USDC", 6);
    await usdc.waitForDeployment();

    const Mock1271 = await ethers.getContractFactory("Mock1271Wallet");
    const wallet = await Mock1271.deploy(await owner.getAddress());
    await wallet.waitForDeployment();

    const assets = [await usdc.getAddress()];
    const targets = [10_000n];
    const deposits = [0n];
    const Balancer = await ethers.getContractFactory("Balancer");
    const balancer = await Balancer.deploy(await wallet.getAddress(), assets, targets, deposits, "Test", "Desc");
    await balancer.waitForDeployment();

    await usdc.mint(await owner.getAddress(), 500_000n);
    const deltas = [
      { token: await usdc.getAddress(), percentageDelta: 0n, newPercentage: 7_500n, amount: 50_000n, isDeposit: true },
    ];
    const nonce: bigint = await balancer.nonce();
    const latest2 = await ethers.provider.getBlock("latest");
    const deadline = BigInt((latest2?.timestamp ?? 0) + 3600);

    const network2 = await ethers.provider.getNetwork();
    const domain = {
      name: "Balancer",
      version: "1",
      chainId: Number(network2.chainId),
      verifyingContract: await balancer.getAddress(),
    };
    const types = {
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
    const value = { nonce, deadline, deltas };
    const signature = await owner.signTypedData(domain, types, value);

    await usdc.connect(owner).approve(await balancer.getAddress(), 50_000n);

    await expect(balancer.executeSignedRebalance(deltas, deadline, signature)).to.emit(balancer, "ProposalExecuted");
  });
});
