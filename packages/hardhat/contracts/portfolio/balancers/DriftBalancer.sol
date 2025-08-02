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

    /**
     * @notice Updates the drift percentage.
     * @param _newDriftPercentage The new drift percentage.
     */
    function updateDriftPercentage(uint256 _newDriftPercentage) external onlyOwner {
        driftPercentage = _newDriftPercentage;
        emit DriftPercentageUpdated(_newDriftPercentage);
    }

    function _checkAndTriggerRebalance() internal {
        // TODO: Implementation needed
    }
}
