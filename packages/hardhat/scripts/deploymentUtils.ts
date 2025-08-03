import { ethers } from "hardhat";
import { Contract } from "ethers";

// Base mainnet token addresses
export const TOKEN_ADDRESSES = {
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  USDT: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
  DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  WETH: "0x4200000000000000000000000000000000000006",
  INCH: "0xc5fecC3a29Fb57B5024eEc8a2239d4621e111CBE",
} as const;

export interface DeploymentResult {
  limitOrderLib: Contract;
  stablecoinGridLib: Contract;
  portfolioAnalysisLib?: Contract;
  mockPriceAggregator: Contract;
  mockLimitOrderProtocol: Contract;
  optimizedBalancerFactory?: Contract;
}

/**
 * Deploy all required libraries
 */
export async function deployLibraries(): Promise<{
  limitOrderLib: Contract;
  stablecoinGridLib: Contract;
  portfolioAnalysisLib: Contract;
}> {
  console.log("📚 Deploying libraries...");

  // Deploy LimitOrderLib
  console.log("Deploying LimitOrderLib...");
  const LimitOrderLib = await ethers.getContractFactory("LimitOrderLib");
  const limitOrderLib = await LimitOrderLib.deploy();
  await limitOrderLib.waitForDeployment();
  console.log("✅ LimitOrderLib deployed to:", await limitOrderLib.getAddress());

  // Deploy StablecoinGridLib
  console.log("Deploying StablecoinGridLib...");
  const StablecoinGridLib = await ethers.getContractFactory("StablecoinGridLib");
  const stablecoinGridLib = await StablecoinGridLib.deploy();
  await stablecoinGridLib.waitForDeployment();
  console.log("✅ StablecoinGridLib deployed to:", await stablecoinGridLib.getAddress());

  // Deploy PortfolioAnalysisLib
  console.log("Deploying PortfolioAnalysisLib...");
  const PortfolioAnalysisLib = await ethers.getContractFactory("PortfolioAnalysisLib");
  const portfolioAnalysisLib = await PortfolioAnalysisLib.deploy();
  await portfolioAnalysisLib.waitForDeployment();
  console.log("✅ PortfolioAnalysisLib deployed to:", await portfolioAnalysisLib.getAddress());

  return {
    limitOrderLib,
    stablecoinGridLib,
    portfolioAnalysisLib,
  };
}

/**
 * Deploy mock contracts
 */
export async function deployMockContracts(deployerAddress: string): Promise<{
  mockPriceAggregator: Contract;
  mockLimitOrderProtocol: Contract;
}> {
  console.log("🎭 Deploying mock contracts...");

  // Deploy MockSpotPriceAggregator
  console.log("Deploying MockSpotPriceAggregator...");
  const MockSpotPriceAggregator = await ethers.getContractFactory("MockSpotPriceAggregator");
  const mockPriceAggregator = await MockSpotPriceAggregator.deploy(deployerAddress);
  await mockPriceAggregator.waitForDeployment();
  console.log("✅ MockSpotPriceAggregator deployed to:", await mockPriceAggregator.getAddress());

  // Deploy MockLimitOrderProtocol
  console.log("Deploying MockLimitOrderProtocol...");
  const MockLimitOrderProtocol = await ethers.getContractFactory("MockLimitOrderProtocol");
  const mockLimitOrderProtocol = await MockLimitOrderProtocol.deploy();
  await mockLimitOrderProtocol.waitForDeployment();
  console.log("✅ MockLimitOrderProtocol deployed to:", await mockLimitOrderProtocol.getAddress());

  return {
    mockPriceAggregator,
    mockLimitOrderProtocol,
  };
}

/**
 * Configure initial prices for testing
 */
export async function configurePrices(mockPriceAggregator: Contract): Promise<void> {
  console.log("🔧 Configuring initial prices...");

  const { WETH, USDC, USDT, DAI, INCH } = TOKEN_ADDRESSES;

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
}

/**
 * Deploy OptimizedBalancerFactory with libraries
 */
