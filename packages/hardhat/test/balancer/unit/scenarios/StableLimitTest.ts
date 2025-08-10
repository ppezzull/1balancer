import { expect } from "chai";
import { ethers } from "hardhat";
import { EventLog } from "ethers";
import { setupStableLimit, log, encodePerformData, findEvent } from "../../../../utils/test/setup";
import {
  expectValidEip1271Signature,
  expectInvalidEip1271Signature,
  expectCreatesEip712Order,
} from "../../../../utils/test/eip1271";

// logging is provided by @test/utils

describe("OptimizedStableLimit Module Tests", function () {
  let user: any;
  let driftBalancer: any;
  let mockPriceAggregator: any;
  let mockUSDC: any;
  let mockUSDT: any;
  let mockDAI: any;

  // Test configuration - New concept: stablecoins are treated as one asset group
  // kept for compatibility in utils
  const stablecoinAmounts = [
    ethers.parseUnits("4000", 6), // 4000 USDC
    ethers.parseUnits("3500", 6), // 3500 USDT
    ethers.parseUnits("2500", 18), // 2500 DAI
  ];
  const driftPercentage = BigInt(200); // 2% drift tolerance

  beforeEach(async function () {
    const ctx = await setupStableLimit(undefined, {
      stablecoinAmounts: [stablecoinAmounts[0], stablecoinAmounts[1], stablecoinAmounts[2]] as const,
      driftPercentage,
    });
    user = ctx.user;
    driftBalancer = ctx.driftBalancer;
    mockPriceAggregator = ctx.priceAggregator;
    mockUSDC = ctx.mockUSDC;
    mockUSDT = ctx.mockUSDT;
    mockDAI = ctx.mockDAI;
  });

  describe("Stablecoin Portfolio Setup", function () {
    it("Should create drift balancer with stablecoins only", async function () {
      const balancerAddress = await driftBalancer.getAddress();
      expect(ethers.isAddress(balancerAddress)).to.equal(true);
      expect(await driftBalancer.owner()).to.equal(await user.getAddress());
      expect(await driftBalancer.driftPercentage()).to.equal(driftPercentage);

      // Verify stablecoin balances
      expect(await mockUSDC.balanceOf(balancerAddress)).to.equal(stablecoinAmounts[0]);
      expect(await mockUSDT.balanceOf(balancerAddress)).to.equal(stablecoinAmounts[1]);
      expect(await mockDAI.balanceOf(balancerAddress)).to.equal(stablecoinAmounts[2]);

      log("✅ Drift balancer created with stablecoins only");
    });

    it("Should have balanced stablecoin portfolio initially", async function () {
      // Trigger rebalance - should not emit RebalanceNeeded since portfolio is balanced
      await expect(driftBalancer.connect(user).triggerRebalance()).to.not.emit(driftBalancer, "RebalanceNeeded");

      log("✅ Initial stablecoin portfolio is balanced");
    });
  });

  describe("Stablecoin Price Deviation Tests", function () {
    it("Should detect rebalancing needed when stablecoin prices deviate", async function () {
      log("🔄 Simulating stablecoin price deviations...");

      // Fetch the exact stablecoin ordering used by the balancer
      const ref = await (driftBalancer as any).stablecoins(0);
      const s1 = await (driftBalancer as any).stablecoins(1);
      const s2 = await (driftBalancer as any).stablecoins(2);

      // Deviate pairs that checkUpkeep reads: token -> ref (ensure owner signer is used)
      const [ownerDeployer] = await ethers.getSigners();
      await mockPriceAggregator.connect(ownerDeployer).setMockPrice(s1, ref, ethers.parseUnits("0.98", 18));
      await mockPriceAggregator.connect(ownerDeployer).setMockPrice(s2, ref, ethers.parseUnits("1.03", 18));
      // Also set reciprocals to keep aggregator consistent
      // 1 / 0.98 = ~1.020408163265306122,  1 / 1.03 = ~0.970873786407767
      const invS1 = (ethers.parseUnits("1", 18) * ethers.parseUnits("1", 18)) / ethers.parseUnits("0.98", 18);
      const invS2 = (ethers.parseUnits("1", 18) * ethers.parseUnits("1", 18)) / ethers.parseUnits("1.03", 18);
      await mockPriceAggregator.connect(ownerDeployer).setMockPrice(ref, s1, invS1);
      await mockPriceAggregator.connect(ownerDeployer).setMockPrice(ref, s2, invS2);

      // Sanity check the mocked rates
      const rateS1Ref = await mockPriceAggregator.getRate(s1, ref, false);
      const rateS2Ref = await mockPriceAggregator.getRate(s2, ref, false);
      log("Rates before upkeep:", { s1_ref: rateS1Ref.toString(), s2_ref: rateS2Ref.toString() });

      // Check via upkeep to detect need for rebalancing
      const [upkeepNeeded] = await driftBalancer.checkUpkeep("0x");
      expect(upkeepNeeded).to.equal(true);
      log("✅ Rebalancing need detected due to stablecoin price deviations");
    });
  });

  describe("Limit Order Creation", function () {
    it("Should create rebalance limit orders compatible with protocol V4", async function () {
      // Create a rebalance order for USDT to USDC
      const sellAmount = ethers.parseUnits("100", 6); // 100 USDT
      const buyAmount = ethers.parseUnits("98", 6); // 98 USDC (at 0.98 rate)

      const tx = await driftBalancer.connect(user).createRebalanceOrder(
        await mockUSDT.getAddress(),
        await mockUSDC.getAddress(),
        sellAmount,
        buyAmount,
        100, // 1% slippage tolerance
      );

      const receipt = await tx.wait();
      const orderEvent = receipt?.logs.find((log: any): log is EventLog => {
        const ev = log as EventLog;
        return (ev as any).eventName === "RebalanceOrderCreated";
      });

      expect(orderEvent).to.not.equal(undefined);
      const parsed1 = driftBalancer.interface.parseLog(orderEvent as any);
      const orderHash1 = (parsed1 as any).args[0];
      expect(orderHash1).to.match(/^0x[0-9a-fA-F]{64}$/);
      log("✅ Rebalance limit order created successfully");
    });

    it("Should create stablecoin grid orders compatible with protocol V4", async function () {
      // Create a grid order for USDT to USDC
      const gridAmount = ethers.parseUnits("50", 6);
      const limitPrice = ethers.parseUnits("0.995", 18);

      const tx = await driftBalancer
        .connect(user)
        .createStablecoinGridOrder(await mockUSDT.getAddress(), await mockUSDC.getAddress(), gridAmount, limitPrice);

      const receipt = await tx.wait();
      const gridOrderEvent = receipt?.logs.find((log: any): log is EventLog => {
        const ev = log as EventLog;
        return (ev as any).eventName === "LimitOrderCreated";
      });

      expect(gridOrderEvent).to.not.equal(undefined);
      const parsed2 = driftBalancer.interface.parseLog(gridOrderEvent as any);
      const orderHash2 = (parsed2 as any).args[0];
      expect(orderHash2).to.match(/^0x[0-9a-fA-F]{64}$/);
      log("✅ Stablecoin grid order created successfully");
    });
  });

  describe("EIP-1271 Signature Validation", function () {
    it("Should generate valid EIP-1271 signatures for limit orders", async function () {
      await expectValidEip1271Signature(driftBalancer);
    });

    it("Should reject invalid signatures", async function () {
      await expectInvalidEip1271Signature(driftBalancer);
    });
  });

  describe("Automation Integration", function () {
    it("Should trigger automation when stablecoin prices deviate", async function () {
      // Simulate significant stablecoin price deviation
      await mockPriceAggregator.setMockPrice(
        await mockUSDT.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseUnits("0.990", 18), // 1% deviation relative to tighter bounds (0.995-1.005)
      );
      await mockPriceAggregator.setMockPrice(
        await mockUSDC.getAddress(),
        await mockUSDT.getAddress(),
        ethers.parseUnits("1.010", 18),
      );

      // Check if upkeep is needed
      const [upkeepNeeded, performData] = await driftBalancer.checkUpkeep("0x");

      expect(upkeepNeeded).to.equal(true);
      expect(performData.length).to.be.greaterThan(0);

      log("✅ Automation upkeep correctly detected");
    });

    it("Should perform upkeep and generate grid orders", async function () {
      // Simulate stablecoin price deviation
      await mockPriceAggregator.setMockPrice(
        await mockUSDT.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseUnits("0.995", 18),
      );

      // Encode perform data
      const performData = encodePerformData(
        await mockUSDT.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseUnits("0.995", 18),
      );

      // Perform upkeep via authorized forwarder
      const tx = await driftBalancer.connect(user).performUpkeep(performData);
      const receipt = await tx.wait();

      // Check for OrdersGenerated event
      const ordersGeneratedEvent = findEvent(receipt, "OrdersGenerated");

      expect(ordersGeneratedEvent).to.not.equal(undefined);
      log("✅ Automation performed and grid orders generated");
    });
  });

  describe("Limit Order Protocol Integration", function () {
    it("Should create EIP-712 compliant orders", async function () {
      await expectCreatesEip712Order(
        driftBalancer,
        user as any,
        await mockUSDC.getAddress(),
        await mockUSDT.getAddress(),
      );
      log("✅ EIP-712 compliant order created with valid hash");
    });
  });
});
