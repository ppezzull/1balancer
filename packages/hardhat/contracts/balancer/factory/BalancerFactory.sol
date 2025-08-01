// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
 * BalancerFactory
 *
 * A simple factory contract that deploys DriftBalancer or TimeBalancer
 * instances. Each user may create multiple balancers depending on their
 * strategy. The factory keeps track of created balancers and emits an event
 * upon deployment. Deployed balancers are owned by the caller and can be
 * initialized with custom portfolio parameters post‑deployment.
 */

import "../balancers/DriftBalancer.sol";
import "../balancers/TimeBalancer.sol";

contract BalancerFactory {
    /// @dev Lists of deployed drift and time balancers per user
    mapping(address => address[]) public userDriftBalancers;
    mapping(address => address[]) public userTimeBalancers;

    /// @dev Emitted when a new balancer is created
    event BalancerCreated(address indexed user, address balancer, bool isTimeBased);

    /**
     * @notice Create a new DriftBalancer
     * @param stableToken The address of the stablecoin used for peg monitoring
     * @param stablePriceFeed The price feed for the stablecoin (8 decimals)
     * @param lowerBound Lower bound for acceptable price (1e8 representation)
     * @param upperBound Upper bound for acceptable price (1e8 representation)
     */
    function createDriftBalancer(
        address _owner,
        address stableToken,
        address stablePriceFeed,
        uint256 lowerBound,
        uint256 upperBound,
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        uint256 _driftPercentage,
        uint256 _updatePeriodicity
    ) external returns (address balancer) {
        balancer = address(new DriftBalancer(
            _owner,
            _assetAddresses,
            _percentages,
            _driftPercentage,
            _updatePeriodicity,
            stableToken,
            stablePriceFeed,
            lowerBound,
            upperBound
        ));
        userDriftBalancers[_owner].push(balancer);
        emit BalancerCreated(_owner, balancer, false);
    }

    /**
     * @notice Create a new TimeBalancer
     * @param stableToken The address of the stablecoin used for peg monitoring
     * @param stablePriceFeed The price feed for the stablecoin (8 decimals)
     * @param lowerBound Lower bound for acceptable price (1e8 representation)
     * @param upperBound Upper bound for acceptable price (1e8 representation)
     * @param interval Rebalance interval in seconds
     */
    function createTimeBalancer(
        address _owner,
        address stableToken,
        address stablePriceFeed,
        uint256 lowerBound,
        uint256 upperBound,
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        uint256 _driftPercentage,
        uint256 _updatePeriodicity,
        uint256 interval
    ) external returns (address balancer) {
        balancer = address(
            new TimeBalancer(
                _owner,
                _assetAddresses,
                _percentages,
                _driftPercentage,
                _updatePeriodicity,
                stableToken,
                stablePriceFeed,
                lowerBound,
                upperBound,
                interval    
            )
        );
        userTimeBalancers[_owner].push(balancer);
        emit BalancerCreated(_owner, balancer, true);
    }
}