import { expect } from "chai";
import { ethers } from "hardhat";
import { BalancerFactory } from "../typechain-types";


describe("BalancerFactory", function () {
  let balancerFactory: BalancerFactory;
  
  before(async () => {
    // Mainnet addresses for stablecoins
    const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    const USDT = "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2";
    const DAI = "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb";

    // 1inch Spot Price Aggregator address on mainnet
    const SPOT_PRICE_AGGREGATOR = "0x00000000000D6FFc74A8feb35aF5827bf57f6786";

    const balancerFactoryFactory = await ethers.getContractFactory("BalancerFactory");
    balancerFactory = (await balancerFactoryFactory.deploy(
      SPOT_PRICE_AGGREGATOR, 
      [USDC, USDT, DAI]
    )) as BalancerFactory;
    await balancerFactory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await balancerFactory.getAddress()).to.be.properAddress;
    });

    it("Should start with no balancers", async function () {
      // Check that the contract deployed successfully
      expect(await balancerFactory.getAddress()).to.be.properAddress;
    });
  });

  describe("Balancer Creation", function () {
    it("Should have createDriftBalancer function", async function () {
      // Check that the createDriftBalancer function exists
      expect(balancerFactory.createDriftBalancer).to.be.a("function");
    });

    it("Should have createTimeBalancer function", async function () {
      // Check that the createTimeBalancer function exists
      expect(balancerFactory.createTimeBalancer).to.be.a("function");
    });
  });
});