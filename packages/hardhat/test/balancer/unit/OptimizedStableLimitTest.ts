import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { Signer, EventLog } from "ethers";
import {
  OptimizedBalancerFactory,
  OptimizedDriftBalancer,
  MockERC20,
  MockSpotPriceAggregator,
  MockLimitOrderProtocol,
} from "../../../typechain-types";
import {
  deployLibraries,
  deployOptimizedBalancerFactory,
  getOrDeployMockTokens,
  mintTestTokens,
  approveFactoryTokens,
  getOrDeploySpotPriceAggregator,
  configureSpotPrices,
  getOrDeployLimitOrderProtocol,
  MockTokens,
} from "../../../utils";

// Minimal logging helper (enable with TEST_LOG=1)
const shouldLog = process.env.TEST_LOG === "1";
const log = (...args: any[]) => {
  if (shouldLog) console.log(...args);
};

describe("OptimizedStableLimit Module Tests", function () {
  let user: Signer;

  // Contracts
  let optimizedBalancerFactory: OptimizedBalancerFactory;
  let driftBalancer: OptimizedDriftBalancer;
  let mockPriceAggregator: MockSpotPriceAggregator;
  let mockLimitOrderProtocol: MockLimitOrderProtocol;

  // Mock Tokens (Stablecoins only)
  let mockUSDC: MockERC20;
  let mockUSDT: MockERC20;
  let mockDAI: MockERC20;

  // Test configuration - New concept: stablecoins are treated as one asset group
  const stablecoinPercentages = [BigInt(100)]; // 100% stablecoins (as one group)
  const stablecoinAmounts = [
    ethers.parseUnits("4000", 6), // 4000 USDC
    ethers.parseUnits("3500", 6), // 3500 USDT
    ethers.parseUnits("2500", 18), // 2500 DAI
  ];
  const driftPercentage = BigInt(200); // 2% drift tolerance

  beforeEach(async function () {
    [, user] = await ethers.getSigners();

    log("🚀 Setting up OptimizedStableLimit test environment...");

    // Deploy libraries
    const libraries = await deployLibraries(hre);

    // Deploy mock tokens (stablecoins only)
    const tokens: MockTokens = await getOrDeployMockTokens(hre);
    mockUSDC = tokens.mockUSDC;
    mockUSDT = tokens.mockUSDT;
    mockDAI = tokens.mockDAI;

    // Deploy mock protocols
    mockPriceAggregator = await getOrDeploySpotPriceAggregator(hre);
    mockLimitOrderProtocol = await getOrDeployLimitOrderProtocol(hre);

    // Configure spot prices for stablecoins (all should be ~1 USD)
    await configureSpotPrices(mockPriceAggregator, tokens);

    // Deploy factory with stablecoin addresses
    const stablecoinAddresses = [await mockUSDC.getAddress(), await mockUSDT.getAddress(), await mockDAI.getAddress()];

    optimizedBalancerFactory = await deployOptimizedBalancerFactory(
      hre,
      {
        limitOrderLib: libraries.limitOrderLib,
        stablecoinGridLib: libraries.stablecoinGridLib,
      },
      { mockPriceAggregator, mockLimitOrderProtocol },
      stablecoinAddresses,
    );

    // Mint tokens to user using utility function
    const userAddress = await user.getAddress();
    await mintTestTokens(tokens, userAddress, {
      USDC: stablecoinAmounts[0],
      USDT: stablecoinAmounts[1],
      DAI: stablecoinAmounts[2],
    });

    // Approve factory to spend tokens using utility function
    await approveFactoryTokens(tokens, user, await optimizedBalancerFactory.getAddress(), {
      USDC: stablecoinAmounts[0],
      USDT: stablecoinAmounts[1],
      DAI: stablecoinAmounts[2],
    });

    // Deploy drift balancer through factory (using user signer)
    const assetAddresses = [await mockUSDC.getAddress(), await mockUSDT.getAddress(), await mockDAI.getAddress()];

    // Call factory from user to create balancer
    const tx = await optimizedBalancerFactory
      .connect(user)
      .createDriftBalancer(assetAddresses, stablecoinPercentages, stablecoinAmounts, driftPercentage);

    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error("Transaction receipt is null");
    }

    log("tx logs count:", receipt.logs.length);

    // Get balancer address from events
    const balancerCreatedEvent = receipt.logs.find((log): log is EventLog => {
      const ev = log as EventLog;
      return (ev as any).eventName === "BalancerCreated";
    }) as EventLog;

    if (!balancerCreatedEvent) {
      throw new Error("BalancerCreated event not found");
    }

    const balancerAddress = balancerCreatedEvent.args[1];
    log("Balancer address from event:", balancerAddress);
    driftBalancer = await ethers.getContractAt("OptimizedDriftBalancer", balancerAddress);

    log("✅ Test environment setup complete");
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
    it("Should create rebalance limit orders", async function () {
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
      const orderEvent = receipt?.logs.find((log): log is EventLog => {
        const ev = log as EventLog;
        return (ev as any).eventName === "RebalanceOrderCreated";
      });

      expect(orderEvent).to.not.equal(undefined);
      log("✅ Rebalance limit order created successfully");
    });

    it("Should create stablecoin grid orders", async function () {
      // Create a grid order for USDT to USDC
      const gridAmount = ethers.parseUnits("50", 6);
      const limitPrice = ethers.parseUnits("0.995", 18);

      const tx = await driftBalancer
        .connect(user)
        .createStablecoinGridOrder(await mockUSDT.getAddress(), await mockUSDC.getAddress(), gridAmount, limitPrice);

      const receipt = await tx.wait();
      const gridOrderEvent = receipt?.logs.find((log): log is EventLog => {
        const ev = log as EventLog;
        return (ev as any).eventName === "LimitOrderCreated";
      });

      expect(gridOrderEvent).to.not.equal(undefined);
      log("✅ Stablecoin grid order created successfully");
    });
  });

  describe("EIP-1271 Signature Validation", function () {
    it("Should generate valid EIP-1271 signatures for limit orders", async function () {
      // Sign with the actual contract owner
      const ownerAddr = await driftBalancer.owner();
      const allSigners = await ethers.getSigners();
      const ownerSigner = allSigners.find(s => s.address.toLowerCase() === ownerAddr.toLowerCase());
      if (!ownerSigner) throw new Error("Owner signer not found");

      const orderHash = ethers.keccak256(ethers.toUtf8Bytes("TEST_ORDER"));
      const messageBytes = ethers.getBytes(orderHash);
      const signed = await ownerSigner.signMessage(messageBytes);

      // Local verification sanity check
      const recovered = ethers.verifyMessage(messageBytes, signed);
      log("Recovered signer:", recovered, "Expected owner:", ownerAddr);
      expect(recovered.toLowerCase()).to.equal(ownerAddr.toLowerCase());

      // Pass the EIP-191 digest as _hash so contract's raw-tryRecover path matches
      const digest = ethers.keccak256(
        ethers.solidityPacked(["string", "bytes32"], ["\x19Ethereum Signed Message:\n32", orderHash]),
      );
      const isValid = await driftBalancer.isValidSignature(digest as any, signed);
      expect(isValid).to.equal("0x1626ba7e");

      log("✅ EIP-1271 signature validation working correctly");
    });

    it("Should reject invalid signatures", async function () {
      const orderHash = ethers.keccak256(ethers.toUtf8Bytes("TEST_ORDER"));
      const other = (await ethers.getSigners())[0];
      const wrongSig = await other.signMessage(ethers.getBytes(orderHash));

      const isValid = await driftBalancer.isValidSignature(orderHash, wrongSig);
      expect(isValid).to.equal("0xffffffff");

      log("✅ Invalid signatures correctly rejected");
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
      const performData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256"],
        [await mockUSDT.getAddress(), await mockUSDC.getAddress(), ethers.parseUnits("0.995", 18)],
      );

      // Set forwarder to the caller (simulating Chainlink forwarder)
      await driftBalancer.connect(user).setForwarderAddress(await user.getAddress());

      // Perform upkeep via authorized forwarder
      const tx = await driftBalancer.connect(user).performUpkeep(performData);
      const receipt = await tx.wait();

      // Check for OrdersGenerated event
      const ordersGeneratedEvent = receipt?.logs.find(log => (log as any).eventName === "OrdersGenerated");

      expect(ordersGeneratedEvent).to.not.equal(undefined);
      log("✅ Automation performed and grid orders generated");
    });
  });

  describe("Limit Order Protocol Integration", function () {
    it("Should create EIP-712 compliant orders", async function () {
      const sellAmount = ethers.parseUnits("100", 6);
      const buyAmount = ethers.parseUnits("100", 6);

      const tx = await driftBalancer.connect(user).createRebalanceOrder(
        await mockUSDC.getAddress(),
        await mockUSDT.getAddress(),
        sellAmount,
        buyAmount,
        50, // 0.5% slippage
      );

      const receipt = await tx.wait();
      const orderEvent = receipt?.logs.find(log => (log as any).eventName === "RebalanceOrderCreated") as EventLog;

      expect(orderEvent).to.not.equal(undefined);

      // Verify order hash calculation
      const parsedEvent = driftBalancer.interface.parseLog(orderEvent);
      const orderHash = (parsedEvent as any).args[0];

      expect(orderHash).to.not.equal(ethers.ZeroHash);
      expect(orderHash.length).to.equal(66); // 0x + 64 hex chars

      log("✅ EIP-712 compliant order created with valid hash");
    });
  });
});
