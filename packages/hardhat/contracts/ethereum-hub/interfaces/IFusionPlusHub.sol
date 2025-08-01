// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IFusionPlusHub
 * @notice Interface for the main Fusion+ hub contract
 */
interface IFusionPlusHub {
    // Events
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

    // Functions
    function initialize(
        address _limitOrderProtocol,
        address _aggregationRouter,
        address _escrowFactory,
        uint256 _protocolFee,
        address _feeRecipient
    ) external;

    function createFusionPlusOrder(
        bytes calldata orderData,
        bytes32 destinationChain,
        address srcEscrow,
        address dstEscrow
    ) external returns (bytes32 orderHash);

    function setProtocolFee(uint256 _fee) external;
    function setFeeRecipient(address _recipient) external;
    function updateContracts(
        address _limitOrderProtocol,
        address _aggregationRouter,
        address _escrowFactory
    ) external;

    function pause() external;
    function unpause() external;
    function calculateFee(uint256 amount) external view returns (uint256);
    function getContractAddresses() external view returns (
        address limitOrderProtocol,
        address aggregationRouter,
        address escrowFactory
    );

    // State getters
    function protocolFee() external view returns (uint256);
    function feeRecipient() external view returns (address);
}