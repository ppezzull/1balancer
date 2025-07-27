// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import "forge-std/console.sol";
import {BalancerFactory} from "../contracts/1balancer/BalancerFactory.sol";
import {Balancer} from "../contracts/1balancer/Balancer.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

contract BalancerFactoryTest is Test {
    BalancerFactory factory;
    ERC20Mock tokenA;
    ERC20Mock tokenB;
    address owner;
    address user;

    function setUp() public {
        owner = makeAddr("owner");
        user = makeAddr("user");

        vm.prank(owner);
        factory = new BalancerFactory();

        tokenA = new ERC20Mock();
        tokenB = new ERC20Mock();
    }

    function test_CreateBalancer_Successful() public {
        address[] memory assetAddresses = new address[](2);
        assetAddresses[0] = address(tokenA);
        assetAddresses[1] = address(tokenB);

        uint256[] memory percentages = new uint256[](2);
        percentages[0] = 50;
        percentages[1] = 50;

        vm.startPrank(owner);
        address newBalancerAddress = factory.createBalancer(assetAddresses, percentages, 5, 1 days);
        assertTrue(factory.isBalancer(newBalancerAddress));

        address[] memory allBalancers = factory.getAllBalancers();
        assertEq(allBalancers.length, 1);
        assertEq(allBalancers[0], newBalancerAddress, "Mismatch in allBalancers array");

        address[] memory ownerBalancers = factory.getBalancersByOwner(owner);
        assertEq(ownerBalancers.length, 1);
        assertEq(ownerBalancers[0], newBalancerAddress, "Mismatch in ownerBalancers array");

        Balancer newBalancer = Balancer(payable(newBalancerAddress));
        assertEq(newBalancer.owner(), owner);
        vm.stopPrank();
    }

    function test_CreateBalancer_EmitsEvent() public {
        address[] memory assetAddresses = new address[](2);
        assetAddresses[0] = address(tokenA);
        assetAddresses[1] = address(tokenB);

        uint256[] memory percentages = new uint256[](2);
        percentages[0] = 50;
        percentages[1] = 50;

        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit BalancerFactory.BalancerCreated(address(0), owner);
        factory.createBalancer(assetAddresses, percentages, 5, 1 days);
    }

    function test_GetBalancersByOwner_ReturnsCorrectly() public {
        address[] memory assetAddresses = new address[](2);
        assetAddresses[0] = address(tokenA);
        assetAddresses[1] = address(tokenB);

        uint256[] memory percentages = new uint256[](2);
        percentages[0] = 50;
        percentages[1] = 50;

        vm.prank(owner);
        factory.createBalancer(assetAddresses, percentages, 5, 1 days);

        vm.prank(user);
        factory.createBalancer(assetAddresses, percentages, 5, 1 days);

        assertEq(factory.getBalancersByOwner(owner).length, 1);
        assertEq(factory.getBalancersByOwner(user).length, 1);
        assertEq(factory.getAllBalancers().length, 2);
    }

    function test_Revert_When_PercentagesDontSumTo100() public {
        address[] memory assetAddresses = new address[](2);
        assetAddresses[0] = address(tokenA);
        assetAddresses[1] = address(tokenB);

        uint256[] memory percentages = new uint256[](2);
        percentages[0] = 40;
        percentages[1] = 50;

        vm.prank(owner);
        vm.expectRevert(BalancerFactory.BalancerFactory__InvalidPercentagesSum.selector);
        factory.createBalancer(assetAddresses, percentages, 5, 1 days);
    }
}
