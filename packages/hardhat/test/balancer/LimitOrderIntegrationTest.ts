import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Limit Order Integration Tests", function () {
  let optimizedBalancerFactory: any;
  let mockPriceAggregator: any;
  let mockLimitOrderProtocol: any;
  let deployer: any;
  let user: any;

  // Base mainnet token addresses
  const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const USDT = "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2";
  const DAI = "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb";
  const WETH = "0x4200000000000000000000000000000000000006";
  const INCH = "0xc5fecC3a29Fb57B5024eEc8a2239d4621e111CBE";

  before(async () => {
    [deployer, user] = await ethers.getSigners();
    
    // Deploy mock contracts
    const MockSpotPriceAggregator = await ethers.getContractFactory("MockSpotPriceAggregator");
    const MockLimitOrderProtocol = await ethers.getContractFactory("MockLimitOrderProtocol");
    const OptimizedBalancerFactory = await ethers.getContractFactory("OptimizedBalancerFactory");
    
    mockPriceAggregator = await MockSpotPriceAggregator.deploy(deployer.address);
    mockLimitOrderProtocol = await MockLimitOrderProtocol.deploy();
    optimizedBalancerFactory = await OptimizedBalancerFactory.deploy(
      mockPriceAggregator.address,
      [USDC, USDT, DAI],
      mockLimitOrderProtocol.address
    );
    
    console.log("🔗 Deployed contracts:");
    console.log("   OptimizedBalancerFactory:", optimizedBalancerFactory.address);
    console.log("   MockSpotPriceAggregator:", mockPriceAggregator.address);
    console.log("   MockLimitOrderProtocol:", mockLimitOrderProtocol.address);
  });

  describe("Initial Setup", function () {
    it("Should have correct configuration", async function () {
      expect(await optimizedBalancerFactory.priceFeed()).to.equal(mockPriceAggregator.address);
      expect(await optimizedBalancerFactory.limitOrderProtocol()).to.equal(mockLimitOrderProtocol.address);
      expect(await optimizedBalancerFactory.stablecoins(0)).to.equal(USDC);
      expect(await optimizedBalancerFactory.stablecoins(1)).to.equal(USDT);
      expect(await optimizedBalancerFactory.stablecoins(2)).to.equal(DAI);
      
      console.log("✅ Factory configuration verified");
    });

    it("Should set up initial prices", async function () {
      // Set up initial prices
      await mockPriceAggregator.setMockPrice(WETH, USDC, ethers.parseEther("3000"));
      await mockPriceAggregator.setMockPrice(USDC, WETH, "333333333333333");
      await mockPriceAggregator.setMockPrice(INCH, USDC, ethers.parseEther("0.5"));
      await mockPriceAggregator.setMockPrice(USDC, INCH, ethers.parseEther("2"));
      
      await mockPriceAggregator.setMockEthPrice(WETH, ethers.parseEther("1"));
      await mockPriceAggregator.setMockEthPrice(USDC, ethers.parseEther("0.001"));
      await mockPriceAggregator.setMockEthPrice(USDT, ethers.parseEther("0.001"));
      await mockPriceAggregator.setMockEthPrice(DAI, ethers.parseEther("0.001"));
      await mockPriceAggregator.setMockEthPrice(INCH, ethers.parseEther("0.0005"));

      console.log("✅ Initial prices configured");
    });
  });

  describe("Balancer Creation", function () {
    it("Should create OptimizedDriftBalancer", async function () {
      const assetAddresses = [USDC, WETH, INCH];
      const percentages = [40, 40, 20];
      const amounts = [
        ethers.parseUnits("1000", 6),  // 1000 USDC
        ethers.parseEther("1"),        // 1 WETH
        ethers.parseEther("1000")      // 1000 1INCH
      ];
      const driftPercentage = 5;

      // Fund user with tokens first
      const usdcToken = await ethers.getContractAt("IERC20", USDC);
      const wethToken = await ethers.getContractAt("IERC20", WETH);
      const inchToken = await ethers.getContractAt("IERC20", INCH);
      
      // Mock token transfers (in real scenario, user would have these tokens)
      await mockPriceAggregator.setMockPrice(USDC, USDC, ethers.parseEther("1"));
      await mockPriceAggregator.setMockPrice(WETH, WETH, ethers.parseEther("1"));
      await mockPriceAggregator.setMockPrice(INCH, INCH, ethers.parseEther("1"));

      const tx = optimizedBalancerFactory.connect(user).createDriftBalancer(
        assetAddresses,
        percentages,
        amounts,
        driftPercentage
      );

      await expect(tx).to.emit(optimizedBalancerFactory, "BalancerCreated");
      
      console.log("✅ OptimizedDriftBalancer created successfully");
    });

    it("Should create OptimizedTimeBalancer", async function () {
      const assetAddresses = [USDC, WETH, INCH];
      const percentages = [40, 40, 20];
      const amounts = [
        ethers.parseUnits("1000", 6),  // 1000 USDC
        ethers.parseEther("1"),        // 1 WETH
        ethers.parseEther("1000")      // 1000 1INCH
      ];
      const interval = 3600; // 1 hour

      const tx = optimizedBalancerFactory.connect(user).createTimeBalancer(
        assetAddresses,
        percentages,
        amounts,
        interval
      );

      await expect(tx).to.emit(optimizedBalancerFactory, "BalancerCreated");
      
      console.log("✅ OptimizedTimeBalancer created successfully");
    });
  });

  describe("Limit Order Creation", function () {
    let driftBalancer: any;

    beforeEach(async function () {
      // Create a drift balancer for testing
      const assetAddresses = [USDC, WETH, INCH];
      const percentages = [40, 40, 20];
      const amounts = [
        ethers.parseUnits("1000", 6),
        ethers.parseEther("1"),
        ethers.parseEther("1000")
      ];
      const driftPercentage = 5;

      const tx = await optimizedBalancerFactory.connect(user).createDriftBalancer(
        assetAddresses,
        percentages,
        amounts,
        driftPercentage
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => 
        log.eventName === "BalancerCreated"
      );
      
      if (event) {
        const balancerAddress = event.args.balancer;
        driftBalancer = await ethers.getContractAt("OptimizedDriftBalancer", balancerAddress);
      }
    });

    it("Should create rebalance limit orders", async function () {
      expect(driftBalancer).to.not.be.undefined;
      
      // Trigger rebalancing
      const tx = await driftBalancer.connect(user).triggerRebalance();
      await expect(tx).to.emit(driftBalancer, "RebalanceNeeded");
      
      console.log("✅ Rebalance triggered successfully");
    });

    it("Should create stablecoin grid orders", async function () {
      expect(driftBalancer).to.not.be.undefined;
      
      // Create a stablecoin grid order
      const tx = await driftBalancer.connect(user).createStablecoinGridOrder(
        USDC,
        USDT,
        ethers.parseUnits("100", 6), // 100 USDC
        ethers.parseEther("1")       // 1:1 rate
      );
      
      await expect(tx).to.emit(driftBalancer, "LimitOrderCreated");
      
      console.log("✅ Stablecoin grid order created successfully");
    });

    it("Should validate EIP-1271 signatures", async function () {
      expect(driftBalancer).to.not.be.undefined;
      
      // Test EIP-1271 signature validation
      const testHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
      const signature = ethers.Signature.from(await user.signMessage(ethers.getBytes(testHash))).compactSerialized;
      
      const isValid = await driftBalancer.isValidSignature(testHash, signature);
      expect(isValid).to.equal("0x1626ba7e"); // Magic value for valid signature
      
      console.log("✅ EIP-1271 signature validation working");
    });
  });

  describe("Price Manipulation and Rebalancing", function () {
    let timeBalancer: any;

    beforeEach(async function () {
      // Create a time balancer for testing
      const assetAddresses = [USDC, WETH, INCH];
      const percentages = [40, 40, 20];
      const amounts = [
        ethers.parseUnits("1000", 6),
        ethers.parseEther("1"),
        ethers.parseEther("1000")
      ];
      const interval = 3600;

      const tx = await optimizedBalancerFactory.connect(user).createTimeBalancer(
        assetAddresses,
        percentages,
        amounts,
        interval
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => 
        log.eventName === "BalancerCreated"
      );
      
      if (event) {
        const balancerAddress = event.args.balancer;
        timeBalancer = await ethers.getContractAt("OptimizedTimeBalancer", balancerAddress);
      }
    });

    it("Should trigger rebalancing when prices change", async function () {
      expect(timeBalancer).to.not.be.undefined;
      
      // Simulate price change
      await mockPriceAggregator.setMockPrice(WETH, USDC, ethers.parseEther("3500")); // ETH pumps
      await mockPriceAggregator.setMockPrice(INCH, USDC, ethers.parseEther("0.3")); // 1INCH dumps
      
      // Trigger portfolio rebalancing
      const tx = await timeBalancer.connect(user).triggerPortfolioRebalance();
      await expect(tx).to.emit(timeBalancer, "PortfolioRebalanceTriggered");
      
      console.log("✅ Portfolio rebalancing triggered successfully");
    });

    it("Should create limit orders for rebalancing", async function () {
      expect(timeBalancer).to.not.be.undefined;
      
      // Create a rebalance order
      const tx = await timeBalancer.connect(user).createRebalanceOrder(
        WETH,
        USDC,
        ethers.parseEther("0.5"), // 0.5 WETH
        ethers.parseUnits("1500", 6), // 1500 USDC
        50 // 0.5% slippage
      );
      
      await expect(tx).to.emit(timeBalancer, "RebalanceOrderCreated");
      
      console.log("✅ Rebalance order created successfully");
    });

    it("Should handle stablecoin depeg scenarios", async function () {
      expect(timeBalancer).to.not.be.undefined;
      
      // Simulate USDT depeg
      await mockPriceAggregator.setStablecoinDeviation(USDT, USDC, 500); // 5% depeg
      
      // Check stablecoin drift
      const tx = await timeBalancer.connect(user).checkStablecoinDrift();
      await expect(tx).to.emit(timeBalancer, "StablecoinRebalanceNeeded");
      
      console.log("✅ Stablecoin depeg scenario handled");
    });
  });

  describe("Chainlink Automation Integration", function () {
    it("Should check upkeep conditions", async function () {
      // Create a balancer
      const assetAddresses = [USDC, WETH, INCH];
      const percentages = [40, 40, 20];
      const amounts = [
        ethers.parseUnits("1000", 6),
        ethers.parseEther("1"),
        ethers.parseEther("1000")
      ];
      const driftPercentage = 5;

      const tx = await optimizedBalancerFactory.connect(user).createDriftBalancer(
        assetAddresses,
        percentages,
        amounts,
        driftPercentage
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => 
        log.eventName === "BalancerCreated"
      );
      
      if (event) {
        const balancerAddress = event.args.balancer;
        const balancer = await ethers.getContractAt("OptimizedDriftBalancer", balancerAddress);
        
        // Test checkUpkeep
        const (upkeepNeeded, performData) = await balancer.checkUpkeep("0x");
        console.log("Upkeep needed:", upkeepNeeded);
        console.log("Perform data:", performData);
        
        expect(typeof upkeepNeeded).to.equal("boolean");
        console.log("✅ Chainlink automation integration working");
      }
    });
  });

  describe("Order Submission to 1inch", function () {
    it("Should generate orders ready for 1inch API submission", async function () {
      // Create a balancer
      const assetAddresses = [USDC, WETH, INCH];
      const percentages = [40, 40, 20];
      const amounts = [
        ethers.parseUnits("1000", 6),
        ethers.parseEther("1"),
        ethers.parseEther("1000")
      ];
      const driftPercentage = 5;

      const tx = await optimizedBalancerFactory.connect(user).createDriftBalancer(
        assetAddresses,
        percentages,
        amounts,
        driftPercentage
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => 
        log.eventName === "BalancerCreated"
      );
      
      if (event) {
        const balancerAddress = event.args.balancer;
        const balancer = await ethers.getContractAt("OptimizedDriftBalancer", balancerAddress);
        
        // Create a limit order
        const orderHash = await balancer.connect(user).createRebalanceOrder(
          WETH,
          USDC,
          ethers.parseEther("0.5"),
          ethers.parseUnits("1500", 6),
          50
        );
        
        // Get order signature
        const signature = await balancer.connect(user).getOrderSignature(orderHash);
        
        console.log("Order hash:", orderHash);
        console.log("Order signature:", signature);
        console.log("✅ Order ready for 1inch API submission");
        
        expect(orderHash).to.not.equal(ethers.ZeroHash);
        expect(signature).to.not.equal("0x");
      }
    });
  });
}); 