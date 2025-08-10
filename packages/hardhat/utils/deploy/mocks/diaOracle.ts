import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "hardhat";
import type { OracleAdapter, DiaPushOracleReceiverMock, MockERC20 } from "../../../typechain-types";
import { MockTokens } from "./tokens";

export interface DiaOracleConfig {
  adapter: OracleAdapter;
  dia: DiaPushOracleReceiverMock;
}

export async function deployDiaPushOracleReceiverMock(
  hre: HardhatRuntimeEnvironment,
): Promise<DiaPushOracleReceiverMock> {
  const { deployments, getNamedAccounts, ethers: hhEthers } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("DiaPushOracleReceiverMock", {
    from: deployer,
    args: [],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  const dia = (await hhEthers.getContractAt(
    "DiaPushOracleReceiverMock",
    (await get("DiaPushOracleReceiverMock")).address,
  )) as unknown as DiaPushOracleReceiverMock;

  console.log(`utils/dia: DiaPushOracleReceiverMock=${await dia.getAddress()}`);
  return dia;
}

export async function deployOracleAdapter(
  hre: HardhatRuntimeEnvironment,
  dia: DiaPushOracleReceiverMock,
  ethUsdKey = "ETH/USD",
): Promise<OracleAdapter> {
  const { deployments, getNamedAccounts, ethers: hhEthers } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("OracleAdapter", {
    from: deployer,
    args: [await dia.getAddress(), ethUsdKey],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  const adapter = (await hhEthers.getContractAt(
    "OracleAdapter",
    (await get("OracleAdapter")).address,
  )) as unknown as OracleAdapter;

  console.log(`utils/dia: OracleAdapter=${await adapter.getAddress()}`);
  return adapter;
}

export async function getOrDeployDiaOracle(hre: HardhatRuntimeEnvironment): Promise<DiaOracleConfig> {
  try {
    const adapter = (await ethers.getContract("OracleAdapter")) as unknown as OracleAdapter;
    const dia = (await ethers.getContract("DiaPushOracleReceiverMock")) as unknown as DiaPushOracleReceiverMock;
    console.log("utils/dia: reuse");
    return { adapter, dia };
  } catch {
    const dia = await deployDiaPushOracleReceiverMock(hre);
    const adapter = await deployOracleAdapter(hre, dia);
    return { adapter, dia };
  }
}

export async function configureDiaPrices(dia: DiaPushOracleReceiverMock, tokens: MockTokens): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const set = async (key: string, price: bigint) => {
    await dia.setMockUpdate(key, BigInt(now), price);
  };

  // Use tokens parameter to drive availability; seeds USD keys used by adapter wiring
  await tokens.mockWETH.getAddress();
  await tokens.mockUSDC.getAddress();
  await tokens.mockUSDT.getAddress();
  await tokens.mockDAI.getAddress();
  await tokens.mockINCH.getAddress();

  await set("ETH/USD", ethers.parseUnits("3000", 18));
  await set("USDC/USD", ethers.parseUnits("1", 18));
  await set("USDT/USD", ethers.parseUnits("1", 18));
  await set("DAI/USD", ethers.parseUnits("1", 18));
  await set("INCH/USD", ethers.parseUnits("0.5", 18));
}

export async function wireAdapterKeys(adapter: OracleAdapter, tokens: MockTokens): Promise<void> {
  const setKey = async (token: MockERC20, key: string) => {
    await adapter.setTokenUsdKey(await token.getAddress(), key);
  };
  await adapter.setEthUsdKey("ETH/USD");

  await setKey(tokens.mockWETH, "ETH/USD");
  await setKey(tokens.mockUSDC, "USDC/USD");
  await setKey(tokens.mockUSDT, "USDT/USD");
  await setKey(tokens.mockDAI, "DAI/USD");
  await setKey(tokens.mockINCH, "INCH/USD");

  console.log("utils/dia: adapter keys wired");
}
