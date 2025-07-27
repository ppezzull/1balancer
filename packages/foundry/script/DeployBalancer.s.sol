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

        // Example deployment of a Balancer contract through the factory
        // This demonstrates how to use the factory to create a Balancer
        
        // Define example assets and percentages for demonstration
        // Note: In production, these would be actual token addresses
        address[] memory exampleAssets = new address[](2);
        uint256[] memory examplePercentages = new uint256[](2);
        
        // Using deployer address as mock token addresses for demonstration
        // In production, replace with actual ERC20 token addresses
        exampleAssets[0] = address(0x1111111111111111111111111111111111111111); // Mock Token A
        exampleAssets[1] = address(0x2222222222222222222222222222222222222222); // Mock Token B
        
        examplePercentages[0] = 6000; // 60%
        examplePercentages[1] = 4000; // 40%
        
        uint256 exampleDriftPercentage = 500; // 5%
        uint256 exampleUpdatePeriodicity = 3600; // 1 hour
        
        // Create an example Balancer through the factory
        address exampleBalancer = balancerFactory.createBalancer(
            exampleAssets,
            examplePercentages,
            exampleDriftPercentage,
            exampleUpdatePeriodicity
        );
        
        console.logString(
            string.concat(
                "Example Balancer deployed at: ", vm.toString(exampleBalancer)
            )
        );
        console.logString(
            string.concat(
                "Balancer owner: ", vm.toString(deployer)
            )
        );
        
        // Log deployment summary
        console.logString("\n=== Deployment Summary ===");
        console.logString(string.concat("BalancerFactory: ", vm.toString(address(balancerFactory))));
        console.logString(string.concat("Example Balancer: ", vm.toString(exampleBalancer)));
        console.logString(string.concat("Deployer/Owner: ", vm.toString(deployer)));
        console.logString("\nBalancer Configuration:");
        console.logString("- Assets: 2 (mock addresses)");
        console.logString("- Allocation: 60% / 40%");
        console.logString("- Drift Tolerance: 5%");
        console.logString("- Update Periodicity: 1 hour");
        console.logString("\nNext Steps:");
        console.logString("1. Update asset addresses to real token contracts");
        console.logString("2. Fund the Balancer with tokens using fund() function");
        console.logString("3. Use factory.createBalancer() to create additional Balancers");
    }
}