// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
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

    // ===== Errors =====
    error ArrayLengthMismatch();
    error PermitOrderMismatch();
    error PermitInsufficientValue();
    error InsufficientBalance();
    error InsufficientAllowance();

    // ===== Types =====
    struct PermitInput {
        address token;       // ERC20 token address
        uint256 value;       // allowance to approve to the Factory (spender)
        uint256 deadline;    // EIP-2612 deadline
        uint8 v; bytes32 r; bytes32 s; // ECDSA parts
    }

    /**
     * @notice Deploy a new Balancer and fund it in the same tx using EIP-2612 permits per token.
     * The permits authorize this Factory as spender; then the Factory transfers to the Balancer.
     * This avoids needing to know the Balancer address in advance and works without CREATE2.
     *
     * Requirements:
     * - assets.length == targetPercBps.length == initialDepositAmounts.length
     * - permits.length == assets.length and aligned by index when amount > 0
     * - each token supports EIP-2612
     */
    function createBalancer(
        address[] calldata assets,
        uint256[] calldata targetPercBps,
        uint256[] calldata initialDepositAmounts,
        PermitInput[] calldata permits
    ) external returns (address balancerAddr) {
        if (assets.length != targetPercBps.length || assets.length != initialDepositAmounts.length) {
            revert ArrayLengthMismatch();
        }
        if (permits.length != assets.length) {
            revert ArrayLengthMismatch();
        }

        // 1) Validate alignment and intended allowances BEFORE deploying
        for (uint256 i; i < assets.length; i++) {
            uint256 amount = initialDepositAmounts[i];
            if (amount == 0) continue;
            address token = assets[i];
            PermitInput calldata p = permits[i];
            if (p.token != token) revert PermitOrderMismatch();
            if (p.value < amount) revert PermitInsufficientValue();
        }

        // 2) Execute permits to grant allowance to the Factory and verify balances/allowances
        for (uint256 i; i < assets.length; i++) {
            uint256 amount = initialDepositAmounts[i];
            if (amount == 0) continue;
            address token = assets[i];
            PermitInput calldata p = permits[i];

            // EIP-2612 permit: approve Factory as spender
            IERC20Permit(token).permit(msg.sender, address(this), p.value, p.deadline, p.v, p.r, p.s);

            // Check allowance set by permit and user balance
            if (IERC20(token).allowance(msg.sender, address(this)) < amount) revert PermitInsufficientValue();
            if (IERC20(token).balanceOf(msg.sender) < amount) revert InsufficientBalance();
        }

        // 3) Deploy balancer with zero initial pulls; we'll fund via Factory transfers after permits
        uint256[] memory zeros = new uint256[](assets.length);
        Balancer balancer = new Balancer(
            msg.sender,
            assets,
            targetPercBps,
            zeros
        );
        balancerAddr = address(balancer);

        // 4) Move funds now that allowances are guaranteed
        for (uint256 i; i < assets.length; i++) {
            uint256 amount = initialDepositAmounts[i];
            if (amount == 0) continue;
            address token = assets[i];
            IERC20(token).safeTransferFrom(msg.sender, balancerAddr, amount);
        }

        allBalancers.push(balancerAddr);
        userBalancers[msg.sender].push(balancerAddr);
        emit BalancerCreated(msg.sender, balancerAddr);
    }

    function balancerCount() external view returns (uint256) { return allBalancers.length; }
    function getUserBalancers(address user) external view returns (address[] memory) { return userBalancers[user]; }
}
