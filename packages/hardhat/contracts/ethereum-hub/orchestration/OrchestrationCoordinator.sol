// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IHTLCManager.sol";
import "../interfaces/IOrchestrationCoordinator.sol";

/**
 * @title OrchestrationCoordinator
 * @author 1Balancer Team
 * @notice Coordinates cross-chain atomic swaps without KYC requirements
 * @dev Custom coordination layer for Fusion+ implementation on BASE
 */
contract OrchestrationCoordinator is IOrchestrationCoordinator, AccessControl, Pausable, ReentrancyGuard {
    // -- Constants --
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
    uint256 public constant MIN_CONFIRMATION_TIME = 30 minutes;
    uint256 public constant MAX_CONFIRMATION_TIME = 24 hours;

    // -- State --
    IHTLCManager public immutable htlcManager;
    // CrossChainOrder struct is defined in IOrchestrationCoordinator

    struct ChainConfig {
        bool isSupported;
        uint256 confirmationTime;
        uint256 gasLimit;
        uint256 gasPrice;
    }

    mapping(bytes32 => IOrchestrationCoordinator.CrossChainOrder) public orders;
    mapping(bytes32 => ChainConfig) public supportedChains;
    mapping(address => bytes32[]) public ordersByMaker;
    
    uint256 public orderCounter;

    // -- Events are defined in IOrchestrationCoordinator --
    
    event ChainConfigUpdated(
        bytes32 indexed chainId,
        bool isSupported,
        uint256 confirmationTime
    );

    // -- Errors --
    error OrchestrationCoordinator__InvalidHTLCManager();
    error OrchestrationCoordinator__ChainNotSupported();
    error OrchestrationCoordinator__InvalidAmounts();
    error OrchestrationCoordinator__InvalidAddresses();
    error OrchestrationCoordinator__OrderNotFound();
    error OrchestrationCoordinator__InvalidOrderStatus();
    error OrchestrationCoordinator__InvalidConfirmationTime();
    error OrchestrationCoordinator__UnauthorizedAccess();

    // -- Constructor --
    constructor(address _htlcManager) {
        if (_htlcManager == address(0)) {
            revert OrchestrationCoordinator__InvalidHTLCManager();
        }
        
        htlcManager = IHTLCManager(_htlcManager);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(RESOLVER_ROLE, msg.sender);
    }

    // -- External Functions --

    /**
     * @notice Creates a cross-chain order
     * @param params Order parameters
     * @return orderHash The hash of the created order
     */
    function createCrossChainOrder(
        OrderParams calldata params
    ) external override nonReentrant whenNotPaused returns (bytes32 orderHash) {
        // Validate inputs
        if (!supportedChains[params.destinationChain].isSupported) {
            revert OrchestrationCoordinator__ChainNotSupported();
        }
        if (params.sourceAmount == 0 || params.destinationAmount == 0) {
            revert OrchestrationCoordinator__InvalidAmounts();
        }
        if (params.sourceToken == address(0) || params.destinationToken == address(0)) {
            revert OrchestrationCoordinator__InvalidAddresses();
        }

        // Generate order hash
        orderHash = keccak256(
            abi.encodePacked(
                msg.sender,
                params.sourceToken,
                params.destinationToken,
                params.sourceAmount,
                params.destinationAmount,
                params.destinationChain,
                orderCounter++,
                block.timestamp
            )
        );

        // Create order
        orders[orderHash] = CrossChainOrder({
            maker: msg.sender,
            sourceToken: params.sourceToken,
            destinationToken: params.destinationToken,
            sourceAmount: params.sourceAmount,
            destinationAmount: params.destinationAmount,
            destinationChain: params.destinationChain,
            orderHash: orderHash,
            htlcId: bytes32(0),
            status: OrderStatus.Created,
            createdAt: block.timestamp,
            confirmedAt: 0
        });

        ordersByMaker[msg.sender].push(orderHash);

        emit CrossChainOrderCreated(
            orderHash,
            msg.sender,
            params.destinationChain,
            params.sourceAmount,
            params.destinationAmount
        );
    }

    /**
     * @notice Confirms order with HTLC creation
     * @param orderHash The order hash
     * @param htlcParams HTLC parameters
     */
    function confirmOrder(
        bytes32 orderHash,
        HTLCParams calldata htlcParams
    ) external override onlyRole(RESOLVER_ROLE) nonReentrant whenNotPaused {
        IOrchestrationCoordinator.CrossChainOrder storage order = orders[orderHash];
        
        // Validate order
        if (order.maker == address(0)) {
            revert OrchestrationCoordinator__OrderNotFound();
        }
        if (order.status != OrderStatus.Created) {
            revert OrchestrationCoordinator__InvalidOrderStatus();
        }

        // Create HTLC
        bytes32 htlcId = htlcManager.createHTLC(
            htlcParams.taker,
            order.sourceToken,
            order.sourceAmount,
            htlcParams.hashlock,
            htlcParams.timelock
        );

        // Update order
        order.htlcId = htlcId;
        order.status = OrderStatus.Confirmed;
        order.confirmedAt = block.timestamp;

        emit CrossChainOrderConfirmed(orderHash, htlcId);
    }

    /**
     * @notice Completes an order after successful swap
     * @param orderHash The order hash
     * @param secret The revealed secret
     */
    function completeOrder(
        bytes32 orderHash,
        bytes32 secret
    ) external override nonReentrant whenNotPaused {
        IOrchestrationCoordinator.CrossChainOrder storage order = orders[orderHash];
        
        // Validate order
        if (order.maker == address(0)) {
            revert OrchestrationCoordinator__OrderNotFound();
        }
        if (order.status != OrderStatus.Confirmed) {
            revert OrchestrationCoordinator__InvalidOrderStatus();
        }

        // Update status
        order.status = OrderStatus.Completed;

        emit CrossChainOrderCompleted(orderHash, secret);
    }

    /**
     * @notice Cancels an order
     * @param orderHash The order hash
     * @param reason Cancellation reason
     */
    function cancelOrder(
        bytes32 orderHash,
        string calldata reason
    ) external override nonReentrant whenNotPaused {
        IOrchestrationCoordinator.CrossChainOrder storage order = orders[orderHash];
        
        // Validate order
        if (order.maker == address(0)) {
            revert OrchestrationCoordinator__OrderNotFound();
        }
        
        // Only maker or operator can cancel
        if (msg.sender != order.maker && !hasRole(OPERATOR_ROLE, msg.sender)) {
            revert OrchestrationCoordinator__UnauthorizedAccess();
        }
        
        // Can only cancel if not completed
        if (order.status == OrderStatus.Completed) {
            revert OrchestrationCoordinator__InvalidOrderStatus();
        }

        // Update status
        order.status = OrderStatus.Cancelled;

        emit CrossChainOrderCancelled(orderHash, reason);
    }

    // -- Admin Functions --

    /**
     * @notice Adds or updates a supported chain
     * @param chainId Chain identifier
     * @param confirmationTime Confirmation time in seconds
     * @param gasLimit Gas limit for the chain
     * @param gasPrice Gas price for the chain
     */
    function addSupportedChain(
        bytes32 chainId,
        uint256 confirmationTime,
        uint256 gasLimit,
        uint256 gasPrice
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (confirmationTime < MIN_CONFIRMATION_TIME || 
            confirmationTime > MAX_CONFIRMATION_TIME) {
            revert OrchestrationCoordinator__InvalidConfirmationTime();
        }

        supportedChains[chainId] = ChainConfig({
            isSupported: true,
            confirmationTime: confirmationTime,
            gasLimit: gasLimit,
            gasPrice: gasPrice
        });

        emit ChainConfigUpdated(chainId, true, confirmationTime);
    }

    /**
     * @notice Removes a supported chain
     * @param chainId Chain identifier
     */
    function removeSupportedChain(bytes32 chainId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedChains[chainId].isSupported = false;
        emit ChainConfigUpdated(chainId, false, 0);
    }

    /**
     * @notice Pauses the contract
     */
    function pause() external onlyRole(OPERATOR_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses the contract
     */
    function unpause() external onlyRole(OPERATOR_ROLE) {
        _unpause();
    }

    // -- View Functions --

    /**
     * @notice Gets order details
     * @param orderHash The order hash
     * @return The order details
     */
    function getOrder(bytes32 orderHash) external view override returns (CrossChainOrder memory) {
        return orders[orderHash];
    }

    /**
     * @notice Gets orders by maker
     * @param maker The maker address
     * @return Array of order hashes
     */
    function getOrdersByMaker(address maker) external view returns (bytes32[] memory) {
        return ordersByMaker[maker];
    }

    /**
     * @notice Checks if a chain is supported
     * @param chainId Chain identifier
     * @return True if the chain is supported
     */
    function isChainSupported(bytes32 chainId) external view returns (bool) {
        return supportedChains[chainId].isSupported;
    }

    /**
     * @notice Gets chain configuration
     * @param chainId Chain identifier
     * @return The chain configuration
     */
    function getChainConfig(bytes32 chainId) external view returns (ChainConfig memory) {
        return supportedChains[chainId];
    }
}