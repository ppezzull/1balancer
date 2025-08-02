// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/*
 * TimeBalancer
 *
 * A portfolio that triggers rebalancing at fixed time intervals. It inherits
 * all core functionality from BaseBalancer including stablecoin peg monitoring
 * and emits the same events. For this minimal hackathon implementation the
 * contract simply exposes a public function that can be called to check
 * whether the portfolio has drifted and emit a `RebalanceNeeded` event if so.
 */

import "../modules/BaseBalancer.sol";

contract TimeBalancer is BaseBalancer {
    uint256 public interval; // In seconds
    uint256 public lastRebalance;

    event IntervalUpdated(uint256 newInterval);
    event RebalanceNeeded(uint256[] allocations, uint256 timestamp);
    event StablecoinTimeRebalance(uint256 totalStablecoinValue, uint256[] balances, uint256[] values, uint256 timestamp);
    event NonStablecoinTimeRebalance(address[] tokens, uint256[] balances, uint256[] values, uint256 totalValue, uint256 timestamp);

    constructor(
        address _owner,
        address _factory,
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        uint256 _interval,
        address[] memory _stablecoins
    ) BaseBalancer(_owner, _factory, _assetAddresses, _percentages, _stablecoins) {
        interval = _interval;
        lastRebalance = block.timestamp;
    }

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
        interval = _interval;
    }

    /// @notice Trigger a time‑based rebalance if the interval has elapsed
    function triggerTimeRebalance() external {
        require(block.timestamp >= lastRebalance + interval, "Too early");
        lastRebalance = block.timestamp;
        // emit with current allocations
        uint256[] memory current = currentAllocations();
        emit RebalanceNeeded(current, block.timestamp);
    }

    /// @notice Check stablecoin balances on time interval
    function checkStablecoinTimeRebalance() external {
        require(block.timestamp >= lastRebalance + interval, "Too early for stablecoin rebalance");
        
        (uint256 totalStablecoinValue, uint256[] memory balances, uint256[] memory values) = this.checkStablecoinBalances();
        
        emit StablecoinTimeRebalance(totalStablecoinValue, balances, values, block.timestamp);
        lastRebalance = block.timestamp;
    }

    /// @notice Check non-stablecoin balances on time interval
    function checkNonStablecoinTimeRebalance() external {
        require(block.timestamp >= lastRebalance + interval, "Too early for non-stablecoin rebalance");
        
        (
            address[] memory tokens,
            uint256[] memory balances,
            uint256[] memory values,
            uint256 totalNonStablecoinValue
        ) = this.checkNonStablecoinBalances();
        
        emit NonStablecoinTimeRebalance(tokens, balances, values, totalNonStablecoinValue, block.timestamp);
        lastRebalance = block.timestamp;
    }
}
