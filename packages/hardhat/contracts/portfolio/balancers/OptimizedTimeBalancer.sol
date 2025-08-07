// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "../modules/OptimizedBaseBalancer.sol";

contract OptimizedTimeBalancer is OptimizedBaseBalancer {
    uint256 public interval;
    uint256 public lastRebalance;

    event IntervalUpdated(uint256 newInterval);
    event RebalanceNeeded(uint256[] allocations, uint256 timestamp);

    constructor(
        address _owner,
        address _factory,
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        uint256 _interval,
        address[] memory _stablecoins,
        address _limitOrderProtocol
    ) OptimizedBaseBalancer(_owner, _factory, _assetAddresses, _percentages, _stablecoins, _limitOrderProtocol) {
        interval = _interval;
        lastRebalance = block.timestamp;
    }

    function triggerTimeRebalance() external {
        require(block.timestamp >= lastRebalance + interval, "Too early");
        lastRebalance = block.timestamp;
        
        uint256[] memory current = currentAllocations();
        emit RebalanceNeeded(current, block.timestamp);
    }

    function setRebalanceInterval(uint256 _interval) external onlyOwner {
        interval = _interval;
        emit IntervalUpdated(_interval);
    }

    function currentAllocations() public view returns (uint256[] memory) {
        uint256[] memory allocations = new uint256[](assetGroupsCount);
        for (uint256 i = 0; i < assetGroupsCount; i++) {
            allocations[i] = assetGroups[i].percentage;
        }
        return allocations;
    }
}
