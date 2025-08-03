import { expect } from "chai";
import { ethers } from "hardhat";

describe("Library Deployment Test", function () {
  let limitOrderLib: any;
  let stablecoinGridLib: any;
  let optimizedBalancerFactory: any;
  let deployer: any;

  before(async () => {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    console.log("🚀 Deploying libraries...");
    
    // Deploy libraries first
    const LimitOrderLib = await ethers.getContractFactory("LimitOrderLib");
    limitOrderLib = await LimitOrderLib.deploy();
    await limitOrderLib.waitForDeployment();
    console.log("✅ LimitOrderLib deployed to:", await limitOrderLib.getAddress());
    
    const StablecoinGridLib = await ethers.getContractFactory("StablecoinGridLib");
    stablecoinGridLib = await StablecoinGridLib.deploy();
    await stablecoinGridLib.waitForDeployment();
    console.log("✅ StablecoinGridLib deployed to:", await stablecoinGridLib.getAddress());
    
    // Deploy mock contracts
    const MockSpotPriceAggregator = await ethers.getContractFactory("contracts/portfolio/mocks/MockSpotPriceAggregator.sol:MockSpotPriceAggregator");
    const mockPriceAggregator = await MockSpotPriceAggregator.deploy(await deployer.getAddress());
    await mockPriceAggregator.waitForDeployment();
    
    const MockLimitOrderProtocol = await ethers.getContractFactory("contracts/portfolio/mocks/MockLimitOrderProtocol.sol:MockLimitOrderProtocol");
    const mockLimitOrderProtocol = await MockLimitOrderProtocol.deploy();
    await mockLimitOrderProtocol.waitForDeployment();
    
    // Deploy OptimizedBalancerFactory with library linking
    const OptimizedBalancerFactory = await ethers.getContractFactory("OptimizedBalancerFactory", {
      libraries: {
        LimitOrderLib: await limitOrderLib.getAddress(),
        StablecoinGridLib: await stablecoinGridLib.getAddress(),
      }
    });
    
    const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    const USDT = "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2";
    const DAI = "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb";
    
    optimizedBalancerFactory = await OptimizedBalancerFactory.deploy(
      await mockPriceAggregator.getAddress(),
      [USDC, USDT, DAI],
      await mockLimitOrderProtocol.getAddress()
    );
    await optimizedBalancerFactory.waitForDeployment();
    
    console.log("✅ OptimizedBalancerFactory deployed to:", await optimizedBalancerFactory.getAddress());
  });

  it("Should deploy libraries and factory successfully", async function () {
    expect(await limitOrderLib.getAddress()).to.not.equal(ethers.ZeroAddress);
    expect(await stablecoinGridLib.getAddress()).to.not.equal(ethers.ZeroAddress);
    expect(await optimizedBalancerFactory.getAddress()).to.not.equal(ethers.ZeroAddress);
    
    console.log("✅ All contracts deployed successfully with library linking");
  });
});
