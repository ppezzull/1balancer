import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { FusionPlusHub, EscrowFactory, MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("FusionPlusHub", function () {
  let fusionPlusHub: FusionPlusHub;
  let escrowFactory: EscrowFactory;
  let mockToken: MockERC20;
  let mockLOP: any;
  let mockRouter: any;
  let deployer: SignerWithAddress;
  let operator: SignerWithAddress;
  let resolver: SignerWithAddress;
  let user: SignerWithAddress;
  let feeRecipient: SignerWithAddress;

  beforeEach(async function () {
    [deployer, operator, resolver, user, feeRecipient] = await ethers.getSigners();

    // Deploy mock token
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20Factory.deploy("Test Token", "TEST", 18);
    await mockToken.waitForDeployment();

    // Deploy mock limit order protocol
    const MockLOPFactory = await ethers.getContractFactory("MockLimitOrderProtocol");
    mockLOP = await MockLOPFactory.deploy();
    await mockLOP.waitForDeployment();

    // Deploy mock aggregation router
    const MockRouterFactory = await ethers.getContractFactory("MockAggregationRouter");
    mockRouter = await MockRouterFactory.deploy();
    await mockRouter.waitForDeployment();

    // Deploy EscrowFactory with required constructor args
    const EscrowFactoryContract = await ethers.getContractFactory("EscrowFactory");
    escrowFactory = await EscrowFactoryContract.deploy(
      await mockLOP.getAddress(), // Mock limit order protocol
      deployer.address // Admin address
    );
    await escrowFactory.waitForDeployment();

    // Deploy FusionPlusHub as upgradeable proxy
    const FusionPlusHubFactory = await ethers.getContractFactory("FusionPlusHub");
    fusionPlusHub = await upgrades.deployProxy(
      FusionPlusHubFactory,
      [
        await mockLOP.getAddress(), // Limit order protocol
        await mockRouter.getAddress(), // Aggregation router
        await escrowFactory.getAddress() // Escrow factory
      ],
      { initializer: "initialize" }
    ) as unknown as FusionPlusHub;
    await fusionPlusHub.waitForDeployment();

    // Set fee recipient
    await fusionPlusHub.setFeeRecipient(feeRecipient.address);

    // Grant roles
    await fusionPlusHub.grantRole(await fusionPlusHub.OPERATOR_ROLE(), operator.address);
    await fusionPlusHub.grantRole(await fusionPlusHub.RESOLVER_ROLE(), resolver.address);
  });

  describe("Deployment", function () {
    it("Should set correct initial values", async function () {
      expect(await fusionPlusHub.escrowFactory()).to.equal(await escrowFactory.getAddress());
      expect(await fusionPlusHub.protocolFee()).to.equal(30);
      expect(await fusionPlusHub.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("Should be deployed as upgradeable proxy", async function () {
      const proxyAdmin = await upgrades.admin.getInstance();
      const implementation = await proxyAdmin.getProxyImplementation(
        await fusionPlusHub.getAddress()
      );
      expect(implementation).to.not.equal(ethers.ZeroAddress);
    });

    it("Should have correct roles assigned", async function () {
      const DEFAULT_ADMIN_ROLE = await fusionPlusHub.DEFAULT_ADMIN_ROLE();
      const OPERATOR_ROLE = await fusionPlusHub.OPERATOR_ROLE();
      const RESOLVER_ROLE = await fusionPlusHub.RESOLVER_ROLE();

      expect(await fusionPlusHub.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.be.true;
      expect(await fusionPlusHub.hasRole(OPERATOR_ROLE, operator.address)).to.be.true;
      expect(await fusionPlusHub.hasRole(RESOLVER_ROLE, resolver.address)).to.be.true;
    });
  });

  describe("Fee Management", function () {
    it("Should calculate fees correctly", async function () {
      const amount = ethers.parseEther("100");
      const fee = await fusionPlusHub.calculateFee(amount);
      expect(fee).to.equal(ethers.parseEther("0.3")); // 0.3% of 100
    });

    it("Should update protocol fee", async function () {
      await fusionPlusHub.setProtocolFee(50); // 0.5%
      expect(await fusionPlusHub.protocolFee()).to.equal(50);

      const amount = ethers.parseEther("100");
      const fee = await fusionPlusHub.calculateFee(amount);
      expect(fee).to.equal(ethers.parseEther("0.5")); // 0.5% of 100
    });

    it("Should enforce maximum fee", async function () {
      await expect(fusionPlusHub.setProtocolFee(1001))
        .to.be.revertedWithCustomError(fusionPlusHub, "FeeTooHigh");
    });

    it("Should update fee recipient", async function () {
      const newRecipient = user.address;
      await fusionPlusHub.setFeeRecipient(newRecipient);
      expect(await fusionPlusHub.feeRecipient()).to.equal(newRecipient);
    });

    it("Should restrict fee updates to admin", async function () {
      await expect(fusionPlusHub.connect(user).setProtocolFee(50))
        .to.be.revertedWithCustomError(fusionPlusHub, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Pausable", function () {
    it("Should pause and unpause", async function () {
      expect(await fusionPlusHub.paused()).to.be.false;

      await fusionPlusHub.pause();
      expect(await fusionPlusHub.paused()).to.be.true;

      await fusionPlusHub.unpause();
      expect(await fusionPlusHub.paused()).to.be.false;
    });

    it("Should restrict pause to admin", async function () {
      await expect(fusionPlusHub.connect(user).pause())
        .to.be.revertedWithCustomError(fusionPlusHub, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Contract Updates", function () {
    it("Should update contract addresses", async function () {
      const newLimitOrder = ethers.Wallet.createRandom().address;
      const newAggregation = ethers.Wallet.createRandom().address;
      const newEscrowFactory = ethers.Wallet.createRandom().address;

      await fusionPlusHub.updateContracts(
        newLimitOrder,
        newAggregation,
        newEscrowFactory
      );

      expect(await fusionPlusHub.limitOrderProtocol()).to.equal(newLimitOrder);
      expect(await fusionPlusHub.aggregationRouter()).to.equal(newAggregation);
      expect(await fusionPlusHub.escrowFactory()).to.equal(newEscrowFactory);
    });

    it("Should restrict contract updates to admin", async function () {
      await expect(
        fusionPlusHub.connect(user).updateContracts(
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          ethers.ZeroAddress
        )
      ).to.be.revertedWithCustomError(fusionPlusHub, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Upgrade", function () {
    it("Should be upgradeable by admin", async function () {
      const FusionPlusHubV2 = await ethers.getContractFactory("FusionPlusHub");
      const upgraded = await upgrades.upgradeProxy(
        await fusionPlusHub.getAddress(),
        FusionPlusHubV2
      );

      expect(await upgraded.getAddress()).to.equal(await fusionPlusHub.getAddress());
      expect(await upgraded.protocolFee()).to.equal(30); // State preserved
    });
  });
});