// import { expect } from "chai";
// import hre, { ethers } from "hardhat";
// import { Signer, EventLog } from "ethers";
// import {
//   OptimizedBalancerFactory,
//   MockERC20,
//   OptimizedDriftBalancer,
//   OptimizedTimeBalancer,
// } from "../../typechain-types";
// import { deployLibraries } from "../../utils/deploy/libs";
// import {
//   getOrDeployMockTokens,
//   getOrDeploySpotPriceAggregator,
//   getOrDeployLimitOrderProtocol,
//   configureSpotPrices
// } from "../../utils/deploy/mocks/index";
// import { deployOptimizedBalancerFactory } from "../../utils/deploy/factory";

// async function setup() {
//   const [deployer, user] = await ethers.getSigners();

//   // Deploy libraries
//   const libraries = await deployLibraries(hre);

//   // Deploy or get mock tokens
//   const tokens = await getOrDeployMockTokens(hre);

//   // Deploy or get mock protocols
//   const mockPriceAggregator = await getOrDeploySpotPriceAggregator(hre);
//   const mockLimitOrderProtocol = await getOrDeployLimitOrderProtocol(hre);

//   // Configure spot prices
//   await configureSpotPrices(mockPriceAggregator, tokens);

//   // Deploy factory with stablecoin addresses
//   const stablecoinAddresses = [
//     await tokens.mockUSDC.getAddress(),
//     await tokens.mockUSDT.getAddress(),
//     await tokens.mockDAI.getAddress(),
//   ];

//   const optimizedBalancerFactory = await deployOptimizedBalancerFactory(
//     hre,
//     {
//       limitOrderLib: libraries.limitOrderLib,
//       stablecoinGridLib: libraries.stablecoinGridLib,
//     },
//     { mockPriceAggregator, mockLimitOrderProtocol },
//     stablecoinAddresses
//   );

//   return {
//     deployer,
//     user,
//     optimizedBalancerFactory,
//     mockPriceAggregator,
//     mockLimitOrderProtocol,
//     ...tokens,
//   };
// }

// describe("Balancer Disbalance Tests", function () {
//   let deployer: Signer;

//   // Contracts
//   let optimizedBalancerFactory: OptimizedBalancerFactory;
//   let driftBalancer: OptimizedDriftBalancer;
//   let timeBalancer: OptimizedTimeBalancer;

//   // Mock Tokens
//   let mockUSDC: MockERC20;
//   let mockUSDT: MockERC20;
//   let mockWETH: MockERC20;
//   let mockINCH: MockERC20;

//   beforeEach(async function () {
//     const setupData = await setup();
//     deployer = setupData.deployer;
//     optimizedBalancerFactory = setupData.optimizedBalancerFactory;
//     mockUSDC = setupData.mockUSDC;
//     mockUSDT = setupData.mockUSDT;
//     mockWETH = setupData.mockWETH;
//     mockINCH = setupData.mockINCH;

//     const deployerAddress = await deployer.getAddress();

//     // Create Drift Balancer
//     const driftAssetAddresses = [await mockUSDC.getAddress(), await mockWETH.getAddress(), await mockINCH.getAddress()];
//     const driftPercentages = [40, 40, 20].map(p => BigInt(p));
//     const driftAmounts = [ethers.parseUnits("4000", 6), ethers.parseEther("4"), ethers.parseEther("4000")];

//     // Fund deployer
//     await mockUSDC.mint(deployerAddress, driftAmounts[0]);
//     await mockWETH.mint(deployerAddress, driftAmounts[1]);
//     await mockINCH.mint(deployerAddress, driftAmounts[2]);

//     // Approve factory to spend tokens
//     await mockUSDC.connect(deployer).approve(await optimizedBalancerFactory.getAddress(), driftAmounts[0]);
//     await mockWETH.connect(deployer).approve(await optimizedBalancerFactory.getAddress(), driftAmounts[1]);
//     await mockINCH.connect(deployer).approve(await optimizedBalancerFactory.getAddress(), driftAmounts[2]);

//     const driftTx = await optimizedBalancerFactory.createDriftBalancer(driftAssetAddresses, driftPercentages, driftAmounts, 100);
//     const driftReceipt = await driftTx.wait();
//     const driftCreatedEvent = driftReceipt?.logs.find(
//       (log): log is EventLog => (log as EventLog).eventName === "BalancerCreated",
//     ) as EventLog;
//     const driftParsedEvent = optimizedBalancerFactory.interface.parseLog(driftCreatedEvent);
//     const driftBalancerAddress = driftParsedEvent!.args[1];
//     driftBalancer = (await ethers.getContractAt(
//       "OptimizedDriftBalancer",
//       driftBalancerAddress,
//     )) as OptimizedDriftBalancer;

//     // Create Time Balancer
//     const timeAssetAddresses = [await mockUSDC.getAddress(), await mockWETH.getAddress(), await mockUSDT.getAddress()];
//     const timePercentages = [50, 30, 20].map(p => BigInt(p));
//     const timeAmounts = [ethers.parseUnits("5000", 6), ethers.parseEther("3"), ethers.parseUnits("2000", 6)];
//     const rebalanceInterval = 3600;

