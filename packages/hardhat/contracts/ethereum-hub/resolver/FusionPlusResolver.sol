// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/ILimitOrderProtocol.sol";
import "../interfaces/IEscrowFactory.sol";
import "../libraries/ImmutablesLib.sol";
import "../libraries/TimelocksLib.sol";
import "../escrow/EscrowSrc.sol";
import "../escrow/EscrowDst.sol";

/**
 * @title FusionPlusResolver
 * @notice Resolver implementation for cross-chain atomic swaps
 * @dev Follows 1inch cross-chain-resolver-example pattern
 */
contract FusionPlusResolver is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ImmutablesLib for ImmutablesLib.Immutables;
    using TimelocksLib for TimelocksLib.Timelocks;

    // -- State --
    IEscrowFactory public immutable escrowFactory;
    ILimitOrderProtocol public immutable limitOrderProtocol;
    
    // Track active swaps for monitoring
    mapping(bytes32 => SwapSession) public swapSessions;
    
    struct SwapSession {
        address srcEscrow;
        address dstEscrow;
        bytes32 orderHash;
        uint256 createdAt;
        bool isActive;
    }

    // -- Events --
    event SwapInitiated(
        bytes32 indexed sessionId,
        address indexed srcEscrow,
        bytes32 orderHash
    );
    
    event SwapCompleted(
        bytes32 indexed sessionId,
        bytes32 secret
    );

    // -- Errors --
    error InvalidLength();
    error LengthMismatch();
    error InvalidEscrow();
    error SwapNotActive();
    error UnauthorizedCaller();

    // -- Constructor --
    constructor(
        IEscrowFactory _escrowFactory,
        ILimitOrderProtocol _limitOrderProtocol,
        address _initialOwner
    ) Ownable(_initialOwner) {
        escrowFactory = _escrowFactory;
        limitOrderProtocol = _limitOrderProtocol;
    }

    // Receive function for safety deposits
    receive() external payable {}

    /**
     * @notice Deploys source chain escrow and fills order
     * @dev Following 1inch pattern but adapted for our escrow system
     * @param immutables Escrow parameters
     * @param order 1inch limit order
     * @param r Signature r value
     * @param vs Signature vs value
     * @param amount Amount to fill
     * @param takerTraits Taker traits for order
     * @param args Additional arguments
     */
    function deploySrc(
        ImmutablesLib.Immutables calldata immutables,
        ILimitOrderProtocol.Order calldata order,
        bytes32 r,
        bytes32 vs,
        uint256 amount,
        uint256 takerTraits,
        bytes calldata args
    ) external payable onlyOwner nonReentrant {
        // Validate immutables
        require(immutables.validate(), "Invalid immutables");
        
        // Calculate escrow address
        address computed = escrowFactory.addressOfEscrowSrc(immutables);
        
        // Send safety deposit to future escrow address
        (bool success,) = computed.call{value: immutables.safetyDeposit}("");
        require(success, "Safety deposit failed");
        
        // Set target bit in takerTraits (1 << 251)
        takerTraits = takerTraits | (uint256(1) << 251);
        
        // Encode escrow as target
        bytes memory argsMem = abi.encodePacked(computed, args);
        
        // Fill order - this will trigger escrow creation
        limitOrderProtocol.fillOrderArgs(
            order,
            r,
            vs,
            amount,
            takerTraits,
            argsMem
        );
        
        // Create escrow through factory
        address srcEscrow = escrowFactory.createSrcEscrow{value: 0}(immutables);
        require(srcEscrow == computed, "Escrow address mismatch");
        
        // Create swap session
        bytes32 sessionId = keccak256(abi.encode(immutables.orderHash, block.timestamp));
        swapSessions[sessionId] = SwapSession({
            srcEscrow: srcEscrow,
            dstEscrow: address(0), // Will be set when dst is deployed
            orderHash: immutables.orderHash,
            createdAt: block.timestamp,
            isActive: true
        });
        
        emit SwapInitiated(sessionId, srcEscrow, immutables.orderHash);
    }

    /**
     * @notice Deploys destination chain escrow
     * @dev Must be called after source escrow is created
     * @param dstImmutables Destination chain immutables
     * @param srcCancellationTimestamp Source cancellation time
     * @param sessionId Session ID from deploySrc
     */
    function deployDst(
        ImmutablesLib.Immutables calldata dstImmutables,
        uint256 srcCancellationTimestamp,
        bytes32 sessionId
    ) external payable onlyOwner nonReentrant {
        SwapSession storage session = swapSessions[sessionId];
        require(session.isActive, "Invalid session");
        require(session.dstEscrow == address(0), "Dst already deployed");
        
        // Create destination escrow
        address dstEscrow = escrowFactory.createDstEscrow{value: msg.value}(
            dstImmutables,
            srcCancellationTimestamp
        );
        
        session.dstEscrow = dstEscrow;
    }

    /**
     * @notice Withdraws from escrow by revealing secret
     * @param escrow Escrow address to withdraw from
     * @param secret The secret that hashes to hashlock
     * @param immutables Escrow immutables for verification
     */
    function withdraw(
        address escrow,
        bytes32 secret,
        ImmutablesLib.Immutables calldata immutables
    ) external nonReentrant {
        // Verify escrow is valid
        require(escrowFactory.isValidEscrow(escrow), "Invalid escrow");
        
        // Try as source escrow first
        try EscrowSrc(payable(escrow)).withdraw(secret) {
            // Success - find and update session
            _updateSessionOnWithdraw(immutables.orderHash, secret);
        } catch {
            // Try as destination escrow
            EscrowDst(payable(escrow)).withdraw(secret);
            _updateSessionOnWithdraw(immutables.orderHash, secret);
        }
    }

    /**
     * @notice Cancels an escrow
     * @param escrow Escrow address to cancel
     * @param immutables Escrow immutables for verification
     */
    function cancel(
        address escrow,
        ImmutablesLib.Immutables calldata immutables
    ) external nonReentrant {
        // Verify escrow is valid
        require(escrowFactory.isValidEscrow(escrow), "Invalid escrow");
        
        // Try as source escrow first
        try EscrowSrc(payable(escrow)).cancel() {
            // Success
        } catch {
            // Try as destination escrow
            EscrowDst(payable(escrow)).cancel();
        }
    }

    /**
     * @notice Executes arbitrary calls for batch operations
     * @dev Following 1inch pattern for flexibility
     * @param targets Target addresses
     * @param arguments Call data for each target
     */
    function arbitraryCalls(
        address[] calldata targets,
        bytes[] calldata arguments
    ) external onlyOwner nonReentrant {
        uint256 length = targets.length;
        if (targets.length != arguments.length) revert LengthMismatch();
        
        for (uint256 i = 0; i < length; ++i) {
            (bool success, bytes memory returnData) = targets[i].call(arguments[i]);
            if (!success) {
                // Forward revert reason
                if (returnData.length > 0) {
                    assembly {
                        let returnData_size := mload(returnData)
                        revert(add(32, returnData), returnData_size)
                    }
                } else {
                    revert("Call failed");
                }
            }
        }
    }

    /**
     * @notice Gets active swap sessions for monitoring
     * @param sessionId Session ID
     * @return session The swap session details
     */
    function getSwapSession(bytes32 sessionId) external view returns (SwapSession memory) {
        return swapSessions[sessionId];
    }

    /**
     * @notice Emergency token recovery
     * @param token Token to recover
     * @param amount Amount to recover
     */
    function emergencyRecover(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            (bool success,) = owner().call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    // -- Internal Functions --

    /**
     * @notice Updates session when withdrawal happens
     * @param orderHash Order hash to find session
     * @param secret Revealed secret
     */
    function _updateSessionOnWithdraw(bytes32 orderHash, bytes32 secret) internal {
        // Find session by order hash
        bytes32 sessionId = _findSessionByOrderHash(orderHash);
        if (sessionId != bytes32(0)) {
            SwapSession storage session = swapSessions[sessionId];
            session.isActive = false;
            emit SwapCompleted(sessionId, secret);
        }
    }

    /**
     * @notice Finds session ID by order hash
     * @param orderHash Order hash to search for
     * @return sessionId Found session ID or zero
     */
    function _findSessionByOrderHash(bytes32 orderHash) internal view returns (bytes32) {
        // In production, this would be optimized with additional mappings
        // For hackathon, simple iteration is acceptable
        return bytes32(0); // Placeholder
    }
}