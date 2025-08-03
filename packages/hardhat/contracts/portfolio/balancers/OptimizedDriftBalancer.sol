// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "../modules/OptimizedBaseBalancer.sol";

contract OptimizedDriftBalancer is OptimizedBaseBalancer {
    uint256 public driftPercentage;

    event DriftPercentageUpdated(uint256 newDriftPercentage);
    event RebalanceNeeded(address[] tokens, uint256[] deviations);

    constructor(
        address _owner,
        address _factory,
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        uint256 _driftPercentage,
        address[] memory _stablecoins,
        address _limitOrderProtocol
    ) OptimizedBaseBalancer(_owner, _factory, _assetAddresses, _percentages, _stablecoins, _limitOrderProtocol) {
        driftPercentage = _driftPercentage;
    }

    function triggerRebalance() external {
        _checkAndTriggerRebalance();
    }

    function updateDriftPercentage(uint256 _newDriftPercentage) external onlyOwner {
        driftPercentage = _newDriftPercentage;
        emit DriftPercentageUpdated(_newDriftPercentage);
    }

    function _checkAndTriggerRebalance() internal {
        uint256 totalValue = getTotalValue();
        if (totalValue == 0) return;

        address[] memory tokens = new address[](assetAddresses.length);
        uint256[] memory deviations = new uint256[](assetAddresses.length);
        
        bool rebalanceNeeded = false;
        
        for (uint256 i = 0; i < assetAddresses.length; i++) {
            address token = assetAddresses[i];
            uint256 balance = IERC20(token).balanceOf(address(this));
            uint256 value = getPrice(token, balance);
            uint256 currentPercentage = (value * 100) / totalValue;
            uint256 targetPercentage = assets[token].percentage;
            
            tokens[i] = token;
            
            (bool withinRange, uint256 deviation) = checkAssetBalance(
                token, balance, currentPercentage, targetPercentage, value
            );
            
            deviations[i] = deviation;
            
            if (!withinRange && deviation > driftPercentage) {
                rebalanceNeeded = true;
            }
        }
        
        if (rebalanceNeeded) {
            emit RebalanceNeeded(tokens, deviations);
        }
    }
}
