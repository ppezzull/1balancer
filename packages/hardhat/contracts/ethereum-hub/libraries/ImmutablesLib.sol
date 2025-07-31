// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./TimelocksLib.sol";

/**
 * @title ImmutablesLib
 * @notice Library for managing escrow immutable parameters
 * @dev Based on 1inch cross-chain-swap pattern for parameter encoding
 */
library ImmutablesLib {
    using TimelocksLib for TimelocksLib.Timelocks;

    struct Immutables {
        address maker;
        address taker;
        address token;
        uint256 amount;
        uint256 safetyDeposit;
        bytes32 hashlockHash;
        TimelocksLib.Timelocks timelocks;
        bytes32 orderHash;       // Link to 1inch order
        uint256 chainId;         // Target chain for cross-chain swaps
    }

    /**
     * @notice Hashes the immutable parameters for escrow address calculation
     * @param immutables The immutable parameters
     * @return hash The hash of the parameters
     */
    function hash(Immutables memory immutables) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            immutables.maker,
            immutables.taker,
            immutables.token,
            immutables.amount,
            immutables.safetyDeposit,
            immutables.hashlockHash,
            immutables.timelocks.encode(),
            immutables.orderHash,
            immutables.chainId
        ));
    }

    /**
     * @notice Validates immutable parameters
     * @param immutables The parameters to validate
     * @return valid True if parameters are valid
     */
    function validate(Immutables memory immutables) internal view returns (bool valid) {
        valid = immutables.maker != address(0) &&
                immutables.taker != address(0) &&
                immutables.token != address(0) &&
                immutables.amount > 0 &&
                immutables.hashlockHash != bytes32(0) &&
                immutables.timelocks.validate() &&
                immutables.chainId > 0;
    }

    /**
     * @notice Creates immutables for source chain escrow
     * @param maker The maker address
     * @param taker The taker address
     * @param token The token address
     * @param amount The token amount
     * @param hashlockHash The hashlock hash
     * @param duration The swap duration
     * @param orderHash The 1inch order hash
     * @param destinationChainId The destination chain ID
     * @return immutables The created immutables
     */
    function createForSource(
        address maker,
        address taker,
        address token,
        uint256 amount,
        bytes32 hashlockHash,
        uint32 duration,
        bytes32 orderHash,
        uint256 destinationChainId
    ) internal view returns (Immutables memory immutables) {
        immutables = Immutables({
            maker: maker,
            taker: taker,
            token: token,
            amount: amount,
            safetyDeposit: calculateSafetyDeposit(amount),
            hashlockHash: hashlockHash,
            timelocks: TimelocksLib.create(duration),
            orderHash: orderHash,
            chainId: destinationChainId
        });
    }

    /**
     * @notice Creates immutables for destination chain escrow
     * @param sourceImmutables The source chain immutables
     * @param destinationToken The token on destination chain
     * @param destinationAmount The amount on destination chain
     * @return immutables The created immutables
     */
    function createForDestination(
        Immutables memory sourceImmutables,
        address destinationToken,
        uint256 destinationAmount
    ) internal view returns (Immutables memory immutables) {
        // Swap maker and taker for destination chain
        immutables = Immutables({
            maker: sourceImmutables.taker,  // Taker becomes maker on destination
            taker: sourceImmutables.maker,  // Maker becomes taker on destination
            token: destinationToken,
            amount: destinationAmount,
            safetyDeposit: calculateSafetyDeposit(destinationAmount),
            hashlockHash: sourceImmutables.hashlockHash,  // Same hashlock
            timelocks: sourceImmutables.timelocks,        // Same timelocks
            orderHash: sourceImmutables.orderHash,         // Same order hash
            chainId: block.chainid                         // Current chain ID
        });
    }

    /**
     * @notice Calculates safety deposit amount (0.1% of swap amount)
     * @param amount The swap amount
     * @return deposit The safety deposit amount
     */
    function calculateSafetyDeposit(uint256 amount) internal pure returns (uint256 deposit) {
        deposit = amount / 1000; // 0.1%
        if (deposit == 0) {
            deposit = 1; // Minimum 1 wei
        }
    }

    /**
     * @notice Encodes immutables for efficient storage/transmission
     * @param immutables The immutables to encode
     * @return encoded The encoded immutables
     */
    function encode(Immutables memory immutables) internal pure returns (bytes memory encoded) {
        encoded = abi.encode(
            immutables.maker,
            immutables.taker,
            immutables.token,
            immutables.amount,
            immutables.safetyDeposit,
            immutables.hashlockHash,
            immutables.timelocks.encode(),
            immutables.orderHash,
            immutables.chainId
        );
    }

    /**
     * @notice Decodes immutables from bytes
     * @param encoded The encoded immutables
     * @return immutables The decoded immutables
     */
    function decode(bytes memory encoded) internal pure returns (Immutables memory immutables) {
        bytes32 timelocksEncoded;
        
        (
            immutables.maker,
            immutables.taker,
            immutables.token,
            immutables.amount,
            immutables.safetyDeposit,
            immutables.hashlockHash,
            timelocksEncoded,
            immutables.orderHash,
            immutables.chainId
        ) = abi.decode(encoded, (address, address, address, uint256, uint256, bytes32, bytes32, bytes32, uint256));
        
        immutables.timelocks = TimelocksLib.decode(timelocksEncoded);
    }

    /**
     * @notice Checks if the maker can withdraw (during withdrawal window)
     * @param immutables The immutables to check
     * @param isSource True if checking source chain
     * @return canWithdraw True if maker can withdraw
     */
    function makerCanWithdraw(
        Immutables memory immutables,
        bool isSource
    ) internal view returns (bool) {
        return immutables.timelocks.canWithdraw(isSource, false);
    }

    /**
     * @notice Checks if anyone can withdraw (public withdrawal phase)
     * @param immutables The immutables to check
     * @param isSource True if checking source chain
     * @return canWithdraw True if public withdrawal is allowed
     */
    function publicCanWithdraw(
        Immutables memory immutables,
        bool isSource
    ) internal view returns (bool) {
        return immutables.timelocks.canWithdraw(isSource, true);
    }

    /**
     * @notice Checks if the escrow can be cancelled
     * @param immutables The immutables to check
     * @param isSource True if checking source chain
     * @return canCancel True if cancellation is allowed
     */
    function canCancel(
        Immutables memory immutables,
        bool isSource
    ) internal view returns (bool) {
        return immutables.timelocks.canCancel(isSource);
    }
}