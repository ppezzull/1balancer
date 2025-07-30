import { expect } from "chai";
import { ethers } from "hardhat";
import { BalancerFactory } from "../typechain-types";

describe("BalancerFactory", function () {
  let balancerFactory: BalancerFactory;
  
  before(async () => {
    const balancerFactoryFactory = await ethers.getContractFactory("BalancerFactory");
    balancerFactory = (await balancerFactoryFactory.deploy()) as BalancerFactory;
    await balancerFactory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await balancerFactory.getAddress()).to.be.properAddress;
    });

    it("Should start with no balancers", async function () {
      const balancers = await balancerFactory.getAllBalancers();
      expect(balancers.length).to.equal(0);
    });
  });

  describe("Balancer Creation", function () {
    it("Should create a new balancer with valid percentages", async function () {
      const assetAddresses = [
        "0x0000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000002"
      ];
      const percentages = [60, 40]; // Total = 100
      const driftPercentage = 5;
      const updatePeriodicity = 86400; // 1 day

      await expect(
        balancerFactory.createBalancer(
          assetAddresses,
          percentages,
          driftPercentage,
          updatePeriodicity
        )
      ).to.emit(balancerFactory, "BalancerCreated");

      const balancers = await balancerFactory.getAllBalancers();
      expect(balancers.length).to.equal(1);
    });

    it("Should revert with invalid percentages", async function () {
      const assetAddresses = [
        "0x0000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000002"
      ];
      const percentages = [60, 30]; // Total = 90, not 100
      const driftPercentage = 5;
      const updatePeriodicity = 86400;

      await expect(
        balancerFactory.createBalancer(
          assetAddresses,
          percentages,
          driftPercentage,
          updatePeriodicity
        )
      ).to.be.revertedWithCustomError(balancerFactory, "BalancerFactory__InvalidPercentagesSum");
    });
  });
});