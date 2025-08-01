// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
    constructor(
        address _owner,
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        uint256 _driftPercentage,
        uint256 _updatePeriodicity,
        address _stableToken,
        address _stablePriceFeed,
        uint256 _lowerBound,
        uint256 _upperBound
    ) BaseBalancer(_owner, _assetAddresses, _percentages, _driftPercentage, _updatePeriodicity, _stableToken, _stablePriceFeed, _lowerBound, _upperBound) {}

    /// @notice Public function to check drift and emit event if needed
    function triggerRebalance() external {
        checkAndTriggerRebalance();
    }

    function checkAndTriggerRebalance() internal {
        // TODO: Implementation needed
    }
}