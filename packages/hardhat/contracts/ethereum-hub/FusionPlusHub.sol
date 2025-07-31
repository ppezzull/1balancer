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
    IEscrowFactory public escrowFactory;

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
     * @notice Creates a cross-chain Fusion+ order
     * @dev This is now handled by the orchestration service off-chain
     * The escrow factory will be called directly by the resolver
     */
    function createFusionPlusOrder(
        bytes32 destinationChain,
        bytes calldata limitOrderData
    ) external nonReentrant whenNotPaused returns (bytes32 orderHash) {
        // Generate order hash
        orderHash = keccak256(abi.encodePacked(msg.sender, destinationChain, block.timestamp));
        
        // Emit event for off-chain orchestration service
        emit FusionPlusOrderCreated(orderHash, msg.sender, destinationChain);
        
        // The actual order creation happens off-chain
        // The orchestration service will monitor this event and coordinate the swap
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