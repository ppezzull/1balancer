// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title StablecoinGridLib
 * @dev Grid trading logic for stablecoins extracted from StableLimit
 * @author @ppezzull
 */
library StablecoinGridLib {
    struct Order {
        address fromToken;
        address toToken;
        uint256 amount;
        uint256 limitPrice; // Price with 1e18 precision
    }

    struct GridParams {
        uint256 capital;
        uint256 nLevels;
        uint256 minOrderSize;
        uint256 maxOrderSize;
        uint256 gridRangeBps;
        uint256 pegPrice;
    }

    // Constants
    uint256 private constant PRICE_PRECISION = 1e18;
    uint256 private constant USDC_DECIMALS = 6;
    uint256 private constant DAI_DECIMALS = 18;

    // Price deviation bounds (1e18 representation)
    uint256 public constant LOWER_BOUND = 998 * 1e15; // 0.998
    uint256 public constant UPPER_BOUND = 1002 * 1e15; // 1.002

    /**
     * @dev Generate grid orders for stablecoin pairs
     */
    function generateGridOrders(
        address[] memory stablecoins,
        GridParams memory params
    ) external pure returns (Order[] memory orders) {
        if (params.nLevels == 0) return new Order[](0);

        uint256 nPairs = stablecoins.length > 1 ? stablecoins.length : 0;
        if (nPairs < 2) return new Order[](0);

        uint256 nLevelsAdjusted = params.nLevels;
        uint256 baseOrderAmount = params.capital / (params.nLevels * 2 * (nPairs - 1));

        if (baseOrderAmount < params.minOrderSize) {
            nLevelsAdjusted = params.capital / (params.minOrderSize * 2 * (nPairs - 1));
            if (nLevelsAdjusted == 0) nLevelsAdjusted = 1;
        } else if (baseOrderAmount > params.maxOrderSize) {
            nLevelsAdjusted = params.capital / (params.maxOrderSize * 2 * (nPairs - 1));
            uint256 maxLevels = 100;
            if (nLevelsAdjusted > maxLevels) nLevelsAdjusted = maxLevels;
        }

        if (nLevelsAdjusted == 0) return new Order[](0);

        uint256 finalOrderAmount = params.capital / (nLevelsAdjusted * 2 * (nPairs - 1));
        orders = new Order[](nLevelsAdjusted * 2 * (nPairs - 1));
        uint256 idx = 0;

        for (uint256 pair = 0; pair < nPairs - 1; pair++) {
            address fromToken = stablecoins[pair];
            address toToken = stablecoins[(pair + 1) % nPairs];
            for (uint256 i = 0; i < nLevelsAdjusted; i++) {
                uint256 offset = ((((i + 1) * PRICE_PRECISION) / nLevelsAdjusted) * params.gridRangeBps) / 10000;
                orders[idx++] = Order(fromToken, toToken, finalOrderAmount, params.pegPrice + offset);
                orders[idx++] = Order(toToken, fromToken, finalOrderAmount, params.pegPrice - offset);
            }
        }

        return orders;
    }

    /**
     * @dev Check if price is within acceptable bounds
     */
    function isPriceWithinBounds(uint256 price) external pure returns (bool) {
        return price >= LOWER_BOUND && price <= UPPER_BOUND;
    }

    /**
     * @dev Calculate grid order parameters
     */
    function calculateGridParams(
        uint256 stablecoinValue,
        uint256 nLevels,
        uint256 gridRangeBps
    ) external pure returns (GridParams memory params) {
        params.capital = stablecoinValue / 10; // Use 10% of stablecoin value
        params.nLevels = nLevels;
        params.minOrderSize = 10 * (10 ** USDC_DECIMALS); // 10 USDC
        params.maxOrderSize = params.capital;
        params.gridRangeBps = gridRangeBps;
        params.pegPrice = 1 * PRICE_PRECISION; // 1 USD for stablecoins
    }

    /**
     * @dev Validate stablecoin pair for grid trading
     */
    function validateStablecoinPair(
        address token1,
        address token2,
        mapping(address => bool) storage isStablecoin
    ) external view returns (bool) {
        return isStablecoin[token1] && isStablecoin[token2] && token1 != token2;
    }
} 