//     // Fund deployer
//     await mockUSDC.mint(deployerAddress, timeAmounts[0]);
//     await mockWETH.mint(deployerAddress, timeAmounts[1]);
//     await mockUSDT.mint(deployerAddress, timeAmounts[2]);

//     // Approve factory to spend tokens
//     await mockUSDC.connect(deployer).approve(await optimizedBalancerFactory.getAddress(), timeAmounts[0]);
//     await mockWETH.connect(deployer).approve(await optimizedBalancerFactory.getAddress(), timeAmounts[1]);
//     await mockUSDT.connect(deployer).approve(await optimizedBalancerFactory.getAddress(), timeAmounts[2]);

//     const timeTx = await optimizedBalancerFactory.createTimeBalancer(
//       timeAssetAddresses,
//       timePercentages,
//       timeAmounts,
//       rebalanceInterval,
//     );
//     const timeReceipt = await timeTx.wait();
//     const timeCreatedEvent = timeReceipt?.logs.find(
//       (log): log is EventLog => (log as EventLog).eventName === "BalancerCreated",
//     ) as EventLog;
//     const timeParsedEvent = optimizedBalancerFactory.interface.parseLog(timeCreatedEvent);
//     const timeBalancerAddress = timeParsedEvent!.args[1];
//     timeBalancer = (await ethers.getContractAt("OptimizedTimeBalancer", timeBalancerAddress)) as OptimizedTimeBalancer;
//   });

//   describe("Balancer Creation and Setup", function () {
//     it("Should create a drift balancer and a time balancer", async function () {
//       const driftAddr = await driftBalancer.getAddress();
//       const timeAddr = await timeBalancer.getAddress();
//       expect(driftAddr).to.be.properAddress;
//       expect(timeAddr).to.be.properAddress;
//       console.log("✅ Both balancers created and funded with initial tokens");
//     });

//     it("Should have correct owners", async function () {
//       expect(await driftBalancer.owner()).to.equal(await deployer.getAddress());
//       expect(await timeBalancer.owner()).to.equal(await deployer.getAddress());
//       console.log("✅ Ownership verified");
//     });

//     it("Should verify initial portfolios are balanced", async function () {
//       await expect(driftBalancer.connect(deployer).triggerRebalance()).to.not.emit(driftBalancer, "RebalanceNeeded");
//       console.log("✅ Initial drift balancer portfolio confirmed to be balanced");

//       await expect(timeBalancer.connect(deployer).triggerTimeRebalance()).to.not.emit(
//         timeBalancer,
//         "RebalanceNeeded",
//       );
//       console.log("✅ Initial time balancer portfolio confirmed to be balanced");
//     });
//   });

//   describe("Global Rebalancing Logic", function () {
//     it("Should trigger rebalancing when adding tokens causes global imbalance", async function () {
//       // Add significant amount of WETH to cause imbalance
//       const additionalWETH = ethers.parseEther("10"); // Large amount to cause imbalance
//       await mockWETH.connect(deployer).approve(await driftBalancer.getAddress(), additionalWETH);
//       await driftBalancer.connect(deployer).fund(await mockWETH.getAddress(), additionalWETH);

//       // Trigger rebalancing
//       const tx = await driftBalancer.connect(deployer).triggerRebalance();
//       const receipt = await tx.wait();

//       // Check for RebalanceNeeded event
//       const rebalanceEvent = receipt?.logs.find(
//         (log): log is EventLog => (log as EventLog).eventName === "RebalanceNeeded"
//       );

//       expect(rebalanceEvent).to.not.be.undefined;
//       console.log("✅ Global rebalancing triggered after adding WETH");

//       // Verify the event contains the expected data
//       if (rebalanceEvent) {
//         const parsedEvent = driftBalancer.interface.parseLog(rebalanceEvent);
//         const tokens = parsedEvent!.args[0] as string[];
//         const deviations = parsedEvent!.args[1] as bigint[];

//         expect(tokens.length).to.be.greaterThan(0);
//         expect(deviations.length).to.be.greaterThan(0);
//         console.log("✅ Rebalance event contains tokens and deviations");
//       }
//     });

//     it("Should create limit orders for rebalancing", async function () {
//       // Add tokens to cause imbalance
//       const additionalUSDC = ethers.parseUnits("2000", 6);
//       await mockUSDC.connect(deployer).approve(await driftBalancer.getAddress(), additionalUSDC);
//       await driftBalancer.connect(deployer).fund(await mockUSDC.getAddress(), additionalUSDC);

//       // Create a rebalance order
//       const sellToken = await mockUSDC.getAddress();
//       const buyToken = await mockWETH.getAddress();
//       const sellAmount = ethers.parseUnits("1000", 6);
//       const buyAmount = ethers.parseEther("0.5");
//       const slippageTolerance = 100; // 1%

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
//       console.log("✅ Rebalance limit order created successfully");

//       if (orderEvent) {
//         const parsedEvent = driftBalancer.interface.parseLog(orderEvent);
//         const orderHash = parsedEvent!.args[0] as string;
//         const maker = parsedEvent!.args[1] as string;
//         const sellTokenEvent = parsedEvent!.args[2] as string;
//         const buyTokenEvent = parsedEvent!.args[3] as string;

