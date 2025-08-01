import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { FusionPlusHub, EscrowFactory, MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Ethereum Hub Tests", function () {
  let fusionPlusHub: FusionPlusHub;
  let escrowFactory: EscrowFactory;
  let mockToken: MockERC20;
  let mockLOP: any;
  let mockRouter: any;
  let deployer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async () => {
    [deployer, user1, user2] = await ethers.getSigners();

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

    // Deploy FusionPlusHub
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

      const escrowFactoryAddress = await fusionPlusHub.escrowFactory();
      expect(escrowFactoryAddress).to.equal(await escrowFactory.getAddress());
    });

    it("Should calculate fees correctly", async function () {
      const amount = ethers.parseEther("100");
      const fee = await fusionPlusHub.calculateFee(amount);
      
      // 0.3% of 100 ETH = 0.3 ETH
      expect(fee).to.equal(ethers.parseEther("0.3"));
    });

    it("Should allow admin to update protocol fee", async function () {
      await fusionPlusHub.setProtocolFee(50); // 0.5%
      expect(await fusionPlusHub.protocolFee()).to.equal(50);
    });

    it("Should enforce maximum protocol fee", async function () {
      await expect(fusionPlusHub.setProtocolFee(1001)) // > 10%
        .to.be.revertedWith("Fee too high");
    });
  });

  describe("EscrowFactory", function () {
    it("Should deploy escrows", async function () {
      const salt = ethers.randomBytes(32);
      const secretHash = ethers.keccak256(ethers.toUtf8Bytes("test-secret"));
      const timeout = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      // Deploy source escrow
      const srcEscrowAddress = await escrowFactory.computeSrcEscrowAddress(
        await mockToken.getAddress(),
        ethers.parseEther("10"),
        deployer.address,
        user1.address,
        secretHash,
        timeout,
        salt
      );

      const tx = await escrowFactory.createSrcEscrow(
        await mockToken.getAddress(),
        ethers.parseEther("10"),
        deployer.address,
        user1.address,
        secretHash,
        timeout,
        salt
      );

      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      // Verify escrow was deployed at computed address
      const code = await ethers.provider.getCode(srcEscrowAddress);
      expect(code).to.not.equal("0x");
    });
  });
});