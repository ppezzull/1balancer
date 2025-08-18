// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/IOracleAdapter.sol";
import "../interfaces/IBalancerFactory.sol";

library StablecoinAnalysisLib {
    using SafeERC20 for IERC20;

    function detectDeviation(
        address[] storage stablecoins,
        address priceFeed,
        uint256 minDrift
    ) internal view returns (bool upkeepNeeded, bytes memory performData) {
        uint256 n = stablecoins.length;
        if (n <= 1) return (false, bytes(""));
        if (priceFeed == address(0)) return (false, bytes(""));
        address ref = stablecoins[0];
        bytes4 sel = IOracleAdapter.getRate.selector; // getRate(address,address,bool)
        unchecked {
            // Primary: check token -> ref pairs (what tests set)
            for (uint256 i = 1; i < n; i++) {
                (bool ok, bytes memory ret) = priceFeed.staticcall(abi.encodeWithSelector(sel, stablecoins[i], ref, false));
                if (ok && ret.length >= 32) {
                    uint256 p = abi.decode(ret, (uint256));
                    if (p >= 1e18 + minDrift || p + minDrift <= 1e18) {
                        return (true, abi.encode(stablecoins[i], ref, p));
                    }
                }
            }
            // Secondary: full pairwise scan both directions as fallback
            for (uint256 i2 = 0; i2 + 1 < n; i2++) {
                for (uint256 j2 = i2 + 1; j2 < n; j2++) {
                    (bool ok1, bytes memory ret1) = priceFeed.staticcall(
                        abi.encodeWithSelector(sel, stablecoins[i2], stablecoins[j2], false)
                    );
                    if (ok1 && ret1.length >= 32) {
                        uint256 p1 = abi.decode(ret1, (uint256));
                        if (p1 >= 1e18 + minDrift || p1 + minDrift <= 1e18) {
                            return (true, abi.encode(stablecoins[i2], stablecoins[j2], p1));
                        }
                    }
                    (bool ok2, bytes memory ret2) = priceFeed.staticcall(
                        abi.encodeWithSelector(sel, stablecoins[j2], stablecoins[i2], false)
                    );
                    if (ok2 && ret2.length >= 32) {
                        uint256 p2 = abi.decode(ret2, (uint256));
                        if (p2 >= 1e18 + minDrift || p2 + minDrift <= 1e18) {
                            return (true, abi.encode(stablecoins[j2], stablecoins[i2], p2));
                        }
                    }
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
        unchecked {
            for (uint256 i = 0; i + 1 < groupTokens.length; i++) {
                for (uint256 j = i + 1; j < groupTokens.length; j++) {
                uint256 p = IOracleAdapter(priceFeed).getRate(groupTokens[i], groupTokens[j], false);
                if (p > 1e18 + minDrift || p + minDrift < 1e18) {
                    rebalanceNeeded = true;
                    deviation = p > 1e18 ? p - 1e18 : 1e18 - p;
                }
                }
            }
        }
        if (referenceStable != address(0)) {
            for (uint256 k = 0; k < groupTokens.length; k++) {
                if (groupTokens[k] == referenceStable) continue;
                uint256 pRef = IOracleAdapter(priceFeed).getRate(groupTokens[k], referenceStable, false);
                if (pRef >= 1e18 + minDrift || pRef + minDrift <= 1e18) {
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
                uint256 price = IOracleAdapter(priceFeed).getRateToEth(stablecoin, false);
                totalValue += (balance * price) / 1e18;
            }
        }
        return totalValue;
    }
}


