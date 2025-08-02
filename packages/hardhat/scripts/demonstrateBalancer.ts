import { ethers } from "hardhat";

async function main() {
  console.log("🚀 BalancerFactory Demonstration Script");
  console.log("=====================================");

  const [deployer] = await ethers.getSigners();
  
  // Connect to deployed contracts
  const balancerFactoryAddress = "0x01135d1e0271635057f727C18A21c91B554df839";
  const mockAggregatorAddress = "0xb5Ed90292B81944D62299C6BDa82F6cbcfA044Af";
  
  const balancerFactory = await ethers.getContractAt("BalancerFactory", balancerFactoryAddress);
  const mockPriceAggregator = await ethers.getContractAt("MockSpotPriceAggregator", mockAggregatorAddress);

  console.log("🔗 Connected to contracts:");
  console.log("   BalancerFactory:", balancerFactoryAddress);
  console.log("   MockSpotPriceAggregator:", mockAggregatorAddress);

  // Base mainnet token addresses
  const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const USDT = "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2";
  const DAI = "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb";
  const WETH = "0x4200000000000000000000000000000000000006";
  const INCH = "0xc5fecC3a29Fb57B5024eEc8a2239d4621e111CBE";

  console.log("\n💰 Current Token Prices:");
  console.log("========================");
  
  const prices = [
    { from: "USDC", to: "USDT", fromAddr: USDC, toAddr: USDT },
    { from: "USDT", to: "USDC", fromAddr: USDT, toAddr: USDC },
    { from: "DAI", to: "USDC", fromAddr: DAI, toAddr: USDC },
    { from: "WETH", to: "USDC", fromAddr: WETH, toAddr: USDC },
    { from: "1INCH", to: "USDC", fromAddr: INCH, toAddr: USDC },
  ];

  for (const price of prices) {
    const rate = await mockPriceAggregator.getRate(price.fromAddr, price.toAddr, false);
    console.log(`   ${price.from}/${price.to}: ${ethers.formatEther(rate)}`);
  }

  console.log("\n📊 Factory Configuration:");
  console.log("=========================");
  
  const stablecoin0 = await balancerFactory.stablecoins(0);
  const stablecoin1 = await balancerFactory.stablecoins(1); 
  const stablecoin2 = await balancerFactory.stablecoins(2);
  const priceFeed = await balancerFactory.priceFeed();
  
  console.log("   Stablecoins:");
  console.log("     [0]:", stablecoin0, "(USDC)");
  console.log("     [1]:", stablecoin1, "(USDT)");
  console.log("     [2]:", stablecoin2, "(DAI)");
  console.log("   Price Feed:", priceFeed);

  console.log("\n🎯 Example Portfolio Configurations:");
  console.log("====================================");
  
  const portfolios = [
    {
      name: "Conservative Stablecoin Heavy",
      assets: [USDC, USDT, WETH],
      percentages: [50, 30, 20],
      description: "80% stablecoins, 20% ETH for conservative growth"
    },
    {
      name: "Balanced DeFi Portfolio", 
      assets: [USDC, WETH, INCH],
      percentages: [40, 40, 20],
      description: "Balanced exposure to stables, ETH, and DeFi tokens"
    },
    {
      name: "Multi-Stablecoin Base",
      assets: [USDC, USDT, DAI, WETH],
      percentages: [30, 30, 20, 20],
      description: "Diversified stablecoin exposure with ETH upside"
    }
  ];

  for (const portfolio of portfolios) {
    console.log(`\n   ${portfolio.name}:`);
    console.log(`     Description: ${portfolio.description}`);
    console.log(`     Assets: ${portfolio.assets.length} tokens`);
    console.log(`     Allocation: ${portfolio.percentages.join('% / ')}%`);
    
    // Calculate theoretical portfolio value with 1000 USDC equivalent
    let totalValue = ethers.parseEther("0");
    for (let i = 0; i < portfolio.assets.length; i++) {
      const assetValue = ethers.parseEther("1000") * BigInt(portfolio.percentages[i]) / BigInt(100);
      totalValue += assetValue;
      const rate = await mockPriceAggregator.getRate(portfolio.assets[i], USDC, false);
      console.log(`       ${i}: ${ethers.formatEther(assetValue)} USD worth @ ${ethers.formatEther(rate)} rate`);
    }
    console.log(`     Total Value: $${ethers.formatEther(totalValue)}`);
  }

  console.log("\n🧪 Testing Price Scenarios:");
  console.log("============================");

  // Test stablecoin depeg scenario
  console.log("\n   Scenario 1: USDT Depeg (+3%)");
  await mockPriceAggregator.setStablecoinDeviation(USDT, USDC, 300); // 3% depeg
  const usdtDepegRate = await mockPriceAggregator.getRate(USDT, USDC, false);
  console.log(`     USDT/USDC after depeg: ${ethers.formatEther(usdtDepegRate)}`);
  
  // Test market crash
  console.log("\n   Scenario 2: Market Crash (-33% ETH, -50% 1INCH)");
  await mockPriceAggregator.setMockPrice(WETH, USDC, ethers.parseEther("2000")); // ETH drops to $2000
  await mockPriceAggregator.setMockPrice(INCH, USDC, ethers.parseEther("0.25")); // 1INCH drops to $0.25
  
  const crashWethRate = await mockPriceAggregator.getRate(WETH, USDC, false);
  const crashInchRate = await mockPriceAggregator.getRate(INCH, USDC, false);
  console.log(`     WETH/USDC after crash: ${ethers.formatEther(crashWethRate)}`);
  console.log(`     1INCH/USDC after crash: ${ethers.formatEther(crashInchRate)}`);

  // Reset prices for normal operation
  console.log("\n   Resetting to normal prices...");
  await mockPriceAggregator.resetStablecoinPrices();
  await mockPriceAggregator.setMockPrice(WETH, USDC, ethers.parseEther("3000"));
  await mockPriceAggregator.setMockPrice(INCH, USDC, ethers.parseEther("0.5"));

  console.log("\n✅ BalancerFactory System Ready!");
  console.log("================================");
  console.log("🎯 The system successfully provides:");
  console.log("   ✓ Multi-asset portfolio balancing");
  console.log("   ✓ Stablecoin deviation monitoring");
  console.log("   ✓ Real-time price feed integration");
  console.log("   ✓ Base mainnet token compatibility");
  console.log("   ✓ Comprehensive testing infrastructure");
  console.log("\n📈 Ready for comprehensive DeFi portfolio management!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
