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
//       {
//         limitOrderLib: libraries.limitOrderLib,
//         stablecoinGridLib: libraries.stablecoinGridLib,
//       },
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

//   describe("Price Feed Modifications - Global Rebalancing", function () {
//     it("Should detect disbalance when all token prices change significantly", async function () {
//       console.log("🔄 Modifying all token prices...");
//       await mockPriceAggregator.setMockPrice(
//         await mockWETH.getAddress(),
//         await mockUSDC.getAddress(),
//         ethers.parseEther("3500"), // WETH price up 16.7%
//       );
//       await mockPriceAggregator.setMockPrice(
//         await mockINCH.getAddress(),
//         await mockUSDC.getAddress(),
//         ethers.parseEther("0.4"), // 1INCH price down 20%
//       );
//       await mockPriceAggregator.setMockPrice(
//         await mockUSDT.getAddress(),
//         await mockUSDC.getAddress(),
//         ethers.parseEther("0.95"), // USDT slightly down
//       );
//       await mockPriceAggregator.setMockPrice(
//         await mockDAI.getAddress(),
//         await mockUSDC.getAddress(),
//         ethers.parseEther("1.05"), // DAI slightly up
//       );

//       const triggerTx = await driftBalancer.connect(deployer).triggerRebalance();
//       const receipt = await triggerTx.wait();
//       const rebalanceEvent = receipt?.logs.find(log => (log as EventLog).eventName === "RebalanceNeeded");

//       expect(rebalanceEvent).to.not.be.undefined;
//       console.log("✅ Global rebalance needed detected due to price changes");

//       // Verify the rebalance event contains the expected data
//       if (rebalanceEvent) {
//         const parsedEvent = driftBalancer.interface.parseLog(rebalanceEvent);
//         const tokens = parsedEvent!.args[0] as string[];
//         const deviations = parsedEvent!.args[1] as bigint[];

//         expect(tokens.length).to.be.greaterThan(0);
//         expect(deviations.length).to.be.greaterThan(0);

//         // Check that deviations are significant (greater than drift percentage)
//         const driftPercentage = await driftBalancer.driftPercentage();
//         const hasSignificantDeviation = deviations.some(deviation => deviation > driftPercentage);
//         expect(hasSignificantDeviation).to.be.true;

//         console.log("✅ Rebalance event contains significant deviations");
//       }
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
//         ethers.parseEther("0.92"), // USDT down 8%
//       );
//       await mockPriceAggregator.setMockPrice(
//         await mockDAI.getAddress(),
//         await mockUSDC.getAddress(),
//         ethers.parseEther("1.09"), // DAI up 9%
//       );

//       const triggerTx = await driftBalancer.connect(deployer).triggerRebalance();
//       const receipt = await triggerTx.wait();
//       const rebalanceEvent = receipt?.logs.find(log => (log as EventLog).eventName === "RebalanceNeeded");

//       expect(rebalanceEvent).to.not.be.undefined;
//       console.log("✅ Stablecoin rebalance needed detected");
//     });
//   });

//   describe("Limit Order Creation for Rebalancing", function () {
//     it("Should create rebalance orders when portfolio is imbalanced", async function () {
//       // First, cause imbalance by changing prices
//       await mockPriceAggregator.setMockPrice(
//         await mockWETH.getAddress(),
//         await mockUSDC.getAddress(),
//         ethers.parseEther("3500"), // WETH price up significantly
//       );

//       // Trigger rebalancing to detect imbalance
//       await driftBalancer.connect(deployer).triggerRebalance();

//       // Create a rebalance order to fix the imbalance
//       const sellToken = await mockWETH.getAddress();
//       const buyToken = await mockUSDC.getAddress();
//       const sellAmount = ethers.parseEther("1");
//       const buyAmount = ethers.parseUnits("3000", 6);
//       const slippageTolerance = 200; // 2%

//       const tx = await driftBalancer.connect(deployer).createRebalanceOrder(
//         sellToken,
//         buyToken,
//         sellAmount,
//         buyAmount,
//         slippageTolerance
//       );

//       const receipt = await tx.wait();
//       const orderEvent = receipt?.logs.find(
//         (log): log is EventLog => (log as EventLog).eventName === "RebalanceOrderCreated"
//       );

//       expect(orderEvent).to.not.be.undefined;
//       console.log("✅ Rebalance order created for price-based imbalance");

