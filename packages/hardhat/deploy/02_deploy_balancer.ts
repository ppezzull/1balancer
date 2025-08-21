import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { getOrDeployMockTokens, mintTestTokens } from "../utils/deploy/mocks/tokens";
import { deployBalancerFactory } from "../utils";
import { buildPermit } from "../utils/deploy/mocks/permits";

// Deploy a Balancer funded with mock tokens using the Factory.
const deployBalancer: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  // Runs by default to create one example Balancer with mocks

  // 1) Ensure Factory is deployed
  const { instance: factory } = await deployBalancerFactory(hre);

  // 2) Ensure mocks exist
  const mocks = await getOrDeployMockTokens(hre);

  // 3) Mint test balances to deployer
  const e6 = 10n ** 6n;
  const e18 = 10n ** 18n;
  await mintTestTokens(mocks, deployer, {
    USDC: 50_000n * e6,
    USDT: 50_000n * e6,
    DAI: 100_000n * e18,
    WETH: 100n * e18,
    INCH: 1_000_000n * e18,
  });

  // 4) Choose targets and deposit amounts

  const targetPercBps = [3000, 2500, 2000, 1500, 1000]; // sums to 10000
  const depositAmounts = [
    10_000n * e6, // USDC
    5_000n * e6, // USDT
    10_000n * e18, // DAI
    2n * e18, // WETH
    50_000n * e18, // INCH
  ];

  // 5) Build EIP-2612 permits for each asset using the permit-enabled mocks
  // Prefer the *_Permit tokens where available to demonstrate permit flow end-to-end
  const pUSDC = mocks.mockUSDC_Permit;
  const pUSDT = mocks.mockUSDT_Permit;
  const pDAI = mocks.mockDAI_Permit;
  const pWETH = mocks.mockWETH_Permit;
  const pINCH = mocks.mockINCH_Permit;

  const assetsWithPermit = [
    await pUSDC.getAddress(),
    await pUSDT.getAddress(),
    await pDAI.getAddress(),
    await pWETH.getAddress(),
    await pINCH.getAddress(),
  ];

  const factoryAddress = await factory.getAddress();
  const permits = [] as any[];
  for (let i = 0; i < assetsWithPermit.length; i++) {
    const tokenAddress = assetsWithPermit[i];
    const amount = depositAmounts[i];
    if (amount === 0n) {
      permits.push({ token: tokenAddress, value: 0n, deadline: 0n, v: 0, r: "0x" as const, s: "0x" as const });
      continue;
    }
    const permit = await buildPermit(hre, {
      tokenAddress,
      owner: deployer,
      spender: factoryAddress,
      value: amount,
    });
    permits.push(permit);
  }

  // 6) Create Balancer with initial deposits via Factory
  // 6) Create Balancer with initial deposits via Factory using permits
  const tx = await (factory as any).createBalancer(
    assetsWithPermit,
    targetPercBps,
    depositAmounts.map(d => BigInt(d.toString())),
    permits,
  );
  await tx.wait();

  // 7) Resolve created Balancer address from user list
  const userBalancers = await factory.getUserBalancers(deployer);
  const balancerAddr = userBalancers[userBalancers.length - 1];
  console.log("✅ Balancer created:", balancerAddr);
};

export default deployBalancer;
deployBalancer.tags = ["Balancer"];
