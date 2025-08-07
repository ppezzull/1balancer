import { HardhatRuntimeEnvironment } from "hardhat/types";
import { MockERC20 } from "../../../typechain-types";

export interface MockTokens {
  mockUSDC: MockERC20;
  mockUSDT: MockERC20;
  mockDAI: MockERC20;
  mockWETH: MockERC20;
  mockINCH: MockERC20;
}

export async function deployMockTokens(hre: HardhatRuntimeEnvironment): Promise<MockTokens> {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("🪙 Deploying mock tokens...");

  // Deploy USDC (6 decimals)
  await deploy("MockUSDC", {
    contract: "MockERC20",
    from: deployer,
    args: ["USD Coin", "USDC", 6],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  // Deploy USDT (6 decimals)
  await deploy("MockUSDT", {
    contract: "MockERC20",
    from: deployer,
    args: ["Tether USD", "USDT", 6],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  // Deploy DAI (18 decimals)
  await deploy("MockDAI", {
    contract: "MockERC20",
    from: deployer,
    args: ["Dai Stablecoin", "DAI", 18],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  // Deploy WETH (18 decimals)
  await deploy("MockWETH", {
    contract: "MockERC20",
    from: deployer,
    args: ["Wrapped Ether", "WETH", 18],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  // Deploy INCH (18 decimals)
  await deploy("MockINCH", {
    contract: "MockERC20",
    from: deployer,
    args: ["1inch Token", "INCH", 18],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  // Get contract instances
  const mockUSDC = (await ethers.getContractAt("MockERC20", (await get("MockUSDC")).address)) as unknown as MockERC20;
  const mockUSDT = (await ethers.getContractAt("MockERC20", (await get("MockUSDT")).address)) as unknown as MockERC20;
  const mockDAI = (await ethers.getContractAt("MockERC20", (await get("MockDAI")).address)) as unknown as MockERC20;
  const mockWETH = (await ethers.getContractAt("MockERC20", (await get("MockWETH")).address)) as unknown as MockERC20;
  const mockINCH = (await ethers.getContractAt("MockERC20", (await get("MockINCH")).address)) as unknown as MockERC20;

  console.log("✅ Mock tokens deployed:");
  console.log("  USDC:", await mockUSDC.getAddress());
  console.log("  USDT:", await mockUSDT.getAddress());
  console.log("  DAI:", await mockDAI.getAddress());
  console.log("  WETH:", await mockWETH.getAddress());
  console.log("  INCH:", await mockINCH.getAddress());

  return { mockUSDC, mockUSDT, mockDAI, mockWETH, mockINCH };
}

export async function getOrDeployMockTokens(hre: HardhatRuntimeEnvironment): Promise<MockTokens> {
  const { deployments, ethers } = hre;
  const { get } = deployments;

  console.log("🔄 Getting or deploying mock tokens...");

  try {
    // Try to get already deployed tokens
    const mockUSDC = (await ethers.getContractAt("MockERC20", (await get("MockUSDC")).address)) as unknown as MockERC20;
    const mockUSDT = (await ethers.getContractAt("MockERC20", (await get("MockUSDT")).address)) as unknown as MockERC20;
    const mockDAI = (await ethers.getContractAt("MockERC20", (await get("MockDAI")).address)) as unknown as MockERC20;
    const mockWETH = (await ethers.getContractAt("MockERC20", (await get("MockWETH")).address)) as unknown as MockERC20;
    const mockINCH = (await ethers.getContractAt("MockERC20", (await get("MockINCH")).address)) as unknown as MockERC20;

    console.log("♻️  Reusing existing mock tokens");
    return { mockUSDC, mockUSDT, mockDAI, mockWETH, mockINCH };
  } catch {
    // If tokens don't exist, deploy them
    console.log("🆕 Deploying new mock tokens");
    return await deployMockTokens(hre);
  }
}

/**
 * @notice Mint tokens for testing purposes
 * @param tokens The token contracts to mint from
 * @param recipient The address to mint tokens to
 * @param amounts Array of amounts to mint [USDC, USDT, DAI, WETH, INCH]
 */
export async function mintTestTokens(
  tokens: MockTokens,
  recipient: string,
  amounts: {
    USDC?: bigint;
    USDT?: bigint;
    DAI?: bigint;
    WETH?: bigint;
    INCH?: bigint;
  },
): Promise<void> {
  console.log("🪙 Minting test tokens to:", recipient);

  const mintPromises: Promise<any>[] = [];

  if (amounts.USDC && amounts.USDC > 0n) {
    console.log(`  💰 Minting ${amounts.USDC} USDC`);
    mintPromises.push(tokens.mockUSDC.mint(recipient, amounts.USDC));
  }

  if (amounts.USDT && amounts.USDT > 0n) {
    console.log(`  💰 Minting ${amounts.USDT} USDT`);
    mintPromises.push(tokens.mockUSDT.mint(recipient, amounts.USDT));
  }

  if (amounts.DAI && amounts.DAI > 0n) {
    console.log(`  💰 Minting ${amounts.DAI} DAI`);
    mintPromises.push(tokens.mockDAI.mint(recipient, amounts.DAI));
  }

  if (amounts.WETH && amounts.WETH > 0n) {
    console.log(`  💰 Minting ${amounts.WETH} WETH`);
    mintPromises.push(tokens.mockWETH.mint(recipient, amounts.WETH));
  }

  if (amounts.INCH && amounts.INCH > 0n) {
    console.log(`  💰 Minting ${amounts.INCH} INCH`);
    mintPromises.push(tokens.mockINCH.mint(recipient, amounts.INCH));
  }

  await Promise.all(mintPromises);
  console.log("✅ Test tokens minted successfully");
}

/**
 * @notice Approve factory to spend tokens for testing purposes
 * @param tokens The token contracts to approve
 * @param signer The signer to approve from
 * @param factoryAddress The factory address to approve
 * @param amounts Array of amounts to approve [USDC, USDT, DAI, WETH, INCH]
 */
export async function approveFactoryTokens(
  tokens: MockTokens,
  signer: any,
  factoryAddress: string,
  amounts: {
    USDC?: bigint;
    USDT?: bigint;
    DAI?: bigint;
    WETH?: bigint;
    INCH?: bigint;
  },
): Promise<void> {
  console.log("🔑 Approving factory to spend tokens:", factoryAddress);

  const approvePromises: Promise<any>[] = [];

  if (amounts.USDC && amounts.USDC > 0n) {
    console.log(`  ✅ Approving ${amounts.USDC} USDC`);
    approvePromises.push(tokens.mockUSDC.connect(signer).approve(factoryAddress, amounts.USDC));
  }

  if (amounts.USDT && amounts.USDT > 0n) {
    console.log(`  ✅ Approving ${amounts.USDT} USDT`);
    approvePromises.push(tokens.mockUSDT.connect(signer).approve(factoryAddress, amounts.USDT));
  }

  if (amounts.DAI && amounts.DAI > 0n) {
    console.log(`  ✅ Approving ${amounts.DAI} DAI`);
    approvePromises.push(tokens.mockDAI.connect(signer).approve(factoryAddress, amounts.DAI));
  }

  if (amounts.WETH && amounts.WETH > 0n) {
    console.log(`  ✅ Approving ${amounts.WETH} WETH`);
    approvePromises.push(tokens.mockWETH.connect(signer).approve(factoryAddress, amounts.WETH));
  }

  if (amounts.INCH && amounts.INCH > 0n) {
    console.log(`  ✅ Approving ${amounts.INCH} INCH`);
    approvePromises.push(tokens.mockINCH.connect(signer).approve(factoryAddress, amounts.INCH));
  }

  await Promise.all(approvePromises);
  console.log("✅ Factory token approvals completed");
}