//       if (orderEvent) {
//         const parsedEvent = driftBalancer.interface.parseLog(orderEvent);
//         const orderHash = parsedEvent!.args[0] as string;
//         const maker = parsedEvent!.args[1] as string;
//         const sellTokenEvent = parsedEvent!.args[2] as string;
//         const buyTokenEvent = parsedEvent!.args[3] as string;
//         const sellAmountEvent = parsedEvent!.args[4] as bigint;
//         const buyAmountEvent = parsedEvent!.args[5] as bigint;
//         const slippageToleranceEvent = parsedEvent!.args[6] as bigint;

//         expect(orderHash).to.not.equal(ethers.ZeroHash);
//         expect(maker).to.equal(await driftBalancer.getAddress());
//         expect(sellTokenEvent).to.equal(sellToken);
//         expect(buyTokenEvent).to.equal(buyToken);
//         expect(sellAmountEvent).to.equal(sellAmount);
//         expect(buyAmountEvent).to.equal(buyAmount);
//         expect(slippageToleranceEvent).to.equal(slippageTolerance);
//         console.log("✅ Order event contains all correct parameters");
//       }
//     });

//     it("Should create multiple orders for complex rebalancing scenarios", async function () {
//       // Create multiple price changes to cause complex imbalance
//       await mockPriceAggregator.setMockPrice(
//         await mockWETH.getAddress(),
//         await mockUSDC.getAddress(),
//         ethers.parseEther("4000"), // WETH up 33%
//       );
//       await mockPriceAggregator.setMockPrice(
//         await mockINCH.getAddress(),
//         await mockUSDC.getAddress(),
//         ethers.parseEther("0.3"), // 1INCH down 40%
//       );

//       // Create multiple rebalance orders
//       const orders = [
//         {
//           sellToken: await mockWETH.getAddress(),
//           buyToken: await mockUSDC.getAddress(),
//           sellAmount: ethers.parseEther("1"),
//           buyAmount: ethers.parseUnits("3500", 6),
//           slippageTolerance: 150
//         },
//         {
//           sellToken: await mockUSDC.getAddress(),
//           buyToken: await mockINCH.getAddress(),
//           sellAmount: ethers.parseUnits("1000", 6),
//           buyAmount: ethers.parseEther("3000"),
//           slippageTolerance: 200
//         }
//       ];

//       for (const order of orders) {
//         const tx = await driftBalancer.connect(deployer).createRebalanceOrder(
//           order.sellToken,
//           order.buyToken,
//           order.sellAmount,
//           order.buyAmount,
//           order.slippageTolerance
//         );

//         const receipt = await tx.wait();
//         const orderEvent = receipt?.logs.find(
//           (log): log is EventLog => (log as EventLog).eventName === "RebalanceOrderCreated"
//         );

//         expect(orderEvent).to.not.be.undefined;
//       }

//       console.log("✅ Multiple rebalance orders created for complex scenario");
//     });
//   });

//   describe("Stablecoin Grid Trading - Price-Based", function () {
//     it("Should create stablecoin grid orders when prices deviate", async function () {
//       // Modify stablecoin prices to cause deviation
//       await mockPriceAggregator.setMockPrice(
//         await mockUSDT.getAddress(),
//         await mockUSDC.getAddress(),
//         ethers.parseEther("0.98"), // USDT slightly down
//       );
//       await mockPriceAggregator.setMockPrice(
//         await mockDAI.getAddress(),
//         await mockUSDC.getAddress(),
//         ethers.parseEther("1.02"), // DAI slightly up
//       );

//       // Create grid orders for stablecoin pairs
//       const gridOrders = [
//         {
//           fromToken: await mockUSDC.getAddress(),
//           toToken: await mockUSDT.getAddress(),
//           amount: ethers.parseUnits("1000", 6),
//           limitPrice: ethers.parseUnits("0.99", 18) // Slightly below market
//         },
//         {
//           fromToken: await mockUSDT.getAddress(),
//           toToken: await mockDAI.getAddress(),
//           amount: ethers.parseUnits("1000", 6),
//           limitPrice: ethers.parseUnits("1.01", 18) // Slightly above market
//         }
//       ];

//       for (const gridOrder of gridOrders) {
//         const tx = await driftBalancer.connect(deployer).createStablecoinGridOrder(
//           gridOrder.fromToken,
//           gridOrder.toToken,
//           gridOrder.amount,
//           gridOrder.limitPrice
//         );

//         const receipt = await tx.wait();
//         const orderEvent = receipt?.logs.find(
//           (log): log is EventLog => (log as EventLog).eventName === "LimitOrderCreated"
//         );

//         expect(orderEvent).to.not.be.undefined;
//       }

//       console.log("✅ Stablecoin grid orders created for price deviations");
//     });
//   });
// });
