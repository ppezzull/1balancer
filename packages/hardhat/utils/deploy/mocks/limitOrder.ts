import { HardhatRuntimeEnvironment } from "hardhat/types";
import { MockLimitOrderProtocol } from "../../../typechain-types";

export async function deployLimitOrderProtocol(hre: HardhatRuntimeEnvironment): Promise<MockLimitOrderProtocol> {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("🔧 Deploying MockLimitOrderProtocol...");

  await deploy("MockLimitOrderProtocol", {
    from: deployer,
    args: [],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  const mockLimitOrderProtocol = (await ethers.getContractAt(
    "MockLimitOrderProtocol",
    (await get("MockLimitOrderProtocol")).address,
  )) as unknown as MockLimitOrderProtocol;

  console.log("✅ MockLimitOrderProtocol deployed to:", await mockLimitOrderProtocol.getAddress());

  return mockLimitOrderProtocol;
}

export async function getOrDeployLimitOrderProtocol(hre: HardhatRuntimeEnvironment): Promise<MockLimitOrderProtocol> {
  const { deployments } = hre;
  const { get } = deployments;
  const { ethers } = hre;

  console.log("🔄 Getting or deploying limit order protocol...");

  try {
    // Try to get already deployed protocol
    const mockLimitOrderProtocol = (await ethers.getContractAt(
      "MockLimitOrderProtocol",
      (await get("MockLimitOrderProtocol")).address,
    )) as unknown as MockLimitOrderProtocol;

    console.log("♻️  Reusing existing MockLimitOrderProtocol");
    return mockLimitOrderProtocol;
  } catch {
    // If protocol doesn't exist, deploy it
    console.log("🆕 Deploying new MockLimitOrderProtocol");
    return await deployLimitOrderProtocol(hre);
  }
}
