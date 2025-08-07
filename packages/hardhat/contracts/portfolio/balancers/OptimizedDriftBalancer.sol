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

        uint256[] memory groupDeviations = new uint256[](assetGroupsCount);
        address[][] memory groupTokens = new address[][](assetGroupsCount);
        
        bool rebalanceNeeded = false;
        
        for (uint256 groupId = 0; groupId < assetGroupsCount; groupId++) {
            AssetGroup memory group = assetGroups[groupId];
            uint256 groupValue = 0;
            
            // Calculate total value for this group
            for (uint256 i = 0; i < group.tokens.length; i++) {
                uint256 balance = IERC20(group.tokens[i]).balanceOf(address(this));
                groupValue += getPrice(group.tokens[i], balance);
            }
            
            uint256 currentPercentage = (groupValue * 100) / totalValue;
            uint256 targetPercentage = group.percentage;
            
            // Calculate deviation
            uint256 deviation = currentPercentage > targetPercentage 
                ? currentPercentage - targetPercentage 
                : targetPercentage - currentPercentage;
            
            groupDeviations[groupId] = deviation;
            groupTokens[groupId] = group.tokens;
            
            if (deviation > driftPercentage) {
                rebalanceNeeded = true;
            }
        }
        
        if (rebalanceNeeded) {
            // Flatten tokens array for the event
            address[] memory allTokens = new address[](assetAddresses.length);
            uint256[] memory allDeviations = new uint256[](assetAddresses.length);
            
            uint256 tokenIndex = 0;
            for (uint256 groupId = 0; groupId < assetGroupsCount; groupId++) {
                for (uint256 i = 0; i < groupTokens[groupId].length; i++) {
                    allTokens[tokenIndex] = groupTokens[groupId][i];
                    allDeviations[tokenIndex] = groupDeviations[groupId];
                    tokenIndex++;
                }
            }
            
            emit RebalanceNeeded(allTokens, allDeviations);
        }
    }
}
