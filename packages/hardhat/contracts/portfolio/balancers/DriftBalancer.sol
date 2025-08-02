// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/*
 * DriftBalancer
 *
 * A portfolio that triggers rebalancing when the allocation drift of any token
 * exceeds a tolerance. It inherits all core functionality from BaseBalancer
 * including stablecoin peg monitoring and emits the same events. For this
 * minimal hackathon implementation the contract simply exposes a public
 * function that can be called to check whether the portfolio has drifted and
 * emit a `RebalanceNeeded` event if so.
 */

import "../modules/BaseBalancer.sol";

contract DriftBalancer is BaseBalancer {
    uint256 public driftPercentage;

    event DriftPercentageUpdated(uint256 newDriftPercentage);
    event RebalanceNeeded(address[] tokens, uint256[] currentPercentages, uint256[] targetPercentages, uint256[] deviations);
    event StablecoinRebalanceNeeded(uint256 totalStablecoinValue, uint256[] balances, uint256[] values);
    event NonStablecoinRebalanceNeeded(address[] tokens, uint256[] balances, uint256[] values, uint256 totalValue);

    constructor(
        address _owner,
        address _factory,
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        uint256 _driftPercentage,
        address[] memory _stablecoins
    ) BaseBalancer(_owner, _factory, _assetAddresses, _percentages, _stablecoins) {
        driftPercentage = _driftPercentage;
    }

    /// @notice Public function to check drift and emit event if needed
    function triggerRebalance() external {
        _checkAndTriggerRebalance();
    }

    /// @notice Check stablecoin balances and trigger rebalance if needed
    function checkStablecoinDrift() external {
        (uint256 totalStablecoinValue, uint256[] memory balances, uint256[] memory values) = this.checkStablecoinBalances();
        
        // Check if any stablecoin has drifted beyond threshold
        bool rebalanceNeeded = false;
        uint256 totalValue = getTotalValue();
        
        if (totalValue > 0) {
            for (uint256 i = 0; i < stablecoins.length; i++) {
                address stablecoin = stablecoins[i];
                if (assets[stablecoin].percentage > 0) {
                    uint256 currentPercentage = (values[i] * 100) / totalValue;
                    uint256 targetPercentage = assets[stablecoin].percentage;
                    
                    (bool withinRange, uint256 deviation) = checkAssetBalance(
                        stablecoin,
                        balances[i],
                        currentPercentage,
                        targetPercentage,
                        values[i]
                    );
                    
                    if (!withinRange && deviation > driftPercentage) {
                        rebalanceNeeded = true;
                        break;
                    }
                }
            }
        }
        
        if (rebalanceNeeded) {
            emit StablecoinRebalanceNeeded(totalStablecoinValue, balances, values);
        }
    }

    /// @notice Check non-stablecoin balances and trigger rebalance if needed
    function checkNonStablecoinDrift() external {
        (
            address[] memory tokens,
            uint256[] memory balances,
            uint256[] memory values,
            uint256 totalNonStablecoinValue
        ) = this.checkNonStablecoinBalances();
        
        bool rebalanceNeeded = false;
        uint256 totalValue = getTotalValue();
        
        if (totalValue > 0) {
            for (uint256 i = 0; i < tokens.length; i++) {
                uint256 currentPercentage = (values[i] * 100) / totalValue;
                uint256 targetPercentage = assets[tokens[i]].percentage;
                
                (bool withinRange, uint256 deviation) = checkAssetBalance(
                    tokens[i],
                    balances[i],
                    currentPercentage,
                    targetPercentage,
                    values[i]
                );
                
                if (!withinRange && deviation > driftPercentage) {
                    rebalanceNeeded = true;
                    break;
                }
            }
        }
        
        if (rebalanceNeeded) {
            emit NonStablecoinRebalanceNeeded(tokens, balances, values, totalNonStablecoinValue);
        }
    }

    /**
     * @notice Updates the drift percentage.
     * @param _newDriftPercentage The new drift percentage.
     */
    function updateDriftPercentage(uint256 _newDriftPercentage) external onlyOwner {
        driftPercentage = _newDriftPercentage;
        emit DriftPercentageUpdated(_newDriftPercentage);
    }

    function _checkAndTriggerRebalance() internal {
        uint256 totalValue = getTotalValue();
        if (totalValue == 0) return;

        address[] memory tokens = new address[](assetAddresses.length);
        uint256[] memory currentPercentages = new uint256[](assetAddresses.length);
        uint256[] memory targetPercentages = new uint256[](assetAddresses.length);
        uint256[] memory deviations = new uint256[](assetAddresses.length);
        
        bool rebalanceNeeded = false;
        
        for (uint256 i = 0; i < assetAddresses.length; i++) {
            address token = assetAddresses[i];
            uint256 balance = IERC20(token).balanceOf(address(this));
            uint256 value = getPrice(token, balance);
            uint256 currentPercentage = (value * 100) / totalValue;
            uint256 targetPercentage = assets[token].percentage;
            
            tokens[i] = token;
            currentPercentages[i] = currentPercentage;
            targetPercentages[i] = targetPercentage;
            
            (bool withinRange, uint256 deviation) = checkAssetBalance(
                token,
                balance,
                currentPercentage,
                targetPercentage,
                value
            );
            
            deviations[i] = deviation;
            
            if (!withinRange && deviation > driftPercentage) {
                rebalanceNeeded = true;
            }
        }
        
        if (rebalanceNeeded) {
            emit RebalanceNeeded(tokens, currentPercentages, targetPercentages, deviations);
        }
    }
}
