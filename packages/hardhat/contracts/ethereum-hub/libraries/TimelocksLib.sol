// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title TimelocksLib
 * @notice Library for managing cross-chain timelock coordination
 * @dev Based on 1inch cross-chain-swap timelock pattern
 */
library TimelocksLib {
    struct Timelocks {
        uint32 srcWithdrawal;        // Withdrawal time on source chain
        uint32 srcPublicWithdrawal;  // Public withdrawal time on source chain
        uint32 srcCancellation;      // Cancellation time on source chain
        uint32 srcDeployedAt;        // Deployment timestamp on source chain
        uint32 dstWithdrawal;        // Withdrawal time on destination chain
        uint32 dstCancellation;      // Cancellation time on destination chain
        uint32 dstDeployedAt;        // Deployment timestamp on destination chain
    }

    // Constants for timeout calculations
    uint32 private constant MIN_CROSS_CHAIN_DELAY = 30 minutes;
    uint32 private constant SAFETY_BUFFER = 2 hours;
    uint32 private constant MAX_DURATION = 7 days;

    /**
     * @notice Creates timelocks for cross-chain atomic swap
     * @param baseDuration Base duration for the swap
     * @return timelocks Configured timelock structure
     */
    function create(uint32 baseDuration) internal view returns (Timelocks memory timelocks) {
        require(baseDuration >= MIN_CROSS_CHAIN_DELAY, "Duration too short");
        require(baseDuration <= MAX_DURATION, "Duration too long");

        uint32 currentTime = uint32(block.timestamp);
        
        // Source chain timelocks
        timelocks.srcDeployedAt = currentTime;
        timelocks.srcWithdrawal = currentTime + baseDuration;
        timelocks.srcPublicWithdrawal = currentTime + baseDuration + SAFETY_BUFFER;
        timelocks.srcCancellation = currentTime + baseDuration + (2 * SAFETY_BUFFER);
        
        // Destination chain timelocks (shorter to ensure atomic execution)
        timelocks.dstDeployedAt = currentTime;
        timelocks.dstWithdrawal = currentTime + (baseDuration / 2);
        timelocks.dstCancellation = currentTime + baseDuration - SAFETY_BUFFER;
    }

    /**
     * @notice Validates timelocks for safety
     * @param timelocks Timelocks to validate
     * @return valid True if timelocks are safe for cross-chain execution
     */
    function validate(Timelocks memory timelocks) internal view returns (bool valid) {
        uint32 currentTime = uint32(block.timestamp);
        
        // Basic timestamp ordering validation
        valid = timelocks.srcWithdrawal > timelocks.srcDeployedAt &&
                timelocks.srcPublicWithdrawal > timelocks.srcWithdrawal &&
                timelocks.srcCancellation > timelocks.srcPublicWithdrawal &&
                timelocks.dstWithdrawal > timelocks.dstDeployedAt &&
                timelocks.dstCancellation > timelocks.dstWithdrawal &&
                // Cross-chain safety: dst cancellation before src withdrawal
                timelocks.dstCancellation < timelocks.srcWithdrawal &&
                // Current time validation
                currentTime >= timelocks.srcDeployedAt;
    }

    /**
     * @notice Sets the deployed timestamp for a chain
     * @param timelocks Timelocks structure
     * @param timestamp Deployment timestamp
     * @param isSource True for source chain, false for destination
     */
    function setDeployedAt(
        Timelocks memory timelocks,
        uint32 timestamp,
        bool isSource
    ) internal pure returns (Timelocks memory) {
        if (isSource) {
            timelocks.srcDeployedAt = timestamp;
        } else {
            timelocks.dstDeployedAt = timestamp;
        }
        return timelocks;
    }

    /**
     * @notice Checks if withdrawal is allowed
     * @param timelocks Timelocks structure
     * @param isSource True for source chain, false for destination
     * @param isPublic True for public withdrawal phase
     * @return allowed True if withdrawal is allowed
     */
    function canWithdraw(
        Timelocks memory timelocks,
        bool isSource,
        bool isPublic
    ) internal view returns (bool allowed) {
        uint32 currentTime = uint32(block.timestamp);
        
        if (isSource) {
            if (isPublic) {
                allowed = currentTime >= timelocks.srcPublicWithdrawal &&
                         currentTime < timelocks.srcCancellation;
            } else {
                allowed = currentTime >= timelocks.srcWithdrawal &&
                         currentTime < timelocks.srcCancellation;
            }
        } else {
            allowed = currentTime >= timelocks.dstWithdrawal &&
                     currentTime < timelocks.dstCancellation;
        }
    }

    /**
     * @notice Checks if cancellation is allowed
     * @param timelocks Timelocks structure
     * @param isSource True for source chain, false for destination
     * @return allowed True if cancellation is allowed
     */
    function canCancel(
        Timelocks memory timelocks,
        bool isSource
    ) internal view returns (bool allowed) {
        uint32 currentTime = uint32(block.timestamp);
        
        if (isSource) {
            allowed = currentTime >= timelocks.srcCancellation;
        } else {
            allowed = currentTime >= timelocks.dstCancellation;
        }
    }

    /**
     * @notice Encodes timelocks into bytes32 for efficient storage
     * @param timelocks Timelocks to encode
     * @return encoded Encoded timelocks
     */
    function encode(Timelocks memory timelocks) internal pure returns (bytes32 encoded) {
        encoded = bytes32(
            (uint256(timelocks.srcWithdrawal) << 224) |
            (uint256(timelocks.srcPublicWithdrawal) << 192) |
            (uint256(timelocks.srcCancellation) << 160) |
            (uint256(timelocks.srcDeployedAt) << 128) |
            (uint256(timelocks.dstWithdrawal) << 96) |
            (uint256(timelocks.dstCancellation) << 64) |
            (uint256(timelocks.dstDeployedAt) << 32)
        );
    }

    /**
     * @notice Decodes timelocks from bytes32
     * @param encoded Encoded timelocks
     * @return timelocks Decoded timelocks
     */
    function decode(bytes32 encoded) internal pure returns (Timelocks memory timelocks) {
        timelocks.srcWithdrawal = uint32(uint256(encoded) >> 224);
        timelocks.srcPublicWithdrawal = uint32(uint256(encoded) >> 192);
        timelocks.srcCancellation = uint32(uint256(encoded) >> 160);
        timelocks.srcDeployedAt = uint32(uint256(encoded) >> 128);
        timelocks.dstWithdrawal = uint32(uint256(encoded) >> 96);
        timelocks.dstCancellation = uint32(uint256(encoded) >> 64);
        timelocks.dstDeployedAt = uint32(uint256(encoded) >> 32);
    }
}