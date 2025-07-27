// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {Balancer} from "../contracts/1balancer/Balancer.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

contract BalancerTest is Test {
    Balancer balancer;
    ERC20Mock tokenA;
    ERC20Mock tokenB;
    address owner;
    address user;

    function setUp() public {
        owner = makeAddr("owner");
        user = makeAddr("user");

        tokenA = new ERC20Mock();
        tokenB = new ERC20Mock();

        address[] memory assetAddresses = new address[](2);
        assetAddresses[0] = address(tokenA);
        assetAddresses[1] = address(tokenB);

        uint256[] memory percentages = new uint256[](2);
        percentages[0] = 50;
        percentages[1] = 50;

        vm.prank(owner);
        balancer = new Balancer(owner, assetAddresses, percentages, 5, 1 days);

        tokenA.mint(owner, 1000 ether);
        tokenB.mint(owner, 1000 ether);
    }

    function test_Constructor_SetsCorrectValues() public view {
        assertEq(balancer.owner(), owner);
        assertEq(balancer.driftPercentage(), 5);
        assertEq(balancer.updatePeriodicity(), 1 days);
        assertEq(balancer.assets(address(tokenA)), 50);
        assertEq(balancer.assets(address(tokenB)), 50);
    }

    function test_Revert_When_AssetArraysMismatch() public {
        address[] memory assetAddresses = new address[](1);
        assetAddresses[0] = address(tokenA);

        uint256[] memory percentages = new uint256[](2);
        percentages[0] = 50;
        percentages[1] = 50;

        vm.prank(owner);
        vm.expectRevert(Balancer.Balancer__InvalidAssetCount.selector);
        new Balancer(owner, assetAddresses, percentages, 5, 1 days);
    }

    function test_Revert_When_PercentagesDontSumToMax() public {
        address[] memory assetAddresses = new address[](2);
        assetAddresses[0] = address(tokenA);
        assetAddresses[1] = address(tokenB);

        uint256[] memory percentages = new uint256[](2);
        percentages[0] = 40;
        percentages[1] = 50;

        vm.prank(owner);
        vm.expectRevert(Balancer.Balancer__InvalidPercentagesSum.selector);
        new Balancer(owner, assetAddresses, percentages, 5, 1 days);
    }

    function test_Fund_Reverts_When_NotOwner() public {
        vm.prank(user);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                user
            )
        );
        balancer.fund(address(tokenA), 100 ether);
    }

    function test_Fund_Reverts_When_AssetNotFound() public {
        ERC20Mock tokenC = new ERC20Mock();
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                Balancer.Balancer__AssetNotFound.selector,
                address(tokenC)
            )
        );
        balancer.fund(address(tokenC), 100 ether);
    }

    function test_Fund_Successful() public {
        vm.startPrank(owner);
        tokenA.approve(address(balancer), 100 ether);
        balancer.fund(address(tokenA), 100 ether);
        vm.stopPrank();

        assertEq(tokenA.balanceOf(address(balancer)), 100 ether);
    }

    function test_Withdraw_Reverts_When_NotOwner() public {
        vm.prank(user);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                user
            )
        );
        balancer.withdraw(address(tokenA), 50 ether);
    }

    function test_Withdraw_Successful() public {
        vm.startPrank(owner);
        tokenA.approve(address(balancer), 100 ether);
        balancer.fund(address(tokenA), 100 ether);
        balancer.withdraw(address(tokenA), 50 ether);
        vm.stopPrank();

        assertEq(tokenA.balanceOf(address(balancer)), 50 ether);
        assertEq(tokenA.balanceOf(owner), 950 ether);
    }

    function test_WithdrawETH_Successful() public {
        payable(address(balancer)).transfer(1 ether);
        uint256 initialOwnerBalance = owner.balance;

        vm.prank(owner);
        balancer.withdrawETH(owner, 1 ether);

        assertEq(address(balancer).balance, 0);
        assertEq(owner.balance, initialOwnerBalance + 1 ether);
    }

    function test_UpdateAssetMapping_Successful() public {
        address[] memory newAssetAddresses = new address[](2);
        newAssetAddresses[0] = address(tokenA);
        newAssetAddresses[1] = address(tokenB);

        uint256[] memory newPercentages = new uint256[](2);
        newPercentages[0] = 60;
        newPercentages[1] = 40;

        vm.prank(owner);
        balancer.updateAssetMapping(newAssetAddresses, newPercentages);

        assertEq(balancer.assets(address(tokenA)), 60);
        assertEq(balancer.assets(address(tokenB)), 40);
    }

    function test_UpdateDriftPercentage_Successful() public {
        vm.prank(owner);
        balancer.updateDriftPercentage(10);
        assertEq(balancer.driftPercentage(), 10);
    }

    function test_SetUpdatePeriodicity_Successful() public {
        vm.prank(owner);
        balancer.setUpdatePeriodicity(2 days);
        assertEq(balancer.updatePeriodicity(), 2 days);
    }

    function test_Receive_AcceptsETH() public {
        (bool success, ) = payable(address(balancer)).call{value: 1 ether}("");
        assertTrue(success);
        assertEq(address(balancer).balance, 1 ether);
    }
}
