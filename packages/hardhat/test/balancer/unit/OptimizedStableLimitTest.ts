// import { expect } from "chai";
// import hre, { ethers } from "hardhat";
// import { Signer, EventLog } from "ethers";
// import {
//   OptimizedBalancerFactory,
//   OptimizedDriftBalancer,
//   MockERC20,
//   MockSpotPriceAggregator,
//   MockLimitOrderProtocol,
// } from "../../../typechain-types";
// import { deployLibraries } from "../../../utils/deploy/libs";
// import { deployOptimizedBalancerFactory } from "../../../utils/deploy/factory";
// import { deployDriftBalancer } from "../../../utils/deploy/balancers";
// import { getOrDeployMockTokens, MockTokens } from "../../../utils/deploy/mocks/tokens";
// import { getOrDeploySpotPriceAggregator, configureSpotPrices } from "../../../utils/deploy/mocks/spotPrice";
// import { getOrDeployLimitOrderProtocol } from "../../../utils/deploy/mocks/limitOrder";

// describe("OptimizedStableLimit Module Tests", function () {
//   let user: Signer;

//   // Contracts
//   let optimizedBalancerFactory: OptimizedBalancerFactory;
//   let driftBalancer: OptimizedDriftBalancer;
//   let mockPriceAggregator: MockSpotPriceAggregator;
//   let mockLimitOrderProtocol: MockLimitOrderProtocol;

//   // Mock Tokens (Stablecoins only)
//   let mockUSDC: MockERC20;
//   let mockUSDT: MockERC20;
//   let mockDAI: MockERC20;

//   // Test configuration - New concept: stablecoins are treated as one asset group
//   const stablecoinPercentages = [BigInt(100)]; // 100% stablecoins (as one group)
//   const stablecoinAmounts = [
//     ethers.parseUnits("4000", 6), // 4000 USDC
//     ethers.parseUnits("3500", 6), // 3500 USDT
//     ethers.parseUnits("2500", 18), // 2500 DAI
//   ];
//   const driftPercentage = BigInt(200); // 2% drift tolerance

//   beforeEach(async function () {
//     [, user] = await ethers.getSigners();

//     console.log("🚀 Setting up OptimizedStableLimit test environment...");

//     // Deploy libraries
//     const libraries = await deployLibraries(hre);

//     // Deploy mock tokens (stablecoins only)
//     const tokens: MockTokens = await getOrDeployMockTokens(hre);
//     console.log("Tokens returned by getOrDeployMockTokens:", tokens);
//     mockUSDC = tokens.mockUSDC;
//     mockUSDT = tokens.mockUSDT;
//     mockDAI = tokens.mockDAI;

//     // Deploy mock protocols
//     mockPriceAggregator = await getOrDeploySpotPriceAggregator(hre);
//     mockLimitOrderProtocol = await getOrDeployLimitOrderProtocol(hre);

//     // Configure spot prices for stablecoins (all should be ~1 USD)
//     await configureSpotPrices(mockPriceAggregator, tokens);

//     // Deploy factory with stablecoin addresses
//     const stablecoinAddresses = [await mockUSDC.getAddress(), await mockUSDT.getAddress(), await mockDAI.getAddress()];

//     optimizedBalancerFactory = await deployOptimizedBalancerFactory(
//       hre,
//       {
//         limitOrderLib: libraries.limitOrderLib,
//         stablecoinGridLib: libraries.stablecoinGridLib,
//       },
//       { mockPriceAggregator, mockLimitOrderProtocol },
//       stablecoinAddresses
//     );

//     // Mint tokens to user
//     const userAddress = await user.getAddress();
//     await mockUSDC.mint(userAddress, stablecoinAmounts[0]);
//     await mockUSDT.mint(userAddress, stablecoinAmounts[1]);
//     await mockDAI.mint(userAddress, stablecoinAmounts[2]);

//     // Approve factory to spend tokens
//     await mockUSDC.connect(user).approve(await optimizedBalancerFactory.getAddress(), stablecoinAmounts[0]);
//     await mockUSDT.connect(user).approve(await optimizedBalancerFactory.getAddress(), stablecoinAmounts[1]);
//     await mockDAI.connect(user).approve(await optimizedBalancerFactory.getAddress(), stablecoinAmounts[2]);

//     // Deploy drift balancer through factory
//     const assetAddresses = [await mockUSDC.getAddress(), await mockUSDT.getAddress(), await mockDAI.getAddress()];

