import { expect } from "chai";
import { ethers } from "hardhat";
import { EventLog } from "ethers";
import { setupDriftBalancerMixed, setupTimeBalancer, findEvent } from "../../../../utils/test/setup";

describe("Balancer Disbalance Tests", function () {
  let deployer: any;
  let driftBalancer: any;
  let timeBalancer: any;
  let mockUSDC: any;
  let mockUSDT: any;
  let mockWETH: any;
  let mockINCH: any;

  beforeEach(async function () {
    const driftCtx = await setupDriftBalancerMixed();
    deployer = driftCtx.deployer;
    driftBalancer = driftCtx.driftBalancer;
    mockUSDC = driftCtx.mockUSDC;
    mockUSDT = driftCtx.mockUSDT;
    mockWETH = driftCtx.mockWETH;
    mockINCH = driftCtx.mockINCH;

    const timeCtx = await setupTimeBalancer();
    timeBalancer = timeCtx.timeBalancer;
  });

  describe("Balancer Creation and Setup", function () {
    it("Should create a drift balancer and a time balancer", async function () {
      const driftAddr = await driftBalancer.getAddress();
      const timeAddr = await timeBalancer.getAddress();
      expect(ethers.isAddress(driftAddr)).to.equal(true);
      expect(ethers.isAddress(timeAddr)).to.equal(true);
    });

    it("Should have correct owners", async function () {
      expect(await driftBalancer.owner()).to.equal(await deployer.getAddress());
      expect(await timeBalancer.owner()).to.equal(await deployer.getAddress());
      // ownership verified
    });

    it("Should verify initial portfolios are balanced", async function () {
      await expect(driftBalancer.connect(deployer).triggerRebalance()).to.not.emit(driftBalancer, "RebalanceNeeded");
      // drift is balanced

      await expect(timeBalancer.connect(deployer).triggerTimeRebalance()).to.not.emit(timeBalancer, "RebalanceNeeded");
      // time balancer is balanced
    });
  });

  describe("Global Rebalancing Logic", function () {
    it("Should trigger rebalancing when adding tokens causes global imbalance", async function () {
      // Add significant amount of WETH to cause imbalance
      const additionalWETH = ethers.parseEther("10"); // Large amount to cause imbalance
      await mockWETH.connect(deployer).approve(await driftBalancer.getAddress(), additionalWETH);
      await driftBalancer.connect(deployer).fund(await mockWETH.getAddress(), additionalWETH);

      // Trigger rebalancing
      const tx = await driftBalancer.connect(deployer).triggerRebalance();
      const receipt = await tx.wait();

      // Check for RebalanceNeeded event
      const rebalanceEvent = findEvent(receipt, "RebalanceNeeded");

      expect(rebalanceEvent).to.not.equal(undefined);
      // rebalancing triggered

      // Verify the event contains the expected data
      if (rebalanceEvent) {
        const parsedEvent = driftBalancer.interface.parseLog(rebalanceEvent);
        const tokens = parsedEvent!.args[0] as string[];
        const deviations = parsedEvent!.args[1] as bigint[];

        expect(tokens.length).to.be.greaterThan(0);
        expect(deviations.length).to.be.greaterThan(0);
        // event contains tokens and deviations
      }
    });

    it("Should create limit orders for rebalancing", async function () {
      // Add tokens to cause imbalance
      const additionalUSDC = ethers.parseUnits("2000", 6);
      await mockUSDC.connect(deployer).approve(await driftBalancer.getAddress(), additionalUSDC);
      await driftBalancer.connect(deployer).fund(await mockUSDC.getAddress(), additionalUSDC);

      // Create a rebalance order
      const sellToken = await mockUSDC.getAddress();
      const buyToken = await mockWETH.getAddress();
      const sellAmount = ethers.parseUnits("1000", 6);
      const buyAmount = ethers.parseEther("0.5");
      const slippageTolerance = 100; // 1%

      const tx = await driftBalancer
        .connect(deployer)
        .createRebalanceOrder(sellToken, buyToken, sellAmount, buyAmount, slippageTolerance);

      const receipt = await tx.wait();
      const orderEvent = findEvent(receipt, "RebalanceOrderCreated") as EventLog | undefined;

      expect(orderEvent).to.not.equal(undefined);
      console.log("✅ Rebalance limit order created successfully");

      if (orderEvent) {
        const parsedEvent = driftBalancer.interface.parseLog(orderEvent);
        const orderHash = parsedEvent!.args[0] as string;
        const maker = parsedEvent!.args[1] as string;
        const sellTokenEvent = parsedEvent!.args[2] as string;
        const buyTokenEvent = parsedEvent!.args[3] as string;

        expect(orderHash).to.not.equal(ethers.ZeroHash);
        expect(maker).to.equal(await driftBalancer.getAddress());
        expect(sellTokenEvent).to.equal(sellToken);
        expect(buyTokenEvent).to.equal(buyToken);
        console.log("✅ Order event contains correct parameters");
      }
    });
  });

  describe("Token Disbalance by Adding Additional Tokens", function () {
    it("Should cause disbalance by adding WETH to time balancer", async function () {
      const additionalWETH = ethers.parseEther("1");
      await mockWETH.connect(deployer).approve(await timeBalancer.getAddress(), additionalWETH);
      await timeBalancer.connect(deployer).fund(await mockWETH.getAddress(), additionalWETH);

      await expect(timeBalancer.connect(deployer).triggerTimeRebalance()).to.emit(timeBalancer, "RebalanceTriggered");
      console.log("✅ Disbalance detected after adding WETH");
    });

    it("Should cause disbalance by adding USDC to time balancer", async function () {
      const additionalUSDC = ethers.parseUnits("1000", 6);
      await mockUSDC.connect(deployer).approve(await timeBalancer.getAddress(), additionalUSDC);
      await timeBalancer.connect(deployer).fund(await mockUSDC.getAddress(), additionalUSDC);

      await expect(timeBalancer.connect(deployer).triggerTimeRebalance()).to.emit(timeBalancer, "RebalanceTriggered");
      console.log("✅ Disbalance detected after adding USDC");
    });
  });

  describe("Multiple Token Disbalance Tests", function () {
    it("Should create complex disbalance by adding multiple tokens", async function () {
      const additionalUSDC = ethers.parseUnits("1200", 6);
      const additionalINCH = ethers.parseEther("400");

      await mockUSDC.connect(deployer).approve(await driftBalancer.getAddress(), additionalUSDC);
      await mockINCH.connect(deployer).approve(await driftBalancer.getAddress(), additionalINCH);

      await driftBalancer.connect(deployer).fund(await mockUSDC.getAddress(), additionalUSDC);
      await driftBalancer.connect(deployer).fund(await mockINCH.getAddress(), additionalINCH);

      await expect(driftBalancer.connect(deployer).triggerRebalance()).to.emit(driftBalancer, "RebalanceNeeded");

      console.log("✅ Complex disbalance detected after adding multiple tokens");
    });

    it("Should verify order signatures can be generated for all tokens", async function () {
      const usdcOrderHash = ethers.keccak256(ethers.toUtf8Bytes("USDC_ORDER"));
      const wethOrderHash = ethers.keccak256(ethers.toUtf8Bytes("WETH_ORDER"));
      const inchOrderHash = ethers.keccak256(ethers.toUtf8Bytes("INCH_ORDER"));

      const usdcSignature = await driftBalancer.connect(deployer).getOrderSignature(usdcOrderHash);
      const wethSignature = await driftBalancer.connect(deployer).getOrderSignature(wethOrderHash);
      const inchSignature = await driftBalancer.connect(deployer).getOrderSignature(inchOrderHash);

      expect(usdcSignature).to.not.equal("0x");
      expect(wethSignature).to.not.equal("0x");
      expect(inchSignature).to.not.equal("0x");

      console.log("✅ Order signatures successfully generated for all tokens");
    });
  });

  describe("Stablecoin Grid Trading", function () {
    it("Should create stablecoin grid orders", async function () {
      const fromToken = await mockUSDC.getAddress();
      const toToken = await mockUSDT.getAddress();
      const amount = ethers.parseUnits("1000", 6);
      const limitPrice = ethers.parseUnits("1", 18); // 1:1 peg

      const tx = await driftBalancer
        .connect(deployer)
        .createStablecoinGridOrder(fromToken, toToken, amount, limitPrice);

      const receipt = await tx.wait();
      const orderEvent = findEvent(receipt, "LimitOrderCreated") as EventLog | undefined;

      expect(orderEvent).to.not.equal(undefined);
      console.log("✅ Stablecoin grid order created successfully");

      if (orderEvent) {
        const parsedEvent = driftBalancer.interface.parseLog(orderEvent);
        const orderHash = parsedEvent!.args[0] as string;
        const maker = parsedEvent!.args[1] as string;
        const fromTokenEvent = parsedEvent!.args[2] as string;
        const toTokenEvent = parsedEvent!.args[3] as string;

        expect(orderHash).to.not.equal(ethers.ZeroHash);
        expect(maker).to.equal(await driftBalancer.getAddress());
        expect(fromTokenEvent).to.equal(fromToken);
        expect(toTokenEvent).to.equal(toToken);
        console.log("✅ Grid order event contains correct parameters");
      }
    });
  });
});
