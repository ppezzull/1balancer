import type { HardhatRuntimeEnvironment } from "hardhat/types";
import hreDefault, { ethers } from "hardhat";
import type { Signer, EventLog } from "ethers";
import type {
  BalancerFactory,
  DriftBalancer,
  MockERC20,
  MockLimitOrderProtocol,
  MockSpotPriceAggregator,
  TimeBalancer,
} from "../../typechain-types";

// Reuse project deploy/mocks utilities
import {
  deployLibraries,
  deployBalancerFactory,
  getOrDeployMockTokens,
  mintTestTokens,
  approveFactoryTokens,
  getOrDeploySpotPriceAggregator,
  configureSpotPrices,
  getOrDeployLimitOrderProtocol,
  type MockTokens,
} from "..";

export const shouldLog = process.env.TEST_LOG === "1";
export const log = (...args: any[]) => {
  if (shouldLog) console.log(...args);
};

export interface StableLimitSetupOptions {
  stablecoinPercentages?: bigint[]; // defaults to [100n]
  stablecoinAmounts: readonly [bigint, bigint, bigint]; // [USDC(6), USDT(6), DAI(18)]
  driftPercentage: bigint; // bps, e.g. 200n = 2%
}

export interface StableLimitTestContext {
  user: Signer;
  owner: Signer;
  factory: BalancerFactory;
  driftBalancer: DriftBalancer;
  tokens: MockTokens;
  mockUSDC: MockERC20;
  mockUSDT: MockERC20;
  mockDAI: MockERC20;
  priceAggregator: MockSpotPriceAggregator;
  limitOrderProtocol: MockLimitOrderProtocol;
}

export async function setupStableLimit(
  hre: HardhatRuntimeEnvironment = hreDefault,
  options: StableLimitSetupOptions,
): Promise<StableLimitTestContext> {
  const { stablecoinAmounts, driftPercentage } = options;
  const stablecoinPercentages = options.stablecoinPercentages ?? [100n];

  const [owner, user] = await ethers.getSigners();

  log("🚀 Setting up stable limit test context...");

  const libraries = await deployLibraries(hre);
  const tokens = await getOrDeployMockTokens(hre);
  const priceAggregator = await getOrDeploySpotPriceAggregator(hre);
  const limitOrderProtocol = await getOrDeployLimitOrderProtocol(hre);

  await configureSpotPrices(priceAggregator, tokens);

  const stablecoinAddresses = [
    await tokens.mockUSDC.getAddress(),
    await tokens.mockUSDT.getAddress(),
    await tokens.mockDAI.getAddress(),
  ];

  const factory = await deployBalancerFactory(
    hre,
    { limitOrderLib: libraries.limitOrderLib, stablecoinGridLib: libraries.stablecoinGridLib },
    { mockPriceAggregator: priceAggregator, mockLimitOrderProtocol: limitOrderProtocol },
    stablecoinAddresses,
  );

  const userAddress = await user.getAddress();
  await mintTestTokens(tokens, userAddress, {
    USDC: stablecoinAmounts[0],
    USDT: stablecoinAmounts[1],
    DAI: stablecoinAmounts[2],
  });

  await approveFactoryTokens(tokens, user, await factory.getAddress(), {
    USDC: stablecoinAmounts[0],
    USDT: stablecoinAmounts[1],
    DAI: stablecoinAmounts[2],
  });

  const assetAddresses = [
    await tokens.mockUSDC.getAddress(),
    await tokens.mockUSDT.getAddress(),
    await tokens.mockDAI.getAddress(),
  ];

  const tx = await factory
    .connect(user)
    .createDriftBalancer(assetAddresses, stablecoinPercentages, [...stablecoinAmounts], driftPercentage);
  const receipt = await tx.wait();

  if (!receipt) throw new Error("Transaction receipt is null");

  const created = receipt.logs.find((l: any): l is EventLog => (l as any).eventName === "BalancerCreated") as EventLog;
  if (!created) throw new Error("BalancerCreated event not found");

  const balancerAddress = (created as any).args[1] as string;
  const driftBalancer = (await ethers.getContractAt("DriftBalancer", balancerAddress)) as unknown as DriftBalancer;

  log("✅ Stable limit test context ready");

  return {
    user,
    owner,
    factory,
    driftBalancer,
    tokens,
    mockUSDC: tokens.mockUSDC,
    mockUSDT: tokens.mockUSDT,
    mockDAI: tokens.mockDAI,
    priceAggregator,
    limitOrderProtocol,
  };
}

