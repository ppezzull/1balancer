import { expect } from "chai";
import { ethers } from "hardhat";
import { EscrowFactory, MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("EscrowFactory", function () {
  let escrowFactory: EscrowFactory;
  let mockToken: MockERC20;
  let mockLOP: any;
  let maker: SignerWithAddress;
  let taker: SignerWithAddress;

  beforeEach(async function () {
    [maker, taker] = await ethers.getSigners();

    // Deploy mock token
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20Factory.deploy("Test Token", "TEST", 18);
    await mockToken.waitForDeployment();

    // Mint tokens to maker
    await mockToken.mint(maker.address, ethers.parseEther("1000"));

    // Deploy mock limit order protocol
    const MockLOPFactory = await ethers.getContractFactory("MockLimitOrderProtocol");
    mockLOP = await MockLOPFactory.deploy();
    await mockLOP.waitForDeployment();

    // Deploy EscrowFactory with required constructor args
    const EscrowFactoryContract = await ethers.getContractFactory("EscrowFactory");
    escrowFactory = await EscrowFactoryContract.deploy(
      await mockLOP.getAddress(), // Mock limit order protocol
      maker.address // Admin address
    );
    await escrowFactory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await escrowFactory.getAddress()).to.not.equal(ethers.ZeroAddress);
    });

    it("Should set correct limit order protocol", async function () {
      expect(await escrowFactory.limitOrderProtocol()).to.equal(await mockLOP.getAddress());
    });

    it("Should grant roles to admin", async function () {
      const DEFAULT_ADMIN_ROLE = await escrowFactory.DEFAULT_ADMIN_ROLE();
      const ORCHESTRATOR_ROLE = await escrowFactory.ORCHESTRATOR_ROLE();

      expect(await escrowFactory.hasRole(DEFAULT_ADMIN_ROLE, maker.address)).to.be.true;
      expect(await escrowFactory.hasRole(ORCHESTRATOR_ROLE, maker.address)).to.be.true;
    });
  });

  describe("Access Control", function () {
    it("Should restrict orchestrator functions", async function () {
      // Note: Creating proper Immutables struct is complex, so we'll just verify access control
      await expect(
        escrowFactory.connect(taker).pause()
      ).to.be.revertedWithCustomError(escrowFactory, "AccessControlUnauthorizedAccount");
    });

    it("Should allow admin to pause", async function () {
      await escrowFactory.pause();
      expect(await escrowFactory.paused()).to.be.true;

      await escrowFactory.unpause();
      expect(await escrowFactory.paused()).to.be.false;
    });
  });
});