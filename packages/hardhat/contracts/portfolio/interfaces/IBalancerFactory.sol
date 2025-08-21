// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IBalancerFactory {
    function balancerCount() external view returns (uint256);
    function getUserBalancers(address user) external view returns (address[] memory);
}
