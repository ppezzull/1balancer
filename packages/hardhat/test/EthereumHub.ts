import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { HTLCManager, OrchestrationCoordinator, FusionPlusHub } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Ethereum Hub Tests", function () {
  let htlcManager: HTLCManager;
  let orchestrationCoordinator: OrchestrationCoordinator;
  let fusionPlusHub: FusionPlusHub;
  let deployer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async () => {
    [deployer, user1, user2] = await ethers.getSigners();

    // Deploy HTLCManager
    const HTLCManagerFactory = await ethers.getContractFactory("HTLCManager");
    htlcManager = await HTLCManagerFactory.deploy(
      30 * 60, // 30 minutes minimum
      7 * 24 * 60 * 60 // 7 days maximum
    );
    await htlcManager.waitForDeployment();

    // Deploy OrchestrationCoordinator
    const OrchestrationCoordinatorFactory = await ethers.getContractFactory("OrchestrationCoordinator");
    orchestrationCoordinator = await OrchestrationCoordinatorFactory.deploy(
      await htlcManager.getAddress()
    );
    await orchestrationCoordinator.waitForDeployment();

    // Deploy FusionPlusHub
    const FusionPlusHubFactory = await ethers.getContractFactory("FusionPlusHub");
    fusionPlusHub = await upgrades.deployProxy(
      FusionPlusHubFactory,
      [
        ethers.ZeroAddress, // Placeholder for limit order protocol
        ethers.ZeroAddress, // Placeholder for aggregation router
        await htlcManager.getAddress(),
        await orchestrationCoordinator.getAddress(),
      ],
      { initializer: "initialize" }
    ) as unknown as FusionPlusHub;
    await fusionPlusHub.waitForDeployment();
  });

  describe("HTLCManager", function () {
    it("Should deploy with correct timeout bounds", async function () {
      expect(await htlcManager.MIN_TIMEOUT()).to.equal(30 * 60);
      expect(await htlcManager.MAX_TIMEOUT()).to.equal(7 * 24 * 60 * 60);
    });

    it("Should have correct roles assigned to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await htlcManager.DEFAULT_ADMIN_ROLE();
      const OPERATOR_ROLE = await htlcManager.OPERATOR_ROLE();
      const PAUSER_ROLE = await htlcManager.PAUSER_ROLE();

      expect(await htlcManager.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.be.true;
      expect(await htlcManager.hasRole(OPERATOR_ROLE, deployer.address)).to.be.true;
      expect(await htlcManager.hasRole(PAUSER_ROLE, deployer.address)).to.be.true;
    });
  });

  describe("OrchestrationCoordinator", function () {
    it("Should be linked to HTLCManager", async function () {
      const htlcAddress = await htlcManager.getAddress();
      expect(await orchestrationCoordinator.htlcManager()).to.equal(htlcAddress);
    });

    it("Should allow adding supported chains", async function () {
      const NEAR_CHAIN_ID = ethers.encodeBytes32String("NEAR");
      
      await orchestrationCoordinator.addSupportedChain(
        NEAR_CHAIN_ID,
        30 * 60, // 30 minutes confirmation
        1000000, // Gas limit
        ethers.parseUnits("0.1", "gwei") // Gas price
      );

      expect(await orchestrationCoordinator.isChainSupported(NEAR_CHAIN_ID)).to.be.true;

      const chainConfig = await orchestrationCoordinator.getChainConfig(NEAR_CHAIN_ID);
      expect(chainConfig.isSupported).to.be.true;
      expect(chainConfig.confirmationTime).to.equal(30 * 60);
    });
  });

  describe("FusionPlusHub", function () {
    it("Should be deployed as upgradeable proxy", async function () {
      // Check if it's a proxy by verifying it has an implementation
      const proxyAdmin = await upgrades.admin.getInstance();
      const implementation = await proxyAdmin.getProxyImplementation(
        await fusionPlusHub.getAddress()
      );
      expect(implementation).to.not.equal(ethers.ZeroAddress);
    });

    it("Should have correct initial configuration", async function () {
      const protocolFee = await fusionPlusHub.protocolFee();
      expect(protocolFee).to.equal(30); // 0.3%

      const [limitOrder, aggregation, htlc, orchestration] = 
        await fusionPlusHub.getContractAddresses();
      
      expect(htlc).to.equal(await htlcManager.getAddress());
      expect(orchestration).to.equal(await orchestrationCoordinator.getAddress());
    });

    it("Should calculate fees correctly", async function () {
      const amount = ethers.parseEther("100");
      const fee = await fusionPlusHub.calculateFee(amount);
      
      // 0.3% of 100 ETH = 0.3 ETH
      expect(fee).to.equal(ethers.parseEther("0.3"));
    });
  });

  describe("Cross-chain order flow", function () {
    beforeEach(async function () {
      // Add NEAR as supported chain
      const NEAR_CHAIN_ID = ethers.encodeBytes32String("NEAR");
      await orchestrationCoordinator.addSupportedChain(
        NEAR_CHAIN_ID,
        30 * 60,
        1000000,
        ethers.parseUnits("0.1", "gwei")
      );

      // Grant resolver role to deployer for testing
      const RESOLVER_ROLE = await orchestrationCoordinator.RESOLVER_ROLE();
      await orchestrationCoordinator.grantRole(RESOLVER_ROLE, deployer.address);
    });

    it("Should create cross-chain order", async function () {
      const NEAR_CHAIN_ID = ethers.encodeBytes32String("NEAR");
      
      const orderParams = {
        sourceToken: ethers.ZeroAddress, // Placeholder
        destinationToken: ethers.ZeroAddress, // Placeholder
        sourceAmount: ethers.parseEther("1"),
        destinationAmount: ethers.parseEther("100"),
        destinationChain: NEAR_CHAIN_ID
      };

      const tx = await orchestrationCoordinator.createCrossChainOrder(orderParams);
      const receipt = await tx.wait();
      
      // Check event emission
      const event = receipt?.logs.find(
        log => log.topics[0] === orchestrationCoordinator.interface.getEvent("CrossChainOrderCreated").topicHash
      );
      
      expect(event).to.not.be.undefined;
    });
  });
});