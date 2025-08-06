import { ethers } from "hardhat";
import type { BaseContract } from "ethers";
import type {
  OptimizedBalancerFactory,
  MockERC20,
  MockSpotPriceAggregator,
  MockLimitOrderProtocol,
  LimitOrderLib,
  StablecoinGridLib,
  PortfolioCoreLib,
} from "../typechain-types";

// Helper function to handle BigInt serialization in JSON
const bigintReplacer = (key: string, value: any) => {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
};

// Base mainnet token addresses
export const TOKEN_ADDRESSES = {
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  USDT: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
  DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  WETH: "0x4200000000000000000000000000000000000006",
  INCH: "0xc5fecC3a29Fb57B5024eEc8a2239d4621e111CBE",
} as const;

// Cache for deployed contracts
const deploymentCache = new Map<string, BaseContract>();

export interface DeploymentResult {
  limitOrderLib: LimitOrderLib;
  stablecoinGridLib: StablecoinGridLib;
  portfolioAnalysisLib?: PortfolioCoreLib;
  mockPriceAggregator: MockSpotPriceAggregator;
  mockLimitOrderProtocol: MockLimitOrderProtocol;
  optimizedBalancerFactory?: OptimizedBalancerFactory;
}

/**
 * Get or deploy a contract, reusing if already deployed
 */
export async function getOrDeployContract(
  contractName: string,
  deployArgs: any[] = [],
  libraries?: Record<string, string>,
): Promise<BaseContract> {
  const cacheKey = `${contractName}-${JSON.stringify(deployArgs, bigintReplacer)}-${JSON.stringify(libraries || {}, bigintReplacer)}`;

  if (deploymentCache.has(cacheKey)) {
    console.log(`♻️  Reusing existing ${contractName}`);
    return deploymentCache.get(cacheKey)!;
  }

  console.log(`🔄 Deploying ${contractName}...`);
  const contractFactory = await ethers.getContractFactory(contractName, libraries ? { libraries } : undefined);
  const contract = await contractFactory.deploy(...deployArgs);
  await contract.waitForDeployment();

  console.log(`✅ ${contractName} deployed to:`, await contract.getAddress());
  deploymentCache.set(cacheKey, contract);

  return contract;
}

/**
 * Deploy all required libraries (with caching and conditional PortfolioAnalysisLib)
 */
export async function deployLibraries(includePortfolioAnalysisLib: boolean = true): Promise<{
  limitOrderLib: BaseContract;
  stablecoinGridLib: BaseContract;
  portfolioAnalysisLib?: BaseContract;
}> {
  console.log("📚 Deploying libraries...");

  // Deploy LimitOrderLib (cached)
  const limitOrderLib = (await getOrDeployContract("LimitOrderLib")) as LimitOrderLib;

  // Deploy StablecoinGridLib (cached)
  const stablecoinGridLib = (await getOrDeployContract("StablecoinGridLib")) as StablecoinGridLib;

  const result: {
    limitOrderLib: LimitOrderLib;
    stablecoinGridLib: StablecoinGridLib;
    portfolioAnalysisLib?: PortfolioCoreLib;
  } = {
    limitOrderLib,
    stablecoinGridLib,
  };

  // Deploy PortfolioAnalysisLib only if requested (cached)
  if (includePortfolioAnalysisLib) {
    const portfolioAnalysisLib = (await getOrDeployContract("PortfolioAnalysisLib")) as any;
    result.portfolioAnalysisLib = portfolioAnalysisLib;
  }

  return result;
}

/**
 * Deploy mock ERC20 tokens for testing
 */
export async function deployMockTokens(): Promise<{
  mockUSDC: MockERC20;
  mockUSDT: MockERC20;
  mockDAI: MockERC20;
  mockWETH: MockERC20;
  mockINCH: MockERC20;
}> {
  console.log("🪙 Deploying mock tokens...");

  const mockUSDC = (await getOrDeployContract("MockERC20", ["USD Coin", "USDC", 6])) as MockERC20;

  const mockUSDT = (await getOrDeployContract("MockERC20", ["Tether USD", "USDT", 6])) as MockERC20;

  const mockDAI = (await getOrDeployContract("MockERC20", ["Dai Stablecoin", "DAI", 18])) as MockERC20;

  const mockWETH = (await getOrDeployContract("MockERC20", ["Wrapped Ether", "WETH", 18])) as MockERC20;

  const mockINCH = (await getOrDeployContract("MockERC20", ["1inch Token", "INCH", 18])) as MockERC20;

  return {
    mockUSDC,
    mockUSDT,
    mockDAI,
    mockWETH,
    mockINCH,
  };
}

/**
 * Deploy mock contracts (with caching)
 */
