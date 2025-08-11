import { expect } from "chai";
import { setupFactoryWithMocks } from "../../../../utils/test/setup";
import type { BalancerFactory, OracleAdapter, MockLimitOrderProtocol } from "../../../../typechain-types";
import type { Signer } from "ethers";
import hreDefault, { ethers } from "hardhat";
import { getOrDeployMockTokens, mintTestTokens, approveFactoryTokens, deployDriftBalancer } from "../../../../utils";

describe("BalancerFactory", function () {
  let balancerFactory: BalancerFactory;
  let mockPriceAggregator: OracleAdapter;
  let mockLimitOrderProtocol: MockLimitOrderProtocol;
  let owner: Signer;
  // let user: any;

  before(async () => {
    const ctx = await setupFactoryWithMocks();
    owner = ctx.owner;
    balancerFactory = ctx.factory;
    mockPriceAggregator = ctx.priceAggregator;
    mockLimitOrderProtocol = ctx.limitOrderProtocol;
  });

  describe("Deployment", function () {
    it("Should deploy and be owned by deployer", async function () {
      expect(await balancerFactory.priceFeed()).to.equal(await mockPriceAggregator.getAddress());
      expect(await balancerFactory.limitOrderProtocol()).to.equal(await mockLimitOrderProtocol.getAddress());
      expect(await balancerFactory.owner()).to.equal(await owner.getAddress());
    });

    it("Should have configured stablecoins", async function () {
      // After setup, stablecoins are passed to factory in setupFactoryWithMocks
      const countToCheck = 3;
      for (let i = 0; i < countToCheck; i++) {
        const addr = await balancerFactory.stablecoins(i);
        expect(addr).to.match(/^0x[0-9a-fA-F]{40}$/);
      }
    });
  });

  describe("Owner setters", function () {
    it("allows owner to update priceFeed, stablecoins, limitOrderProtocol, and automation addresses", async function () {
      const ownerSigner = owner;
      const newPriceFeed = "0x0000000000000000000000000000000000000001";
      await balancerFactory.connect(ownerSigner).setPriceFeed(newPriceFeed);
      expect(await balancerFactory.priceFeed()).to.equal(newPriceFeed);

      const newStablecoins = [
        "0x0000000000000000000000000000000000000002",
        "0x0000000000000000000000000000000000000003",
      ];
      await balancerFactory.connect(ownerSigner).setStablecoins(newStablecoins);
      expect(await balancerFactory.stablecoins(0)).to.equal(newStablecoins[0]);
      expect(await balancerFactory.stablecoins(1)).to.equal(newStablecoins[1]);

      const newLOP = "0x0000000000000000000000000000000000000004";
      await balancerFactory.connect(ownerSigner).setLimitOrderProtocol(newLOP);
      expect(await balancerFactory.limitOrderProtocol()).to.equal(newLOP);

      const newLink = "0x0000000000000000000000000000000000000005";
      const newRegistrar = "0x0000000000000000000000000000000000000006";
      const newRegistry = "0x0000000000000000000000000000000000000007";
      await balancerFactory.connect(ownerSigner).setAutomationAddresses(newLink, newRegistrar, newRegistry);
      expect(await balancerFactory.linkToken()).to.equal(newLink);
      expect(await balancerFactory.automationRegistrar()).to.equal(newRegistrar);
      expect(await balancerFactory.automationRegistry()).to.equal(newRegistry);
    });
  });

  describe("Balancer Creation", function () {
    it("creates DriftBalancer via factory", async function () {
      const tokens = await getOrDeployMockTokens(hreDefault);
      const ownerSigner = owner;

      const usdc = await tokens.mockUSDC.getAddress();
      const weth = await tokens.mockWETH.getAddress();
      const inch = await tokens.mockINCH.getAddress();

      // Reset factory wiring in case previous tests changed it
      const usdt = await tokens.mockUSDT.getAddress();
      const dai = await tokens.mockDAI.getAddress();
      await balancerFactory.connect(ownerSigner).setPriceFeed(await mockPriceAggregator.getAddress());
      await balancerFactory.connect(ownerSigner).setLimitOrderProtocol(await mockLimitOrderProtocol.getAddress());
      await balancerFactory.connect(ownerSigner).setStablecoins([usdc, usdt, dai]);

      await mintTestTokens(tokens, await ownerSigner.getAddress(), {
        USDC: ethers.parseUnits("4000", 6),
        WETH: ethers.parseEther("4"),
        INCH: ethers.parseEther("4000"),
      });
      await approveFactoryTokens(tokens, ownerSigner, await balancerFactory.getAddress(), {
        USDC: ethers.parseUnits("4000", 6),
        WETH: ethers.parseEther("4"),
        INCH: ethers.parseEther("4000"),
      });
      const drift = await deployDriftBalancer(hreDefault, balancerFactory.connect(ownerSigner) as BalancerFactory, {
        assetAddresses: [usdc, weth, inch],
        percentages: [40n, 40n, 20n],
        amounts: [ethers.parseUnits("4000", 6), ethers.parseEther("4"), ethers.parseEther("4000")],
        driftPercentage: 1n,
        name: "Optimized Drift Balancer",
        description:
          "Automatically rebalances when portfolio drift exceeds tolerance and stablecoin deviations are detected.",
      });
      const driftAddr = await drift.getAddress();
      expect(driftAddr).to.match(/^0x[0-9a-fA-F]{40}$/);
    });

    it("creates TimeBalancer via factory", async function () {
      const tokens = await getOrDeployMockTokens(hreDefault);
      const ownerSigner = owner;

      const usdc = await tokens.mockUSDC.getAddress();
      const weth = await tokens.mockWETH.getAddress();
      const usdt = await tokens.mockUSDT.getAddress();

      // Reset factory wiring in case previous tests changed it
      await balancerFactory.connect(ownerSigner).setPriceFeed(await mockPriceAggregator.getAddress());
      await balancerFactory.connect(ownerSigner).setLimitOrderProtocol(await mockLimitOrderProtocol.getAddress());
      await balancerFactory.connect(ownerSigner).setStablecoins([usdc, usdt]);

      await mintTestTokens(tokens, await ownerSigner.getAddress(), {
        USDC: ethers.parseUnits("5000", 6),
        WETH: ethers.parseEther("3"),
        USDT: ethers.parseUnits("2000", 6),
      });
      await approveFactoryTokens(tokens, ownerSigner, await balancerFactory.getAddress(), {
        USDC: ethers.parseUnits("5000", 6),
        WETH: ethers.parseEther("3"),
        USDT: ethers.parseUnits("2000", 6),
      });

      const tx = await balancerFactory
        .connect(ownerSigner)
        .createTimeBalancer(
          [usdc, weth, usdt],
          [70n, 30n],
          [ethers.parseUnits("5000", 6), ethers.parseEther("3"), ethers.parseUnits("2000", 6)],
          30 * 24 * 60 * 60,
          "Optimized Time Balancer",
          "Periodically checks and rebalances based on a fixed interval and stablecoin deviations.",
        );
      const receipt = await tx.wait();
      const created = receipt?.logs.find((l: unknown) => {
        return (
          typeof (l as { eventName?: string }).eventName !== "undefined" &&
          (l as { eventName?: string }).eventName === "BalancerCreated"
        );
      });
      expect(created).to.not.equal(undefined);
      if (created && (created as { args?: unknown[] }).args && Array.isArray((created as { args?: unknown[] }).args)) {
        const args = (created as { args: unknown[] }).args;
        const addr = args[1];
        expect(typeof addr).to.equal("string");
        expect(addr as string).to.match(/^0x[0-9a-fA-F]{40}$/);
      }
    });
  });
});
