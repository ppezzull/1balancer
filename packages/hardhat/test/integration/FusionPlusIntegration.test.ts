import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { FusionPlusHub, EscrowFactory, MockERC20 } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("FusionPlus Integration", function () {
  let fusionPlusHub: FusionPlusHub;
  let escrowFactory: EscrowFactory;
  let tokenA: MockERC20;
  let tokenB: MockERC20;
  let mockLOP: any;
  let mockRouter: any;
  let maker: SignerWithAddress;
  let taker: SignerWithAddress;
  let resolver: SignerWithAddress;
  let feeRecipient: SignerWithAddress;

  beforeEach(async function () {
    [maker, taker, resolver, feeRecipient] = await ethers.getSigners();

    // Deploy tokens
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    tokenA = await MockERC20Factory.deploy("Token A", "TKA", 18);
    tokenB = await MockERC20Factory.deploy("Token B", "TKB", 18);
    
    // Mint tokens
    await tokenA.mint(maker.address, ethers.parseEther("10000"));
    await tokenB.mint(taker.address, ethers.parseEther("10000"));

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
      maker.address // Admin address
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

    // Setup
    await fusionPlusHub.setFeeRecipient(feeRecipient.address);
    await fusionPlusHub.grantRole(await fusionPlusHub.RESOLVER_ROLE(), resolver.address);
  });

  describe("Integration Setup", function () {
    it("Should have all contracts deployed", async function () {
      expect(await fusionPlusHub.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await escrowFactory.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await tokenA.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await tokenB.getAddress()).to.not.equal(ethers.ZeroAddress);
    });

    it("Should have correct configuration", async function () {
      expect(await fusionPlusHub.escrowFactory()).to.equal(await escrowFactory.getAddress());
      expect(await fusionPlusHub.limitOrderProtocol()).to.equal(await mockLOP.getAddress());
      expect(await fusionPlusHub.protocolFee()).to.equal(30);
      expect(await fusionPlusHub.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("Should have correct token balances", async function () {
      expect(await tokenA.balanceOf(maker.address)).to.equal(ethers.parseEther("10000"));
      expect(await tokenB.balanceOf(taker.address)).to.equal(ethers.parseEther("10000"));
    });
  });

  describe("Fee Calculations", function () {
    it("Should calculate fees correctly for different amounts", async function () {
      const testAmounts = [
        ethers.parseEther("1"),
        ethers.parseEther("10"),
        ethers.parseEther("100"),
        ethers.parseEther("1000"),
        ethers.parseEther("10000")
      ];

      for (const amount of testAmounts) {
        const fee = await fusionPlusHub.calculateFee(amount);
        const expectedFee = amount * 30n / 10000n; // 0.3%
        expect(fee).to.equal(expectedFee);
      }
    });

    it("Should handle fee updates", async function () {
      // Update fee to 0.5%
      await fusionPlusHub.setProtocolFee(50);

      const amount = ethers.parseEther("1000");
      const fee = await fusionPlusHub.calculateFee(amount);
      expect(fee).to.equal(ethers.parseEther("5")); // 0.5% of 1000
    });
  });

  describe("Access Control", function () {
    it("Should enforce role restrictions", async function () {
      const RESOLVER_ROLE = await fusionPlusHub.RESOLVER_ROLE();
      
      // Check resolver has role
      expect(await fusionPlusHub.hasRole(RESOLVER_ROLE, resolver.address)).to.be.true;
      
      // Check random user doesn't have role
      expect(await fusionPlusHub.hasRole(RESOLVER_ROLE, taker.address)).to.be.false;
      
      // Test admin function restriction
      await expect(
        fusionPlusHub.connect(taker).setProtocolFee(100)
      ).to.be.revertedWithCustomError(fusionPlusHub, "AccessControlUnauthorizedAccount");
    });
  });
});