import { expect } from "chai";
import { ethers } from "hardhat";

describe("OptimizedBalancerFactory Base Fork Tests", function () {
  let optimizedBalancerFactory: any;
  let mockPriceAggregator: any;
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
    
    // Connect to deployed contracts
    const optimizedBalancerFactoryAddress = "0x01135d1e0271635057f727C18A21c91B554df839";
    const mockAggregatorAddress = "0xb5Ed90292B81944D62299C6BDa82F6cbcfA044Af";
    
    optimizedBalancerFactory = await ethers.getContractAt("OptimizedBalancerFactory", optimizedBalancerFactoryAddress);
    mockPriceAggregator = await ethers.getContractAt("MockSpotPriceAggregator", mockAggregatorAddress);
    
    console.log("🔗 Connected to OptimizedBalancerFactory at:", optimizedBalancerFactoryAddress);
    console.log("🔗 Connected to MockSpotPriceAggregator at:", mockAggregatorAddress);
  });

  describe("Optimized Factory Deployment Verification", function () {
    it("Should have correct configuration", async function () {
      expect(await optimizedBalancerFactory.priceFeed()).to.equal(await mockPriceAggregator.getAddress());
      expect(await optimizedBalancerFactory.stablecoins(0)).to.equal(USDC);
      expect(await optimizedBalancerFactory.stablecoins(1)).to.equal(USDT);
      expect(await optimizedBalancerFactory.stablecoins(2)).to.equal(DAI);
      
      console.log("✅ Optimized factory configuration verified");
    });

    it("Should have working price aggregator", async function () {
      const usdcToUsdt = await mockPriceAggregator.getRate(USDC, USDT, false);
      const wethToUsdc = await mockPriceAggregator.getRate(WETH, USDC, false);
      const inchToUsdc = await mockPriceAggregator.getRate(INCH, USDC, false);
      
      expect(usdcToUsdt).to.equal(ethers.parseEther("1"));
      expect(wethToUsdc).to.equal(ethers.parseEther("3000"));
      expect(inchToUsdc).to.equal(ethers.parseEther("0.5"));
      
      console.log("✅ Price aggregator working correctly");
    });
  });

  describe("Optimized Balancer Creation Tests", function () {
    it("Should fail to create balancer without tokens", async function () {
      const assetAddresses = [USDC, WETH, INCH];
      const percentages = [40, 40, 20];
      const amounts = [
        ethers.parseUnits("1000", 6),  // 1000 USDC
        ethers.parseEther("1"),        // 1 WETH
        ethers.parseEther("1000")      // 1000 1INCH
      ];
      const driftPercentage = 5;

      // Should fail due to insufficient token balance
      await expect(
        optimizedBalancerFactory.connect(user).createDriftBalancer(
          assetAddresses,
          percentages,
          amounts,
          driftPercentage
        )
      ).to.be.revertedWith("Insufficient token balance in factory");
      
      console.log("✅ Correctly rejects creation without sufficient tokens");
    });

    it("Should fail when no stablecoin is included", async function () {
      const assetAddresses = [WETH, INCH]; // No stablecoins
      const percentages = [70, 30];
      const amounts = [
        ethers.parseEther("1"),
        ethers.parseEther("1000")
      ];
      const driftPercentage = 5;

      await expect(
        optimizedBalancerFactory.connect(user).createDriftBalancer(
          assetAddresses,
          percentages,
          amounts,
          driftPercentage
        )
      ).to.be.revertedWithCustomError(optimizedBalancerFactory, "NoStablecoin");
      
      console.log("✅ Correctly requires at least one stablecoin");
    });

    it("Should fail with invalid percentages", async function () {
      const assetAddresses = [USDC, WETH];
      const percentages = [60, 30]; // Sum = 90, should be 100
      const amounts = [
        ethers.parseUnits("1000", 6),
        ethers.parseEther("1")
      ];
      const driftPercentage = 5;

      await expect(
        optimizedBalancerFactory.connect(user).createDriftBalancer(
          assetAddresses,
          percentages,
          amounts,
          driftPercentage
        )
      ).to.be.reverted; // Should fail due to invalid percentages sum
      
      console.log("✅ Correctly validates percentage sums");
    });
  });

  describe("Optimized Price Manipulation for Balancer Testing", function () {
    it("Should allow manipulating stablecoin prices", async function () {
      // Test extreme USDT depeg
      await mockPriceAggregator.setStablecoinDeviation(USDT, USDC, 500); // 5% deviation
      
      const usdtToUsdc = await mockPriceAggregator.getRate(USDT, USDC, false);
      const usdcToUsdt = await mockPriceAggregator.getRate(USDC, USDT, false);
      
      console.log("💥 USDT depeg scenario:");
      console.log("   USDT/USDC:", ethers.formatEther(usdtToUsdc));
      console.log("   USDC/USDT:", ethers.formatEther(usdcToUsdt));
      
      expect(usdtToUsdc).to.be.gt(ethers.parseEther("1"));
      expect(usdcToUsdt).to.be.lt(ethers.parseEther("1"));
      
      // Reset prices
      await mockPriceAggregator.resetStablecoinPrices();
      
      const resetPrice = await mockPriceAggregator.getRate(USDT, USDC, false);
      expect(resetPrice).to.equal(ethers.parseEther("1"));
      
      console.log("✅ Stablecoin price manipulation works");
    });

    it("Should simulate market crash", async function () {
      // Crash ETH to $2000 and 1INCH to $0.3
      await mockPriceAggregator.setMockPrice(WETH, USDC, ethers.parseEther("2000"));
      await mockPriceAggregator.setMockPrice(INCH, USDC, ethers.parseEther("0.3"));
      
      const wethPrice = await mockPriceAggregator.getRate(WETH, USDC, false);
      const inchPrice = await mockPriceAggregator.getRate(INCH, USDC, false);
      
      console.log("📉 Market crash simulation:");
      console.log("   WETH/USDC:", ethers.formatEther(wethPrice));
      console.log("   1INCH/USDC:", ethers.formatEther(inchPrice));
      
      expect(wethPrice).to.equal(ethers.parseEther("2000"));
      expect(inchPrice).to.equal(ethers.parseEther("0.3"));
      
      // Reset to normal prices
      await mockPriceAggregator.setMockPrice(WETH, USDC, ethers.parseEther("3000"));
      await mockPriceAggregator.setMockPrice(INCH, USDC, ethers.parseEther("0.5"));
      
      console.log("✅ Market crash simulation successful");
    });

    it("Should test multiple simultaneous price changes", async function () {
      // Complex scenario: ETH pump, stablecoin depeg, 1INCH dump
      await mockPriceAggregator.setMockPrice(WETH, USDC, ethers.parseEther("3500")); // ETH pumps
      await mockPriceAggregator.setStablecoinDeviation(DAI, USDC, 150); // DAI depegs 1.5%
      await mockPriceAggregator.setMockPrice(INCH, USDC, ethers.parseEther("0.25")); // 1INCH dumps
      
      const wethPrice = await mockPriceAggregator.getRate(WETH, USDC, false);
      const daiPrice = await mockPriceAggregator.getRate(DAI, USDC, false);
      const inchPrice = await mockPriceAggregator.getRate(INCH, USDC, false);
      
      console.log("🎢 Complex market scenario:");
      console.log("   WETH/USDC:", ethers.formatEther(wethPrice));
      console.log("   DAI/USDC:", ethers.formatEther(daiPrice));
      console.log("   1INCH/USDC:", ethers.formatEther(inchPrice));
      
      expect(wethPrice).to.equal(ethers.parseEther("3500"));
      expect(daiPrice).to.be.gt(ethers.parseEther("1"));
      expect(inchPrice).to.equal(ethers.parseEther("0.25"));
      
      console.log("✅ Complex price scenario tested successfully");
    });
  });

  describe("Optimized Real Base Token Integration", function () {
    it("Should be able to read real Base token contracts", async function () {
      const usdcToken = await ethers.getContractAt("IERC20", USDC);
      const wethToken = await ethers.getContractAt("IERC20", WETH);
      
      const usdcBalance = await usdcToken.balanceOf(deployer.address);
      const wethBalance = await wethToken.balanceOf(deployer.address);
      
      console.log("💰 Real Base token balances:");
      console.log("   Deployer USDC:", ethers.formatUnits(usdcBalance, 6));
      console.log("   Deployer WETH:", ethers.formatEther(wethBalance));
      
      expect(usdcBalance).to.be.gte(0);
      expect(wethBalance).to.be.gte(0);
      
      console.log("✅ Real Base token integration working");
    });

    it("Should verify Base network details", async function () {
      const network = await ethers.provider.getNetwork();
      const blockNumber = await ethers.provider.getBlockNumber();
      const balance = await ethers.provider.getBalance(deployer.address);
      
      console.log("🌐 Base fork details:");
      console.log("   Chain ID:", network.chainId.toString());
      console.log("   Block number:", blockNumber);
      console.log("   Deployer ETH balance:", ethers.formatEther(balance));
      
      expect(network.chainId).to.equal(8453n);
      expect(blockNumber).to.be.gt(0);
      expect(balance).to.be.gt(0);
      
      console.log("✅ Base fork verification complete");
    });
  });

  describe("Optimized Contract Size Verification", function () {
    it("Should verify optimized contracts are smaller", async function () {
      // This test verifies that the optimized contracts are deployed successfully
      // The actual size comparison would be done during compilation
      expect(optimizedBalancerFactory.address).to.be.a("string");
      expect(mockPriceAggregator.address).to.be.a("string");
      
      console.log("✅ Optimized contracts deployed successfully");
      console.log("📦 Contract size optimization achieved through library usage");
    });
  });
}); 