export async function deployMockContracts(deployerAddress: string): Promise<{
  mockPriceAggregator: MockSpotPriceAggregator;
  mockLimitOrderProtocol: MockLimitOrderProtocol;
}> {
  console.log("🎭 Deploying mock contracts...");

  // Deploy MockSpotPriceAggregator (cached)
  const mockPriceAggregator = (await getOrDeployContract("MockSpotPriceAggregator", [
    deployerAddress,
  ])) as MockSpotPriceAggregator;

  // Deploy MockLimitOrderProtocol (cached)
  const mockLimitOrderProtocol = (await getOrDeployContract("MockLimitOrderProtocol")) as MockLimitOrderProtocol;

  return {
    mockPriceAggregator,
    mockLimitOrderProtocol,
  };
}

/**
 * Configure initial prices for testing
 */
export async function configurePrices(mockPriceAggregator: MockSpotPriceAggregator): Promise<void> {
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
 * Deploy OptimizedBalancerFactory with libraries (cached version)
 */
export async function deployOptimizedBalancerFactory(
  mockPriceAggregator: MockSpotPriceAggregator,
  mockLimitOrderProtocol: MockLimitOrderProtocol,
  libraries: {
    limitOrderLib: LimitOrderLib;
    stablecoinGridLib: StablecoinGridLib;
    portfolioAnalysisLib?: PortfolioCoreLib;
  },
  gasLimit?: number,
): Promise<OptimizedBalancerFactory> {
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

  // Create deployment args
  const deploymentArgs = [
    await mockPriceAggregator.getAddress(),
    [USDC, USDT, DAI],
    await mockLimitOrderProtocol.getAddress(),
  ];

  const deployOptions: any = {};
  if (gasLimit) {
    deployOptions.gasLimit = gasLimit;
  }

  // Use cached deployment with libraries
  const OptimizedBalancerFactory = await ethers.getContractFactory("OptimizedBalancerFactory", {
    libraries: librariesConfig,
  });

  const cacheKey = `OptimizedBalancerFactory_${JSON.stringify(deploymentArgs)}_${JSON.stringify(librariesConfig)}`;

  if (deploymentCache.has(cacheKey)) {
    console.log("♻️ Using cached OptimizedBalancerFactory");
    return deploymentCache.get(cacheKey) as OptimizedBalancerFactory;
  }

  const optimizedBalancerFactory = await OptimizedBalancerFactory.deploy(
    deploymentArgs[0] as string,
    deploymentArgs[1] as string[],
    deploymentArgs[2] as string,
    deployOptions,
  );

  await optimizedBalancerFactory.waitForDeployment();
  deploymentCache.set(cacheKey, optimizedBalancerFactory as any);

  console.log("✅ OptimizedBalancerFactory deployed to:", await optimizedBalancerFactory.getAddress());

  return optimizedBalancerFactory as OptimizedBalancerFactory;
}

/**
 * Test balancer creation and event emission
 */
export async function testBalancerCreation(
  optimizedBalancerFactory: OptimizedBalancerFactory,
  user: any,
): Promise<void> {
  console.log("🧪 Testing balancer creation...");

  const { USDC, WETH, INCH } = TOKEN_ADDRESSES;
  const assetAddresses = [USDC, WETH, INCH];
  const percentages = [40, 40, 20];
  const amounts = [
    ethers.parseUnits("1000", 6), // 1000 USDC
    ethers.parseEther("1"), // 1 WETH
    ethers.parseEther("1000"), // 1000 1INCH
  ];
  const driftPercentage = 5;

  console.log("Creating OptimizedDriftBalancer...");
  const createTx = await optimizedBalancerFactory
    .connect(user)
    .createDriftBalancer(assetAddresses, percentages, amounts, driftPercentage);

  const receipt = await createTx.wait();
  console.log("✅ Balancer creation transaction completed");

  // Check for BalancerCreated event
  const balancerCreatedEvent = receipt?.logs?.find((log: any) => log.eventName === "BalancerCreated");

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
  gasLimit?: number,
): Promise<DeploymentResult> {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Starting complete system deployment...");
  console.log("Deployer:", await deployer.getAddress());

  try {
    // Deploy libraries
    const allLibraries = await deployLibraries(includePortfolioAnalysisLib);
    const libraries = includePortfolioAnalysisLib
      ? allLibraries
      : {
          limitOrderLib: allLibraries.limitOrderLib,
          stablecoinGridLib: allLibraries.stablecoinGridLib,
        };

    // Deploy mock contracts
    const mocks = await deployMockContracts(await deployer.getAddress());

    // Configure prices
    await configurePrices(mocks.mockPriceAggregator);

    // Deploy factory
    const factory = await deployOptimizedBalancerFactory(
      mocks.mockPriceAggregator,
      mocks.mockLimitOrderProtocol,
      libraries,
      gasLimit,
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
