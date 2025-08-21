import { expect } from "chai";
import { ethers } from "hardhat";

describe("BalancerFactory (integration)", () => {
  it("creates a new Balancer and indexes it", async () => {
    const [deployer] = await ethers.getSigners();

    // Deploy mocks
    const USDC = await ethers.getContractFactory("MockERC20");
    const usdc = await USDC.deploy("USD Coin", "USDC", 6);
    await usdc.waitForDeployment();

    // Deploy factory
    const Factory = await ethers.getContractFactory("BalancerFactory");
    const factory = await Factory.deploy();
    await factory.waitForDeployment();

    // Mint and approve initial deposit
    await usdc.mint(await deployer.getAddress(), 250_000n);
    await usdc.connect(deployer).approve(await factory.getAddress(), 250_000n);

    const assets = [await usdc.getAddress()];
    const targets = [10_000n];
    const initial = [250_000n];

    const tx = await factory.createBalancer(assets, targets, initial, "Name", "Desc");
    const receipt = await tx.wait();
    const created = receipt?.logs.find((l: any) => (l as any).eventName === "BalancerCreated");
    expect(created).to.not.equal(undefined);

    const count = await factory.balancerCount();
    expect(count).to.equal(1n);

    const list = await factory.getUserBalancers(await deployer.getAddress());
    expect(list.length).to.equal(1);
  });
});
