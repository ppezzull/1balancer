// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "../interfaces/IBalancerFactory.sol";
import "../interfaces/ISpotPriceAggregator.sol";
import "../libraries/StablecoinAnalysisLib.sol";
import "./OptimizedBaseBalancer.sol";

contract OptimizedTimeBalancer is OptimizedBaseBalancer {
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
    ) OptimizedBaseBalancer(_owner, _factory, _assetAddresses, _percentages, _stablecoins, _limitOrderProtocol) {
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

    // ===== Automation hooks =====
    function _checkUpkeep(bytes calldata /*checkData*/) internal view override returns (bool upkeepNeeded, bytes memory performData) {
        // Time-based: upkeep when interval elapsed
        bool due = block.timestamp >= lastRebalance + interval;
        if (!due) return (false, bytes(""));
        return (true, bytes(""));
    }

    function _performUpkeep(bytes calldata /*performData*/) internal override {
        // Simply emit that a rebalance is needed because interval elapsed
        uint256[] memory current = currentAllocations();
        emit RebalanceNeeded(current, block.timestamp);
        lastRebalance = block.timestamp;
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
