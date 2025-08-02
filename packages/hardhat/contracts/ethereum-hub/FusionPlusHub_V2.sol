// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./interfaces/IEscrowFactory.sol";
import "./interfaces/ILimitOrderProtocol.sol";
import "./libraries/ImmutablesLib.sol";
import "./libraries/TimelocksLib.sol";

/**
 * @title FusionPlusHub V2
 * @author 1Balancer Team
 * @notice Enhanced hub contract for Fusion+ cross-chain swaps on BASE with better 1inch integration
 * @dev Integrates with 1inch foundation contracts and manages cross-chain coordination
 */
contract FusionPlusHub_V2 is 
    Initializable, 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable 
{
    // -- Constants --
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // -- State --
    address public limitOrderProtocol;
    address public aggregationRouter;
    IEscrowFactory public escrowFactory;

    // Protocol fee configuration
    uint256 public protocolFee; // basis points (e.g., 30 = 0.3%)
    uint256 public constant MAX_FEE = 1000; // 10%
    address public feeRecipient;

    // Order tracking for cross-chain coordination
    mapping(bytes32 => OrderStatus) public orderStatuses;
    
    enum OrderStatus {
        None,
        Created,
        Filled,
        Completed,
        Cancelled
    }

    // -- Events --
    event FusionPlusOrderCreated(
        bytes32 indexed orderHash,
        address indexed maker,
        bytes32 destinationChain,
        address srcToken,
        address dstToken,
        uint256 srcAmount,
        uint256 dstAmount
    );
    
    event OrderStatusUpdated(
        bytes32 indexed orderHash,
        OrderStatus status
    );
    
    event ProtocolFeeUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newRecipient);
    event ContractsUpdated(
        address limitOrderProtocol,
        address aggregationRouter,
        address escrowFactory
    );

    // -- Errors --
    error FusionPlusHub__InvalidAddress();
    error FusionPlusHub__InvalidFee();
    error FusionPlusHub__UnauthorizedAccess();
    error FusionPlusHub__InvalidAmount();
    error FusionPlusHub__OrderAlreadyExists();
    error FusionPlusHub__InvalidOrderStatus();

    // -- Modifier --
    modifier onlyAdmin() {
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert FusionPlusHub__UnauthorizedAccess();
        }
        _;
    }

    modifier validAddress(address addr) {
        if (addr == address(0)) {
            revert FusionPlusHub__InvalidAddress();
        }
        _;
    }

    // -- Initializer --
    function initialize(
        address _limitOrderProtocol,
        address _aggregationRouter,
        address _escrowFactory
    ) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        // Validate addresses
        if (_limitOrderProtocol == address(0) || 
            _aggregationRouter == address(0) ||
            _escrowFactory == address(0)) {
            revert FusionPlusHub__InvalidAddress();
        }

        // Set foundation contracts
        limitOrderProtocol = _limitOrderProtocol;
        aggregationRouter = _aggregationRouter;
        escrowFactory = IEscrowFactory(_escrowFactory);

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(RESOLVER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        // Set initial fee configuration
        protocolFee = 30; // 0.3%
        feeRecipient = msg.sender;
    }

    // -- External Functions --

    /**
     * @notice Creates a cross-chain Fusion+ order with proper validation
     * @dev Validates amounts and creates order hash for tracking
     * @param destinationChain The destination chain identifier
     * @param srcToken Source chain token address
     * @param dstToken Destination chain token address
     * @param srcAmount Amount on source chain
     * @param dstAmount Expected amount on destination chain
     * @param orderData Additional order parameters
     */
    function createFusionPlusOrder(
        bytes32 destinationChain,
        address srcToken,
        address dstToken,
        uint256 srcAmount,
        uint256 dstAmount,
        bytes calldata orderData
    ) external nonReentrant whenNotPaused returns (bytes32 orderHash) {
        // Validate inputs
        if (srcAmount == 0 || dstAmount == 0) {
            revert FusionPlusHub__InvalidAmount();
        }
        
        if (srcToken == address(0) || dstToken == address(0)) {
            revert FusionPlusHub__InvalidAddress();
        }
        
        // Generate unique order hash
        orderHash = keccak256(abi.encodePacked(
            msg.sender,
            destinationChain,
            srcToken,
            dstToken,
            srcAmount,
            dstAmount,
            block.timestamp,
            block.number
        ));
        
        // Check if order already exists
        if (orderStatuses[orderHash] != OrderStatus.None) {
            revert FusionPlusHub__OrderAlreadyExists();
        }
        
        // Mark order as created
        orderStatuses[orderHash] = OrderStatus.Created;
        
        // Emit event for off-chain orchestration service
        emit FusionPlusOrderCreated(
            orderHash,
            msg.sender,
            destinationChain,
            srcToken,
            dstToken,
            srcAmount,
            dstAmount
        );
        
        emit OrderStatusUpdated(orderHash, OrderStatus.Created);
    }

    /**
     * @notice Updates order status (called by resolver/orchestrator)
     * @param orderHash The order hash to update
     * @param newStatus The new status
     */
    function updateOrderStatus(
        bytes32 orderHash,
        OrderStatus newStatus
    ) external onlyRole(RESOLVER_ROLE) {
        OrderStatus currentStatus = orderStatuses[orderHash];
        
        // Validate status transition
        if (currentStatus == OrderStatus.None) {
            revert FusionPlusHub__InvalidOrderStatus();
        }
        
        if (currentStatus == OrderStatus.Cancelled || 
            currentStatus == OrderStatus.Completed) {
            revert FusionPlusHub__InvalidOrderStatus();
        }
        
        orderStatuses[orderHash] = newStatus;
        emit OrderStatusUpdated(orderHash, newStatus);
    }

    /**
     * @notice Creates escrow pair for cross-chain atomic swap
     * @dev Called by resolver after order validation
     */
    function createEscrowsForOrder(
        bytes32 orderHash,
        ImmutablesLib.Immutables calldata srcImmutables,
        ImmutablesLib.Immutables calldata dstImmutables
    ) external payable onlyRole(RESOLVER_ROLE) returns (
        address srcEscrow,
        address dstEscrow
    ) {
        // Verify order exists and is in correct state
        if (orderStatuses[orderHash] != OrderStatus.Created) {
            revert FusionPlusHub__InvalidOrderStatus();
        }
        
        // Create escrows through factory
        (srcEscrow, dstEscrow) = escrowFactory.createEscrowPair{value: msg.value}(
            srcImmutables,
            dstImmutables
        );
        
        // Update order status
        orderStatuses[orderHash] = OrderStatus.Filled;
        emit OrderStatusUpdated(orderHash, OrderStatus.Filled);
    }

    // -- Admin Functions --

    /**
     * @notice Updates protocol fee
     * @param _fee New fee in basis points
     */
    function setProtocolFee(uint256 _fee) external onlyAdmin {
        if (_fee > MAX_FEE) {
            revert FusionPlusHub__InvalidFee();
        }
        protocolFee = _fee;
        emit ProtocolFeeUpdated(_fee);
    }

    /**
     * @notice Updates fee recipient
     * @param _recipient New fee recipient address
     */
    function setFeeRecipient(address _recipient) external onlyAdmin validAddress(_recipient) {
        feeRecipient = _recipient;
        emit FeeRecipientUpdated(_recipient);
    }

    /**
     * @notice Updates contract addresses
     * @param _limitOrderProtocol New limit order protocol address
     * @param _aggregationRouter New aggregation router address
     * @param _escrowFactory New escrow factory address
     */
    function updateContracts(
        address _limitOrderProtocol,
        address _aggregationRouter,
        address _escrowFactory
    ) external onlyAdmin {
        if (_limitOrderProtocol != address(0)) {
            limitOrderProtocol = _limitOrderProtocol;
        }
        if (_aggregationRouter != address(0)) {
            aggregationRouter = _aggregationRouter;
        }
        if (_escrowFactory != address(0)) {
            escrowFactory = IEscrowFactory(_escrowFactory);
        }

        emit ContractsUpdated(
            limitOrderProtocol,
            aggregationRouter,
            _escrowFactory
        );
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
     * @notice Calculates fee for an amount
     * @param amount The amount to calculate fee for
     * @return The fee amount
     */
    function calculateFee(uint256 amount) public view returns (uint256) {
        return (amount * protocolFee) / 10000;
    }

    /**
     * @notice Gets order status
     * @param orderHash The order hash to check
     * @return The order status
     */
    function getOrderStatus(bytes32 orderHash) external view returns (OrderStatus) {
        return orderStatuses[orderHash];
    }

    /**
     * @notice Gets all contract addresses
     * @return _limitOrderProtocol The limit order protocol address
     * @return _aggregationRouter The aggregation router address
     * @return _escrowFactory The escrow factory address
     */
    function getContractAddresses() external view returns (
        address _limitOrderProtocol,
        address _aggregationRouter,
        address _escrowFactory
    ) {
        return (
            limitOrderProtocol,
            aggregationRouter,
            address(escrowFactory)
        );
    }
}