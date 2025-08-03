// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title MockAggregationRouter
 * @notice Mock implementation of 1inch Aggregation Router for testing
 */
contract MockAggregationRouter {
    // Minimal implementation for testing
    function swap(bytes calldata /* data */) external payable returns (uint256 returnAmount) {
        // Mock implementation
        returnAmount = 1000;
    }
    
    function unoswap(address /* srcToken */, uint256 /* amount */, uint256 /* minReturn */, bytes32[] calldata /* pools */) external payable returns (uint256 returnAmount) {
        // Mock implementation
        returnAmount = 1000;
    }
}