export interface FactorySetupContext {
  owner: Signer;
  factory: BalancerFactory;
  priceAggregator: MockSpotPriceAggregator;
  limitOrderProtocol: MockLimitOrderProtocol;
}

export async function setupFactoryWithMocks(
  hre: HardhatRuntimeEnvironment = hreDefault,
  stablecoinAddresses: string[] = [],
): Promise<FactorySetupContext> {
  const [owner] = await ethers.getSigners();
  const priceAggregator = await getOrDeploySpotPriceAggregator(hre);
  const limitOrderProtocol = await getOrDeployLimitOrderProtocol(hre);

  const libraries = await deployLibraries(hre);
  const factory = await deployBalancerFactory(
    hre,
    { limitOrderLib: libraries.limitOrderLib, stablecoinGridLib: libraries.stablecoinGridLib },
    { mockPriceAggregator: priceAggregator, mockLimitOrderProtocol: limitOrderProtocol },
    stablecoinAddresses,
  );

  return { owner, factory, priceAggregator, limitOrderProtocol };
}

export function encodePerformData(tokenIn: string, tokenOut: string, price: bigint): string {
  return ethers.AbiCoder.defaultAbiCoder().encode(["address", "address", "uint256"], [tokenIn, tokenOut, price]);
}

export async function getOwnerSignerOf(contract: { owner: () => Promise<string> }): Promise<Signer> {
  const ownerAddr = await contract.owner();
  const allSigners = await ethers.getSigners();
  const ownerSigner = allSigners.find(s => s.address.toLowerCase() === ownerAddr.toLowerCase());
  if (!ownerSigner) throw new Error("Owner signer not found");
  return ownerSigner;
}

export function findEvent(receipt: any, eventName: string): EventLog | undefined {
  return receipt?.logs.find((log: any): log is EventLog => (log as any).eventName === eventName);
}

// ===== Additional mixed-asset setup helpers =====
export interface DriftMixedSetupOptions {
  percentages?: readonly [bigint, bigint, bigint];
  amounts?: readonly [bigint, bigint, bigint]; // [USDC(6), WETH(18), INCH(18)]
  driftPercentage?: bigint; // in bps
}

export interface DriftMixedContext {
  deployer: Signer;
  factory: BalancerFactory;
  driftBalancer: any;
  tokens: MockTokens;
  mockUSDC: MockERC20;
  mockUSDT: MockERC20;
  mockDAI: MockERC20;
  mockWETH: MockERC20;
  mockINCH: MockERC20;
  priceAggregator: MockSpotPriceAggregator;
}

export async function setupDriftBalancerMixed(
  hre: HardhatRuntimeEnvironment = hreDefault,
  options?: DriftMixedSetupOptions,
): Promise<DriftMixedContext> {
  const [deployer] = await ethers.getSigners();
  const libraries = await deployLibraries(hre);
  const tokens = await getOrDeployMockTokens(hre);
  const priceAggregator = await getOrDeploySpotPriceAggregator(hre);
  const limitOrderProtocol = await getOrDeployLimitOrderProtocol(hre);
  await configureSpotPrices(priceAggregator, tokens);

  const factory = await deployBalancerFactory(
    hre,
    { limitOrderLib: libraries.limitOrderLib, stablecoinGridLib: libraries.stablecoinGridLib },
    { mockPriceAggregator: priceAggregator, mockLimitOrderProtocol: limitOrderProtocol },
    [await tokens.mockUSDC.getAddress(), await tokens.mockUSDT.getAddress(), await tokens.mockDAI.getAddress()],
  );

  const percentages = options?.percentages ?? ([40n, 40n, 20n] as const);
  const amounts =
    options?.amounts ?? ([ethers.parseUnits("4000", 6), ethers.parseEther("4"), ethers.parseEther("4000")] as const);
  const driftPercentage = options?.driftPercentage ?? 1n;

  const deployerAddress = await deployer.getAddress();
  await tokens.mockUSDC.mint(deployerAddress, amounts[0]);
  await tokens.mockWETH.mint(deployerAddress, amounts[1]);
  await tokens.mockINCH.mint(deployerAddress, amounts[2]);

  const factoryAddr = await factory.getAddress();
  await tokens.mockUSDC.connect(deployer).approve(factoryAddr, amounts[0]);
  await tokens.mockWETH.connect(deployer).approve(factoryAddr, amounts[1]);
  await tokens.mockINCH.connect(deployer).approve(factoryAddr, amounts[2]);

  const assetAddresses = [
    await tokens.mockUSDC.getAddress(),
    await tokens.mockWETH.getAddress(),
    await tokens.mockINCH.getAddress(),
  ];

  const tx = await factory.createDriftBalancer(
    assetAddresses,
    [...percentages] as unknown as bigint[],
    [...amounts] as unknown as bigint[],
    driftPercentage,
  );
  const receipt = await tx.wait();
  const created = findEvent(receipt, "BalancerCreated")!;
  const parsed = (factory as any).interface.parseLog(created);
  const driftAddr = parsed.args[1] as string;
  const driftBalancer = await ethers.getContractAt("DriftBalancer", driftAddr);

  return {
    deployer,
    factory,
    driftBalancer,
    tokens,
    mockUSDC: tokens.mockUSDC,
    mockUSDT: tokens.mockUSDT,
    mockDAI: tokens.mockDAI,
    mockWETH: tokens.mockWETH,
    mockINCH: tokens.mockINCH,
    priceAggregator,
  };
}

