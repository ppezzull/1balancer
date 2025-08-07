// import { expect } from "chai";
// import hre, { ethers } from "hardhat";
// import { Signer, EventLog } from "ethers";
// import { deployLibraries } from "../../utils/deploy/libs";
// import {
//   getOrDeployMockTokens,
//   getOrDeploySpotPriceAggregator,
//   getOrDeployLimitOrderProtocol,
//   configureSpotPrices
// } from "../../utils/deploy/mocks/index";
// import { deployOptimizedBalancerFactory } from "../../utils/deploy/factory";
// import {
//   MockERC20,
//   OptimizedBalancerFactory,
//   MockSpotPriceAggregator,
//   OptimizedDriftBalancer,
// } from "../../typechain-types";

// describe("Drift Balancer Price Feed Tests", function () {
//   let deployer: Signer;

//   // Contracts
//   let optimizedBalancerFactory: OptimizedBalancerFactory;
//   let mockPriceAggregator: MockSpotPriceAggregator;
//   let driftBalancer: OptimizedDriftBalancer;

//   // Mock Tokens
//   let mockUSDC: MockERC20;
//   let mockUSDT: MockERC20;
//   let mockDAI: MockERC20;
//   let mockWETH: MockERC20;
//   let mockINCH: MockERC20;

//   // Test setup
//   const assetAddresses = async () => [
//     await mockUSDC.getAddress(),
//     await mockWETH.getAddress(),
//     await mockINCH.getAddress(),
//     await mockUSDT.getAddress(),
//     await mockDAI.getAddress(),
//   ];
//   const assetPercentages = [BigInt(2500), BigInt(2500), BigInt(2500), BigInt(1250), BigInt(1250)];
//   const driftAmounts = [
//     ethers.parseUnits("5000", 6),
//     ethers.parseEther("5"),
//     ethers.parseEther("3000"),
//     ethers.parseUnits("2500", 6),
//     ethers.parseEther("3750"),
//   ];

//   beforeEach(async function () {
//     [deployer] = await ethers.getSigners();

//     console.log("🚀 Deploying test environment...");

//     // Deploy libraries
//     const libraries = await deployLibraries(hre);

//     // Deploy or get mock tokens
//     const tokens = await getOrDeployMockTokens(hre);

//     // Deploy or get mock protocols
//     const mockPriceAggregatorInstance = await getOrDeploySpotPriceAggregator(hre);
//     const mockLimitOrderProtocol = await getOrDeployLimitOrderProtocol(hre);

//     mockUSDC = tokens.mockUSDC;
//     mockUSDT = tokens.mockUSDT;
//     mockDAI = tokens.mockDAI;
//     mockWETH = tokens.mockWETH;
//     mockINCH = tokens.mockINCH;
//     mockPriceAggregator = mockPriceAggregatorInstance;

//     // Configure spot prices
//     await configureSpotPrices(mockPriceAggregator, tokens);

//     // Deploy factory with stablecoin addresses
//     const stablecoinAddresses = [
//       await mockUSDC.getAddress(),
//       await mockUSDT.getAddress(),
//       await mockDAI.getAddress(),
//     ];

//     optimizedBalancerFactory = await deployOptimizedBalancerFactory(
//       hre,
//       libraries,
//       { mockPriceAggregator, mockLimitOrderProtocol },
//       stablecoinAddresses
//     );

//     // Mint and approve tokens for the factory
//     for (let i = 0; i < (await assetAddresses()).length; i++) {
//       const token = (await ethers.getContractAt("MockERC20", (await assetAddresses())[i])) as unknown as MockERC20;
//       await token.mint(await deployer.getAddress(), driftAmounts[i]);
//       await token.connect(deployer).approve(await optimizedBalancerFactory.getAddress(), driftAmounts[i]);
//     }

//     console.log("✅ Test environment deployed and configured.");

