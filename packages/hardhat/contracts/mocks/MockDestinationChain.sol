// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "../ethereum-hub/libraries/TimelocksLib.sol";

/**
 * @title MockDestinationChain
 * @notice Simulates destination chain (NEAR) behavior for testing
 * @dev Used to test cross-chain coordination without actual cross-chain calls
 */
contract MockDestinationChain {
    using TimelocksLib for TimelocksLib.Timelocks;

    // Simulated NEAR escrows
    mapping(bytes32 => DestinationEscrow) public escrows;
    mapping(address => uint256) public balances;

    struct DestinationEscrow {
        address maker;
        address taker;
        address token;
        uint256 amount;
        bytes32 secretHash;
        TimelocksLib.Timelocks timelocks;
        bool exists;
        bool withdrawn;
        bool cancelled;
    }

    event EscrowCreated(bytes32 indexed escrowId, address maker, address taker);
    event SecretRevealed(bytes32 indexed escrowId, bytes32 secret);
    event EscrowWithdrawn(bytes32 indexed escrowId, address recipient);
    event EscrowCancelled(bytes32 indexed escrowId);

    /**
     * @notice Simulate creating an escrow on destination chain
     */
    function createEscrow(
        bytes32 escrowId,
        address maker,
        address taker,
        address token,
        uint256 amount,
        bytes32 secretHash,
        TimelocksLib.Timelocks calldata timelocks
    ) external {
        require(!escrows[escrowId].exists, "Escrow already exists");
        
        // Validate timelocks for destination chain
        require(
            timelocks.dstWithdrawal < timelocks.dstCancellation,
            "Invalid destination timelocks"
        );

        escrows[escrowId] = DestinationEscrow({
            maker: maker,
            taker: taker,
            token: token,
            amount: amount,
            secretHash: secretHash,
            timelocks: timelocks,
            exists: true,
            withdrawn: false,
            cancelled: false
        });

        // Simulate token lock
        balances[address(this)] += amount;

        emit EscrowCreated(escrowId, maker, taker);
    }

    /**
     * @notice Simulate withdrawing with secret on destination chain
     */
    function withdraw(bytes32 escrowId, bytes32 secret) external {
        DestinationEscrow storage escrow = escrows[escrowId];
        require(escrow.exists, "Escrow does not exist");
        require(!escrow.withdrawn, "Already withdrawn");
        require(!escrow.cancelled, "Already cancelled");
        require(keccak256(abi.encode(secret)) == escrow.secretHash, "Invalid secret");
        require(block.timestamp <= escrow.timelocks.dstWithdrawal, "Withdrawal expired");

        escrow.withdrawn = true;
        
        // Simulate token transfer
        balances[address(this)] -= escrow.amount;
        balances[escrow.maker] += escrow.amount;

        emit SecretRevealed(escrowId, secret);
        emit EscrowWithdrawn(escrowId, escrow.maker);
    }

    /**
     * @notice Simulate cancelling escrow on destination chain
     */
    function cancel(bytes32 escrowId) external {
        DestinationEscrow storage escrow = escrows[escrowId];
        require(escrow.exists, "Escrow does not exist");
        require(!escrow.withdrawn, "Already withdrawn");
        require(!escrow.cancelled, "Already cancelled");
        require(
            block.timestamp > escrow.timelocks.dstCancellation,
            "Cannot cancel yet"
        );

        escrow.cancelled = true;
        
        // Simulate token return
        balances[address(this)] -= escrow.amount;
        balances[escrow.taker] += escrow.amount;

        emit EscrowCancelled(escrowId);
    }

    /**
     * @notice Get escrow details
     */
    function getEscrow(bytes32 escrowId) external view returns (
        address maker,
        address taker,
        uint256 amount,
        bool withdrawn,
        bool cancelled,
        uint256 withdrawalDeadline,
        uint256 cancellationTime
    ) {
        DestinationEscrow memory escrow = escrows[escrowId];
        require(escrow.exists, "Escrow does not exist");

        return (
            escrow.maker,
            escrow.taker,
            escrow.amount,
            escrow.withdrawn,
            escrow.cancelled,
            escrow.timelocks.dstWithdrawal,
            escrow.timelocks.dstCancellation
        );
    }

    /**
     * @notice Check if secret has been revealed
     */
    function isSecretRevealed(bytes32 escrowId) external view returns (bool) {
        return escrows[escrowId].withdrawn;
    }

    /**
     * @notice Get balance for testing
     */
    function getBalance(address account) external view returns (uint256) {
        return balances[account];
    }

    /**
     * @notice Simulate cross-chain message delay
     */
    function simulateMessageDelay(uint256 /* delay */) external pure {
        // In real scenario, this would simulate network delays
        // For testing, we can use Hardhat's time manipulation
    }

    /**
     * @notice Batch operations for testing multiple escrows
     */
    function createMultipleEscrows(
        bytes32[] calldata escrowIds,
        address[] calldata makers,
        address[] calldata takers,
        uint256[] calldata amounts,
        bytes32[] calldata secretHashes,
        TimelocksLib.Timelocks[] calldata timelocks
    ) external {
        require(
            escrowIds.length == makers.length &&
            makers.length == takers.length &&
            takers.length == amounts.length &&
            amounts.length == secretHashes.length &&
            secretHashes.length == timelocks.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < escrowIds.length; i++) {
            this.createEscrow(
                escrowIds[i],
                makers[i],
                takers[i],
                address(0), // Simplified for testing
                amounts[i],
                secretHashes[i],
                timelocks[i]
            );
        }
    }

    /**
     * @notice Reset state for testing
     */
    function reset() external {
        // Only for testing - would not exist in production
        // Hardhat will reset state between tests
    }
}