//     driftBalancer = await deployDriftBalancer(hre, optimizedBalancerFactory, {
//       assetAddresses,
//       percentages: stablecoinPercentages,
//       amounts: stablecoinAmounts,
//       driftPercentage,
//     });

//     console.log("✅ Test environment setup complete");
//   });

//   describe("Stablecoin Portfolio Setup", function () {
//     it("Should create drift balancer with stablecoins only", async function () {
//       const balancerAddress = await driftBalancer.getAddress();
//       expect(balancerAddress).to.be.properAddress;
//       expect(await driftBalancer.owner()).to.equal(await user.getAddress());
//       expect(await driftBalancer.driftPercentage()).to.equal(driftPercentage);

//       // Verify stablecoin balances
//       expect(await mockUSDC.balanceOf(balancerAddress)).to.equal(stablecoinAmounts[0]);
//       expect(await mockUSDT.balanceOf(balancerAddress)).to.equal(stablecoinAmounts[1]);
//       expect(await mockDAI.balanceOf(balancerAddress)).to.equal(stablecoinAmounts[2]);

//       console.log("✅ Drift balancer created with stablecoins only");
//     });

//     it("Should have balanced stablecoin portfolio initially", async function () {
//       // Trigger rebalance - should not emit RebalanceNeeded since portfolio is balanced
//       await expect(driftBalancer.connect(user).triggerRebalance()).to.not.emit(driftBalancer, "RebalanceNeeded");

//       console.log("✅ Initial stablecoin portfolio is balanced");
//     });
//   });

//   describe("Stablecoin Price Deviation Tests", function () {
//     it("Should detect rebalancing needed when stablecoin prices deviate", async function () {
//       console.log("🔄 Simulating stablecoin price deviations...");

//       // Simulate USDT price dropping to 0.98 USD (2% deviation)
//       await mockPriceAggregator.setMockPrice(
//         await mockUSDT.getAddress(),
//         await mockUSDC.getAddress(),
//         ethers.parseUnits("0.98", 18),
//       );

//       // Simulate DAI price rising to 1.03 USD (3% deviation)
//       await mockPriceAggregator.setMockPrice(
//         await mockDAI.getAddress(),
//         await mockUSDC.getAddress(),
//         ethers.parseUnits("1.03", 18),
//       );

//       // Trigger rebalance - should emit RebalanceNeeded
//       const tx = await driftBalancer.connect(user).triggerRebalance();
//       const receipt = await tx.wait();

//       const rebalanceEvent = receipt?.logs.find(
//         (log): log is EventLog => (log as EventLog).eventName === "RebalanceNeeded"
//       );

//       expect(rebalanceEvent).to.not.be.undefined;
//       console.log("✅ Rebalancing detected due to stablecoin price deviations");
//     });
//   });

//   describe("Limit Order Creation", function () {
//     it("Should create rebalance limit orders", async function () {
//       // Create a rebalance order for USDT to USDC
//       const sellAmount = ethers.parseUnits("100", 6); // 100 USDT
//       const buyAmount = ethers.parseUnits("98", 6); // 98 USDC (at 0.98 rate)

//       const tx = await driftBalancer.connect(user).createRebalanceOrder(
//         await mockUSDT.getAddress(),
//         await mockUSDC.getAddress(),
//         sellAmount,
//         buyAmount,
//         100 // 1% slippage tolerance
//       );

//       const receipt = await tx.wait();
//       const orderEvent = receipt?.logs.find(
//         (log): log is EventLog => (log as EventLog).eventName === "RebalanceOrderCreated"
//       );

//       expect(orderEvent).to.not.be.undefined;
//       console.log("✅ Rebalance limit order created successfully");
//     });

//     it("Should create stablecoin grid orders", async function () {
//       // Create a grid order for USDT to USDC
//       const gridAmount = ethers.parseUnits("50", 6);
//       const limitPrice = ethers.parseUnits("0.995", 18);

//       const tx = await driftBalancer.connect(user).createStablecoinGridOrder(
//         await mockUSDT.getAddress(),
//         await mockUSDC.getAddress(),
//         gridAmount,
//         limitPrice,
//       );

//       const receipt = await tx.wait();
//       const gridOrderEvent = receipt?.logs.find(
//         (log): log is EventLog => (log as EventLog).eventName === "LimitOrderCreated"
//       );

