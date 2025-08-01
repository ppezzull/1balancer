// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title MockLimitOrderProtocol
 * @notice Mock implementation of 1inch Limit Order Protocol for testing
 */
contract MockLimitOrderProtocol {
    // Minimal implementation for testing
    function fillOrder(bytes calldata /* order */, bytes calldata /* signature */, uint256 /* makingAmount */, uint256 /* takingAmount */) external payable {
        // Mock implementation
    }
    
    function cancelOrder(bytes calldata /* order */) external {
        // Mock implementation
    }
    
    function remaining(bytes32 /* orderHash */) external pure returns (uint256) {
        return 0;
    }
}