//     const tx = await optimizedBalancerFactory.createDriftBalancer(
//       await assetAddresses(),
//       assetPercentages,
//       driftAmounts,
//       200, // 2% drift
//     );
//     const receipt = await tx.wait();
//     const createdEvent = receipt?.logs.find(
//       (log): log is EventLog => (log as EventLog).eventName === "BalancerCreated",
//     ) as EventLog;
//     const parsedEvent = optimizedBalancerFactory.interface.parseLog(createdEvent);
//     const balancerAddress = parsedEvent!.args[1];
//     driftBalancer = (await ethers.getContractAt("OptimizedDriftBalancer", balancerAddress)) as unknown as OptimizedDriftBalancer;
//   });

//   it("Should create a drift balancer and verify initial portfolio is balanced", async function () {
//     const triggerTx = await driftBalancer.connect(deployer).triggerRebalance();
//     const receipt = await triggerTx.wait();
//     const rebalanceEvent = receipt?.logs.find(log => (log as EventLog).eventName === "RebalanceNeeded");
//     expect(rebalanceEvent).to.be.undefined;
//     console.log("✅ Initial portfolio confirmed to be balanced");
//   });

//   describe("Price Feed Modifications", function () {
//     it("Should detect disbalance when all token prices change significantly", async function () {
//       console.log("🔄 Modifying all token prices...");
//       await mockPriceAggregator.setMockPrice(
//         await mockWETH.getAddress(),
//         await mockUSDC.getAddress(),
//         ethers.parseEther("3500"),
//       );
//       await mockPriceAggregator.setMockPrice(
//         await mockINCH.getAddress(),
//         await mockUSDC.getAddress(),
//         ethers.parseEther("0.4"),
//       );
//       await mockPriceAggregator.setMockPrice(
//         await mockUSDT.getAddress(),
//         await mockUSDC.getAddress(),
//         ethers.parseEther("0.95"),
//       );
//       await mockPriceAggregator.setMockPrice(
//         await mockDAI.getAddress(),
//         await mockUSDC.getAddress(),
//         ethers.parseEther("1.05"),
//       );

//       const triggerTx = await driftBalancer.connect(deployer).triggerRebalance();
//       const receipt = await triggerTx.wait();
//       const rebalanceEvent = receipt?.logs.find(log => (log as EventLog).eventName === "RebalanceNeeded");

//       expect(rebalanceEvent).to.not.be.undefined;
//       console.log("✅ Rebalance needed detected.");
//     });

//     it("Should reset prices to normal and verify balance", async function () {
//       await configureSpotPrices(mockPriceAggregator, {
//         mockUSDC,
//         mockUSDT,
//         mockDAI,
//         mockWETH,
//         mockINCH,
//       }); // Reset prices
//       console.log("🔄 Reset all prices to initial values");

//       const triggerTx = await driftBalancer.connect(deployer).triggerRebalance();
//       const receipt = await triggerTx.wait();
//       const rebalanceEvent = receipt?.logs.find(log => (log as EventLog).eventName === "RebalanceNeeded");
//       expect(rebalanceEvent).to.be.undefined;
//       console.log("✅ Portfolio is balanced again after price reset");
//     });

//     it("Should detect disbalance when only stablecoin prices change", async function () {
//       console.log("🔄 Modifying only stablecoin prices...");
//       await mockPriceAggregator.setMockPrice(
//         await mockUSDT.getAddress(),
//         await mockUSDC.getAddress(),
//         ethers.parseEther("0.92"),
//       );
//       await mockPriceAggregator.setMockPrice(
//         await mockDAI.getAddress(),
//         await mockUSDC.getAddress(),
//         ethers.parseEther("1.09"),
//       );

//       const triggerTx = await driftBalancer.connect(deployer).triggerRebalance();
//       const receipt = await triggerTx.wait();
//       const rebalanceEvent = receipt?.logs.find(log => (log as EventLog).eventName === "RebalanceNeeded");

//       expect(rebalanceEvent).to.not.be.undefined;
//       console.log("✅ Stablecoin rebalance needed detected");
//     });
//   });
// });
