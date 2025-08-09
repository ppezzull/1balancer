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

    // Price bounds for stablecoin deviation detection (wider bounds for testing)
    // Tighter bounds so a 1% deviation triggers actions (e.g., 0.99 is outside bounds)
    uint256 internal constant LOWER_BOUND = 995 * 1e15; // 0.995
    uint256 internal constant UPPER_BOUND = 1005 * 1e15; // 1.005

    /**
     * @dev Generate grid orders for stablecoin pairs
     */
    function generateGridOrders(
        address[] memory stablecoins,
        GridParams memory params
    ) internal pure returns (Order[] memory orders) {
        if (params.nLevels == 0) return new Order[](0);

        uint256 nPairs = stablecoins.length;
        if (nPairs < 2) return new Order[](0);

        uint256 nLevelsAdjusted = params.nLevels;
        uint256 denominator = params.nLevels * 2 * (nPairs - 1);
        uint256 baseOrderAmount = denominator == 0 ? 0 : params.capital / denominator;

        if (baseOrderAmount < params.minOrderSize) {
            uint256 denomMin = params.minOrderSize * 2 * (nPairs - 1);
            nLevelsAdjusted = denomMin == 0 ? 0 : params.capital / denomMin;
            if (nLevelsAdjusted == 0) nLevelsAdjusted = 1;
        } else if (baseOrderAmount > params.maxOrderSize) {
            uint256 denomMax = params.maxOrderSize * 2 * (nPairs - 1);
            nLevelsAdjusted = denomMax == 0 ? 0 : params.capital / denomMax;
            uint256 maxLevels = 100;
            if (nLevelsAdjusted > maxLevels) nLevelsAdjusted = maxLevels;
        }

        if (nLevelsAdjusted == 0) return new Order[](0);

        uint256 perLevelDenom = nLevelsAdjusted * 2 * (nPairs - 1);
        uint256 finalOrderAmount = params.capital / perLevelDenom;
        orders = new Order[](perLevelDenom);
        uint256 idx = 0;
        uint256 step = (PRICE_PRECISION * params.gridRangeBps) / 10000;
        uint256 peg = params.pegPrice;

        unchecked {
            for (uint256 pair = 0; pair < nPairs - 1; pair++) {
                address fromToken = stablecoins[pair];
                address toToken = stablecoins[pair + 1];
                for (uint256 i = 0; i < nLevelsAdjusted; i++) {
                    uint256 offset = ((i + 1) * step) / nLevelsAdjusted;
                    orders[idx++] = Order(fromToken, toToken, finalOrderAmount, peg + offset);
                    orders[idx++] = Order(toToken, fromToken, finalOrderAmount, peg - offset);
                }
            }
        }

        return orders;
    }

    /**
     * @dev Check if price is within acceptable bounds
     */
    function isPriceWithinBounds(uint256 price) internal pure returns (bool) {
        return price >= LOWER_BOUND && price <= UPPER_BOUND;
    }

    /**
     * @dev Calculate grid order parameters
     */
    function calculateGridParams(
        uint256 stablecoinValue,
        uint256 nLevels,
        uint256 gridRangeBps
    ) internal pure returns (GridParams memory params) {
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