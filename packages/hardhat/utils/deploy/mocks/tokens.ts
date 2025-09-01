import { HardhatRuntimeEnvironment } from "hardhat/types";

export interface MockTokens {
  mockUSDC_Permit: any;
  mockUSDT_Permit: any;
  mockDAI_Permit: any;
  mockWETH_Permit: any;
  mockINCH_Permit: any;
}

export async function deployMockTokens(hre: HardhatRuntimeEnvironment): Promise<MockTokens> {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("🪙 Deploying permit-enabled mock tokens...");
  // Deploy only permit-enabled mocks (EIP-2612)
  await deploy("MockUSDC_Permit", {
    contract: "MockERC20Permit",
    from: deployer,
    args: ["USD Coin Permit", "pUSDC", 6],
    log: true,
    skipIfAlreadyDeployed: true,
  });
  await deploy("MockUSDT_Permit", {
    contract: "MockERC20Permit",
    from: deployer,
    args: ["Tether USD Permit", "pUSDT", 6],
    log: true,
    skipIfAlreadyDeployed: true,
  });
  await deploy("MockDAI_Permit", {
    contract: "MockERC20Permit",
    from: deployer,
    args: ["Dai Stablecoin Permit", "pDAI", 18],
    log: true,
    skipIfAlreadyDeployed: true,
  });
  await deploy("MockWETH_Permit", {
    contract: "MockERC20Permit",
    from: deployer,
    args: ["Wrapped Ether Permit", "pWETH", 18],
    log: true,
    skipIfAlreadyDeployed: true,
  });
  await deploy("MockINCH_Permit", {
    contract: "MockERC20Permit",
    from: deployer,
    args: ["1inch Token Permit", "pINCH", 18],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  // Get contract instances
  const mockUSDC_Permit = (await ethers.getContractAt(
    "MockERC20Permit",
    (await get("MockUSDC_Permit")).address,
  )) as unknown as any;
  const mockUSDT_Permit = (await ethers.getContractAt(
    "MockERC20Permit",
    (await get("MockUSDT_Permit")).address,
  )) as unknown as any;
  const mockDAI_Permit = (await ethers.getContractAt(
    "MockERC20Permit",
    (await get("MockDAI_Permit")).address,
  )) as unknown as any;
  const mockWETH_Permit = (await ethers.getContractAt(
    "MockERC20Permit",
    (await get("MockWETH_Permit")).address,
  )) as unknown as any;
  const mockINCH_Permit = (await ethers.getContractAt(
    "MockERC20Permit",
    (await get("MockINCH_Permit")).address,
  )) as unknown as any;

  console.log("✅ Permit mock tokens deployed:");
  console.log("  pUSDC:", await mockUSDC_Permit.getAddress());
  console.log("  pUSDT:", await mockUSDT_Permit.getAddress());
  console.log("  pDAI:", await mockDAI_Permit.getAddress());
  console.log("  pWETH:", await mockWETH_Permit.getAddress());
  console.log("  pINCH:", await mockINCH_Permit.getAddress());

  return {
    mockUSDC_Permit,
    mockUSDT_Permit,
    mockDAI_Permit,
    mockWETH_Permit,
    mockINCH_Permit,
  };
}

export async function getOrDeployMockTokens(hre: HardhatRuntimeEnvironment): Promise<MockTokens> {
  const { deployments, ethers } = hre;
  const { get, delete: del } = deployments as any;

  console.log("🔄 Getting or deploying permit-enabled mock tokens...");

  try {
    // Try to get already deployed tokens
    const usdcAddr = (await get("MockUSDC_Permit")).address;
    const usdtAddr = (await get("MockUSDT_Permit")).address;
    const daiAddr = (await get("MockDAI_Permit")).address;
    const wethAddr = (await get("MockWETH_Permit")).address;
    const inchAddr = (await get("MockINCH_Permit")).address;

    // Verify code exists at these addresses (network may have been reset while JSONs persisted)
    const codes = await Promise.all([
      ethers.provider.getCode(usdcAddr),
      ethers.provider.getCode(usdtAddr),
      ethers.provider.getCode(daiAddr),
      ethers.provider.getCode(wethAddr),
      ethers.provider.getCode(inchAddr),
    ]);
    const anyMissing = codes.some((c: string) => c === "0x" || c.length <= 2);
    if (anyMissing) {
      console.log("⚠️  Detected missing bytecode for some mock tokens. Cleaning and redeploying...");
      // Clean stale records to force redeploy
      await Promise.all([
        del?.("MockUSDC_Permit").catch(() => {}),
        del?.("MockUSDT_Permit").catch(() => {}),
        del?.("MockDAI_Permit").catch(() => {}),
        del?.("MockWETH_Permit").catch(() => {}),
        del?.("MockINCH_Permit").catch(() => {}),
      ]);
      throw new Error("stale-mocks");
    }

    // Bind contracts and sanity-check ABI by calling a couple of view methods
    const mockUSDC_PermitC = (await ethers.getContractAt("MockERC20Permit", usdcAddr)) as unknown as any;
    const mockUSDT_PermitC = (await ethers.getContractAt("MockERC20Permit", usdtAddr)) as unknown as any;
    const mockDAI_PermitC = (await ethers.getContractAt("MockERC20Permit", daiAddr)) as unknown as any;
    const mockWETH_PermitC = (await ethers.getContractAt("MockERC20Permit", wethAddr)) as unknown as any;
    const mockINCH_PermitC = (await ethers.getContractAt("MockERC20Permit", inchAddr)) as unknown as any;

    try {
      await Promise.all([
        mockUSDC_PermitC.name(),
        mockUSDT_PermitC.name(),
        mockDAI_PermitC.name(),
        mockWETH_PermitC.name(),
        mockINCH_PermitC.name(),
        mockUSDC_PermitC.nonces(ethers.ZeroAddress),
      ]);
    } catch {
      console.log("⚠️  Detected ABI/address mismatch for mock tokens. Cleaning and redeploying...");
      await Promise.all([
        del?.("MockUSDC_Permit").catch(() => {}),
        del?.("MockUSDT_Permit").catch(() => {}),
        del?.("MockDAI_Permit").catch(() => {}),
        del?.("MockWETH_Permit").catch(() => {}),
        del?.("MockINCH_Permit").catch(() => {}),
      ]);
      throw new Error("stale-mocks");
    }

    console.log("♻️  Reusing existing permit mock tokens");
    return {
      mockUSDC_Permit: mockUSDC_PermitC,
      mockUSDT_Permit: mockUSDT_PermitC,
      mockDAI_Permit: mockDAI_PermitC,
      mockWETH_Permit: mockWETH_PermitC,
      mockINCH_Permit: mockINCH_PermitC,
    };
  } catch {
    // If tokens don't exist, deploy them
    console.log("🆕 Deploying new permit mock tokens");
    // Force fresh deploys
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
    mintPromises.push(tokens.mockUSDC_Permit.mint(recipient, amounts.USDC));
  }

  if (amounts.USDT && amounts.USDT > 0n) {
    console.log(`  💰 Minting ${amounts.USDT} USDT`);
    mintPromises.push(tokens.mockUSDT_Permit.mint(recipient, amounts.USDT));
  }

  if (amounts.DAI && amounts.DAI > 0n) {
    console.log(`  💰 Minting ${amounts.DAI} DAI`);
    mintPromises.push(tokens.mockDAI_Permit.mint(recipient, amounts.DAI));
  }

  if (amounts.WETH && amounts.WETH > 0n) {
    console.log(`  💰 Minting ${amounts.WETH} WETH`);
    mintPromises.push(tokens.mockWETH_Permit.mint(recipient, amounts.WETH));
  }

  if (amounts.INCH && amounts.INCH > 0n) {
    console.log(`  💰 Minting ${amounts.INCH} INCH`);
    mintPromises.push(tokens.mockINCH_Permit.mint(recipient, amounts.INCH));
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
// Manual approvals removed; use EIP-2612 permits via Factory.createBalancer
