// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Balancer.sol";

/**
 * @title BalancerFactory
 * @notice Factory contract for creating Balancer instances
 * @dev Creates Balancer contracts and sets the creator as the owner
 */
contract BalancerFactory {
    // Events
    event BalancerCreated(
        address indexed balancer,
        address indexed owner,
        address[] assets,
        uint256[] percentages,
        uint256 driftPercentage,
        uint256 updatePeriodicity
    );

    // State variables
    address[] public balancers;
    mapping(address => address[]) public ownerToBalancers;
    mapping(address => address) public balancerToOwner;

    /**
     * @notice Create a new Balancer contract
     * @param _assets Array of asset addresses
     * @param _percentages Array of percentages corresponding to assets (in basis points)
     * @param _driftPercentage Maximum allowed drift percentage (in basis points)
     * @param _updatePeriodicity Time between updates in seconds
     * @return balancer Address of the newly created Balancer contract
     */
    function createBalancer(
        address[] memory _assets,
        uint256[] memory _percentages,
        uint256 _driftPercentage,
        uint256 _updatePeriodicity
    ) external returns (address balancer) {
        // Create new Balancer contract with msg.sender as owner
        Balancer newBalancer = new Balancer(
            msg.sender,
            _assets,
            _percentages,
            _driftPercentage,
            _updatePeriodicity
        );

        balancer = address(newBalancer);

        // Store the balancer information
        balancers.push(balancer);
        ownerToBalancers[msg.sender].push(balancer);
        balancerToOwner[balancer] = msg.sender;

        emit BalancerCreated(
            balancer,
            msg.sender,
            _assets,
            _percentages,
            _driftPercentage,
            _updatePeriodicity
        );

        return balancer;
    }

    /**
     * @notice Get all balancers created by this factory
     * @return Array of balancer addresses
     */
    function getAllBalancers() external view returns (address[] memory) {
        return balancers;
    }

    /**
     * @notice Get all balancers owned by a specific address
     * @param _owner Owner address
     * @return Array of balancer addresses owned by the specified address
     */
    function getBalancersByOwner(address _owner) external view returns (address[] memory) {
        return ownerToBalancers[_owner];
    }

    /**
     * @notice Get the owner of a specific balancer
     * @param _balancer Balancer address
     * @return Owner address
     */
    function getBalancerOwner(address _balancer) external view returns (address) {
        return balancerToOwner[_balancer];
    }

    /**
     * @notice Get the total number of balancers created
     * @return Number of balancers
     */
    function getBalancerCount() external view returns (uint256) {
        return balancers.length;
    }

    /**
     * @notice Get the number of balancers owned by a specific address
     * @param _owner Owner address
     * @return Number of balancers owned
     */
    function getBalancerCountByOwner(address _owner) external view returns (uint256) {
        return ownerToBalancers[_owner].length;
    }

    /**
     * @notice Check if a balancer was created by this factory
     * @param _balancer Balancer address to check
     * @return True if the balancer was created by this factory
     */
    function isBalancerFromFactory(address _balancer) external view returns (bool) {
        return balancerToOwner[_balancer] != address(0);
    }
}