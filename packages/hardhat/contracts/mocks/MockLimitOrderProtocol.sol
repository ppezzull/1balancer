// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "../portfolio/interfaces/ILimitOrderProtocol.sol";

/**
 * @title MockLimitOrderProtocol
 * @dev Mock implementation of ILimitOrderProtocol for testing
 */
contract MockLimitOrderProtocol is ILimitOrderProtocol {
    mapping(bytes32 => bool) public filledOrders;
    mapping(bytes32 => Order) public orders;
    
    event MockOrderFilled(
        bytes32 indexed orderHash,
        address indexed maker,
        address indexed taker,
        uint256 makingAmount,
        uint256 takingAmount,
        uint256 remainingMakingAmount
    );

    function fillOrderArgs(
        Order calldata order,
        bytes32 r,
        bytes32 vs,
        uint256 amount,
        TakerTraits calldata takerTraits,
        bytes calldata args
    ) external payable returns(uint256 makingAmount, uint256 takingAmount, bytes32 orderHash) {
        orderHash = calculateOrderHash(order);
        
        // Mock fill logic
        if (!filledOrders[orderHash]) {
            filledOrders[orderHash] = true;
            orders[orderHash] = order;
            
            makingAmount = order.makingAmount;
            takingAmount = order.takingAmount;
            
            emit MockOrderFilled(
                orderHash,
                order.maker,
                msg.sender,
                makingAmount,
                takingAmount,
                0 // remaining making amount
            );
        }
    }

    function fillContractOrderArgs(
        Order calldata order,
        bytes calldata signature,
        uint256 amount,
        TakerTraits calldata takerTraits,
        bytes calldata args
    ) external returns(uint256 makingAmount, uint256 takingAmount, bytes32 orderHash) {
        orderHash = calculateOrderHash(order);
        
        // Mock fill logic for contract orders
        if (!filledOrders[orderHash]) {
            filledOrders[orderHash] = true;
            orders[orderHash] = order;
            
            makingAmount = order.makingAmount;
            takingAmount = order.takingAmount;
            
            emit MockOrderFilled(
                orderHash,
                order.maker,
                msg.sender,
                makingAmount,
                takingAmount,
                0 // remaining making amount
            );
        }
    }

    function cancelOrder(bytes32 orderHash, uint256 makerTraits) external {
        // Mock cancellation
        filledOrders[orderHash] = true; // Mark as cancelled
    }

    function calculateOrderHash(Order memory order) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            order.salt,
            order.maker,
            order.receiver,
            order.makerAsset,
            order.takerAsset,
            order.makingAmount,
            order.takingAmount,
            order.makerTraits
        ));
    }

    function isOrderFilled(bytes32 orderHash) external view returns (bool) {
        return filledOrders[orderHash];
    }

    function getOrder(bytes32 orderHash) external view returns (Order memory) {
        return orders[orderHash];
    }
} 