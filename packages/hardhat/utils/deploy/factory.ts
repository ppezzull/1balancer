import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  OptimizedBalancerFactory,
  LimitOrderLib,
  StablecoinGridLib,
  MockSpotPriceAggregator,
  MockLimitOrderProtocol,
} from "../../typechain-types";

export async function deployOptimizedBalancerFactory(
  hre: HardhatRuntimeEnvironment,
  libraries: {
    limitOrderLib: LimitOrderLib;
    stablecoinGridLib: StablecoinGridLib;
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

  console.log("🏭 Deploying OptimizedBalancerFactory...");
  console.log("Stablecoins:", stablecoinAddresses);

  const factoryDeployment = await deploy("OptimizedBalancerFactory", {
    from: deployer,
    args: [
      await mocks.mockPriceAggregator.getAddress(),
      stablecoinAddresses,
      await mocks.mockLimitOrderProtocol.getAddress(),
    ],
    libraries: {
      LimitOrderLib: await libraries.limitOrderLib.getAddress(),
      StablecoinGridLib: await libraries.stablecoinGridLib.getAddress(),
    },
    log: true,
    skipIfAlreadyDeployed: true,
  });

  const optimizedBalancerFactory = (await ethers.getContractAt(
    "OptimizedBalancerFactory",
    factoryDeployment.address,
  )) as unknown as OptimizedBalancerFactory;

  console.log("✅ OptimizedBalancerFactory deployed to:", await optimizedBalancerFactory.getAddress());

  return optimizedBalancerFactory;
}