export interface TimeBalancerSetupOptions {
  // Percentages per asset group: [stablecoinGroup, WETH]
  percentages?: readonly [bigint, bigint];
  amounts?: readonly [bigint, bigint, bigint]; // [USDC(6), WETH(18), USDT(6)]
  intervalSeconds?: number;
}

export async function setupTimeBalancer(
  hre: HardhatRuntimeEnvironment = hreDefault,
  options?: TimeBalancerSetupOptions,
): Promise<{
  deployer: Signer;
  factory: BalancerFactory;
  timeBalancer: TimeBalancer;
  tokens: MockTokens;
  priceAggregator: MockSpotPriceAggregator;
}> {
  const [deployer] = await ethers.getSigners();
  const libraries = await deployLibraries(hre);
  const tokens = await getOrDeployMockTokens(hre);
  const priceAggregator = await getOrDeploySpotPriceAggregator(hre);
  const limitOrderProtocol = await getOrDeployLimitOrderProtocol(hre);
  await configureSpotPrices(priceAggregator, tokens);

  const factory = await deployBalancerFactory(
    hre,
    { limitOrderLib: libraries.limitOrderLib, stablecoinGridLib: libraries.stablecoinGridLib },
    { mockPriceAggregator: priceAggregator, mockLimitOrderProtocol: limitOrderProtocol },
    [await tokens.mockUSDC.getAddress(), await tokens.mockUSDT.getAddress(), await tokens.mockDAI.getAddress()],
  );

  const percentages = options?.percentages ?? ([70n, 30n] as const);
  const amounts = options?.amounts ?? [
    ethers.parseUnits("5000", 6),
    ethers.parseEther("3"),
    ethers.parseUnits("2000", 6),
  ];
  const intervalSeconds = options?.intervalSeconds ?? 30 * 24 * 60 * 60; // ~30 days

  const deployerAddress = await deployer.getAddress();
  await tokens.mockUSDC.mint(deployerAddress, amounts[0]);
  await tokens.mockWETH.mint(deployerAddress, amounts[1]);
  await tokens.mockUSDT.mint(deployerAddress, amounts[2]);

  const factoryAddr = await factory.getAddress();
  await tokens.mockUSDC.connect(deployer).approve(factoryAddr, amounts[0]);
  await tokens.mockWETH.connect(deployer).approve(factoryAddr, amounts[1]);
  await tokens.mockUSDT.connect(deployer).approve(factoryAddr, amounts[2]);

  const assetAddresses = [
    await tokens.mockUSDC.getAddress(),
    await tokens.mockWETH.getAddress(),
    await tokens.mockUSDT.getAddress(),
  ];

  const tx = await factory.createTimeBalancer(
    assetAddresses,
    [...percentages] as unknown as bigint[],
    [...amounts] as unknown as bigint[],
    intervalSeconds,
  );
  const receipt = await tx.wait();
  const created = findEvent(receipt, "BalancerCreated")!;
  const parsed = (factory as any).interface.parseLog(created);
  const timeAddr = parsed.args[1] as string;
  const timeBalancer = await ethers.getContractAt("TimeBalancer", timeAddr);

  return { deployer, factory, timeBalancer, tokens, priceAggregator };
}
