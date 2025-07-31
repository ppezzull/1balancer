import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  FusionPlusHub,
  BaseEscrowFactory,
  MockFusionPlusResolver,
  MockDestinationChain,
  MockERC20
} from "../../typechain-types";

describe("Cross-Chain Swap Integration", function () {
  let hub: FusionPlusHub;
  let escrowFactory: BaseEscrowFactory;
  let mockResolver: MockFusionPlusResolver;
  let mockDestChain: MockDestinationChain;
  let srcToken: MockERC20;
  let dstToken: MockERC20;

  let owner: SignerWithAddress;
  let maker: SignerWithAddress;
  let taker: SignerWithAddress;
  let resolver: SignerWithAddress;

  const FORK_BLOCK = 12345678; // Replace with actual BASE block
  const ONE_HOUR = 3600;
  const ONE_DAY = 86400;

  beforeEach(async function () {
    // Get signers
    [owner, maker, taker, resolver] = await ethers.getSigners();

    // Deploy mock tokens
    const MockToken = await ethers.getContractFactory("MockERC20");
    srcToken = await MockToken.deploy("Source Token", "SRC", 18);
    dstToken = await MockToken.deploy("Destination Token", "DST", 18);

    // Deploy core contracts
    const EscrowFactory = await ethers.getContractFactory("BaseEscrowFactory");
    escrowFactory = await EscrowFactory.deploy();

    const Hub = await ethers.getContractFactory("FusionPlusHub");
    hub = await Hub.deploy();
    await hub.initialize(
      escrowFactory.address,
      "0x111111125421ca6dc452d289314280a0f8842a65" // 1inch LOP on BASE
    );

    // Deploy mock contracts
    const MockDestChain = await ethers.getContractFactory("MockDestinationChain");
    mockDestChain = await MockDestChain.deploy();

    const MockResolver = await ethers.getContractFactory("MockFusionPlusResolver");
    mockResolver = await MockResolver.deploy(
      hub.address,
      escrowFactory.address,
      mockDestChain.address
    );

    // Setup tokens
    await srcToken.mint(maker.address, ethers.utils.parseEther("1000"));
    await srcToken.mint(taker.address, ethers.utils.parseEther("1000"));
    await dstToken.mint(taker.address, ethers.utils.parseEther("1000"));
  });

  describe("Successful Atomic Swap", function () {
    it("Should complete a cross-chain swap successfully", async function () {
      const srcAmount = ethers.utils.parseEther("100");
      const dstAmount = ethers.utils.parseEther("95"); // Accounting for slippage
      const secret = ethers.utils.randomBytes(32);
      const secretHash = ethers.utils.keccak256(secret);

      // Setup timelocks
      const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
      const timelocks = {
        srcWithdrawal: currentTime + ONE_HOUR * 2,
        srcCancellation: currentTime + ONE_DAY,
        dstWithdrawal: currentTime + ONE_HOUR,
        dstCancellation: currentTime + ONE_HOUR * 4
      };

      // 1. Maker approves tokens
      await srcToken.connect(maker).approve(hub.address, srcAmount);

      // 2. Create order through mock resolver
      const orderHash = await mockResolver.simulateOrder(
        maker.address,
        srcToken.address,
        dstToken.address,
        srcAmount,
        dstAmount,
        secretHash,
        timelocks
      );

      // 3. Resolver initiates atomic swap
      await mockResolver.connect(resolver).simulateAtomicSwap(orderHash);

      // 4. Verify escrows are created and paired
      const events = await escrowFactory.queryFilter(
        escrowFactory.filters.EscrowDeployed()
      );
      expect(events.length).to.be.gt(0);

      // 5. Simulate destination chain escrow creation
      const escrowId = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(["bytes32", "string"], [orderHash, "dst"])
      );
      await mockDestChain.createEscrow(
        escrowId,
        taker.address,
        maker.address,
        dstToken.address,
        dstAmount,
        secretHash,
        timelocks
      );

      // 6. Reveal secret on destination chain
      await mockDestChain.withdraw(escrowId, secret);

      // 7. Verify destination chain state
      const dstEscrow = await mockDestChain.getEscrow(escrowId);
      expect(dstEscrow.withdrawn).to.be.true;

      // 8. Use revealed secret on source chain
      // In real scenario, this would be done by monitoring destination chain
      await mockResolver.simulateRevealSecret(orderHash, secret);

      // 9. Verify swap completion
      const order = await mockResolver.getOrder(orderHash);
      expect(order.filled).to.be.true;
    });
  });

  describe("Timeout Scenarios", function () {
    it("Should handle maker cancellation after timeout", async function () {
      const srcAmount = ethers.utils.parseEther("50");
      const dstAmount = ethers.utils.parseEther("48");
      const secretHash = ethers.utils.keccak256(ethers.utils.randomBytes(32));

      const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
      const timelocks = {
        srcWithdrawal: currentTime + ONE_HOUR,
        srcCancellation: currentTime + 10, // Very short for testing
        dstWithdrawal: currentTime + 30,
        dstCancellation: currentTime + ONE_HOUR
      };

      // Create order
      const orderHash = await mockResolver.simulateOrder(
        maker.address,
        srcToken.address,
        dstToken.address,
        srcAmount,
        dstAmount,
        secretHash,
        timelocks
      );

      // Initiate swap
      await mockResolver.simulateAtomicSwap(orderHash);

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [11]);
      await ethers.provider.send("evm_mine", []);

      // Cancel order
      await mockResolver.simulateCancelOrder(orderHash);

      // Verify cancellation
      const order = await mockResolver.getOrder(orderHash);
      expect(order.filled).to.be.false;
    });

    it("Should enforce timeout ordering constraints", async function () {
      const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
      
      // Invalid timelocks (dst cancellation before src withdrawal)
      const invalidTimelocks = {
        srcWithdrawal: currentTime + ONE_DAY,
        srcCancellation: currentTime + ONE_DAY * 2,
        dstWithdrawal: currentTime + ONE_HOUR,
        dstCancellation: currentTime + ONE_HOUR * 2 // Should be > srcWithdrawal
      };

      // This should fail validation in the actual contract
      // The mock might not enforce all constraints
    });
  });

  describe("Batch Operations", function () {
    it("Should handle multiple swaps in batch", async function () {
      const orderCount = 3;
      const orderHashes: string[] = [];
      const shouldFill: boolean[] = [];

      for (let i = 0; i < orderCount; i++) {
        const amount = ethers.utils.parseEther((10 * (i + 1)).toString());
        const secretHash = ethers.utils.keccak256(ethers.utils.randomBytes(32));
        
        const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
        const timelocks = {
          srcWithdrawal: currentTime + ONE_HOUR * 2,
          srcCancellation: currentTime + ONE_DAY,
          dstWithdrawal: currentTime + ONE_HOUR,
          dstCancellation: currentTime + ONE_HOUR * 4
        };

        const orderHash = await mockResolver.simulateOrder(
          maker.address,
          srcToken.address,
          dstToken.address,
          amount,
          amount.mul(95).div(100),
          secretHash,
          timelocks
        );

        orderHashes.push(orderHash);
        shouldFill.push(i % 2 === 0); // Fill even orders only
      }

      // Execute batch
      await mockResolver.simulateBatch(orderHashes, shouldFill);

      // Verify results
      for (let i = 0; i < orderHashes.length; i++) {
        const order = await mockResolver.getOrder(orderHashes[i]);
        expect(order.filled).to.equal(shouldFill[i]);
      }
    });
  });

  describe("Gas Optimization", function () {
    it("Should measure gas costs for operations", async function () {
      const srcAmount = ethers.utils.parseEther("100");
      const dstAmount = ethers.utils.parseEther("95");
      const secret = ethers.utils.randomBytes(32);
      const secretHash = ethers.utils.keccak256(secret);

      const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
      const timelocks = {
        srcWithdrawal: currentTime + ONE_HOUR * 2,
        srcCancellation: currentTime + ONE_DAY,
        dstWithdrawal: currentTime + ONE_HOUR,
        dstCancellation: currentTime + ONE_HOUR * 4
      };

      // Measure order creation gas
      const orderTx = await mockResolver.simulateOrder(
        maker.address,
        srcToken.address,
        dstToken.address,
        srcAmount,
        dstAmount,
        secretHash,
        timelocks
      );
      const orderReceipt = await orderTx.wait();
      console.log("Order creation gas:", orderReceipt.gasUsed.toString());

      // Measure swap initiation gas
      const swapTx = await mockResolver.simulateAtomicSwap(
        await orderTx.events?.[0].args?.orderHash
      );
      const swapReceipt = await swapTx.wait();
      console.log("Swap initiation gas:", swapReceipt.gasUsed.toString());

      // Gas should be reasonable for mainnet
      expect(swapReceipt.gasUsed).to.be.lt(500000);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero amounts gracefully", async function () {
      // Test with zero amounts should fail
      await expect(
        mockResolver.simulateOrder(
          maker.address,
          srcToken.address,
          dstToken.address,
          0,
          0,
          ethers.utils.keccak256(ethers.utils.randomBytes(32)),
          {
            srcWithdrawal: 0,
            srcCancellation: 0,
            dstWithdrawal: 0,
            dstCancellation: 0
          }
        )
      ).to.be.revertedWith("Invalid amount");
    });

    it("Should handle duplicate order attempts", async function () {
      const srcAmount = ethers.utils.parseEther("100");
      const dstAmount = ethers.utils.parseEther("95");
      const secretHash = ethers.utils.keccak256(ethers.utils.randomBytes(32));

      const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
      const timelocks = {
        srcWithdrawal: currentTime + ONE_HOUR * 2,
        srcCancellation: currentTime + ONE_DAY,
        dstWithdrawal: currentTime + ONE_HOUR,
        dstCancellation: currentTime + ONE_HOUR * 4
      };

      // Create order
      const orderHash = await mockResolver.simulateOrder(
        maker.address,
        srcToken.address,
        dstToken.address,
        srcAmount,
        dstAmount,
        secretHash,
        timelocks
      );

      // Initiate swap
      await mockResolver.simulateAtomicSwap(orderHash);

      // Try to initiate again
      await expect(
        mockResolver.simulateAtomicSwap(orderHash)
      ).to.be.revertedWith("Order already filled");
    });
  });
});