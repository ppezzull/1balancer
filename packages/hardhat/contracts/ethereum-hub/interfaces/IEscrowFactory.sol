// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "../libraries/ImmutablesLib.sol";

/**
 * @title IEscrowFactory
 * @notice Interface for 1inch-compatible escrow factory
 * @dev Creates escrows for cross-chain atomic swaps following 1inch patterns
 */
interface IEscrowFactory {

    /**
     * @notice Creates a source chain escrow
     * @param immutables Escrow parameters
     * @return escrow Address of created escrow
     */
    function createSrcEscrow(ImmutablesLib.Immutables calldata immutables) 
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
        ImmutablesLib.Immutables calldata immutables,
        uint256 srcCancellationTimestamp
    ) external payable returns (address escrow);

    /**
     * @notice Computes the address of a source escrow
     * @param immutables Escrow parameters
     * @return escrowAddress Computed escrow address
     */
    function addressOfEscrowSrc(ImmutablesLib.Immutables calldata immutables) 
        external 
        view 
        returns (address escrowAddress);

    /**
     * @notice Computes the address of a destination escrow
     * @param immutables Escrow parameters
     * @return escrowAddress Computed escrow address
     */
    function addressOfEscrowDst(ImmutablesLib.Immutables calldata immutables)
        external
        view
        returns (address escrowAddress);

    /**
     * @notice Creates escrows for orchestration service
     * @dev Batch creation for efficiency
     * @param srcImmutables Source chain immutables
     * @param dstImmutables Destination chain immutables
     * @return srcEscrow Source escrow address
     * @return dstEscrow Destination escrow address
     */
    function createEscrowPair(
        ImmutablesLib.Immutables calldata srcImmutables,
        ImmutablesLib.Immutables calldata dstImmutables
    ) external payable returns (
        address srcEscrow,
        address dstEscrow
    );

    /**
     * @notice Checks if an address is a valid escrow created by this factory
     * @param escrow Address to check
     * @return True if the address is a valid escrow
     */
    function isValidEscrow(address escrow) external view returns (bool);

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