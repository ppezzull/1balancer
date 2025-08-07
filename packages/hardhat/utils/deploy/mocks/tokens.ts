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
