import { expect } from "chai";
import { ethers } from "hardhat";

describe("Base Fork Integration Tests", function () {
  let mockPriceAggregator: any;
  let deployer: any;

  // Base mainnet token addresses
  const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const USDT = "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2";
  const DAI = "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb";
  const WETH = "0x4200000000000000000000000000000000000006";
  const INCH = "0xc5fecC3a29Fb57B5024eEc8a2239d4621e111CBE";

  before(async () => {
    [deployer] = await ethers.getSigners();

    // Get the deployed MockSpotPriceAggregator
    const mockAggregatorAddress = "0x6C6E4b178f77a1488E5c3E66d0724A5849aAD4BA";
    mockPriceAggregator = await ethers.getContractAt("MockSpotPriceAggregator", mockAggregatorAddress);

    console.log("🔗 Connected to MockSpotPriceAggregator at:", mockAggregatorAddress);
    console.log("📍 Using deployer:", deployer.address);
  });

  describe("Mock Price Aggregator Base Fork Tests", function () {
    it("Should have correct default stablecoin prices", async function () {
      const usdcToUsdt = await mockPriceAggregator.getRate(USDC, USDT, false);
      const usdtToUsdc = await mockPriceAggregator.getRate(USDT, USDC, false);
      const usdcToDai = await mockPriceAggregator.getRate(USDC, DAI, false);

      expect(usdcToUsdt).to.equal(ethers.parseEther("1")); // 1:1 ratio
      expect(usdtToUsdc).to.equal(ethers.parseEther("1"));
      expect(usdcToDai).to.equal(ethers.parseEther("1"));
      
      console.log("✅ Stablecoin prices verified");
    });

    it("Should return correct ETH prices for Base tokens", async function () {
      const wethToEth = await mockPriceAggregator.getRateToEth(WETH, false);
      const usdcToEth = await mockPriceAggregator.getRateToEth(USDC, false);
      const inchToEth = await mockPriceAggregator.getRateToEth(INCH, false);
      
      expect(wethToEth).to.equal(ethers.parseEther("1")); // 1 WETH = 1 ETH
      expect(usdcToEth).to.equal(ethers.parseEther("0.001")); // 1 USDC = 0.001 ETH
      expect(inchToEth).to.equal(ethers.parseEther("0.0005")); // 1 1INCH = 0.0005 ETH
      
      console.log("✅ ETH prices verified for Base tokens");
    });

    it("Should allow price manipulation for testing", async function () {
      // Test stablecoin deviation
      await mockPriceAggregator.setStablecoinDeviation(USDC, USDT, 50); // 0.5% deviation
      
      const usdcToUsdt = await mockPriceAggregator.getRate(USDC, USDT, false);
      expect(usdcToUsdt).to.be.gt(ethers.parseEther("1")); // Should be > 1.0
      
      console.log("📊 USDC/USDT after 0.5% deviation:", ethers.formatEther(usdcToUsdt));
      
      // Reset prices
      await mockPriceAggregator.resetStablecoinPrices();
      
      const resetPrice = await mockPriceAggregator.getRate(USDC, USDT, false);
      expect(resetPrice).to.equal(ethers.parseEther("1"));
      
      console.log("✅ Price manipulation and reset verified");
    });

    it("Should simulate market crash scenario", async function () {
      // Crash ETH from $3000 to $2000
      await mockPriceAggregator.setMockPrice(WETH, USDC, ethers.parseEther("2000"));
      
      const wethToUsdc = await mockPriceAggregator.getRate(WETH, USDC, false);
      expect(wethToUsdc).to.equal(ethers.parseEther("2000"));
      
      console.log("📉 ETH price after crash:", ethers.formatEther(wethToUsdc), "USDC");
      
      // Crash 1INCH from $0.5 to $0.3
      await mockPriceAggregator.setMockPrice(INCH, USDC, ethers.parseEther("0.3"));
      
      const inchToUsdc = await mockPriceAggregator.getRate(INCH, USDC, false);
      expect(inchToUsdc).to.equal(ethers.parseEther("0.3"));
      
      console.log("📉 1INCH price after crash:", ethers.formatEther(inchToUsdc), "USDC");
      console.log("✅ Market crash simulation verified");
    });

    it("Should test extreme stablecoin depeg", async function () {
      // USDT loses peg severely (goes to $0.90)
      await mockPriceAggregator.setStablecoinDeviation(USDT, USDC, 1000); // 10% deviation
      
      const usdtToUsdc = await mockPriceAggregator.getRate(USDT, USDC, false);
      const usdcToUsdt = await mockPriceAggregator.getRate(USDC, USDT, false);
      
      console.log("💥 USDT depeg - USDT/USDC:", ethers.formatEther(usdtToUsdc));
      console.log("💥 USDT depeg - USDC/USDT:", ethers.formatEther(usdcToUsdt));
      
      expect(usdtToUsdc).to.be.gt(ethers.parseEther("1")); // USDT should be worth more USDC (since USDT is depegged up)
      expect(usdcToUsdt).to.be.lt(ethers.parseEther("1")); // USDC should be worth less USDT
      
      console.log("✅ Extreme depeg scenario verified");
    });
  });

  describe("Real Base Token Interaction", function () {
    it("Should check actual token balances on Base fork", async function () {
      // Get actual token contracts
      const usdcToken = await ethers.getContractAt("IERC20", USDC);
      const wethToken = await ethers.getContractAt("IERC20", WETH);
      
      // Check if we can read from actual Base contracts
      try {
        const usdcBalance = await usdcToken.balanceOf(deployer.address);
        const wethBalance = await wethToken.balanceOf(deployer.address);
        
        console.log("💰 Deployer USDC balance:", ethers.formatUnits(usdcBalance, 6));
        console.log("💰 Deployer WETH balance:", ethers.formatEther(wethBalance));
        
        // These should be 0 for our test account, but the call should succeed
        expect(usdcBalance).to.be.gte(0);
        expect(wethBalance).to.be.gte(0);
        
        console.log("✅ Real Base token interaction verified");
      } catch (error) {
        console.log("❌ Could not read real token balances:", error);
        throw error;
      }
    });

    it("Should verify we're on Base fork", async function () {
      const network = await ethers.provider.getNetwork();
      const blockNumber = await ethers.provider.getBlockNumber();
      
      console.log("🌐 Network chainId:", network.chainId.toString());
      console.log("🔢 Current block number:", blockNumber);
      
      expect(network.chainId).to.equal(8453n); // Base mainnet chain ID
      expect(blockNumber).to.be.gt(0);
      
      console.log("✅ Base fork verification complete");
    });
  });

  describe("Advanced Price Testing Scenarios", function () {
    it("Should test multiple simultaneous price changes", async function () {
      // Simulate a complex market scenario
      await mockPriceAggregator.setMockPrice(WETH, USDC, ethers.parseEther("2500")); // ETH drops
      await mockPriceAggregator.setStablecoinDeviation(USDT, USDC, 200); // USDT depegs 2%
      await mockPriceAggregator.setMockPrice(INCH, USDC, ethers.parseEther("0.8")); // 1INCH pumps
      
      const wethPrice = await mockPriceAggregator.getRate(WETH, USDC, false);
      const usdtPrice = await mockPriceAggregator.getRate(USDT, USDC, false);
      const inchPrice = await mockPriceAggregator.getRate(INCH, USDC, false);
      
      console.log("📊 Complex scenario prices:");
      console.log("   WETH/USDC:", ethers.formatEther(wethPrice));
      console.log("   USDT/USDC:", ethers.formatEther(usdtPrice));
      console.log("   1INCH/USDC:", ethers.formatEther(inchPrice));
      
      expect(wethPrice).to.equal(ethers.parseEther("2500"));
      expect(usdtPrice).to.be.gt(ethers.parseEther("1")); // USDT price should be > 1 due to deviation
      expect(inchPrice).to.equal(ethers.parseEther("0.8"));
      
      console.log("✅ Complex market scenario verified");
    });

    it("Should test price recovery simulation", async function () {
      // Reset all prices to normal
      await mockPriceAggregator.setMockPrice(WETH, USDC, ethers.parseEther("3000"));
      await mockPriceAggregator.resetStablecoinPrices();
      await mockPriceAggregator.setMockPrice(INCH, USDC, ethers.parseEther("0.5"));
      
      const wethPrice = await mockPriceAggregator.getRate(WETH, USDC, false);
      const usdtPrice = await mockPriceAggregator.getRate(USDT, USDC, false);
      const inchPrice = await mockPriceAggregator.getRate(INCH, USDC, false);
      
      expect(wethPrice).to.equal(ethers.parseEther("3000"));
      expect(usdtPrice).to.equal(ethers.parseEther("1"));
      expect(inchPrice).to.equal(ethers.parseEther("0.5"));
      
      console.log("✅ Market recovery simulation verified");
    });
  });
});