//         expect(orderHash).to.not.equal(ethers.ZeroHash);
//         expect(maker).to.equal(await driftBalancer.getAddress());
//         expect(sellTokenEvent).to.equal(sellToken);
//         expect(buyTokenEvent).to.equal(buyToken);
//         console.log("✅ Order event contains correct parameters");
//       }
//     });
//   });

//   describe("Token Disbalance by Adding Additional Tokens", function () {
//     it("Should cause disbalance by adding WETH to time balancer", async function () {
//       const additionalWETH = ethers.parseEther("1");
//       await mockWETH.connect(deployer).approve(await timeBalancer.getAddress(), additionalWETH);
//       await timeBalancer.connect(deployer).fund(await mockWETH.getAddress(), additionalWETH);

//       await expect(timeBalancer.connect(deployer).triggerTimeRebalance()).to.emit(timeBalancer, "RebalanceTriggered");
//       console.log("✅ Disbalance detected after adding WETH");
//     });

//     it("Should cause disbalance by adding USDC to time balancer", async function () {
//       const additionalUSDC = ethers.parseUnits("1000", 6);
//       await mockUSDC.connect(deployer).approve(await timeBalancer.getAddress(), additionalUSDC);
//       await timeBalancer.connect(deployer).fund(await mockUSDC.getAddress(), additionalUSDC);

//       await expect(timeBalancer.connect(deployer).triggerTimeRebalance()).to.emit(timeBalancer, "RebalanceTriggered");
//       console.log("✅ Disbalance detected after adding USDC");
//     });
//   });

//   describe("Multiple Token Disbalance Tests", function () {
//     it("Should create complex disbalance by adding multiple tokens", async function () {
//       const additionalUSDC = ethers.parseUnits("1200", 6);
//       const additionalINCH = ethers.parseEther("400");

//       await mockUSDC.connect(deployer).approve(await driftBalancer.getAddress(), additionalUSDC);
//       await mockINCH.connect(deployer).approve(await driftBalancer.getAddress(), additionalINCH);

//       await driftBalancer.connect(deployer).fund(await mockUSDC.getAddress(), additionalUSDC);
//       await driftBalancer.connect(deployer).fund(await mockINCH.getAddress(), additionalINCH);

//       await expect(driftBalancer.connect(deployer).triggerRebalance()).to.emit(driftBalancer, "RebalanceNeeded");

//       console.log("✅ Complex disbalance detected after adding multiple tokens");
//     });

//     it("Should verify order signatures can be generated for all tokens", async function () {
//       const usdcOrderHash = ethers.keccak256(ethers.toUtf8Bytes("USDC_ORDER"));
//       const wethOrderHash = ethers.keccak256(ethers.toUtf8Bytes("WETH_ORDER"));
//       const inchOrderHash = ethers.keccak256(ethers.toUtf8Bytes("INCH_ORDER"));

//       const usdcSignature = await driftBalancer.connect(deployer).getOrderSignature(usdcOrderHash);
//       const wethSignature = await driftBalancer.connect(deployer).getOrderSignature(wethOrderHash);
//       const inchSignature = await driftBalancer.connect(deployer).getOrderSignature(inchOrderHash);

//       expect(usdcSignature).to.not.equal("0x");
//       expect(wethSignature).to.not.equal("0x");
//       expect(inchSignature).to.not.equal("0x");

//       console.log("✅ Order signatures successfully generated for all tokens");
//     });
//   });

//   describe("Stablecoin Grid Trading", function () {
//     it("Should create stablecoin grid orders", async function () {
//       const fromToken = await mockUSDC.getAddress();
//       const toToken = await mockUSDT.getAddress();
//       const amount = ethers.parseUnits("1000", 6);
//       const limitPrice = ethers.parseUnits("1", 18); // 1:1 peg

//       const tx = await driftBalancer.connect(deployer).createStablecoinGridOrder(
//         fromToken,
//         toToken,
//         amount,
//         limitPrice
//       );

//       const receipt = await tx.wait();
//       const orderEvent = receipt?.logs.find(
//         (log): log is EventLog => (log as EventLog).eventName === "LimitOrderCreated"
//       );

//       expect(orderEvent).to.not.be.undefined;
//       console.log("✅ Stablecoin grid order created successfully");

//       if (orderEvent) {
//         const parsedEvent = driftBalancer.interface.parseLog(orderEvent);
//         const orderHash = parsedEvent!.args[0] as string;
//         const maker = parsedEvent!.args[1] as string;
//         const fromTokenEvent = parsedEvent!.args[2] as string;
//         const toTokenEvent = parsedEvent!.args[3] as string;

//         expect(orderHash).to.not.equal(ethers.ZeroHash);
//         expect(maker).to.equal(await driftBalancer.getAddress());
//         expect(fromTokenEvent).to.equal(fromToken);
//         expect(toTokenEvent).to.equal(toToken);
//         console.log("✅ Grid order event contains correct parameters");
//       }
//     });
//   });
// });
