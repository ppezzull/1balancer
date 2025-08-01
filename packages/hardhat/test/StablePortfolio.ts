import { ethers, deployments, getNamedAccounts } from "hardhat";
import { assert } from "chai";

describe("1Balancer Stable Portfolio Test", function () {
  let deployer: any;
  let factory: any;
  let usdc: any, usdt: any, dai: any;
  let feedUsdc: any;

  beforeEach(async function () {
    // Deploy mocks and factory
    const { deployer: d } = await getNamedAccounts();
    deployer = d;
    await deployments.fixture(["BalancerFactory"]);
    factory = await ethers.getContract("BalancerFactory");

    // Deploy mock ERC20s
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
    usdt = await MockERC20.deploy("Tether", "USDT", 6);
    dai = await MockERC20.deploy("Dai", "DAI", 18);

    // Deploy mock price feeds (8 decimals)
    const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    feedUsdc = await MockPriceFeed.deploy(1e8);
  });

  it("should create and initialize a DriftBalancer with three stablecoins", async function () {
    // Portfolio configuration
    const assetAddresses = [await usdc.getAddress(), await usdt.getAddress(), await dai.getAddress()];
    const percentages = [33, 33, 34]; // Sum must be 100
    const driftPercentage = 5; // 5%
    const updatePeriodicity = 86400; // 1 day

    // Stablecoin monitoring configuration (for USDC)
    const lowerBound = 99_800_000; // 0.998 * 1e8
    const upperBound = 100_200_000; // 1.002 * 1e8

    // Create the balancer
    const tx = await factory.createDriftBalancer(
      deployer,
      await usdc.getAddress(),
      await feedUsdc.getAddress(),
      lowerBound,
      upperBound,
      assetAddresses,
      percentages,
      driftPercentage,
      updatePeriodicity,
    );
    const receipt = await tx.wait();
    const event = receipt?.logs.find((l: any) => l?.eventName === "BalancerCreated");
    const balancerAddr = event?.args?.balancer;

    assert.isDefined(balancerAddr, "balancerAddr should not be undefined");

    // Attach to the deployed balancer and verify state
    const balancer = await ethers.getContractAt("DriftBalancer", balancerAddr);

    assert.equal(await balancer.owner(), deployer);
    assert.equal(await balancer.driftPercentage(), BigInt(driftPercentage));
    assert.equal(await balancer.updatePeriodicity(), BigInt(updatePeriodicity));

    // Verify asset configuration
    for (let i = 0; i < assetAddresses.length; i++) {
      const assetPercentage = await balancer.assets(assetAddresses[i]);
      assert.equal(assetPercentage, BigInt(percentages[i]));
    }
  });
});
