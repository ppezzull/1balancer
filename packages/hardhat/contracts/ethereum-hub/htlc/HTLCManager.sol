// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title HTLCManager
 * @author 1Balancer Team
 * @notice Manages Hashed Timelock Contracts for cross-chain atomic swaps
 * @dev Implements HTLC functionality for the Ethereum Hub on BASE chain
 */
contract HTLCManager is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    // -- Constants --
    uint256 public constant MIN_TIMEOUT = 30 minutes;
    uint256 public constant MAX_TIMEOUT = 7 days;
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // -- State --
    struct HTLC {
        address maker;
        address taker;
        address token;
        uint256 amount;
        bytes32 hashlock;
        uint256 timelock;
        bool withdrawn;
        bool refunded;
        bytes32 secret;
    }

    mapping(bytes32 => HTLC) public htlcs;
    uint256 public htlcCounter;

    // -- Events --
    event HTLCCreated(
        bytes32 indexed htlcId,
        address indexed maker,
        address indexed taker,
        address token,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock
    );
    
    event HTLCWithdrawn(bytes32 indexed htlcId, bytes32 secret);
    event HTLCRefunded(bytes32 indexed htlcId);

    // -- Errors --
    error HTLCManager__InvalidTimeout();
    error HTLCManager__InvalidAmount();
    error HTLCManager__InvalidHashlock();
    error HTLCManager__InvalidAddresses();
    error HTLCManager__HTLCNotFound();
    error HTLCManager__AlreadyWithdrawn();
    error HTLCManager__AlreadyRefunded();
    error HTLCManager__InvalidSecret();
    error HTLCManager__TimelockNotExpired();
    error HTLCManager__UnauthorizedAccess();

    // -- Constructor --
    constructor(uint256 _minTimeout, uint256 _maxTimeout) {
        // Validate timeout bounds
        if (_minTimeout == 0 || _maxTimeout == 0 || _minTimeout >= _maxTimeout) {
            revert HTLCManager__InvalidTimeout();
        }
        
        // Grant roles to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    // -- External Functions --

    /**
     * @notice Creates a new HTLC
     * @param _taker Address of the taker
     * @param _token Token address
     * @param _amount Amount to lock
     * @param _hashlock Hash of the secret
     * @param _timelock Unix timestamp for timeout
     * @return htlcId The ID of the created HTLC
     */
    function createHTLC(
        address _taker,
        address _token,
        uint256 _amount,
        bytes32 _hashlock,
        uint256 _timelock
    ) external nonReentrant whenNotPaused returns (bytes32 htlcId) {
        // Validate inputs
        if (_taker == address(0) || _token == address(0)) {
            revert HTLCManager__InvalidAddresses();
        }
        if (_amount == 0) {
            revert HTLCManager__InvalidAmount();
        }
        if (_hashlock == bytes32(0)) {
            revert HTLCManager__InvalidHashlock();
        }
        if (_timelock <= block.timestamp + MIN_TIMEOUT || 
            _timelock > block.timestamp + MAX_TIMEOUT) {
            revert HTLCManager__InvalidTimeout();
        }

        // Generate HTLC ID
        htlcId = keccak256(
            abi.encodePacked(
                msg.sender,
                _taker,
                _token,
                _amount,
                _hashlock,
                _timelock,
                htlcCounter++
            )
        );

        // Create HTLC
        htlcs[htlcId] = HTLC({
            maker: msg.sender,
            taker: _taker,
            token: _token,
            amount: _amount,
            hashlock: _hashlock,
            timelock: _timelock,
            withdrawn: false,
            refunded: false,
            secret: bytes32(0)
        });

        // Transfer tokens to contract
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        emit HTLCCreated(htlcId, msg.sender, _taker, _token, _amount, _hashlock, _timelock);
    }

    /**
     * @notice Withdraws funds from an HTLC by revealing the secret
     * @param _htlcId The HTLC ID
     * @param _secret The secret that hashes to the hashlock
     */
    function withdraw(bytes32 _htlcId, bytes32 _secret) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        HTLC storage htlc = htlcs[_htlcId];
        
        // Validate HTLC exists
        if (htlc.maker == address(0)) {
            revert HTLCManager__HTLCNotFound();
        }
        
        // Check if already withdrawn or refunded
        if (htlc.withdrawn) {
            revert HTLCManager__AlreadyWithdrawn();
        }
        if (htlc.refunded) {
            revert HTLCManager__AlreadyRefunded();
        }
        
        // Verify secret
        if (keccak256(abi.encodePacked(_secret)) != htlc.hashlock) {
            revert HTLCManager__InvalidSecret();
        }
        
        // Mark as withdrawn and store secret
        htlc.withdrawn = true;
        htlc.secret = _secret;
        
        // Transfer tokens to taker
        IERC20(htlc.token).safeTransfer(htlc.taker, htlc.amount);
        
        emit HTLCWithdrawn(_htlcId, _secret);
    }

    /**
     * @notice Refunds funds to the maker after timeout
     * @param _htlcId The HTLC ID
     */
    function refund(bytes32 _htlcId) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        HTLC storage htlc = htlcs[_htlcId];
        
        // Validate HTLC exists
        if (htlc.maker == address(0)) {
            revert HTLCManager__HTLCNotFound();
        }
        
        // Check if already withdrawn or refunded
        if (htlc.withdrawn) {
            revert HTLCManager__AlreadyWithdrawn();
        }
        if (htlc.refunded) {
            revert HTLCManager__AlreadyRefunded();
        }
        
        // Check if timelock has expired
        if (block.timestamp < htlc.timelock) {
            revert HTLCManager__TimelockNotExpired();
        }
        
        // Only maker can refund
        if (msg.sender != htlc.maker) {
            revert HTLCManager__UnauthorizedAccess();
        }
        
        // Mark as refunded
        htlc.refunded = true;
        
        // Transfer tokens back to maker
        IERC20(htlc.token).safeTransfer(htlc.maker, htlc.amount);
        
        emit HTLCRefunded(_htlcId);
    }

    // -- View Functions --

    /**
     * @notice Gets HTLC details
     * @param _htlcId The HTLC ID
     * @return The HTLC struct
     */
    function getHTLC(bytes32 _htlcId) external view returns (HTLC memory) {
        return htlcs[_htlcId];
    }

    /**
     * @notice Checks if an HTLC can be withdrawn
     * @param _htlcId The HTLC ID
     * @return True if the HTLC can be withdrawn
     */
    function canWithdraw(bytes32 _htlcId) external view returns (bool) {
        HTLC memory htlc = htlcs[_htlcId];
        return htlc.maker != address(0) && 
               !htlc.withdrawn && 
               !htlc.refunded &&
               block.timestamp < htlc.timelock;
    }

    /**
     * @notice Checks if an HTLC can be refunded
     * @param _htlcId The HTLC ID
     * @return True if the HTLC can be refunded
     */
    function canRefund(bytes32 _htlcId) external view returns (bool) {
        HTLC memory htlc = htlcs[_htlcId];
        return htlc.maker != address(0) && 
               !htlc.withdrawn && 
               !htlc.refunded &&
               block.timestamp >= htlc.timelock;
    }

    // -- Admin Functions --

    /**
     * @notice Pauses the contract
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses the contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}