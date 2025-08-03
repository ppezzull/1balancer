import { expect } from "chai";
import { ethers } from "hardhat";
import { deployCompleteSystem } from "../../scripts/deploymentUtils";
import { Contract } from "ethers";

describe("Drift Balancer Price Feed Tests", function () {
  let optimizedBalancerFactory: Contract;
  let mockPriceAggregator: Contract;
  let mockLimitOrderProtocol: Contract;
  let deployer: any;
  let user: any;
  let driftBalancer: Contract;

  // Mock token instances
  let mockUSDC: Contract;
  let mockUSDT: Contract;
  let mockDAI: Contract;
  let mockWETH: Contract;
  let mockINCH: Contract;

  before(async () => {
    [deployer, user] = await ethers.getSigners();

    console.log("🚀 Deploying system using deployment utilities...");

    // Deploy the complete system using the utility
    const deployment = await deployCompleteSystem(false);

    optimizedBalancerFactory = deployment.optimizedBalancerFactory!;
    mockPriceAggregator = deployment.mockPriceAggregator;
    mockLimitOrderProtocol = deployment.mockLimitOrderProtocol;

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("contracts/mocks/MockERC20.sol:MockERC20");
    const mockUSDC = await MockERC20.deploy("USD Coin", "USDC", 6);
    const mockUSDT = await MockERC20.deploy("Tether USD", "USDT", 6);
    const mockDAI = await MockERC20.deploy("Dai Stablecoin", "DAI", 18);
    const mockWETH = await MockERC20.deploy("Wrapped Ether", "WETH", 18);
    const mockINCH = await MockERC20.deploy("1inch Token", "INCH", 18);

    // Mint tokens to deployer (who will be the owner) and user
    await mockUSDC.mint(deployer.address, ethers.parseUnits("200000", 6));
    await mockUSDT.mint(deployer.address, ethers.parseUnits("200000", 6));
    await mockDAI.mint(deployer.address, ethers.parseEther("200000"));
    await mockWETH.mint(deployer.address, ethers.parseEther("200"));
    await mockINCH.mint(deployer.address, ethers.parseEther("200000"));

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
    it("Should create a drift balancer with initial tokens", async function () {
      // Create a balancer with mixed tokens (stables and non-stables)
      const assetAddresses = [
        await mockUSDC.getAddress(),
        await mockWETH.getAddress(),
        await mockINCH.getAddress(),
        await mockUSDT.getAddress(),
        await mockDAI.getAddress(),
      ];
      const percentages = [20, 30, 20, 15, 15]; // Total: 100%
      const amounts = [
        ethers.parseUnits("5000", 6), // 5000 USDC
        ethers.parseEther("5"), // 5 WETH
        ethers.parseEther("3000"), // 3000 1INCH
        ethers.parseUnits("3750", 6), // 3750 USDT
        ethers.parseEther("3750"), // 3750 DAI
      ];
      const driftPercentage = 5; // 5% drift tolerance

      const tx = await (optimizedBalancerFactory as any)
        .connect(user)
        .createDriftBalancer(assetAddresses, percentages, amounts, driftPercentage);

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => log.eventName === "BalancerCreated");

      expect(event).to.not.be.undefined;
      driftBalancer = (await ethers.getContractAt("OptimizedDriftBalancer", event.args.balancer)) as any;
      console.log("✅ Drift Balancer created at:", await driftBalancer.getAddress());

      // Fund the balancer with initial tokens (using deployer as owner)
      await (mockUSDC as any).connect(deployer).approve(await driftBalancer.getAddress(), ethers.parseUnits("5000", 6));
      await (mockWETH as any).connect(deployer).approve(await driftBalancer.getAddress(), ethers.parseEther("5"));
      await (mockINCH as any).connect(deployer).approve(await driftBalancer.getAddress(), ethers.parseEther("3000"));
      await (mockUSDT as any).connect(deployer).approve(await driftBalancer.getAddress(), ethers.parseUnits("3750", 6));
      await (mockDAI as any).connect(deployer).approve(await driftBalancer.getAddress(), ethers.parseEther("3750"));

      await (driftBalancer as any).connect(deployer).fund(await mockUSDC.getAddress(), ethers.parseUnits("5000", 6));
      await (driftBalancer as any).connect(deployer).fund(await mockWETH.getAddress(), ethers.parseEther("5"));
      await (driftBalancer as any).connect(deployer).fund(await mockINCH.getAddress(), ethers.parseEther("3000"));
      await (driftBalancer as any).connect(deployer).fund(await mockUSDT.getAddress(), ethers.parseUnits("3750", 6));
      await (driftBalancer as any).connect(deployer).fund(await mockDAI.getAddress(), ethers.parseEther("3750"));

      console.log("✅ Balancer funded with initial tokens");
    });

    it("Should verify initial portfolio is balanced", async function () {
      // Trigger a check to ensure the portfolio is balanced initially
      const triggerTx = await (driftBalancer as any).connect(deployer).triggerRebalance();
      const receipt = await triggerTx.wait();

      // No rebalance event should be emitted if balanced
      const rebalanceEvent = receipt?.logs.find((log: any) => log.eventName === "RebalanceNeeded");
      expect(rebalanceEvent).to.be.undefined;

      console.log("✅ Initial portfolio confirmed to be balanced");
    });
  });

  describe("Price Feed Modifications - All Tokens", function () {
    it("Should detect disbalance when all token prices change significantly", async function () {
      console.log("🔄 Modifying all token prices...");

      // Modify both non-stable and stable token prices
      await mockPriceAggregator.setMockPrice(
        await mockWETH.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseEther("3600"),
      ); // 20% increase
      await mockPriceAggregator.setMockPrice(
        await mockINCH.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseEther("0.35"),
      ); // 30% decrease
      await mockPriceAggregator.setMockPrice(
        await mockUSDT.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseEther("0.94"),
      ); // 6% decrease
      await mockPriceAggregator.setMockPrice(
        await mockDAI.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseEther("1.07"),
      ); // 7% increase

      console.log("📊 Modified prices:");
      console.log("   WETH/USDC: 3000 -> 3600 (+20%)");
      console.log("   INCH/USDC: 0.5 -> 0.35 (-30%)");
      console.log("   USDT/USDC: 1.0 -> 0.94 (-6%)");
      console.log("   DAI/USDC: 1.0 -> 1.07 (+7%)");

      // Trigger rebalance check
      const triggerTx = await (driftBalancer as any).connect(deployer).triggerRebalance();
      const receipt = await triggerTx.wait();

      // Check if RebalanceNeeded event was emitted
      const rebalanceEvent = receipt?.logs.find((log: any) => log.eventName === "RebalanceNeeded");
      expect(rebalanceEvent).to.not.be.undefined;

      // Verify token addresses and deviations in the event
      const tokens = rebalanceEvent.args[0];
      const deviations = rebalanceEvent.args[1];

      console.log("✅ Rebalance needed detected");
      console.log("📊 Token deviations:");

      for (let i = 0; i < tokens.length; i++) {
        const tokenAddress = tokens[i];
        let tokenSymbol = "Unknown";

        if (tokenAddress === (await mockUSDC.getAddress())) tokenSymbol = "USDC";
        if (tokenAddress === (await mockWETH.getAddress())) tokenSymbol = "WETH";
        if (tokenAddress === (await mockINCH.getAddress())) tokenSymbol = "INCH";
        if (tokenAddress === (await mockUSDT.getAddress())) tokenSymbol = "USDT";
        if (tokenAddress === (await mockDAI.getAddress())) tokenSymbol = "DAI";

        console.log(`   ${tokenSymbol}: ${deviations[i]}`);
      }
    });
  });

  describe("Price Feed Modifications - Stablecoins Only", function () {
    it("Should reset prices to normal and verify balance", async function () {
      // Reset all prices to initial values
      await mockPriceAggregator.setMockPrice(
        await mockWETH.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseEther("3000"),
      );
      await mockPriceAggregator.setMockPrice(
        await mockINCH.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseEther("0.5"),
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

      console.log("🔄 Reset all prices to initial values");

      // Trigger check to verify no rebalance needed
      const triggerTx = await (driftBalancer as any).connect(deployer).triggerRebalance();
      const receipt = await triggerTx.wait();
      const rebalanceEvent = receipt?.logs.find((log: any) => log.eventName === "RebalanceNeeded");
      expect(rebalanceEvent).to.be.undefined;

      console.log("✅ Portfolio is balanced again after price reset");
    });

    it("Should detect disbalance when only stablecoin prices change", async function () {
      console.log("🔄 Modifying only stablecoin prices...");

      // Only modify stablecoin prices
      await mockPriceAggregator.setMockPrice(
        await mockUSDT.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseEther("0.92"),
      ); // 8% decrease
      await mockPriceAggregator.setMockPrice(
        await mockDAI.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseEther("1.09"),
      ); // 9% increase

      console.log("📊 Modified stablecoin prices only:");
      console.log("   USDT/USDC: 1.0 -> 0.92 (-8%)");
      console.log("   DAI/USDC: 1.0 -> 1.09 (+9%)");

      // Trigger rebalance check
      const triggerTx = await (driftBalancer as any).connect(deployer).triggerRebalance();
      const receipt = await triggerTx.wait();

      // Check if RebalanceNeeded event was emitted
      const rebalanceEvent = receipt?.logs.find((log: any) => log.eventName === "RebalanceNeeded");
      expect(rebalanceEvent).to.not.be.undefined;

      // Verify token addresses and deviations in the event
      const tokens = rebalanceEvent.args[0];
      const deviations = rebalanceEvent.args[1];

      // Extract only the stablecoin deviations
      const stableDeviations = [];
      for (let i = 0; i < tokens.length; i++) {
        const tokenAddress = tokens[i];
        if (
          tokenAddress === (await mockUSDT.getAddress()) ||
          tokenAddress === (await mockDAI.getAddress()) ||
          tokenAddress === (await mockUSDC.getAddress())
        ) {
          let tokenSymbol = "Unknown";
          if (tokenAddress === (await mockUSDC.getAddress())) tokenSymbol = "USDC";
          if (tokenAddress === (await mockUSDT.getAddress())) tokenSymbol = "USDT";
          if (tokenAddress === (await mockDAI.getAddress())) tokenSymbol = "DAI";
          stableDeviations.push({ symbol: tokenSymbol, deviation: deviations[i] });
        }
      }

      console.log("✅ Stablecoin rebalance needed detected");
      console.log("📊 Stablecoin deviations:");
      stableDeviations.forEach(dev => {
        console.log(`   ${dev.symbol}: ${dev.deviation}`);
      });
    });
  });
});
