import { HardhatRuntimeEnvironment } from "hardhat/types";
import { OptimizedBalancerFactory, MockSpotPriceAggregator, MockLimitOrderProtocol } from "../../typechain-types";

export async function deployOptimizedBalancerFactory(
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
): Promise<OptimizedBalancerFactory> {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // single-line output per request

  const factoryDeployment = await deploy("OptimizedBalancerFactory", {
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
    "OptimizedBalancerFactory",
    factoryDeployment.address,
  )) as unknown as OptimizedBalancerFactory;

  const addr = await optimizedBalancerFactory.getAddress();
  console.log(`utils/factory: OptimizedBalancerFactory=${addr} Stablecoins=${JSON.stringify(stablecoinAddresses)}`);

  return optimizedBalancerFactory;
}
