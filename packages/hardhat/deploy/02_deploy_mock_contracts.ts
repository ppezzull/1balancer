import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployMockContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  
  console.log("🚀 Deploying mock contracts on Base fork...");
  console.log("Deployer:", deployer);

  // Base mainnet addresses for actual tokens (we'll use these addresses in our mock)
  const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const USDT = "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2";
  const DAI = "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb";
  const WETH = "0x4200000000000000000000000000000000000006";
  const INCH = "0xc5fecC3a29Fb57B5024eEc8a2239d4621e111CBE";

  // Deploy MockSpotPriceAggregator
  const mockPriceAggregator = await deploy("MockSpotPriceAggregator", {
    from: deployer,
    args: [deployer],
    log: true,
    autoMine: true,
  });

  console.log("✅ MockSpotPriceAggregator deployed to:", mockPriceAggregator.address);

  // Deploy ModularBalancerFactory with mock price aggregator
  const balancerFactory = await deploy("ModularBalancerFactory", {
    from: deployer,
    args: [mockPriceAggregator.address, [USDC, USDT, DAI]],
    log: true,
    autoMine: true,
  });

  console.log("✅ ModularBalancerFactory deployed to:", balancerFactory.address);

  // Get the deployed contracts
  const mockAggregator = await ethers.getContractAt("MockSpotPriceAggregator", mockPriceAggregator.address);
  
  // Set up prices for the actual Base tokens
  console.log("🔧 Setting up prices for Base mainnet tokens...");
  
  // Set prices for the real token addresses on Base
  await mockAggregator.setMockPrice(WETH, USDC, ethers.parseEther("3000"));
  await mockAggregator.setMockPrice(USDC, WETH, "333333333333333");
  await mockAggregator.setMockPrice(INCH, USDC, ethers.parseEther("0.5"));
  await mockAggregator.setMockPrice(USDC, INCH, ethers.parseEther("2"));
  
  await mockAggregator.setMockEthPrice(WETH, ethers.parseEther("1"));
  await mockAggregator.setMockEthPrice(USDC, ethers.parseEther("0.001"));
  await mockAggregator.setMockEthPrice(USDT, ethers.parseEther("0.001"));
  await mockAggregator.setMockEthPrice(DAI, ethers.parseEther("0.001"));
  await mockAggregator.setMockEthPrice(INCH, ethers.parseEther("0.0005"));

  console.log("✅ All prices configured for Base mainnet tokens");
  
  // Verify configuration
  const usdcToUsdt = await mockAggregator.getRate(USDC, USDT, false);
  const wethToUsdc = await mockAggregator.getRate(WETH, USDC, false);
  const inchToUsdc = await mockAggregator.getRate(INCH, USDC, false);
  
  console.log("📊 Price verification:");
  console.log("USDC/USDT:", ethers.formatEther(usdcToUsdt));
  console.log("WETH/USDC:", ethers.formatEther(wethToUsdc));
  console.log("1INCH/USDC:", ethers.formatEther(inchToUsdc));

  return true;
};

export default deployMockContracts;
deployMockContracts.tags = ["MockContracts", "MockSpotPriceAggregator", "ModularBalancerFactory"];
deployMockContracts.id = "deploy_mock_contracts_modular";
