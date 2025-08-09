// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/IOracleAdapter.sol";
import "../interfaces/IBalancerFactory.sol";

import "../libraries/StablecoinGridLib.sol";
import "../libraries/PortfolioAnalysisLib.sol";
import "../libraries/StablecoinAnalysisLib.sol";
import "./BaseBalancer.sol";

contract DriftBalancer is BaseBalancer {
    using SafeERC20 for IERC20;

    // ===== Metadata / Config =====
    uint256 public driftPercentage;
    // name/description inherited in base


    // ===== Events =====
    event DriftPercentageUpdated(uint256 newDriftPercentage);
    event RebalanceNeeded(address[] tokens, uint256[] deviations);
    event OrdersGenerated(StablecoinGridLib.Order[] orders);

    constructor(
        address _owner,
        address _factory,
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        uint256 _driftPercentage,
        address[] memory _stablecoins,
        address _limitOrderProtocol
    ) BaseBalancer(_owner, _factory, _assetAddresses, _percentages, _stablecoins, _limitOrderProtocol) {

        driftPercentage = _driftPercentage;
        name = "Optimized Drift Balancer";
        description = "Automatically rebalances when portfolio drift exceeds tolerance and stablecoin deviations are detected.";
    }

    // ===== Owner controls =====
    function updateDriftPercentage(uint256 _newDriftPercentage) external onlyOwner {
        driftPercentage = _newDriftPercentage;
        emit DriftPercentageUpdated(_newDriftPercentage);
    }

    // ===== Automation hooks =====
    function _checkUpkeep(bytes calldata /*checkData*/) internal view override returns (bool upkeepNeeded, bytes memory performData) {
        // Require ~0.1% drift (1e15 in 18 decimals) to trigger upkeep
        return StablecoinAnalysisLib.detectDeviation(stablecoins, factory.priceFeed(), 1e15);
    }

    function _performUpkeep(bytes calldata /*performData*/) internal override {
        uint256 stablecoinValue = StablecoinAnalysisLib.totalStablecoinValue(stablecoins, factory.priceFeed(), address(this));
        StablecoinGridLib.GridParams memory params = StablecoinGridLib.calculateGridParams(
            stablecoinValue,
            5,
            15
        );
        StablecoinGridLib.Order[] memory orders = StablecoinGridLib.generateGridOrders(stablecoins, params);
        emit OrdersGenerated(orders);

        for (uint256 i = 0; i < orders.length; i++) {
            StablecoinGridLib.Order memory gridOrder = orders[i];
            bytes32 orderHash = createStablecoinGridOrder(
                gridOrder.fromToken,
                gridOrder.toToken,
                gridOrder.amount,
                gridOrder.limitPrice
            );
            emit LimitOrderCreated(orderHash, address(this), gridOrder.fromToken, gridOrder.toToken, gridOrder.amount, gridOrder.limitPrice);
        }
    }

    // ===== Rebalance trigger =====
    function triggerRebalance() external { _checkAndTriggerRebalance(); }

    function _checkAndTriggerRebalance() internal {
        uint256 totalValue = getTotalValue();
        if (totalValue == 0) return;

        uint256[] memory groupDeviations = new uint256[](assetGroupsCount);
        address[][] memory groupTokens = new address[][](assetGroupsCount);
        bool rebalanceNeeded = false;

        for (uint256 groupId = 0; groupId < assetGroupsCount; groupId++) {
            AssetGroup memory group = assetGroups[groupId];
            uint256 groupValue = 0;
            for (uint256 i = 0; i < group.tokens.length; i++) {
                uint256 balance = IERC20(group.tokens[i]).balanceOf(address(this));
                groupValue += getPrice(group.tokens[i], balance);
            }
            uint256 currentPercentage = (groupValue * 100) / totalValue;
            uint256 targetPercentage = group.percentage;
            uint256 deviation = currentPercentage > targetPercentage ? currentPercentage - targetPercentage : targetPercentage - currentPercentage;
            groupDeviations[groupId] = deviation;
            groupTokens[groupId] = group.tokens;
            if (deviation > driftPercentage) {
                rebalanceNeeded = true;
            }
            if (group.isStablecoinGroup && group.tokens.length > 1) {
                address referenceStable = stablecoins.length > 0 ? stablecoins[0] : address(0);
                (bool need, uint256 devBps) = StablecoinAnalysisLib.computeGroupStablecoinDeviation(
                    group.tokens,
                    referenceStable,
                    factory.priceFeed(),
                    1e15
                );
                if (need) {
                    rebalanceNeeded = true;
                    groupDeviations[groupId] = devBps;
                }
            }
        }

        if (rebalanceNeeded) {
            address[] memory allTokens = new address[](assetAddresses.length);
            uint256[] memory allDeviations = new uint256[](assetAddresses.length);
            uint256 tokenIndex = 0;
            for (uint256 groupId2 = 0; groupId2 < assetGroupsCount; groupId2++) {
                for (uint256 i3 = 0; i3 < groupTokens[groupId2].length; i3++) {
                    allTokens[tokenIndex] = groupTokens[groupId2][i3];
                    allDeviations[tokenIndex] = groupDeviations[groupId2];
                    tokenIndex++;
                }
            }
            emit RebalanceNeeded(allTokens, allDeviations);
        }
    }

    // All order, EIP-1271, and portfolio helpers are inherited from base
    receive() external payable {}
}
