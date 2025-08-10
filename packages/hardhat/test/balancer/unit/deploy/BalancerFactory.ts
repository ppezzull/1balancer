import { expect } from "chai";
import { setupFactoryWithMocks } from "../../../../utils/test/setup";
import type {
  BalancerFactory as BalancerFactoryType,
  OracleAdapter,
  MockLimitOrderProtocol,
} from "../../../../typechain-types";
import type { Signer } from "ethers";

describe("BalancerFactory", function () {
  let optimizedBalancerFactory: BalancerFactoryType;
  let mockPriceAggregator: OracleAdapter;
  let mockLimitOrderProtocol: MockLimitOrderProtocol;
  let owner: Signer;
  // let user: any;

  before(async () => {
    const ctx = await setupFactoryWithMocks();
    owner = ctx.owner;
    optimizedBalancerFactory = ctx.factory as unknown as BalancerFactoryType;
    mockPriceAggregator = ctx.priceAggregator as unknown as OracleAdapter;
    mockLimitOrderProtocol = ctx.limitOrderProtocol as unknown as MockLimitOrderProtocol;
  });

  describe("Deployment", function () {
    it("Should deploy with correct constructor parameters", async function () {
      expect(await optimizedBalancerFactory.priceFeed()).to.equal(await mockPriceAggregator.getAddress());
      expect(await optimizedBalancerFactory.limitOrderProtocol()).to.equal(await mockLimitOrderProtocol.getAddress());
      expect(await optimizedBalancerFactory.owner()).to.equal((owner as any).address);
    });

    it("Should have configured stablecoins", async function () {
      // After setup, stablecoins are passed to factory in setupFactoryWithMocks
      const countToCheck = 3;
      for (let i = 0; i < countToCheck; i++) {
        const addr = await optimizedBalancerFactory.stablecoins(i);
        expect(addr).to.match(/^0x[0-9a-fA-F]{40}$/);
      }
    });
  });

  describe("Access Control", function () {
    it("Should have correct owner", async function () {
      expect(await optimizedBalancerFactory.owner()).to.equal((owner as any).address);
    });
  });

  describe("Owner setters", function () {
    it("allows owner to update priceFeed, stablecoins, limitOrderProtocol, and automation addresses", async function () {
      const ownerSigner = owner as any;
      const newPriceFeed = "0x0000000000000000000000000000000000000001";
      await optimizedBalancerFactory.connect(ownerSigner).setPriceFeed(newPriceFeed);
      expect(await optimizedBalancerFactory.priceFeed()).to.equal(newPriceFeed);

      const newStablecoins = [
        "0x0000000000000000000000000000000000000002",
        "0x0000000000000000000000000000000000000003",
      ];
      await optimizedBalancerFactory.connect(ownerSigner).setStablecoins(newStablecoins);
      expect(await optimizedBalancerFactory.stablecoins(0)).to.equal(newStablecoins[0]);
      expect(await optimizedBalancerFactory.stablecoins(1)).to.equal(newStablecoins[1]);

      const newLOP = "0x0000000000000000000000000000000000000004";
      await optimizedBalancerFactory.connect(ownerSigner).setLimitOrderProtocol(newLOP);
      expect(await optimizedBalancerFactory.limitOrderProtocol()).to.equal(newLOP);

      const newLink = "0x0000000000000000000000000000000000000005";
      const newRegistrar = "0x0000000000000000000000000000000000000006";
      const newRegistry = "0x0000000000000000000000000000000000000007";
      await optimizedBalancerFactory.connect(ownerSigner).setAutomationAddresses(newLink, newRegistrar, newRegistry);
      expect(await optimizedBalancerFactory.linkToken()).to.equal(newLink);
      expect(await optimizedBalancerFactory.automationRegistrar()).to.equal(newRegistrar);
      expect(await optimizedBalancerFactory.automationRegistry()).to.equal(newRegistry);
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
