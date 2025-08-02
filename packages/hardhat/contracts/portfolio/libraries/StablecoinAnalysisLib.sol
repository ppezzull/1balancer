// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library StablecoinAnalysisLib {
    /**
     * @dev Get stablecoin balances and values
     */
    function getStablecoinData(
        address[] memory stablecoins,
        address balancerContract,
        function(address, uint256) internal view returns (uint256) getPriceFunc
    ) internal view returns (
        uint256 totalStablecoinValue,
        uint256[] memory balances,
        uint256[] memory values
    ) {
        uint256 stablecoinCount = stablecoins.length;
        balances = new uint256[](stablecoinCount);
        values = new uint256[](stablecoinCount);
        totalStablecoinValue = 0;

        for (uint256 i = 0; i < stablecoinCount; i++) {
            address stablecoin = stablecoins[i];
            uint256 balance = IERC20(stablecoin).balanceOf(balancerContract);
            uint256 value = getPriceFunc(stablecoin, balance);
            
            balances[i] = balance;
            values[i] = value;
            totalStablecoinValue += value;
        }
    }

    /**
     * @dev Filter non-stablecoin assets
     */
    function filterNonStablecoins(
        address[] memory allAssets,
        mapping(address => bool) storage isStablecoin
    ) internal view returns (address[] memory nonStablecoins) {
        uint256 count = 0;
        
        // Count non-stablecoins
        for (uint256 i = 0; i < allAssets.length; i++) {
            if (!isStablecoin[allAssets[i]]) {
                count++;
            }
        }

        nonStablecoins = new address[](count);
        uint256 index = 0;
        
        // Fill array
        for (uint256 i = 0; i < allAssets.length; i++) {
            if (!isStablecoin[allAssets[i]]) {
                nonStablecoins[index] = allAssets[i];
                index++;
            }
        }
    }
}
