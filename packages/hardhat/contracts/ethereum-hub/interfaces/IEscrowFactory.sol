// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IEscrowFactory
 * @notice Interface for 1inch-compatible escrow factory
 * @dev Creates escrows for cross-chain atomic swaps following 1inch patterns
 */
interface IEscrowFactory {
    /**
     * @notice Immutable parameters for escrow creation
     * @dev Matches 1inch cross-chain-swap pattern
     */
    struct Immutables {
        address maker;
        address taker;
        address token;
        uint256 amount;
        uint256 safetyDeposit;
        bytes32 hashlockHash;
        Timelocks timelocks;
    }

    /**
     * @notice Timelock configuration for cross-chain coordination
     */
    struct Timelocks {
        uint256 srcDeployedAt;
        uint256 srcWithdrawal;
        uint256 srcPublicWithdrawal;
        uint256 srcCancellation;
        uint256 dstDeployedAt;
        uint256 dstWithdrawal;
        uint256 dstCancellation;
    }

    /**
     * @notice Creates a source chain escrow
     * @param immutables Escrow parameters
     * @return escrow Address of created escrow
     */
    function createSrcEscrow(Immutables calldata immutables) 
        external 
        payable 
        returns (address escrow);

    /**
     * @notice Creates a destination chain escrow
     * @param immutables Escrow parameters
     * @param srcCancellationTimestamp Source chain cancellation timestamp
     * @return escrow Address of created escrow
     */
    function createDstEscrow(
        Immutables calldata immutables,
        uint256 srcCancellationTimestamp
    ) external payable returns (address escrow);

    /**
     * @notice Computes the address of a source escrow
     * @param immutables Escrow parameters
     * @return escrowAddress Computed escrow address
     */
    function addressOfEscrowSrc(Immutables calldata immutables) 
        external 
        view 
        returns (address escrowAddress);

    /**
     * @notice Computes the address of a destination escrow
     * @param immutables Escrow parameters
     * @return escrowAddress Computed escrow address
     */
    function addressOfEscrowDst(Immutables calldata immutables)
        external
        view
        returns (address escrowAddress);

    /**
     * @notice Emitted when source escrow is created
     */
    event SrcEscrowCreated(
        address indexed escrow,
        address indexed maker,
        address indexed taker,
        bytes32 hashlockHash
    );

    /**
     * @notice Emitted when destination escrow is created
     */
    event DstEscrowCreated(
        address indexed escrow,
        address indexed maker,
        address indexed taker,
        bytes32 hashlockHash
    );
}