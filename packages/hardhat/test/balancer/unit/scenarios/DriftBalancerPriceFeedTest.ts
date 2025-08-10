import { expect } from "chai";
import { ethers } from "hardhat";
import { setupDriftBalancerMixed } from "../../../../utils/test/setup";
import { configureSpotPrices } from "../../../../utils";

describe("Drift Balancer Price Feed Tests", function () {
  let deployer: any;
  let driftBalancer: any;
  let mockUSDC: any;
  let mockUSDT: any;
  let mockDAI: any;
  let mockWETH: any;
  let mockINCH: any;
  let mockPriceAggregator: any;

  // Token helpers

  beforeEach(async function () {
    const ctx = await setupDriftBalancerMixed();
    deployer = ctx.deployer;
    driftBalancer = ctx.driftBalancer;
    mockUSDC = ctx.mockUSDC;
    mockUSDT = ctx.mockUSDT;
    mockDAI = ctx.mockDAI;
    mockWETH = ctx.mockWETH;
    mockINCH = ctx.mockINCH;
    mockPriceAggregator = ctx.priceAggregator;
  });

  it("Should create a drift balancer and verify initial portfolio is balanced", async function () {
    const triggerTx = await driftBalancer.connect(deployer).triggerRebalance();
    const receipt = await triggerTx.wait();
    const rebalanceEvent = receipt?.logs.find((log: any) => (log as any).eventName === "RebalanceNeeded");
    expect(rebalanceEvent).to.equal(undefined);
    console.log("✅ Initial portfolio confirmed to be balanced");
  });

  describe("Price Feed Modifications - Global Rebalancing", function () {
    it("Should detect disbalance when all token prices change significantly", async function () {
      console.log("🔄 Modifying all token prices...");
      await mockPriceAggregator.setMockPrice(
        await mockWETH.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseEther("3500"), // WETH price up 16.7%
      );
      await mockPriceAggregator.setMockPrice(
        await mockINCH.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseEther("0.4"), // 1INCH price down 20%
      );
      await mockPriceAggregator.setMockPrice(
        await mockUSDT.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseEther("0.95"), // USDT slightly down
      );
      await mockPriceAggregator.setMockPrice(
        await mockDAI.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseEther("1.05"), // DAI slightly up
      );

      // Also set reciprocals for consistency
      const ONE = ethers.parseUnits("1", 18);
      const invWethUsdc = (ONE * ONE) / ethers.parseEther("3500");
      const invInchUsdc = (ONE * ONE) / ethers.parseEther("0.4");
      const invUsdtUsdc = (ONE * ONE) / ethers.parseEther("0.95");
      const invDaiUsdc = (ONE * ONE) / ethers.parseEther("1.05");

      await mockPriceAggregator.setMockPrice(await mockUSDC.getAddress(), await mockWETH.getAddress(), invWethUsdc);
      await mockPriceAggregator.setMockPrice(await mockUSDC.getAddress(), await mockINCH.getAddress(), invInchUsdc);
      await mockPriceAggregator.setMockPrice(await mockUSDC.getAddress(), await mockUSDT.getAddress(), invUsdtUsdc);
      await mockPriceAggregator.setMockPrice(await mockUSDC.getAddress(), await mockDAI.getAddress(), invDaiUsdc);

      const triggerTx = await driftBalancer.connect(deployer).triggerRebalance();
      const receipt = await triggerTx.wait();
      const rebalanceEvent = receipt?.logs.find((log: any) => (log as any).eventName === "RebalanceNeeded");

      expect(rebalanceEvent).to.not.equal(undefined);
      console.log("✅ Global rebalance needed detected due to price changes");

      // Verify the rebalance event contains the expected data
      if (rebalanceEvent) {
        const parsedEvent = driftBalancer.interface.parseLog(rebalanceEvent);
        const tokens = parsedEvent!.args[0] as string[];
        const deviations = parsedEvent!.args[1] as bigint[];

        expect(tokens.length).to.be.greaterThan(0);
        expect(deviations.length).to.be.greaterThan(0);

        // Check that deviations are significant (greater than drift percentage)
        const driftPercentage = await driftBalancer.driftPercentage();
        const hasSignificantDeviation = deviations.some(deviation => deviation > driftPercentage);
        expect(hasSignificantDeviation).to.equal(true);

        console.log("✅ Rebalance event contains significant deviations");
      }
    });

    it("Should reset prices to normal and verify balance", async function () {
      await configureSpotPrices(mockPriceAggregator, {
        mockUSDC,
        mockUSDT,
        mockDAI,
        mockWETH,
        mockINCH,
      }); // Reset prices
      console.log("🔄 Reset all prices to initial values");

      const triggerTx = await driftBalancer.connect(deployer).triggerRebalance();
      const receipt = await triggerTx.wait();
      const rebalanceEvent = receipt?.logs.find((log: any) => (log as any).eventName === "RebalanceNeeded");
      expect(rebalanceEvent).to.equal(undefined);
      console.log("✅ Portfolio is balanced again after price reset");
    });

    it("Should detect disbalance when only stablecoin prices change", async function () {
      console.log("🔄 Modifying only stablecoin prices...");
      await mockPriceAggregator.setMockPrice(
        await mockUSDT.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseEther("0.92"), // USDT down 8%
      );
      await mockPriceAggregator.setMockPrice(
        await mockDAI.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseEther("1.09"), // DAI up 9%
      );

      // Reciprocals for stable pairs
      const ONE2 = ethers.parseUnits("1", 18);
      const invUsdt = (ONE2 * ONE2) / ethers.parseEther("0.92");
      const invDai = (ONE2 * ONE2) / ethers.parseEther("1.09");
      await mockPriceAggregator.setMockPrice(await mockUSDC.getAddress(), await mockUSDT.getAddress(), invUsdt);
      await mockPriceAggregator.setMockPrice(await mockUSDC.getAddress(), await mockDAI.getAddress(), invDai);

      const triggerTx = await driftBalancer.connect(deployer).triggerRebalance();
      const receipt = await triggerTx.wait();
      const rebalanceEvent = receipt?.logs.find((log: any) => (log as any).eventName === "RebalanceNeeded");

      expect(rebalanceEvent).to.not.equal(undefined);
      console.log("✅ Stablecoin rebalance needed detected");
    });
  });

  describe("Limit Order Creation for Rebalancing", function () {
    it("Should create rebalance orders when portfolio is imbalanced", async function () {
      // First, cause imbalance by changing prices
      await mockPriceAggregator.setMockPrice(
        await mockWETH.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseEther("3500"), // WETH price up significantly
      );

      // Trigger rebalancing to detect imbalance
      await driftBalancer.connect(deployer).triggerRebalance();

      // Create a rebalance order to fix the imbalance
      const sellToken = await mockWETH.getAddress();
      const buyToken = await mockUSDC.getAddress();
      const sellAmount = ethers.parseEther("1");
      const buyAmount = ethers.parseUnits("3000", 6);
      const slippageTolerance = 200; // 2%

      const tx = await driftBalancer
        .connect(deployer)
        .createRebalanceOrder(sellToken, buyToken, sellAmount, buyAmount, slippageTolerance);

      const receipt = await tx.wait();
      const orderEvent = receipt?.logs.find((log: any) => (log as any).eventName === "RebalanceOrderCreated");

      expect(orderEvent).to.not.equal(undefined);
      console.log("✅ Rebalance order created for price-based imbalance");

      if (orderEvent) {
        const parsedEvent = driftBalancer.interface.parseLog(orderEvent);
        const orderHash = parsedEvent!.args[0] as string;
        const maker = parsedEvent!.args[1] as string;
        const sellTokenEvent = parsedEvent!.args[2] as string;
        const buyTokenEvent = parsedEvent!.args[3] as string;
        const sellAmountEvent = parsedEvent!.args[4] as bigint;
        const buyAmountEvent = parsedEvent!.args[5] as bigint;
        const slippageToleranceEvent = parsedEvent!.args[6] as bigint;

        expect(orderHash).to.not.equal(ethers.ZeroHash);
        expect(maker).to.equal(await driftBalancer.getAddress());
        expect(sellTokenEvent).to.equal(sellToken);
        expect(buyTokenEvent).to.equal(buyToken);
        expect(sellAmountEvent).to.equal(sellAmount);
        expect(buyAmountEvent).to.equal(buyAmount);
        expect(slippageToleranceEvent).to.equal(slippageTolerance);
        console.log("✅ Order event contains all correct parameters");
      }
    });

    it("Should create multiple orders for complex rebalancing scenarios", async function () {
      // Create multiple price changes to cause complex imbalance
      await mockPriceAggregator.setMockPrice(
        await mockWETH.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseEther("4000"), // WETH up 33%
      );
      await mockPriceAggregator.setMockPrice(
        await mockINCH.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseEther("0.3"), // 1INCH down 40%
      );

      // Create multiple rebalance orders
      const orders = [
        {
          sellToken: await mockWETH.getAddress(),
          buyToken: await mockUSDC.getAddress(),
          sellAmount: ethers.parseEther("1"),
          buyAmount: ethers.parseUnits("3500", 6),
          slippageTolerance: 150,
        },
        {
          sellToken: await mockUSDC.getAddress(),
          buyToken: await mockINCH.getAddress(),
          sellAmount: ethers.parseUnits("1000", 6),
          buyAmount: ethers.parseEther("3000"),
          slippageTolerance: 200,
        },
      ];

      for (const order of orders) {
        const tx = await driftBalancer
          .connect(deployer)
          .createRebalanceOrder(
            order.sellToken,
            order.buyToken,
            order.sellAmount,
            order.buyAmount,
            order.slippageTolerance,
          );

        const receipt = await tx.wait();
        const orderEvent = receipt?.logs.find((log: any) => (log as any).eventName === "RebalanceOrderCreated");

        expect(orderEvent).to.not.equal(undefined);
      }

      console.log("✅ Multiple rebalance orders created for complex scenario");
    });
  });

  describe("Stablecoin Grid Trading - Price-Based", function () {
    it("Should create stablecoin grid orders when prices deviate", async function () {
      // Modify stablecoin prices to cause deviation
      await mockPriceAggregator.setMockPrice(
        await mockUSDT.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseEther("0.98"), // USDT slightly down
      );
      await mockPriceAggregator.setMockPrice(
        await mockDAI.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseEther("1.02"), // DAI slightly up
      );

      // Create grid orders for stablecoin pairs
      const gridOrders = [
        {
          fromToken: await mockUSDC.getAddress(),
          toToken: await mockUSDT.getAddress(),
          amount: ethers.parseUnits("1000", 6),
          limitPrice: ethers.parseUnits("0.99", 18), // Slightly below market
        },
        {
          fromToken: await mockUSDT.getAddress(),
          toToken: await mockDAI.getAddress(),
          amount: ethers.parseUnits("1000", 6),
          limitPrice: ethers.parseUnits("1.01", 18), // Slightly above market
        },
      ];

      for (const gridOrder of gridOrders) {
        const tx = await driftBalancer
          .connect(deployer)
          .createStablecoinGridOrder(gridOrder.fromToken, gridOrder.toToken, gridOrder.amount, gridOrder.limitPrice);

        const receipt = await tx.wait();
        const orderEvent = receipt?.logs.find((log: any) => (log as any).eventName === "LimitOrderCreated");

        expect(orderEvent).to.not.equal(undefined);
      }

      console.log("✅ Stablecoin grid orders created for price deviations");
    });
  });
});
