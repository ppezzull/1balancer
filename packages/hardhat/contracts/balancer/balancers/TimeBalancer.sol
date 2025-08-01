// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
 * TimeBalancer
 *
 * A portfolio that rebalances on a fixed schedule. Users can configure the
 * interval in seconds. When the interval has elapsed the `triggerTimeRebalance`
 * function will emit a `RebalanceNeeded` event. In a full implementation this
 * would generate limit orders via the inherited StableLimit module. Here we
 * simply emit the event for off‑chain listeners to act upon.
 */

import "../modules/BaseBalancer.sol";

contract TimeBalancer is BaseBalancer {
    uint256 public rebalanceInterval;
    uint256 public lastRebalance;

    constructor(
        address _owner,
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        uint256 _driftPercentage,
        uint256 _updatePeriodicity,
        address _stableToken,
        address _stablePriceFeed,
        uint256 _lowerBound,
        uint256 _upperBound,
        uint256 _interval
    ) BaseBalancer(_owner, _assetAddresses, _percentages, _driftPercentage, _updatePeriodicity, _stableToken, _stablePriceFeed, _lowerBound, _upperBound) {
        rebalanceInterval = _interval;
        lastRebalance = block.timestamp;
    }

    event RebalanceNeeded(uint256[] allocations, uint256 timestamp);
     
    function currentAllocations() public view returns (uint256[] memory) {
        uint256[] memory allocations = new uint256[](assetAddresses.length);
        for (uint256 i = 0; i < assetAddresses.length; i++) {
            allocations[i] = assets[assetAddresses[i]].percentage;
        }
        return allocations;
    }

    /// @notice Update the rebalance interval
    function setRebalanceInterval(uint256 _interval) external {
        require(msg.sender == owner(), "Only owner");
        rebalanceInterval = _interval;
    }

    /// @notice Trigger a time‑based rebalance if the interval has elapsed
    function triggerTimeRebalance() external {
        require(block.timestamp >= lastRebalance + rebalanceInterval, "Too early");
        lastRebalance = block.timestamp;
        // emit with current allocations
        uint256[] memory current = currentAllocations();
        emit RebalanceNeeded(current, block.timestamp);
    }
}