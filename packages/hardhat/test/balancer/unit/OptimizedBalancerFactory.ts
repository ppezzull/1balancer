import { expect } from "chai";
import { ethers } from "hardhat";
import { OptimizedBalancerFactory, MockSpotPriceAggregator, MockLimitOrderProtocol } from "../../../typechain-types";

describe("OptimizedBalancerFactory", function () {
  let optimizedBalancerFactory: OptimizedBalancerFactory;
  let mockPriceAggregator: MockSpotPriceAggregator;
  let mockLimitOrderProtocol: MockLimitOrderProtocol;
  let owner: any;
  // let user: any;

  before(async () => {
    [owner] = await ethers.getSigners();

    // Deploy mock contracts
    const MockSpotPriceAggregatorFactory = await ethers.getContractFactory("MockSpotPriceAggregator");
    mockPriceAggregator = await MockSpotPriceAggregatorFactory.deploy(owner.address);
    await mockPriceAggregator.waitForDeployment();

    const MockLimitOrderProtocolFactory = await ethers.getContractFactory("MockLimitOrderProtocol");
    mockLimitOrderProtocol = await MockLimitOrderProtocolFactory.deploy();
    await mockLimitOrderProtocol.waitForDeployment();

    // Deploy libraries (only the ones actually used by OptimizedBalancerFactory)
    const LimitOrderLibFactory = await ethers.getContractFactory("LimitOrderLib");
    const limitOrderLib = await LimitOrderLibFactory.deploy();
    await limitOrderLib.waitForDeployment();

    const StablecoinGridLibFactory = await ethers.getContractFactory("StablecoinGridLib");
    const stablecoinGridLib = await StablecoinGridLibFactory.deploy();
    await stablecoinGridLib.waitForDeployment();

    // Deploy OptimizedBalancerFactory with only the required libraries
    const OptimizedBalancerFactoryFactory = await ethers.getContractFactory("OptimizedBalancerFactory", {
      libraries: {
        LimitOrderLib: await limitOrderLib.getAddress(),
        StablecoinGridLib: await stablecoinGridLib.getAddress(),
      },
    });

    optimizedBalancerFactory = await OptimizedBalancerFactoryFactory.deploy(
      await mockPriceAggregator.getAddress(),
      [], // Empty stablecoins array for testing
      await mockLimitOrderProtocol.getAddress(),
    );
    await optimizedBalancerFactory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with correct constructor parameters", async function () {
      expect(await optimizedBalancerFactory.priceFeed()).to.equal(await mockPriceAggregator.getAddress());
      expect(await optimizedBalancerFactory.limitOrderProtocol()).to.equal(await mockLimitOrderProtocol.getAddress());
      expect(await optimizedBalancerFactory.owner()).to.equal(owner.address);
    });

    it("Should have empty stablecoins array initially", async function () {
      // For an empty array, accessing index 0 should revert
      await expect(optimizedBalancerFactory.stablecoins(0)).to.be.reverted;
    });
  });

  describe("Access Control", function () {
    it("Should have correct owner", async function () {
      expect(await optimizedBalancerFactory.owner()).to.equal(owner.address);
    });
  });

  // describe("Balancer Creation", function () {
  //   it("Should revert when trying to create balancer without stablecoins", async function () {
  //     const assetAddresses = ["0x1234567890123456789012345678901234567890"];
  //     const percentages = [100];
  //     const amounts = [ethers.parseEther("1")];
  //     const driftPercentage = 5;

  //     await expect(
  //       optimizedBalancerFactory
  //         .connect(user)
  //         .createDriftBalancer(assetAddresses, percentages, amounts, driftPercentage),
  //     ).to.be.revertedWithCustomError(optimizedBalancerFactory, "NoStablecoin");
  //   });
  // });
});
