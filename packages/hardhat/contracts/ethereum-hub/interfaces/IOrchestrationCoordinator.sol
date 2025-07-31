// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IOrchestrationCoordinator
 * @author 1Balancer Team
 * @notice Interface for the Orchestration Coordinator contract
 */
interface IOrchestrationCoordinator {
    // -- Enums --
    enum OrderStatus {
        Created,
        Confirmed,
        Completed,
        Cancelled
    }

    // -- Structs --
    struct OrderParams {
        address sourceToken;
        address destinationToken;
        uint256 sourceAmount;
        uint256 destinationAmount;
        bytes32 destinationChain;
    }

    struct HTLCParams {
        address taker;
        bytes32 hashlock;
        uint256 timelock;
    }

    struct CrossChainOrder {
        address maker;
        address sourceToken;
        address destinationToken;
        uint256 sourceAmount;
        uint256 destinationAmount;
        bytes32 destinationChain;
        bytes32 orderHash;
        bytes32 htlcId;
        OrderStatus status;
        uint256 createdAt;
        uint256 confirmedAt;
    }

    // -- Events --
    event CrossChainOrderCreated(
        bytes32 indexed orderHash,
        address indexed maker,
        bytes32 indexed destinationChain,
        uint256 sourceAmount,
        uint256 destinationAmount
    );
    
    event CrossChainOrderConfirmed(
        bytes32 indexed orderHash,
        bytes32 htlcId
    );
    
    event CrossChainOrderCompleted(
        bytes32 indexed orderHash,
        bytes32 secret
    );
    
    event CrossChainOrderCancelled(
        bytes32 indexed orderHash,
        string reason
    );

    // -- Functions --
    function createCrossChainOrder(
        OrderParams calldata params
    ) external returns (bytes32 orderHash);

    function confirmOrder(
        bytes32 orderHash,
        HTLCParams calldata htlcParams
    ) external;

    function completeOrder(
        bytes32 orderHash,
        bytes32 secret
    ) external;

    function cancelOrder(
        bytes32 orderHash,
        string calldata reason
    ) external;

    function getOrder(bytes32 orderHash) external view returns (CrossChainOrder memory);
}