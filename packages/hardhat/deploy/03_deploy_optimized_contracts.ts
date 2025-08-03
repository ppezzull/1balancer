import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { TOKEN_ADDRESSES } from "../scripts/deploymentUtils";

const deployOptimizedContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  console.log("🚀 Deploying optimized contracts on Base fork...");
  console.log("Deployer:", deployer);

  // Get token addresses from the utility file
  const { USDC, USDT, DAI, WETH, INCH } = TOKEN_ADDRESSES;

  // Set high gas limit for all deployments
  const gasLimit = 100000000;

  // Deploy MockSpotPriceAggregator
  const mockPriceAggregator = await deploy("MockSpotPriceAggregator", {
    from: deployer,
    args: [deployer],
    log: true,
    autoMine: true,
    // always redeploy on localhost
    skipIfAlreadyDeployed: false,
    gasLimit: gasLimit,
  });

  console.log("✅ MockSpotPriceAggregator deployed to:", mockPriceAggregator.address);

  // Deploy MockLimitOrderProtocol
  const mockLimitOrderProtocolDeployment = await deploy("MockLimitOrderProtocol", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: false,
    gasLimit: gasLimit,
  });

  console.log("✅ MockLimitOrderProtocol deployed to:", mockLimitOrderProtocolDeployment.address);

  // Get deployed contract addresses
  const mockPriceAggregatorAddress = (await deployments.get("MockSpotPriceAggregator")).address;
  const mockLimitOrderProtocolAddress = (await deployments.get("MockLimitOrderProtocol")).address;

  console.log("🔧 Using MockSpotPriceAggregator at:", mockPriceAggregatorAddress);
  console.log("🔧 Using MockLimitOrderProtocol at:", mockLimitOrderProtocolAddress);

  // Get references to the deployed libraries
  console.log("📚 Getting library references...");
  
  let limitOrderLibAddress;
  let stablecoinGridLibAddress;
  let portfolioAnalysisLibAddress;
  
  try {
    const limitOrderLibDeployment = await deployments.get("LimitOrderLib");
    limitOrderLibAddress = limitOrderLibDeployment.address;
    console.log("✅ Using LimitOrderLib at:", limitOrderLibAddress);
    
    const stablecoinGridLibDeployment = await deployments.get("StablecoinGridLib");
    stablecoinGridLibAddress = stablecoinGridLibDeployment.address;
    console.log("✅ Using StablecoinGridLib at:", stablecoinGridLibAddress);
    
    const portfolioAnalysisLibDeployment = await deployments.get("PortfolioAnalysisLib");
    portfolioAnalysisLibAddress = portfolioAnalysisLibDeployment.address;
    console.log("✅ Using PortfolioAnalysisLib at:", portfolioAnalysisLibAddress);
  } catch (error) {
    console.error("❌ Error retrieving libraries:", error);
    console.error("Make sure to deploy libraries first with: npx hardhat deploy --tags Libraries");
    throw new Error("Required libraries not found. Please deploy libraries first.");
  }

  // Deploy OptimizedBalancerFactory with libraries linked
  const optimizedBalancerFactory = await deploy("OptimizedBalancerFactory", {
    from: deployer,
    args: [mockPriceAggregatorAddress, [USDC, USDT, DAI], mockLimitOrderProtocolAddress],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: false,
    libraries: {
      LimitOrderLib: limitOrderLibAddress,
      StablecoinGridLib: stablecoinGridLibAddress,
      PortfolioAnalysisLib: portfolioAnalysisLibAddress,
    },
    gasLimit: gasLimit,
  });

  console.log("✅ OptimizedBalancerFactory deployed to:", optimizedBalancerFactory.address);

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

export default deployOptimizedContracts;
deployOptimizedContracts.tags = ["OptimizedContracts"];
deployOptimizedContracts.id = "deploy_optimized_contracts";
