// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import "../contracts/1balancer/Balancer.sol";
import "../contracts/1balancer/BalancerFactory.sol";

/**
 * @notice Deploy script for Balancer and BalancerFactory contracts
 * @dev Inherits ScaffoldETHDeploy which:
 *      - Includes forge-std/Script.sol for deployment
 *      - Includes ScaffoldEthDeployerRunner modifier
 *      - Provides `deployer` variable
 * Example:
 * yarn deploy --file DeployBalancer.s.sol  # local anvil chain
 * yarn deploy --file DeployBalancer.s.sol --network optimism # live network (requires keystore)
 */
contract DeployBalancer is ScaffoldETHDeploy {
    /**
     * @dev Deployer setup based on `ETH_KEYSTORE_ACCOUNT` in `.env`:
     *      - "scaffold-eth-default": Uses Anvil's account #9 (0xa0Ee7A142d267C1f36714E4a8F75612F20a79720), no password prompt
     *      - "scaffold-eth-custom": requires password used while creating keystore
     *
     * Note: Must use ScaffoldEthDeployerRunner modifier to:
     *      - Setup correct `deployer` account and fund it
     *      - Export contract addresses & ABIs to `nextjs` packages
     */
    function run() external ScaffoldEthDeployerRunner {
        // Deploy BalancerFactory first
        BalancerFactory balancerFactory = new BalancerFactory();
        console.logString(
            string.concat(
                "BalancerFactory deployed at: ", vm.toString(address(balancerFactory))
            )
        );
        
        // Log deployment summary
        console.logString("\n=== Deployment Summary ===");
        console.logString(string.concat("BalancerFactory: ", vm.toString(address(balancerFactory))));
        console.logString(string.concat("Deployer/Owner: ", vm.toString(deployer)));
        console.logString("\nNext Steps:");
        console.logString("1. Update asset addresses to real token contracts");
        console.logString("2. Fund the Balancer with tokens using fund() function");
    }
}