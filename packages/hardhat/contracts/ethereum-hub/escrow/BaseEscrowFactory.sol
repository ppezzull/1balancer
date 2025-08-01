// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IEscrowFactory.sol";
import "../interfaces/ILimitOrderProtocol.sol";
import "../libraries/ImmutablesLib.sol";
import "../libraries/TimelocksLib.sol";

/**
 * @title BaseEscrowFactory
 * @notice Factory for creating escrow contracts following 1inch pattern
 * @dev Designed to work with orchestration service for cross-chain coordination
 */
abstract contract BaseEscrowFactory is IEscrowFactory, AccessControl, Pausable {
    using ImmutablesLib for ImmutablesLib.Immutables;
    using TimelocksLib for TimelocksLib.Timelocks;

    // -- Constants --
    bytes32 public constant ORCHESTRATOR_ROLE = keccak256("ORCHESTRATOR_ROLE");
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
    
    // -- State --
    address public immutable escrowSrcImplementation;
    address public immutable escrowDstImplementation;
    address public immutable limitOrderProtocol;
    
    // Track deployed escrows for orchestration service
    mapping(bytes32 => address) public escrows; // orderHash => escrow address
    mapping(address => bool) public isValidEscrow;
    
    // -- Errors --
    error InvalidImmutables();
    error EscrowAlreadyExists();
    error InvalidSafetyDeposit();
    error UnauthorizedCaller();

    // -- Constructor --
    constructor(
        address _escrowSrcImpl,
        address _escrowDstImpl,
        address _limitOrderProtocol
    ) {
        require(_escrowSrcImpl != address(0), "Invalid src implementation");
        require(_escrowDstImpl != address(0), "Invalid dst implementation");
        require(_limitOrderProtocol != address(0), "Invalid LOP address");
        
        escrowSrcImplementation = _escrowSrcImpl;
        escrowDstImplementation = _escrowDstImpl;
        limitOrderProtocol = _limitOrderProtocol;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORCHESTRATOR_ROLE, msg.sender);
    }

    /**
     * @notice Creates a source chain escrow
     * @dev Called by orchestration service when initiating cross-chain swap
     * @param immutables Escrow parameters
     * @return escrow Address of created escrow
     */
    function createSrcEscrow(
        ImmutablesLib.Immutables calldata immutables
    ) external payable override onlyRole(ORCHESTRATOR_ROLE) whenNotPaused returns (address escrow) {
        // Validate immutables
        if (!ImmutablesLib.validate(immutables)) {
            revert InvalidImmutables();
        }
        
        // Validate safety deposit
        if (msg.value != immutables.safetyDeposit) {
            revert InvalidSafetyDeposit();
        }
        
        // Check if escrow already exists for this order
        bytes32 immutablesHash = ImmutablesLib.hash(immutables);
        if (escrows[immutablesHash] != address(0)) {
            revert EscrowAlreadyExists();
        }
        
        // Deploy escrow using CREATE2 for deterministic address
        escrow = Clones.cloneDeterministic(escrowSrcImplementation, immutablesHash);
        
        // Initialize escrow
        (bool success,) = escrow.call{value: msg.value}(
            abi.encodeWithSignature("initialize(bytes)", immutables.encode())
        );
        require(success, "Escrow initialization failed");
        
        // Track escrow
        escrows[immutablesHash] = escrow;
        isValidEscrow[escrow] = true;
        
        emit SrcEscrowCreated(
            escrow,
            immutables.maker,
            immutables.taker,
            immutables.hashlockHash
        );
    }

    /**
     * @notice Creates a destination chain escrow
     * @dev Called by orchestration service on destination chain
     * @param immutables Escrow parameters (adapted for destination)
     * @param srcCancellationTimestamp Source chain cancellation timestamp
     * @return escrow Address of created escrow
     */
    function createDstEscrow(
        ImmutablesLib.Immutables calldata immutables,
        uint256 srcCancellationTimestamp
    ) external payable override onlyRole(ORCHESTRATOR_ROLE) whenNotPaused returns (address escrow) {
        // Validate immutables
        if (!ImmutablesLib.validate(immutables)) {
            revert InvalidImmutables();
        }
        
        // Validate safety deposit
        if (msg.value != immutables.safetyDeposit) {
            revert InvalidSafetyDeposit();
        }
        
        // Validate timing coordination
        require(
            immutables.timelocks.dstCancellation < srcCancellationTimestamp,
            "Invalid timeout coordination"
        );
        
        // Check if escrow already exists
        bytes32 immutablesHash = ImmutablesLib.hash(immutables);
        if (escrows[immutablesHash] != address(0)) {
            revert EscrowAlreadyExists();
        }
        
        // Deploy escrow
        escrow = Clones.cloneDeterministic(escrowDstImplementation, immutablesHash);
        
        // Initialize escrow
        (bool success,) = escrow.call{value: msg.value}(
            abi.encodeWithSignature("initialize(bytes,uint256)", 
                immutables.encode(), 
                srcCancellationTimestamp
            )
        );
        require(success, "Escrow initialization failed");
        
        // Track escrow
        escrows[immutablesHash] = escrow;
        isValidEscrow[escrow] = true;
        
        emit DstEscrowCreated(
            escrow,
            immutables.maker,
            immutables.taker,
            immutables.hashlockHash
        );
    }

    /**
     * @notice Computes the address of a source escrow
     * @dev Used by orchestration service for coordination
     * @param immutables Escrow parameters
     * @return escrowAddress Computed escrow address
     */
    function addressOfEscrowSrc(
        ImmutablesLib.Immutables calldata immutables
    ) external view override returns (address escrowAddress) {
        bytes32 immutablesHash = ImmutablesLib.hash(immutables);
        escrowAddress = Clones.predictDeterministicAddress(
            escrowSrcImplementation,
            immutablesHash
        );
    }

    /**
     * @notice Computes the address of a destination escrow
     * @dev Used by orchestration service for coordination
     * @param immutables Escrow parameters
     * @return escrowAddress Computed escrow address
     */
    function addressOfEscrowDst(
        ImmutablesLib.Immutables calldata immutables
    ) external view override returns (address escrowAddress) {
        bytes32 immutablesHash = ImmutablesLib.hash(immutables);
        escrowAddress = Clones.predictDeterministicAddress(
            escrowDstImplementation,
            immutablesHash
        );
    }

    /**
     * @notice Fills a 1inch limit order as part of cross-chain swap
     * @dev Called by resolver to initiate the swap
     * @param order The limit order to fill
     * @param signature Order signature
     * @param makingAmount Amount to make
     * @param takingAmount Amount to take
     * @param escrowAddress Target escrow for funds
     */
    function fillOrderWithEscrow(
        ILimitOrderProtocol.Order calldata order,
        bytes calldata signature,
        uint256 makingAmount,
        uint256 takingAmount,
        address escrowAddress
    ) external onlyRole(RESOLVER_ROLE) whenNotPaused {
        require(isValidEscrow[escrowAddress], "Invalid escrow");
        
        // Fill order with escrow as receiver
        // The escrow will handle the cross-chain coordination
        bytes memory interaction = abi.encode(escrowAddress);
        
        ILimitOrderProtocol(limitOrderProtocol).fillOrder(
            order,
            signature,
            interaction,
            makingAmount,
            takingAmount,
            0 // skipPermitAndThresholdAmount
        );
    }

    // -- Admin Functions --

    /**
     * @notice Pauses the factory
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses the factory
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Grants orchestrator role to the orchestration service
     * @param orchestrator Address of the orchestration service operator
     */
    function grantOrchestratorRole(address orchestrator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ORCHESTRATOR_ROLE, orchestrator);
    }
}