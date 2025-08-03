import { expect } from "chai";
import { ethers } from "hardhat";
import type {
  OptimizedBalancerFactory,
  MockERC20,
  MockSpotPriceAggregator,
  MockLimitOrderProtocol,
  OptimizedDriftBalancer,
  OptimizedTimeBalancer,
} from "../../typechain-types";
import { deployCompleteSystem, deployMockTokens } from "../../scripts/deploymentUtils";

describe("Balancer Disbalance Tests", function () {
  let optimizedBalancerFactory: OptimizedBalancerFactory;
  let mockPriceAggregator: MockSpotPriceAggregator;
  let mockLimitOrderProtocol: MockLimitOrderProtocol;
  let deployer: any;
  let user: any;
  let driftBalancer: OptimizedDriftBalancer;
  let timeBalancer: OptimizedTimeBalancer;

  // Mock token instances
  let mockUSDC: MockERC20;
  let mockUSDT: MockERC20;
  let mockDAI: MockERC20;
  let mockWETH: MockERC20;
  let mockINCH: MockERC20;

  before(async () => {
    [deployer, user] = await ethers.getSigners();

    console.log("🚀 Deploying system using deployment utilities...");

    // Deploy the complete system using the utility
    const deployment = await deployCompleteSystem(false);

    optimizedBalancerFactory = deployment.optimizedBalancerFactory!;
    mockPriceAggregator = deployment.mockPriceAggregator;
    mockLimitOrderProtocol = deployment.mockLimitOrderProtocol;

    // Deploy mock tokens
    const mockTokens = await deployMockTokens();
    mockUSDC = mockTokens.mockUSDC;
    mockUSDT = mockTokens.mockUSDT;
    mockDAI = mockTokens.mockDAI;
    mockWETH = mockTokens.mockWETH;
    mockINCH = mockTokens.mockINCH;

    // Mint tokens to deployer (who will be the owner) and user
    await (mockUSDC as any).mint(deployer.address, ethers.parseUnits("200000", 6));
    await (mockUSDT as any).mint(deployer.address, ethers.parseUnits("200000", 6));
    await (mockDAI as any).mint(deployer.address, ethers.parseEther("200000"));
    await (mockWETH as any).mint(deployer.address, ethers.parseEther("200"));
    await (mockINCH as any).mint(deployer.address, ethers.parseEther("200000"));

    await (mockUSDC as any).mint(user.address, ethers.parseUnits("100000", 6));
    await (mockUSDT as any).mint(user.address, ethers.parseUnits("100000", 6));
    await (mockDAI as any).mint(user.address, ethers.parseEther("100000"));
    await (mockWETH as any).mint(user.address, ethers.parseEther("100"));
    await (mockINCH as any).mint(user.address, ethers.parseEther("100000"));

    // Approve factory to spend user's tokens
    await (mockUSDC as any)
      .connect(user)
      .approve(await optimizedBalancerFactory.getAddress(), ethers.parseUnits("100000", 6));
    await (mockUSDT as any)
      .connect(user)
      .approve(await optimizedBalancerFactory.getAddress(), ethers.parseUnits("100000", 6));
    await (mockDAI as any)
      .connect(user)
      .approve(await optimizedBalancerFactory.getAddress(), ethers.parseEther("100000"));
    await (mockWETH as any)
      .connect(user)
      .approve(await optimizedBalancerFactory.getAddress(), ethers.parseEther("100"));
    await (mockINCH as any)
      .connect(user)
      .approve(await optimizedBalancerFactory.getAddress(), ethers.parseEther("100000"));

    // Set up initial prices
    await mockPriceAggregator.setMockPrice(
      await mockWETH.getAddress(),
      await mockUSDC.getAddress(),
      ethers.parseEther("3000"),
    );
    await mockPriceAggregator.setMockPrice(await mockUSDC.getAddress(), await mockWETH.getAddress(), "333333333333333");
    await mockPriceAggregator.setMockPrice(
      await mockINCH.getAddress(),
      await mockUSDC.getAddress(),
      ethers.parseEther("0.5"),
    );
    await mockPriceAggregator.setMockPrice(
      await mockUSDC.getAddress(),
      await mockINCH.getAddress(),
      ethers.parseEther("2"),
    );
    await mockPriceAggregator.setMockPrice(
      await mockUSDT.getAddress(),
      await mockUSDC.getAddress(),
      ethers.parseEther("1"),
    );
    await mockPriceAggregator.setMockPrice(
      await mockDAI.getAddress(),
      await mockUSDC.getAddress(),
      ethers.parseEther("1"),
    );

    await mockPriceAggregator.setMockEthPrice(await mockWETH.getAddress(), ethers.parseEther("1"));
    await mockPriceAggregator.setMockEthPrice(await mockUSDC.getAddress(), ethers.parseEther("0.001"));
    await mockPriceAggregator.setMockEthPrice(await mockUSDT.getAddress(), ethers.parseEther("0.001"));
    await mockPriceAggregator.setMockEthPrice(await mockDAI.getAddress(), ethers.parseEther("0.001"));
    await mockPriceAggregator.setMockEthPrice(await mockINCH.getAddress(), ethers.parseEther("0.0005"));

    console.log("🔧 Setting up stablecoin list in factory...");
    // Deploy the complete system using the utility with mock token addresses
    const mockTokenAddresses = [await mockUSDC.getAddress(), await mockUSDT.getAddress(), await mockDAI.getAddress()];

    // The factory is already deployed with the hardcoded addresses from TOKEN_ADDRESSES
    // We need to recreate it with our mock token addresses
    const libraries = {
      limitOrderLib: deployment.limitOrderLib,
      stablecoinGridLib: deployment.stablecoinGridLib,
      portfolioAnalysisLib: deployment.portfolioAnalysisLib,
    };

    // Deploy a new factory with mock token addresses
    const OptimizedBalancerFactory = await ethers.getContractFactory("OptimizedBalancerFactory", {
      libraries: {
        LimitOrderLib: await libraries.limitOrderLib.getAddress(),
        StablecoinGridLib: await libraries.stablecoinGridLib.getAddress(),
      },
    });

    optimizedBalancerFactory = (await OptimizedBalancerFactory.deploy(
      await mockPriceAggregator.getAddress(),
      mockTokenAddresses,
      await mockLimitOrderProtocol.getAddress(),
    )) as any;
    await optimizedBalancerFactory.waitForDeployment();

    console.log(
      "✅ OptimizedBalancerFactory deployed with mock stablecoins at:",
      await optimizedBalancerFactory.getAddress(),
    );
  });

  describe("Balancer Creation and Setup", function () {
    it("Should create a drift balancer and a time balancer", async function () {
      // Create a drift balancer
      const driftAssetAddresses = [
        await mockUSDC.getAddress(),
        await mockWETH.getAddress(),
        await mockINCH.getAddress(),
      ];
      const driftPercentages = [40, 40, 20]; // Total: 100%
      const driftAmounts = [
        ethers.parseUnits("4000", 6), // 4000 USDC
        ethers.parseEther("4"), // 4 WETH
        ethers.parseEther("4000"), // 4000 1INCH
      ];
      const driftThreshold = 5; // 5% drift tolerance

      const driftTx = await (optimizedBalancerFactory as any)
        .connect(user)
        .createDriftBalancer(driftAssetAddresses, driftPercentages, driftAmounts, driftThreshold);

      const driftReceipt = await driftTx.wait();
      const driftEvent = driftReceipt?.logs.find((log: any) => log.eventName === "BalancerCreated");

      expect(driftEvent).to.not.be.undefined;
      driftBalancer = (await ethers.getContractAt("OptimizedDriftBalancer", driftEvent.args.balancer)) as any;
      console.log("✅ Drift Balancer created at:", await driftBalancer.getAddress());

      // Create a time balancer
      const timeAssetAddresses = [
        await mockUSDC.getAddress(),
        await mockWETH.getAddress(),
        await mockUSDT.getAddress(),
      ];
      const timePercentages = [50, 30, 20]; // Total: 100%
      const timeAmounts = [
        ethers.parseUnits("5000", 6), // 5000 USDC
        ethers.parseEther("3"), // 3 WETH
        ethers.parseUnits("2000", 6), // 2000 USDT
      ];
      const rebalanceInterval = 3600; // 1 hour

      const timeTx = await (optimizedBalancerFactory as any)
        .connect(user)
        .createTimeBalancer(timeAssetAddresses, timePercentages, timeAmounts, rebalanceInterval);

      const timeReceipt = await timeTx.wait();
      const timeEvent = timeReceipt?.logs.find((log: any) => log.eventName === "BalancerCreated");

      expect(timeEvent).to.not.be.undefined;
      timeBalancer = (await ethers.getContractAt("OptimizedTimeBalancer", timeEvent.args.balancer)) as any;
      console.log("✅ Time Balancer created at:", await timeBalancer.getAddress());

      // Fund the balancers with initial tokens
      // Use deployer to fund since they are the owner
      await (mockUSDC as any).connect(deployer).approve(await driftBalancer.getAddress(), ethers.parseUnits("4000", 6));
      await (mockWETH as any).connect(deployer).approve(await driftBalancer.getAddress(), ethers.parseEther("4"));
      await (mockINCH as any).connect(deployer).approve(await driftBalancer.getAddress(), ethers.parseEther("4000"));

      await (mockUSDC as any).connect(deployer).approve(await timeBalancer.getAddress(), ethers.parseUnits("5000", 6));
      await (mockWETH as any).connect(deployer).approve(await timeBalancer.getAddress(), ethers.parseEther("3"));
      await (mockUSDT as any).connect(deployer).approve(await timeBalancer.getAddress(), ethers.parseUnits("2000", 6));

      // Then fund the balancers (only owner can fund)
      await (driftBalancer as any).connect(deployer).fund(await mockUSDC.getAddress(), ethers.parseUnits("4000", 6));
      await (driftBalancer as any).connect(deployer).fund(await mockWETH.getAddress(), ethers.parseEther("4"));
      await (driftBalancer as any).connect(deployer).fund(await mockINCH.getAddress(), ethers.parseEther("4000"));

      await (timeBalancer as any).connect(deployer).fund(await mockUSDC.getAddress(), ethers.parseUnits("5000", 6));
      await (timeBalancer as any).connect(deployer).fund(await mockWETH.getAddress(), ethers.parseEther("3"));
      await (timeBalancer as any).connect(deployer).fund(await mockUSDT.getAddress(), ethers.parseUnits("2000", 6));

      console.log("✅ Both balancers funded with initial tokens");
    });

    it("Should verify initial portfolios are balanced", async function () {
      // Trigger a check to ensure the drift balancer portfolio is balanced initially
      const driftTx = await (driftBalancer as any).connect(deployer).triggerRebalance();
      const driftReceipt = await driftTx.wait();

      // No rebalance event should be emitted if balanced
      const driftEvent = driftReceipt?.logs.find((log: any) => log.eventName === "RebalanceNeeded");
      expect(driftEvent).to.be.undefined;

      console.log("✅ Initial drift balancer portfolio confirmed to be balanced");

      // Trigger a check to ensure the time balancer portfolio is balanced initially
      const timeTx = await (timeBalancer as any).connect(deployer).triggerTimeRebalance();
      const timeReceipt = await timeTx.wait();

      // No rebalance event should be emitted if balanced
      const timeEvent = timeReceipt?.logs.find((log: any) => log.eventName === "RebalanceNeeded");
      expect(timeEvent).to.be.undefined;

      console.log("✅ Initial time balancer portfolio confirmed to be balanced");
    });
  });

  describe("Token Disbalance by Adding Additional Tokens", function () {
    it("Should cause disbalance by adding WETH to drift balancer", async function () {
      console.log("🔄 Adding extra WETH to drift balancer to create disbalance...");

      // Add a significant amount of WETH (10% more than the initial allocation)
      const additionalWETH = ethers.parseEther("0.4"); // 10% of the initial 4 WETH

      // Approve and fund
      await (mockWETH as any).connect(deployer).approve(await driftBalancer.getAddress(), additionalWETH);
      await (driftBalancer as any).connect(deployer).fund(await mockWETH.getAddress(), additionalWETH);

      console.log(`📊 Added ${ethers.formatEther(additionalWETH)} additional WETH to drift balancer`);

      // Trigger rebalance check
      const triggerTx = await (driftBalancer as any).connect(deployer).triggerRebalance();
      const receipt = await triggerTx.wait();

      // Check if RebalanceNeeded event was emitted
      const rebalanceEvent = receipt?.logs.find((log: any) => log.eventName === "RebalanceNeeded");
      expect(rebalanceEvent).to.not.be.undefined;

      // Verify token addresses and deviations in the event
      const tokens = rebalanceEvent.args[0];
      const deviations = rebalanceEvent.args[1];

      console.log("✅ Disbalance detected after adding WETH");
      console.log("📊 Token deviations:");

      for (let i = 0; i < tokens.length; i++) {
        const tokenAddress = tokens[i];
        let tokenSymbol = "Unknown";

        if (tokenAddress === (await mockUSDC.getAddress())) tokenSymbol = "USDC";
        if (tokenAddress === (await mockWETH.getAddress())) tokenSymbol = "WETH";
        if (tokenAddress === (await mockINCH.getAddress())) tokenSymbol = "INCH";

        console.log(`   ${tokenSymbol}: ${deviations[i]}`);
      }
    });

    it("Should cause disbalance by adding USDC to time balancer", async function () {
      console.log("🔄 Adding extra USDC to time balancer to create disbalance...");

      // Add a significant amount of USDC (20% more than the initial allocation)
      const additionalUSDC = ethers.parseUnits("1000", 6); // 20% of the initial 5000 USDC

      // Approve and fund
      await (mockUSDC as any).connect(deployer).approve(await timeBalancer.getAddress(), additionalUSDC);
      await (timeBalancer as any).connect(deployer).fund(await mockUSDC.getAddress(), additionalUSDC);

      console.log(`📊 Added ${ethers.formatUnits(additionalUSDC, 6)} additional USDC to time balancer`);

      // Trigger rebalance check
      const triggerTx = await (timeBalancer as any).connect(deployer).triggerTimeRebalance();
      const receipt = await triggerTx.wait();

      // Check if RebalanceNeeded event was emitted
      const rebalanceEvent = receipt?.logs.find((log: any) => log.eventName === "RebalanceNeeded");
      expect(rebalanceEvent).to.not.be.undefined;

      // Verify token addresses and deviations in the event
      const tokens = rebalanceEvent.args[0];
      const deviations = rebalanceEvent.args[1];

      console.log("✅ Disbalance detected after adding USDC");
      console.log("📊 Token deviations:");

      for (let i = 0; i < tokens.length; i++) {
        const tokenAddress = tokens[i];
        let tokenSymbol = "Unknown";

        if (tokenAddress === (await mockUSDC.getAddress())) tokenSymbol = "USDC";
        if (tokenAddress === (await mockWETH.getAddress())) tokenSymbol = "WETH";
        if (tokenAddress === (await mockUSDT.getAddress())) tokenSymbol = "USDT";

        console.log(`   ${tokenSymbol}: ${deviations[i]}`);
      }
    });
  });

  describe("Multiple Token Disbalance Tests", function () {
    it("Should create complex disbalance by adding multiple tokens", async function () {
      console.log("🔄 Creating complex disbalance in drift balancer...");

      // Add multiple tokens to create a more complex disbalance scenario
      const additionalUSDC = ethers.parseUnits("1200", 6); // 30% more USDC
      const additionalINCH = ethers.parseEther("400"); // 10% more INCH

      // Approve and fund
      await (mockUSDC as any).connect(deployer).approve(await driftBalancer.getAddress(), additionalUSDC);
      await (mockINCH as any).connect(deployer).approve(await driftBalancer.getAddress(), additionalINCH);

      await (driftBalancer as any).connect(deployer).fund(await mockUSDC.getAddress(), additionalUSDC);
      await (driftBalancer as any).connect(deployer).fund(await mockINCH.getAddress(), additionalINCH);

      console.log(
        `📊 Added ${ethers.formatUnits(additionalUSDC, 6)} USDC and ${ethers.formatEther(additionalINCH)} INCH to drift balancer`,
      );

      // Trigger rebalance check
      const triggerTx = await (driftBalancer as any).connect(deployer).triggerRebalance();
      const receipt = await triggerTx.wait();

      // Check if RebalanceNeeded event was emitted
      const rebalanceEvent = receipt?.logs.find((log: any) => log.eventName === "RebalanceNeeded");
      expect(rebalanceEvent).to.not.be.undefined;

      // Extract and log token deviations
      const tokens = rebalanceEvent.args[0];
      const deviations = rebalanceEvent.args[1];

      console.log("✅ Complex disbalance detected after adding multiple tokens");
      console.log("📊 Token deviations:");

      for (let i = 0; i < tokens.length; i++) {
        const tokenAddress = tokens[i];
        let tokenSymbol = "Unknown";

        if (tokenAddress === (await mockUSDC.getAddress())) tokenSymbol = "USDC";
        if (tokenAddress === (await mockWETH.getAddress())) tokenSymbol = "WETH";
        if (tokenAddress === (await mockINCH.getAddress())) tokenSymbol = "INCH";

        console.log(`   ${tokenSymbol}: ${deviations[i]}`);
      }
    });

    it("Should verify order signatures can be generated for all tokens", async function () {
      // Generate order signatures for verification
      const usdcOrderHash = ethers.keccak256(ethers.toUtf8Bytes("USDC_ORDER"));
      const wethOrderHash = ethers.keccak256(ethers.toUtf8Bytes("WETH_ORDER"));
      const inchOrderHash = ethers.keccak256(ethers.toUtf8Bytes("INCH_ORDER"));

      // Get signatures from drift balancer (only owner can call)
      const usdcSignature = await (driftBalancer as any).connect(deployer).getOrderSignature(usdcOrderHash);
      const wethSignature = await (driftBalancer as any).connect(deployer).getOrderSignature(wethOrderHash);
      const inchSignature = await (driftBalancer as any).connect(deployer).getOrderSignature(inchOrderHash);

      // Verify all signatures are valid
      expect(usdcSignature).to.not.equal("0x");
      expect(wethSignature).to.not.equal("0x");
      expect(inchSignature).to.not.equal("0x");

      console.log("✅ Order signatures successfully generated for all tokens");
      console.log("   USDC order signature:", usdcSignature);
      console.log("   WETH order signature:", wethSignature);
      console.log("   INCH order signature:", inchSignature);
    });
  });
});
