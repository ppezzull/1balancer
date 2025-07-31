// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title ILimitOrderProtocol
 * @notice Interface for 1inch Limit Order Protocol integration
 * @dev This interface enables cross-chain swaps through 1inch foundation
 */
interface ILimitOrderProtocol {
    struct Order {
        uint256 salt;
        address makerAsset;
        address takerAsset;
        address maker;
        address receiver;
        address allowedSender;  // 0x0 for public orders
        uint256 makingAmount;
        uint256 takingAmount;
        uint256 offsets;
        bytes interactions;     // Encoded interactions for hooks
    }

    struct Signature {
        bytes32 r;
        bytes32 vs;
    }

    /**
     * @notice Fills a limit order
     * @param order The order to fill
     * @param signature Order signature
     * @param interaction Additional interaction data
     * @param makingAmount Amount of maker asset
     * @param takingAmount Amount of taker asset
     * @param skipPermitAndThresholdAmount Skip permit and threshold checks
     * @return actualMakingAmount Actual amount of maker asset filled
     * @return actualTakingAmount Actual amount of taker asset filled
     * @return orderHash Hash of the filled order
     */
    function fillOrder(
        Order calldata order,
        bytes calldata signature,
        bytes calldata interaction,
        uint256 makingAmount,
        uint256 takingAmount,
        uint256 skipPermitAndThresholdAmount
    ) external payable returns (
        uint256 actualMakingAmount,
        uint256 actualTakingAmount,
        bytes32 orderHash
    );

    /**
     * @notice Fills an order with compact signature
     * @param order The order to fill
     * @param r Signature r value
     * @param vs Signature vs value
     * @param amount Fill amount
     * @param takerTraits Taker traits for advanced features
     * @param args Additional arguments
     */
    function fillOrderArgs(
        Order calldata order,
        bytes32 r,
        bytes32 vs,
        uint256 amount,
        uint256 takerTraits,
        bytes calldata args
    ) external payable returns (
        uint256 actualMakingAmount,
        uint256 actualTakingAmount,
        bytes32 orderHash
    );

    /**
     * @notice Cancels an order
     * @param orderInfo Order info for cancellation
     */
    function cancelOrder(uint256 orderInfo) external;

    /**
     * @notice Checks if an order is valid
     * @param order The order to check
     * @param signature Order signature
     * @return isValid True if order is valid
     */
    function checkOrder(Order calldata order, bytes calldata signature)
        external
        view
        returns (bool isValid);

    /**
     * @notice Gets remaining fill amount for an order
     * @param orderHash Hash of the order
     * @return remaining Remaining amount that can be filled
     */
    function remaining(bytes32 orderHash) external view returns (uint256);

    /**
     * @notice Emitted when an order is filled
     */
    event OrderFilled(
        bytes32 indexed orderHash,
        address indexed maker,
        address indexed taker,
        uint256 makingAmount,
        uint256 takingAmount
    );

    /**
     * @notice Emitted when an order is cancelled
     */
    event OrderCancelled(bytes32 indexed orderHash);
}