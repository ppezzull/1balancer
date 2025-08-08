// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/ISpotPriceAggregator.sol";
import "../interfaces/IBalancerFactory.sol";

library StablecoinAnalysisLib {
    using SafeERC20 for IERC20;

    function detectDeviation(
        address[] storage stablecoins,
        address priceFeed,
        uint256 minDrift
    ) internal view returns (bool upkeepNeeded, bytes memory performData) {
        uint256 n = stablecoins.length;
        if (n > 1) {
            address ref = stablecoins[0];
            // Primary: check token -> ref pairs (what tests set)
            for (uint256 i = 1; i < n; i++) {
                try ISpotPriceAggregator(priceFeed).getRate(stablecoins[i], ref, false) returns (uint256 p) {
                    if (p > 1e18 + minDrift || p + minDrift < 1e18) {
                        return (true, abi.encode(stablecoins[i], ref, p));
                    }
                } catch {}
            }
            // Secondary: full pairwise scan both directions as fallback
            for (uint256 i2 = 0; i2 < n - 1; i2++) {
                for (uint256 j2 = i2 + 1; j2 < n; j2++) {
                    try ISpotPriceAggregator(priceFeed).getRate(stablecoins[i2], stablecoins[j2], false) returns (uint256 p1) {
                        if (p1 > 1e18 + minDrift || p1 + minDrift < 1e18) {
                            return (true, abi.encode(stablecoins[i2], stablecoins[j2], p1));
                        }
                    } catch {}
                    try ISpotPriceAggregator(priceFeed).getRate(stablecoins[j2], stablecoins[i2], false) returns (uint256 p2) {
                        if (p2 > 1e18 + minDrift || p2 + minDrift < 1e18) {
                            return (true, abi.encode(stablecoins[j2], stablecoins[i2], p2));
                        }
                    } catch {}
                }
            }
        }
        return (false, bytes(""));
    }

    function computeGroupStablecoinDeviation(
        address[] memory groupTokens,
        address referenceStable,
        address priceFeed,
        uint256 minDrift
    ) internal view returns (bool rebalanceNeeded, uint256 deviation) {
        // Pairwise check
        for (uint256 i = 0; i < groupTokens.length - 1; i++) {
            for (uint256 j = i + 1; j < groupTokens.length; j++) {
                uint256 p = ISpotPriceAggregator(priceFeed).getRate(groupTokens[i], groupTokens[j], false);
                if (p > 1e18 + minDrift || p + minDrift < 1e18) {
                    rebalanceNeeded = true;
                    deviation = p > 1e18 ? p - 1e18 : 1e18 - p;
                }
            }
        }
        if (referenceStable != address(0)) {
            for (uint256 k = 0; k < groupTokens.length; k++) {
                if (groupTokens[k] == referenceStable) continue;
                uint256 pRef = ISpotPriceAggregator(priceFeed).getRate(groupTokens[k], referenceStable, false);
                if (pRef > 1e18 + minDrift || pRef + minDrift < 1e18) {
                    rebalanceNeeded = true;
                    deviation = pRef > 1e18 ? pRef - 1e18 : 1e18 - pRef;
                }
            }
        }
    }

    function totalStablecoinValue(
        address[] storage stablecoins,
        address priceFeed,
        address self
    ) internal view returns (uint256) {
        uint256 totalValue = 0;
        for (uint256 i = 0; i < stablecoins.length; i++) {
            address stablecoin = stablecoins[i];
            uint256 balance = IERC20(stablecoin).balanceOf(self);
            if (balance > 0) {
                uint256 price = ISpotPriceAggregator(priceFeed).getRateToEth(stablecoin, false);
                totalValue += (balance * price) / 1e18;
            }
        }
        return totalValue;
    }
}


