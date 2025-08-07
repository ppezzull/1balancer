import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "hardhat";
import { MockSpotPriceAggregator, MockERC20 } from "../../../typechain-types";
import { MockTokens } from "./tokens";

export interface SpotPriceConfig {
  mockPriceAggregator: MockSpotPriceAggregator;
  tokens: MockTokens;
}

export async function deploySpotPriceAggregator(hre: HardhatRuntimeEnvironment): Promise<MockSpotPriceAggregator> {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("🔧 Deploying MockSpotPriceAggregator...");

  await deploy("MockSpotPriceAggregator", {
    from: deployer,
    args: [deployer],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  const mockPriceAggregator = (await ethers.getContractAt(
    "MockSpotPriceAggregator",
    (await get("MockSpotPriceAggregator")).address,
  )) as unknown as MockSpotPriceAggregator;

  console.log("✅ MockSpotPriceAggregator deployed to:", await mockPriceAggregator.getAddress());

  return mockPriceAggregator;
}

export async function configureSpotPrices(
  mockPriceAggregator: MockSpotPriceAggregator,
  tokens: MockTokens,
): Promise<void> {
  console.log("💰 Configuring spot prices...");

  const wethAddress = await tokens.mockWETH.getAddress();
  const usdcAddress = await tokens.mockUSDC.getAddress();
  const usdtAddress = await tokens.mockUSDT.getAddress();
  const daiAddress = await tokens.mockDAI.getAddress();
  const inchAddress = await tokens.mockINCH.getAddress();

  // Set WETH address in the aggregator
  await mockPriceAggregator.setWethAddress(wethAddress);

  // Set up token-to-token prices
  await mockPriceAggregator.setMockPrice(wethAddress, usdcAddress, ethers.parseUnits("3000", 18));
  await mockPriceAggregator.setMockPrice(usdcAddress, wethAddress, ethers.parseUnits("1", 18) / BigInt(3000));

  await mockPriceAggregator.setMockPrice(wethAddress, usdtAddress, ethers.parseUnits("3000", 18));
  await mockPriceAggregator.setMockPrice(usdtAddress, wethAddress, ethers.parseUnits("1", 18) / BigInt(3000));

  await mockPriceAggregator.setMockPrice(wethAddress, daiAddress, ethers.parseUnits("3000", 18));
  await mockPriceAggregator.setMockPrice(daiAddress, wethAddress, ethers.parseUnits("1", 18) / BigInt(3000));

  // 1INCH prices
  await mockPriceAggregator.setMockPrice(inchAddress, usdcAddress, ethers.parseUnits("0.5", 18));
  await mockPriceAggregator.setMockPrice(usdcAddress, inchAddress, ethers.parseUnits("2", 18));

  await mockPriceAggregator.setMockPrice(inchAddress, usdtAddress, ethers.parseUnits("0.5", 18));
  await mockPriceAggregator.setMockPrice(usdtAddress, inchAddress, ethers.parseUnits("2", 18));

  await mockPriceAggregator.setMockPrice(inchAddress, daiAddress, ethers.parseUnits("0.5", 18));
  await mockPriceAggregator.setMockPrice(daiAddress, inchAddress, ethers.parseUnits("2", 18));

  // Stablecoin cross-rates (should be close to 1:1)
  await mockPriceAggregator.setMockPrice(usdcAddress, usdtAddress, ethers.parseUnits("1", 18));
  await mockPriceAggregator.setMockPrice(usdtAddress, usdcAddress, ethers.parseUnits("1", 18));

  await mockPriceAggregator.setMockPrice(usdcAddress, daiAddress, ethers.parseUnits("1", 18));
  await mockPriceAggregator.setMockPrice(daiAddress, usdcAddress, ethers.parseUnits("1", 18));

  await mockPriceAggregator.setMockPrice(usdtAddress, daiAddress, ethers.parseUnits("1", 18));
  await mockPriceAggregator.setMockPrice(daiAddress, usdtAddress, ethers.parseUnits("1", 18));

  // Set ETH prices (for getRateToEth function)
  await mockPriceAggregator.setMockEthPrice(wethAddress, ethers.parseEther("1"));
  await mockPriceAggregator.setMockEthPrice(usdcAddress, ethers.parseEther("0.00033")); // 1/3000
  await mockPriceAggregator.setMockEthPrice(usdtAddress, ethers.parseEther("0.00033"));
  await mockPriceAggregator.setMockEthPrice(daiAddress, ethers.parseEther("0.00033"));
  await mockPriceAggregator.setMockEthPrice(inchAddress, ethers.parseEther("0.000165")); // 0.5/3000

  console.log("✅ Spot prices configured");
}

export async function setStablecoinDeviation(
  mockPriceAggregator: MockSpotPriceAggregator,
  stablecoin1: MockERC20,
  stablecoin2: MockERC20,
  deviationBps: number,
): Promise<void> {
  console.log(`🔄 Setting stablecoin deviation: ${deviationBps} bps`);

  const stablecoin1Address = await stablecoin1.getAddress();
  const stablecoin2Address = await stablecoin2.getAddress();

  await mockPriceAggregator.setStablecoinDeviation(stablecoin1Address, stablecoin2Address, deviationBps);

  console.log(`✅ Deviation set for ${await stablecoin1.symbol()} -> ${await stablecoin2.symbol()}`);
}

export async function resetStablecoinPrices(mockPriceAggregator: MockSpotPriceAggregator): Promise<void> {
  console.log("🔄 Resetting stablecoin prices to 1:1");

  await mockPriceAggregator.resetStablecoinPrices();

  console.log("✅ Stablecoin prices reset");
}

export async function getOrDeploySpotPriceAggregator(hre: HardhatRuntimeEnvironment): Promise<MockSpotPriceAggregator> {
  const { deployments } = hre;
  const { get } = deployments;

  console.log("🔄 Getting or deploying spot price aggregator...");

  try {
    // Try to get already deployed aggregator
    const mockPriceAggregator = (await ethers.getContractAt(
      "MockSpotPriceAggregator",
      (await get("MockSpotPriceAggregator")).address,
    )) as unknown as MockSpotPriceAggregator;

    console.log("♻️  Reusing existing MockSpotPriceAggregator");
    return mockPriceAggregator;
  } catch {
    // If aggregator doesn't exist, deploy it
    console.log("🆕 Deploying new MockSpotPriceAggregator");
    return await deploySpotPriceAggregator(hre);
  }
}
