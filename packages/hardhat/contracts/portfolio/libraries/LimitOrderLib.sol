// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "../interfaces/ILimitOrderProtocol.sol";

/**
 * @title LimitOrderLib
 * @dev Library for creating and managing 1inch limit orders
 * @author @ppezzull
 */
library LimitOrderLib {
    // Maker traits flags
    uint256 private constant NO_PARTIAL_FILLS_FLAG = 255;
    uint256 private constant ALLOW_MULTIPLE_FILLS_FLAG = 254;
    uint256 private constant NEED_PREINTERACTION_FLAG = 252;
    uint256 private constant NEED_POSTINTERACTION_FLAG = 251;
    uint256 private constant NEED_EPOCH_CHECK_FLAG = 250;
    uint256 private constant HAS_EXTENSION_FLAG = 249;
    uint256 private constant USE_PERMIT2_FLAG = 248;
    uint256 private constant UNWRAP_WETH_FLAG = 247;

    // Taker traits flags
    uint256 private constant MAKER_AMOUNT_FLAG = 255;
    uint256 private constant UNWRAP_WETH_FLAG_TAKER = 254;
    uint256 private constant SKIP_ORDER_PERMIT_FLAG = 253;
    uint256 private constant USE_PERMIT2_FLAG_TAKER = 252;
    uint256 private constant ARGS_HAS_TARGET = 251;

    struct LimitOrderData {
        ILimitOrderProtocol.Order order;
        bytes extension;
        bytes signature;
        uint256 orderHash;
    }

    struct RebalanceOrder {
        address sellToken;
        address buyToken;
        uint256 sellAmount;
        uint256 buyAmount;
        uint256 slippageTolerance; // in basis points (1 = 0.01%)
    }

    event LimitOrderCreated(
        bytes32 indexed orderHash,
        address indexed maker,
        address sellToken,
        address buyToken,
        uint256 sellAmount,
        uint256 buyAmount
    );

    /**
     * @dev Create a basic limit order
     */
    function createLimitOrder(
        address maker,
        address receiver,
        address makerAsset,
        address takerAsset,
        uint256 makingAmount,
        uint256 takingAmount,
        uint256 salt,
        bool allowPartialFills,
        bool allowMultipleFills,
        uint256 expiration
    ) internal pure returns (ILimitOrderProtocol.Order memory order) {
        uint256 makerTraits = buildMakerTraits(
            address(0), // allowedSender
            false, // shouldCheckEpoch
            allowPartialFills, // allowPartialFill
            allowMultipleFills, // allowMultipleFills
            false, // usePermit2
            false, // unwrapWeth
            expiration, // expiry
            0, // nonce
            0 // series
        );

        order = ILimitOrderProtocol.Order({
            salt: salt,
            maker: maker,
            receiver: receiver,
            makerAsset: makerAsset,
            takerAsset: takerAsset,
            makingAmount: makingAmount,
            takingAmount: takingAmount,
            makerTraits: makerTraits
        });
    }

    /**
     * @dev Create a rebalancing limit order
     */
    function createRebalanceOrder(
        RebalanceOrder memory rebalanceOrder,
        address maker,
        uint256 salt
    ) external pure returns (ILimitOrderProtocol.Order memory order) {
        order = createLimitOrder(
            maker, // maker
            maker, // receiver
            rebalanceOrder.sellToken, // makerAsset
            rebalanceOrder.buyToken, // takerAsset
            rebalanceOrder.sellAmount, // makingAmount
            rebalanceOrder.buyAmount, // takingAmount
            salt, // salt
            true, // allowPartialFills
            false, // allowMultipleFills
            3600 // expiration: 1 hour expiration (will be added to current timestamp)
        );
    }

    /**
     * @dev Build maker traits for limit orders
     */
    function buildMakerTraits(
        address allowedSender,
        bool shouldCheckEpoch,
        bool allowPartialFill,
        bool allowMultipleFills,
        bool usePermit2,
        bool unwrapWeth,
        uint256 expiry,
        uint256 nonce,
        uint256 series
    ) internal pure returns (uint256 makerTraits) {
        // Validate inputs
        require(expiry < (1 << 40), "Expiry too large");
        require(nonce < (1 << 40), "Nonce too large");
        require(series < (1 << 40), "Series too large");

        makerTraits = (series << 160) |
                     (nonce << 120) |
                     (expiry << 80) |
                     (uint256(uint160(allowedSender)) & ((1 << 80) - 1));

        // Set flags
        if (!allowPartialFill) makerTraits |= (1 << NO_PARTIAL_FILLS_FLAG);
        if (allowMultipleFills) makerTraits |= (1 << ALLOW_MULTIPLE_FILLS_FLAG);
        if (shouldCheckEpoch) makerTraits |= (1 << NEED_EPOCH_CHECK_FLAG);
        if (usePermit2) makerTraits |= (1 << USE_PERMIT2_FLAG);
        if (unwrapWeth) makerTraits |= (1 << UNWRAP_WETH_FLAG);
    }

    /**
     * @dev Build taker traits for order filling
     */
    function buildTakerTraits(
        bool makingAmount,
        bool unwrapWeth,
        bool skipMakerPermit,
        bool usePermit2,
        address target,
        bytes memory extension,
        bytes memory interaction,
        uint256 threshold
    ) internal pure returns (ILimitOrderProtocol.TakerTraits memory takerTraits) {
        uint256 traits = threshold;

        if (makingAmount) traits |= (1 << MAKER_AMOUNT_FLAG);
        if (unwrapWeth) traits |= (1 << UNWRAP_WETH_FLAG_TAKER);
        if (skipMakerPermit) traits |= (1 << SKIP_ORDER_PERMIT_FLAG);
        if (usePermit2) traits |= (1 << USE_PERMIT2_FLAG_TAKER);
        if (target != address(0)) traits |= (1 << ARGS_HAS_TARGET);

        // Add extension and interaction lengths
        traits |= (uint256(extension.length) << 224);
        traits |= (uint256(interaction.length) << 200);

        takerTraits.traits = traits;
        takerTraits.args = abi.encodePacked(target, extension, interaction);
    }

    /**
     * @dev Calculate order hash
     */
    function calculateOrderHash(
        ILimitOrderProtocol.Order memory order,
        bytes32 domainSeparator
    ) external pure returns (bytes32 orderHash) {
        orderHash = keccak256(abi.encodePacked(
            "\x19\x01",
            domainSeparator,
            keccak256(abi.encode(
                order.salt,
                order.maker,
                order.receiver,
                order.makerAsset,
                order.takerAsset,
                order.makingAmount,
                order.takingAmount,
                order.makerTraits
            ))
        ));
    }

    /**
     * @dev Validate order parameters
     */
    function validateOrder(ILimitOrderProtocol.Order memory order) external pure returns (bool) {
        require(order.maker != address(0), "Invalid maker");
        require(order.makerAsset != address(0), "Invalid maker asset");
        require(order.takerAsset != address(0), "Invalid taker asset");
        require(order.makingAmount > 0, "Invalid making amount");
        require(order.takingAmount > 0, "Invalid taking amount");
        require(order.makerAsset != order.takerAsset, "Same assets");
        
        return true;
    }

    /**
     * @dev Calculate slippage-adjusted amounts
     */
    function calculateSlippageAmounts(
        uint256 baseAmount,
        uint256 slippageTolerance
    ) external pure returns (uint256 minAmount, uint256 maxAmount) {
        require(slippageTolerance <= 1000, "Slippage too high"); // Max 10%
        
        uint256 tolerance = (baseAmount * slippageTolerance) / 10000;
        minAmount = baseAmount - tolerance;
        maxAmount = baseAmount + tolerance;
    }
} 