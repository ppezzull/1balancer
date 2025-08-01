// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../libraries/ImmutablesLib.sol";
import "../libraries/TimelocksLib.sol";

/**
 * @title EscrowSrc
 * @notice Source chain escrow for cross-chain atomic swaps
 * @dev Works with orchestration service for Fusion+ cross-chain swaps
 */
contract EscrowSrc is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ImmutablesLib for ImmutablesLib.Immutables;
    using TimelocksLib for TimelocksLib.Timelocks;

    // -- State --
    ImmutablesLib.Immutables private _immutables;
    bool private _initialized;
    bool private _withdrawn;
    bool private _cancelled;
    bytes32 private _revealedSecret;

    // -- Events --
    event EscrowInitialized(
        address indexed maker,
        address indexed taker,
        uint256 amount,
        bytes32 hashlockHash
    );
    
    event SecretRevealed(bytes32 indexed hashlockHash, bytes32 secret);
    event FundsWithdrawn(address indexed recipient, uint256 amount);
    event EscrowCancelled(address indexed maker);

    // -- Errors --
    error AlreadyInitialized();
    error NotInitialized();
    error AlreadyWithdrawn();
    error AlreadyCancelled();
    error InvalidSecret();
    error NotInWithdrawalWindow();
    error NotInCancellationWindow();
    error UnauthorizedCaller();
    error TransferFailed();

    // -- Modifiers --
    modifier onlyInitialized() {
        if (!_initialized) revert NotInitialized();
        _;
    }

    /**
     * @notice Initializes the escrow with immutable parameters
     * @dev Called by factory immediately after deployment
     * @param encodedImmutables Encoded immutable parameters
     */
    function initialize(bytes calldata encodedImmutables) external payable {
        if (_initialized) revert AlreadyInitialized();
        
        _immutables = ImmutablesLib.decode(encodedImmutables);
        _initialized = true;
        
        // Validate safety deposit
        require(msg.value == _immutables.safetyDeposit, "Invalid safety deposit");
        
        emit EscrowInitialized(
            _immutables.maker,
            _immutables.taker,
            _immutables.amount,
            _immutables.hashlockHash
        );
    }

    /**
     * @notice Withdraws funds by revealing the secret
     * @dev Can be called by taker or orchestration service
     * @param secret The secret that hashes to hashlockHash
     */
    function withdraw(bytes32 secret) external nonReentrant onlyInitialized {
        if (_withdrawn) revert AlreadyWithdrawn();
        if (_cancelled) revert AlreadyCancelled();
        
        // Verify secret
        if (keccak256(abi.encodePacked(secret)) != _immutables.hashlockHash) {
            revert InvalidSecret();
        }
        
        // Check withdrawal window
        bool canWithdraw = _immutables.timelocks.canWithdraw(true, false);
        bool publicWithdrawal = _immutables.timelocks.canWithdraw(true, true);
        
        if (!canWithdraw && !publicWithdrawal) {
            revert NotInWithdrawalWindow();
        }
        
        // For maker withdrawal period, only taker can withdraw
        if (canWithdraw && !publicWithdrawal && msg.sender != _immutables.taker) {
            revert UnauthorizedCaller();
        }
        
        // Mark as withdrawn and store secret
        _withdrawn = true;
        _revealedSecret = secret;
        
        emit SecretRevealed(_immutables.hashlockHash, secret);
        
        // Transfer tokens to taker
        IERC20(_immutables.token).safeTransfer(_immutables.taker, _immutables.amount);
        
        // Return safety deposit to taker
        (bool success,) = _immutables.taker.call{value: _immutables.safetyDeposit}("");
        if (!success) revert TransferFailed();
        
        emit FundsWithdrawn(_immutables.taker, _immutables.amount);
    }

    /**
     * @notice Cancels the escrow and refunds the maker
     * @dev Can only be called after cancellation timeout
     */
    function cancel() external nonReentrant onlyInitialized {
        if (_withdrawn) revert AlreadyWithdrawn();
        if (_cancelled) revert AlreadyCancelled();
        
        // Check if cancellation is allowed
        if (!_immutables.timelocks.canCancel(true)) {
            revert NotInCancellationWindow();
        }
        
        // Only maker can cancel
        if (msg.sender != _immutables.maker) {
            revert UnauthorizedCaller();
        }
        
        // Mark as cancelled
        _cancelled = true;
        
        // Transfer tokens back to maker
        IERC20(_immutables.token).safeTransfer(_immutables.maker, _immutables.amount);
        
        // Return safety deposit to maker
        (bool success,) = _immutables.maker.call{value: _immutables.safetyDeposit}("");
        if (!success) revert TransferFailed();
        
        emit EscrowCancelled(_immutables.maker);
    }

    /**
     * @notice Gets the current escrow status
     * @return initialized Whether the escrow is initialized
     * @return withdrawn Whether funds have been withdrawn
     * @return cancelled Whether the escrow is cancelled
     */
    function getStatus() external view returns (
        bool initialized,
        bool withdrawn,
        bool cancelled,
        bool inWithdrawalWindow,
        bool inCancellationWindow
    ) {
        initialized = _initialized;
        withdrawn = _withdrawn;
        cancelled = _cancelled;
        
        if (_initialized) {
            inWithdrawalWindow = _immutables.timelocks.canWithdraw(true, false) ||
                                _immutables.timelocks.canWithdraw(true, true);
            inCancellationWindow = _immutables.timelocks.canCancel(true);
        }
    }

    /**
     * @notice Gets the immutable parameters
     * @return Immutables structure
     */
    function getImmutables() external view onlyInitialized returns (ImmutablesLib.Immutables memory) {
        return _immutables;
    }

    /**
     * @notice Gets the revealed secret (if any)
     * @return secret The revealed secret
     */
    function getRevealedSecret() external view returns (bytes32) {
        return _revealedSecret;
    }

    /**
     * @notice Receives tokens from 1inch limit order protocol
     * @dev This function is called when the order is filled
     */
    function onOrderFilled(
        address token,
        uint256 amount,
        bytes calldata /* data */
    ) external onlyInitialized {
        // Verify the correct token and amount
        require(token == _immutables.token, "Invalid token");
        require(amount == _immutables.amount, "Invalid amount");
        
        // The tokens are now in the escrow, ready for cross-chain swap
    }

    /**
     * @notice Emergency function to recover stuck tokens
     * @dev Can only be called by maker after cancellation window
     * @param token Token to recover
     * @param amount Amount to recover
     */
    function emergencyRecover(address token, uint256 amount) external onlyInitialized {
        require(msg.sender == _immutables.maker, "Only maker");
        require(_immutables.timelocks.canCancel(true), "Not in cancellation window");
        require(!_withdrawn && !_cancelled, "Already finalized");
        
        // Safety check: don't allow recovering the escrowed tokens normally
        if (token == _immutables.token) {
            require(amount <= IERC20(token).balanceOf(address(this)) - _immutables.amount, 
                "Cannot recover escrowed funds");
        }
        
        IERC20(token).safeTransfer(_immutables.maker, amount);
    }

    // Receive function to accept safety deposits
    receive() external payable {}
}