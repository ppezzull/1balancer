import { HardhatRuntimeEnvironment } from "hardhat/types";
import type { BalancerFactory, MockSpotPriceAggregator, MockLimitOrderProtocol } from "../../typechain-types";

export async function deployBalancerFactory(
  hre: HardhatRuntimeEnvironment,
  _libraries: {
    // kept for backward compat; no linking needed here anymore
    limitOrderLib: any;
    stablecoinGridLib: any;
  },
  mocks: {
    mockPriceAggregator: MockSpotPriceAggregator;
    mockLimitOrderProtocol: MockLimitOrderProtocol;
  },
  stablecoinAddresses: string[],
): Promise<BalancerFactory> {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // single-line output per request

  const factoryDeployment = await deploy("BalancerFactory", {
    from: deployer,
    args: [
      await mocks.mockPriceAggregator.getAddress(),
      stablecoinAddresses,
      await mocks.mockLimitOrderProtocol.getAddress(),
    ],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  const optimizedBalancerFactory = (await ethers.getContractAt(
    "BalancerFactory",
    factoryDeployment.address,
  )) as unknown as BalancerFactory;

  const addr = await optimizedBalancerFactory.getAddress();
  console.log(`utils/factory: BalancerFactory=${addr} Stablecoins=${JSON.stringify(stablecoinAddresses)}`);

  return optimizedBalancerFactory;
}