export async function deployOptimizedBalancerFactory(
  mockPriceAggregator: Contract,
  mockLimitOrderProtocol: Contract,
  libraries: {
    limitOrderLib: Contract;
    stablecoinGridLib: Contract;
    portfolioAnalysisLib?: Contract;
  },
  gasLimit?: number
): Promise<Contract> {
  console.log("🏭 Deploying OptimizedBalancerFactory...");

  const { USDC, USDT, DAI } = TOKEN_ADDRESSES;

  // Prepare libraries object
  const librariesConfig: Record<string, string> = {
    LimitOrderLib: await libraries.limitOrderLib.getAddress(),
    StablecoinGridLib: await libraries.stablecoinGridLib.getAddress(),
  };

  if (libraries.portfolioAnalysisLib) {
    librariesConfig.PortfolioAnalysisLib = await libraries.portfolioAnalysisLib.getAddress();
  }

  // Deploy OptimizedBalancerFactory with libraries linked
  const OptimizedBalancerFactory = await ethers.getContractFactory("OptimizedBalancerFactory", {
    libraries: librariesConfig,
  });

  const deployOptions: any = {};
  if (gasLimit) {
    deployOptions.gasLimit = gasLimit;
  }

  const optimizedBalancerFactory = await OptimizedBalancerFactory.deploy(
    await mockPriceAggregator.getAddress(),
    [USDC, USDT, DAI],
    await mockLimitOrderProtocol.getAddress(),
    deployOptions
  );

  await optimizedBalancerFactory.waitForDeployment();
  console.log("✅ OptimizedBalancerFactory deployed to:", await optimizedBalancerFactory.getAddress());

  return optimizedBalancerFactory;
}

/**
 * Test balancer creation and event emission
 */
export async function testBalancerCreation(
  optimizedBalancerFactory: Contract,
  user: any
): Promise<void> {
  console.log("🧪 Testing balancer creation...");

  const { USDC, WETH, INCH } = TOKEN_ADDRESSES;
  const assetAddresses = [USDC, WETH, INCH];
  const percentages = [40, 40, 20];
  const amounts = [
    ethers.parseUnits("1000", 6),  // 1000 USDC
    ethers.parseEther("1"),        // 1 WETH
    ethers.parseEther("1000")      // 1000 1INCH
  ];
  const driftPercentage = 5;

  console.log("Creating OptimizedDriftBalancer...");
  const createTx = await optimizedBalancerFactory.connect(user).createDriftBalancer(
    assetAddresses,
    percentages,
    amounts,
    driftPercentage
  );

  const receipt = await createTx.wait();
  console.log("✅ Balancer creation transaction completed");

  // Check for BalancerCreated event
  const balancerCreatedEvent = receipt?.logs?.find(
    (log: any) => log.eventName === "BalancerCreated"
  );

  if (balancerCreatedEvent) {
    console.log("✅ BalancerCreated event emitted");
    console.log("   Balancer Address:", balancerCreatedEvent.args?.balancer);
    console.log("   Owner:", balancerCreatedEvent.args?.owner);
    console.log("   Is Time Based:", balancerCreatedEvent.args?.isTimeBased);
  } else {
    console.log("⚠️ BalancerCreated event not found");
  }
}

/**
 * Complete deployment with all components
 */
export async function deployCompleteSystem(
  includePortfolioAnalysisLib: boolean = false,
  gasLimit?: number
): Promise<DeploymentResult> {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Starting complete system deployment...");
  console.log("Deployer:", await deployer.getAddress());

  try {
    // Deploy libraries
    const libraries = await deployLibraries();
    if (!includePortfolioAnalysisLib) {
      delete libraries.portfolioAnalysisLib;
    }

    // Deploy mock contracts
    const mocks = await deployMockContracts(await deployer.getAddress());

    // Configure prices
    await configurePrices(mocks.mockPriceAggregator);

    // Deploy factory
    const factory = await deployOptimizedBalancerFactory(
      mocks.mockPriceAggregator,
      mocks.mockLimitOrderProtocol,
      libraries,
      gasLimit
    );

    console.log("🎉 Complete system deployment successful!");

    return {
      ...libraries,
      ...mocks,
      optimizedBalancerFactory: factory,
    };
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
} 