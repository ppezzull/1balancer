// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./interfaces/IHTLCManager.sol";
import "./interfaces/IOrchestrationCoordinator.sol";
import "./interfaces/IEscrowFactory.sol";
import "./interfaces/ILimitOrderProtocol.sol";
import "./libraries/ImmutablesLib.sol";
import "./libraries/TimelocksLib.sol";

/**
 * @title FusionPlusHub
 * @author 1Balancer Team
 * @notice Main hub contract for Fusion+ cross-chain swaps on BASE
 * @dev Integrates with 1inch foundation contracts and manages cross-chain coordination
 */
contract FusionPlusHub is 
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
    IHTLCManager public htlcManager; // Legacy, to be migrated
    IOrchestrationCoordinator public orchestrationCoordinator;
    IEscrowFactory public escrowFactory; // New escrow pattern

    // Protocol fee configuration
    uint256 public protocolFee; // basis points (e.g., 30 = 0.3%)
    uint256 public constant MAX_FEE = 1000; // 10%
    address public feeRecipient;

    // -- Events --
    event FusionPlusOrderCreated(
        bytes32 indexed orderHash,
        address indexed maker,
        bytes32 destinationChain
    );
    
    event ProtocolFeeUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newRecipient);
    event ContractsUpdated(
        address limitOrderProtocol,
        address aggregationRouter,
        address htlcManager,
        address orchestrationCoordinator,
        address escrowFactory
    );

    // -- Errors --
    error FusionPlusHub__InvalidAddress();
    error FusionPlusHub__InvalidFee();
    error FusionPlusHub__UnauthorizedAccess();

    // -- Modifier --
    modifier onlyAdmin() {
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert FusionPlusHub__UnauthorizedAccess();
        }
        _;
    }

    // -- Initializer --
    function initialize(
        address _limitOrderProtocol,
        address _aggregationRouter,
        address _htlcManager,
        address _orchestrationCoordinator,
        address _escrowFactory
    ) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        // Validate addresses
        if (_limitOrderProtocol == address(0) || 
            _aggregationRouter == address(0) ||
            _htlcManager == address(0) ||
            _orchestrationCoordinator == address(0) ||
            _escrowFactory == address(0)) {
            revert FusionPlusHub__InvalidAddress();
        }

        // Set foundation contracts
        limitOrderProtocol = _limitOrderProtocol;
        aggregationRouter = _aggregationRouter;
        htlcManager = IHTLCManager(_htlcManager);
        orchestrationCoordinator = IOrchestrationCoordinator(_orchestrationCoordinator);
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
     * @notice Creates a cross-chain Fusion+ order
     * @param orderParams Order parameters for cross-chain swap
     * @param limitOrderData Encoded limit order data for 1inch protocol
     * @return orderHash The hash of the created order
     */
    function createFusionPlusOrder(
        IOrchestrationCoordinator.OrderParams calldata orderParams,
        bytes calldata limitOrderData
    ) external nonReentrant whenNotPaused returns (bytes32 orderHash) {
        // Create cross-chain order in orchestration coordinator
        orderHash = orchestrationCoordinator.createCrossChainOrder(orderParams);

        // TODO: Integrate with 1inch Limit Order Protocol
        // This would involve decoding limitOrderData and creating order on 1inch
        // For hackathon demo, we simulate this integration

        emit FusionPlusOrderCreated(orderHash, msg.sender, orderParams.destinationChain);
    }

    /**
     * @notice Executes a cross-chain swap through HTLC
     * @param orderHash The order hash to execute
     * @param htlcParams HTLC parameters
     */
    function executeSwap(
        bytes32 orderHash,
        IOrchestrationCoordinator.HTLCParams calldata htlcParams
    ) external onlyRole(RESOLVER_ROLE) nonReentrant whenNotPaused {
        // Confirm order with HTLC creation
        orchestrationCoordinator.confirmOrder(orderHash, htlcParams);
    }

    /**
     * @notice Completes a swap after secret reveal
     * @param orderHash The order hash
     * @param secret The revealed secret
     */
    function completeSwap(
        bytes32 orderHash,
        bytes32 secret
    ) external nonReentrant whenNotPaused {
        // Get order details
        IOrchestrationCoordinator.CrossChainOrder memory order = 
            orchestrationCoordinator.getOrder(orderHash);

        // Withdraw from HTLC using secret
        htlcManager.withdraw(order.htlcId, secret);

        // Complete order in orchestration coordinator
        orchestrationCoordinator.completeOrder(orderHash, secret);
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
    function setFeeRecipient(address _recipient) external onlyAdmin {
        if (_recipient == address(0)) {
            revert FusionPlusHub__InvalidAddress();
        }
        feeRecipient = _recipient;
        emit FeeRecipientUpdated(_recipient);
    }

    /**
     * @notice Updates contract addresses
     * @param _limitOrderProtocol New limit order protocol address
     * @param _aggregationRouter New aggregation router address
     * @param _htlcManager New HTLC manager address
     * @param _orchestrationCoordinator New orchestration coordinator address
     */
    function updateContracts(
        address _limitOrderProtocol,
        address _aggregationRouter,
        address _htlcManager,
        address _orchestrationCoordinator
    ) external onlyAdmin {
        if (_limitOrderProtocol != address(0)) {
            limitOrderProtocol = _limitOrderProtocol;
        }
        if (_aggregationRouter != address(0)) {
            aggregationRouter = _aggregationRouter;
        }
        if (_htlcManager != address(0)) {
            htlcManager = IHTLCManager(_htlcManager);
        }
        if (_orchestrationCoordinator != address(0)) {
            orchestrationCoordinator = IOrchestrationCoordinator(_orchestrationCoordinator);
        }

        emit ContractsUpdated(
            limitOrderProtocol,
            aggregationRouter,
            address(htlcManager),
            address(orchestrationCoordinator)
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
     * @notice Gets all contract addresses
     * @return _limitOrderProtocol The limit order protocol address
     * @return _aggregationRouter The aggregation router address
     * @return _htlcManager The HTLC manager address
     * @return _orchestrationCoordinator The orchestration coordinator address
     */
    function getContractAddresses() external view returns (
        address _limitOrderProtocol,
        address _aggregationRouter,
        address _htlcManager,
        address _orchestrationCoordinator
    ) {
        return (
            limitOrderProtocol,
            aggregationRouter,
            address(htlcManager),
            address(orchestrationCoordinator)
        );
    }
}