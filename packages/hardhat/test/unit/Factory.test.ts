import { expect } from "chai";
import { ethers } from "hardhat";
import { setupFactoryWithMocks, createBalancerWithPermits, mintFor } from "../../utils/test/setup";

describe("BalancerFactory: createBalancer with EIP-2612 permits", () => {
  it("creates a Balancer and transfers initial deposits via permits", async () => {
    const { factory, tokens } = await setupFactoryWithMocks();
    const [deployer] = await ethers.getSigners();

    const e6 = 10n ** 6n;
    const e18 = 10n ** 18n;

    // Mint funds for deployer
    await mintFor(deployer.address, { usdc: 10_000n * e6, usdt: 5_000n * e6, dai: 20_000n * e18 });

    const assets = [await tokens.usdc.getAddress(), await tokens.usdt.getAddress(), await tokens.dai.getAddress()];
    const targetPercBps = [4000, 3000, 3000];
    const deposits = [5_000n * e6, 2_500n * e6, 10_000n * e18];

    const balancer = await createBalancerWithPermits({ factory, owner: deployer, assets, targetPercBps, deposits });
    const balancerAddr = await balancer.getAddress();

    // Check the Balancer got the funds
    const usdcBal = await ethers.getContractAt("MockERC20Permit", assets[0]);
    const usdtBal = await ethers.getContractAt("MockERC20Permit", assets[1]);
    const daiBal = await ethers.getContractAt("MockERC20Permit", assets[2]);

    expect(await usdcBal.balanceOf(balancerAddr)).to.equal(deposits[0]);
    expect(await usdtBal.balanceOf(balancerAddr)).to.equal(deposits[1]);
    expect(await daiBal.balanceOf(balancerAddr)).to.equal(deposits[2]);

    // Check allowances: factory should not retain allowance; balancer has zero allowance from user
    const factoryAddr = await factory.getAddress();
    expect(await usdcBal.allowance(deployer.address, factoryAddr)).to.equal(0n);
    expect(await usdtBal.allowance(deployer.address, factoryAddr)).to.equal(0n);
    expect(await daiBal.allowance(deployer.address, factoryAddr)).to.equal(0n);
    expect(await usdcBal.allowance(deployer.address, balancerAddr)).to.equal(0n);
    expect(await usdtBal.allowance(deployer.address, balancerAddr)).to.equal(0n);
    expect(await daiBal.allowance(deployer.address, balancerAddr)).to.equal(0n);

    // And that it’s recorded for the user
    const userBalancers = await factory.getUserBalancers(deployer.address);
    expect(userBalancers).to.include(balancerAddr);
  });
});