//       expect(gridOrderEvent).to.not.be.undefined;
//       console.log("✅ Stablecoin grid order created successfully");
//     });
//   });

//   describe("EIP-1271 Signature Validation", function () {
//     it("Should generate valid EIP-1271 signatures for limit orders", async function () {
//       // Create a test order hash
//       const orderHash = ethers.keccak256(ethers.toUtf8Bytes("TEST_ORDER"));

//       // Get signature from the balancer
//       const signature = await driftBalancer.connect(user).getOrderSignature(orderHash);

//       expect(signature).to.not.equal("0x");
//       expect(signature.length).to.be.greaterThan(0);

//       // Verify the signature can be validated by EIP-1271
//       const isValid = await driftBalancer.isValidSignature(orderHash, signature);
//       expect(isValid).to.equal("0x1626ba7e"); // EIP-1271 magic value

//       console.log("✅ EIP-1271 signature validation working correctly");
//     });

//     it("Should reject invalid signatures", async function () {
//       const orderHash = ethers.keccak256(ethers.toUtf8Bytes("TEST_ORDER"));
//       const invalidSignature = ethers.toUtf8Bytes("INVALID_SIGNATURE");

//       const isValid = await driftBalancer.isValidSignature(orderHash, invalidSignature);
//       expect(isValid).to.equal("0xffffffff"); // Invalid signature indicator

//       console.log("✅ Invalid signatures correctly rejected");
//     });
//   });

//   describe("Automation Integration", function () {
//     it("Should trigger automation when stablecoin prices deviate", async function () {
//       // Simulate significant stablecoin price deviation
//       await mockPriceAggregator.setMockPrice(
//         await mockUSDT.getAddress(),
//         await mockUSDC.getAddress(),
//         ethers.parseUnits("0.99", 18) // 1% deviation
//       );

//       // Check if upkeep is needed
//       const [upkeepNeeded, performData] = await driftBalancer.checkUpkeep("0x");

//       expect(upkeepNeeded).to.be.true;
//       expect(performData.length).to.be.greaterThan(0);

//       console.log("✅ Automation upkeep correctly detected");
//     });

//     it("Should perform upkeep and generate grid orders", async function () {
//       // Simulate stablecoin price deviation
//       await mockPriceAggregator.setMockPrice(
//         await mockUSDT.getAddress(),
//         await mockUSDC.getAddress(),
//         ethers.parseUnits("0.995", 18)
//       );

//       // Encode perform data
//       const performData = ethers.AbiCoder.defaultAbiCoder().encode(
//         ["address", "address", "uint256"],
//         [await mockUSDT.getAddress(), await mockUSDC.getAddress(), ethers.parseUnits("0.995", 18)]
//       );

//       // Perform upkeep
//       const tx = await driftBalancer.connect(user).performUpkeep(performData);
//       const receipt = await tx.wait();

//       // Check for OrdersGenerated event
//       const ordersGeneratedEvent = receipt?.logs.find(
//         (log) => log.eventName === "OrdersGenerated"
//       );

//       expect(ordersGeneratedEvent).to.not.be.undefined;
//       console.log("✅ Automation performed and grid orders generated");
//     });
//   });

//   describe("Limit Order Protocol Integration", function () {
//     it("Should create EIP-712 compliant orders", async function () {
//       const sellAmount = ethers.parseUnits("100", 6);
//       const buyAmount = ethers.parseUnits("100", 6);

//       const tx = await driftBalancer.connect(user).createRebalanceOrder(
//         await mockUSDC.getAddress(),
//         await mockUSDT.getAddress(),
//         sellAmount,
//         buyAmount,
//         50 // 0.5% slippage
//       );

//       const receipt = await tx.wait();
//       const orderEvent = receipt?.logs.find(
//         (log) => log.eventName === "RebalanceOrderCreated"
//       ) as EventLog;

//       expect(orderEvent).to.not.be.undefined;

//       // Verify order hash calculation
//       const parsedEvent = driftBalancer.interface.parseLog(orderEvent);
//       const orderHash = parsedEvent.args[0];

//       expect(orderHash).to.not.equal(ethers.ZeroHash);
//       expect(orderHash.length).to.equal(66); // 0x + 64 hex chars

//       console.log("✅ EIP-712 compliant order created with valid hash");
//     });
//   });
// });
