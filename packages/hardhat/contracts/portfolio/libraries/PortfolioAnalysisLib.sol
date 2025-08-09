// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

library PortfolioAnalysisLib {
    struct PortfolioData {
        uint256 portfolioValue;
        uint256 stablecoinRatio;
        bool isBalanced;
        bool rebalanceNeeded;
    }

    struct AssetAnalysis {
        address token;
        uint256 balance;
        uint256 currentPercentage;
        uint256 targetPercentage;
        uint256 deviation;
        bool withinRange;
    }

    /**
     * @dev Check if an asset's balance is within acceptable percentage range
     */
    function checkAssetBalance(
        uint256 currentPercentage,
        uint256 targetPercentage
    ) internal pure returns (bool isWithinRange, uint256 deviation) {
        if (currentPercentage > targetPercentage) {
            deviation = currentPercentage - targetPercentage;
        } else {
            deviation = targetPercentage - currentPercentage;
        }

        isWithinRange = deviation <= 5; // 5% tolerance
        return (isWithinRange, deviation);
    }

    /**
     * @dev Calculate portfolio metrics
     */
    function calculatePortfolioMetrics(
        uint256 totalValue,
        uint256 stablecoinValue
    ) internal pure returns (uint256 stablecoinRatio) {
        if (totalValue == 0) return 0;
        unchecked {
            stablecoinRatio = (stablecoinValue * 10000) / totalValue; // Basis points
        }
    }
}
