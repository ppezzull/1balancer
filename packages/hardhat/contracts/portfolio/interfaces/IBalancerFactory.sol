// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IBalancerFactory {
    function priceFeed() external view returns (address);
    function stablecoins() external view returns (address[] memory);
}
