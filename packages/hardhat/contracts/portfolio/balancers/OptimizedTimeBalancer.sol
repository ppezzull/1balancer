// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IBalancerFactory.sol";
import "../interfaces/ISpotPriceAggregator.sol";
import "../libraries/StablecoinAnalysisLib.sol";
import "./OptimizedDriftBalancer.sol";

contract OptimizedTimeBalancer is OptimizedDriftBalancer {
    uint256 public interval;
    uint256 public lastRebalance;
    string public timeName;
    string public timeDescription;

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
    ) OptimizedDriftBalancer(_owner, _factory, _assetAddresses, _percentages, 0, _stablecoins, _limitOrderProtocol) {
        interval = _interval;
        lastRebalance = block.timestamp;
        timeName = "Optimized Time Balancer";
        timeDescription = "Periodically checks and rebalances based on a fixed interval and stablecoin deviations.";
    }

    function triggerTimeRebalance() external {
        require(block.timestamp >= lastRebalance + interval, "Too early");
        lastRebalance = block.timestamp;

        // Also detect stablecoin deviations using shared library
        (bool upkeepNeeded, ) = StablecoinAnalysisLib.detectDeviation(stablecoins, IBalancerFactory(factory).priceFeed(), 1e15);
        if (upkeepNeeded) {
            uint256[] memory current = currentAllocations();
            emit RebalanceNeeded(current, block.timestamp);
        }
    }

    function setRebalanceInterval(uint256 _interval) external onlyOwner {
        interval = _interval;
        emit IntervalUpdated(_interval);
    }

    function updateTimeMetadata(string calldata _name, string calldata _description) external onlyOwner {
        timeName = _name;
        timeDescription = _description;
    }

    function currentAllocations() public view returns (uint256[] memory) {
        uint256[] memory allocations = new uint256[](assetGroupsCount);
        for (uint256 i = 0; i < assetGroupsCount; i++) {
            allocations[i] = assetGroups[i].percentage;
        }
        return allocations;
    }
}
