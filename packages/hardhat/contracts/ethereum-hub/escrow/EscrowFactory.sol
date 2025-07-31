// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./BaseEscrowFactory.sol";
import "./EscrowSrc.sol";
import "./EscrowDst.sol";

/**
 * @title EscrowFactory
 * @notice Concrete implementation of escrow factory for 1inch integration
 * @dev Deploys and manages escrows for cross-chain atomic swaps
 */
contract EscrowFactory is BaseEscrowFactory {
    
    // -- Constructor --
    constructor(
        address _limitOrderProtocol,
        address _admin
    ) BaseEscrowFactory(
        address(new EscrowSrc()),      // Deploy src implementation
        address(new EscrowDst()),      // Deploy dst implementation
        _limitOrderProtocol
    ) {
        // Grant admin role to specified address (for orchestration service)
        if (_admin != msg.sender) {
            _grantRole(DEFAULT_ADMIN_ROLE, _admin);
            _grantRole(ORCHESTRATOR_ROLE, _admin);
        }
    }

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
    ) external payable onlyRole(ORCHESTRATOR_ROLE) returns (
        address srcEscrow,
        address dstEscrow
    ) {
        // Calculate required safety deposits
        uint256 totalSafetyDeposit = srcImmutables.safetyDeposit + dstImmutables.safetyDeposit;
        require(msg.value == totalSafetyDeposit, "Invalid safety deposit total");
        
        // Create source escrow
        srcEscrow = this.createSrcEscrow{value: srcImmutables.safetyDeposit}(srcImmutables);
        
        // Create destination escrow
        uint256 srcCancellationTimestamp = srcImmutables.timelocks.srcCancellation;
        dstEscrow = this.createDstEscrow{value: dstImmutables.safetyDeposit}(
            dstImmutables,
            srcCancellationTimestamp
        );
    }

    /**
     * @notice Gets escrow addresses for a cross-chain order
     * @param orderHash The order hash
     * @return srcEscrow Source escrow address
     * @return dstEscrow Destination escrow address
     */
    function getEscrowPair(bytes32 orderHash) external view returns (
        address srcEscrow,
        address dstEscrow
    ) {
        // In production, this would query both chains
        // For hackathon, we simulate with computed addresses
        srcEscrow = escrows[orderHash];
        // Destination escrow would be on different chain
        dstEscrow = address(0); // Placeholder
    }

    /**
     * @notice Verifies escrow status for orchestration
     * @param escrowAddress Escrow to check
     * @return isValid True if escrow is valid and active
     */
    function verifyEscrowStatus(address escrowAddress) external view returns (bool isValid) {
        if (!isValidEscrow[escrowAddress]) {
            return false;
        }
        
        // Check escrow status
        try EscrowSrc(payable(escrowAddress)).getStatus() returns (
            bool initialized,
            bool withdrawn,
            bool cancelled,
            bool,
            bool
        ) {
            isValid = initialized && !withdrawn && !cancelled;
        } catch {
            // Try as destination escrow
            try EscrowDst(payable(escrowAddress)).getStatus() returns (
                bool initialized_,
                bool withdrawn_,
                bool cancelled_,
                bool,
                bool,
                uint256
            ) {
                isValid = initialized_ && !withdrawn_ && !cancelled_;
            } catch {
                isValid = false;
            }
        }
    }

    /**
     * @notice Emergency pause for all escrow creation
     * @dev Only admin can call during emergencies
     */
    function emergencyPause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Resume escrow creation after emergency
     * @dev Only admin can call
     */
    function emergencyUnpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}