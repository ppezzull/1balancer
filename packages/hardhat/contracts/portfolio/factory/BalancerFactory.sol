// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../balancers/Balancer.sol";

/**
 * @title BalancerFactory (minimal)
 * @notice Deploys Balancer instances with initial deposits. No automation, no oracles.
 */
contract BalancerFactory is Ownable {
    using SafeERC20 for IERC20;

    event BalancerCreated(address indexed owner, address balancer);

    address[] public allBalancers;
    mapping(address => address[]) public userBalancers; // owner => balancers

    constructor() Ownable(msg.sender) {}

    function createBalancer(
        address[] memory assets,
        uint256[] memory targetPercBps,
        uint256[] memory initialDepositAmounts,
        string memory nameMetadata,
        string memory descriptionMetadata
    ) external returns (address balancerAddr) {
        Balancer balancer = new Balancer(
            msg.sender,
            assets,
            targetPercBps,
            initialDepositAmounts,
            nameMetadata,
            descriptionMetadata
        );
        balancerAddr = address(balancer);

        // If initial deposits not already transferred (constructor pulls via transferFrom using owner)
        // ensure caller granted allowance beforehand.
        allBalancers.push(balancerAddr);
        userBalancers[msg.sender].push(balancerAddr);
        emit BalancerCreated(msg.sender, balancerAddr);
    }

    function balancerCount() external view returns (uint256) { return allBalancers.length; }
    function getUserBalancers(address user) external view returns (address[] memory) { return userBalancers[user]; }
}
