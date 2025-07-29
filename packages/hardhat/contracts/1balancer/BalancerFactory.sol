// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Balancer} from "./Balancer.sol";

/**
 * @title BalancerFactory
 * @author @ppezzull
 * @notice A factory for creating and managing Balancer contracts.
 */
contract BalancerFactory {
    // -- State --

    address[] public allBalancers;
    mapping(address => address[]) public balancersByOwner;
    mapping(address => bool) public isBalancer;

    // -- Events --

    event BalancerCreated(address indexed newBalancer, address indexed owner);

    // -- Errors --

    error BalancerFactory__InvalidPercentagesSum();

    // -- External Functions --

    /**
     * @notice Creates a new Balancer contract.
     * @param _assetAddresses The list of asset addresses.
     * @param _percentages The list of percentages for each asset.
     * @param _driftPercentage The drift percentage.
     * @param _updatePeriodicity The update periodicity.
     * @return newBalancer The address of the newly created Balancer contract.
     */
    /**
     * @notice Validates that the sum of percentages equals 100.
     * @param _percentages The list of percentages to validate.
     */
    function _validateAssetPercentages(uint256[] memory _percentages) internal pure {
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < _percentages.length; i++) {
            totalPercentage += _percentages[i];
        }

        if (totalPercentage != 100) {
            revert BalancerFactory__InvalidPercentagesSum();
        }
    }

    function createBalancer(
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        uint256 _driftPercentage,
        uint256 _updatePeriodicity
    ) external returns (address newBalancer) {
        _validateAssetPercentages(_percentages);
        Balancer balancer = new Balancer(msg.sender, _assetAddresses, _percentages, _driftPercentage, _updatePeriodicity);
        newBalancer = address(balancer);

        allBalancers.push(newBalancer);
        balancersByOwner[msg.sender].push(newBalancer);
        isBalancer[newBalancer] = true;

        emit BalancerCreated(newBalancer, msg.sender);
    }

    // -- View Functions --

    /**
     * @notice Returns the list of all created Balancer contracts.
     */
    function getAllBalancers() external view returns (address[] memory) {
        return allBalancers;
    }

    /**
     * @notice Returns the list of Balancer contracts created by a specific owner.
     * @param _owner The address of the owner.
     */
    function getBalancersByOwner(address _owner) external view returns (address[] memory) {
        return balancersByOwner[_owner];
    }
}
