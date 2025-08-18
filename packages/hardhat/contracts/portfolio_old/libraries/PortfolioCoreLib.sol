// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PortfolioCoreLib
 * @dev Core portfolio management functions extracted from BaseBalancer
 * @author @ppezzull
 */
library PortfolioCoreLib {
    using SafeERC20 for IERC20;

    struct Asset {
        uint256 percentage;
    }

    struct PortfolioState {
        address[] assetAddresses;
        mapping(address => Asset) assets;
        uint256 lastUpdateTimestamp;
    }

    // Events
    event Funded(address indexed asset, uint256 amount);
    event Withdrawn(address indexed asset, uint256 amount);
    event ETHWithdrawn(address indexed to, uint256 amount);
    event AssetMappingUpdated(address[] assets, uint256[] percentages);

    // Errors
    error InvalidAssetCount();
    error InvalidPercentagesSum();
    error AssetNotFound(address asset);
    error ZeroAddressNotAllowed();
    error WithdrawalFailed();

    /**
     * @dev Update asset mapping with validation
     */
    function updateAssetMapping(
        PortfolioState storage state,
        address[] memory newAssetAddresses,
        uint256[] memory newPercentages
    ) external {
        if (newAssetAddresses.length != newPercentages.length) {
            revert InvalidAssetCount();
        }

        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < newPercentages.length; i++) {
            totalPercentage += newPercentages[i];
        }
        if (totalPercentage != 100) {
            revert InvalidPercentagesSum();
        }

        for (uint256 i = 0; i < newAssetAddresses.length; i++) {
            if (newAssetAddresses[i] == address(0)) {
                revert ZeroAddressNotAllowed();
            }
        }

        // Clear old mapping
        for (uint256 i = 0; i < state.assetAddresses.length; i++) {
            delete state.assets[state.assetAddresses[i]];
        }

        state.assetAddresses = newAssetAddresses;
        for (uint256 i = 0; i < state.assetAddresses.length; i++) {
            state.assets[state.assetAddresses[i]] = Asset({ percentage: newPercentages[i] });
        }

        state.lastUpdateTimestamp = block.timestamp;
        emit AssetMappingUpdated(newAssetAddresses, newPercentages);
    }

    /**
     * @dev Fund portfolio with tokens
     */
    function fundAsset(
        PortfolioState storage state,
        address asset,
        uint256 amount,
        address from
    ) external {
        if (state.assets[asset].percentage == 0) {
            revert AssetNotFound(asset);
        }
        IERC20(asset).safeTransferFrom(from, address(this), amount);
        emit Funded(asset, amount);
    }

    /**
     * @dev Withdraw tokens from portfolio
     */
    function withdrawAsset(
        PortfolioState storage state,
        address asset,
        uint256 amount,
        address to
    ) external {
        if (state.assets[asset].percentage == 0) {
            revert AssetNotFound(asset);
        }
        IERC20(asset).safeTransfer(to, amount);
        emit Withdrawn(asset, amount);
    }

    /**
     * @dev Withdraw ETH from portfolio
     */
    function withdrawETH(address to, uint256 amount) external {
        (bool success, ) = to.call{ value: amount }("");
        if (!success) {
            revert WithdrawalFailed();
        }
        emit ETHWithdrawn(to, amount);
    }

    /**
     * @dev Get total portfolio value
     */
    function getTotalValue(
        PortfolioState storage state,
        function(address, uint256) internal view returns (uint256) getPriceFunc
    ) internal view returns (uint256) {
        uint256 totalValue = 0;
        for (uint256 i = 0; i < state.assetAddresses.length; i++) {
            address asset = state.assetAddresses[i];
            uint256 balance = IERC20(asset).balanceOf(address(this));
            totalValue += getPriceFunc(asset, balance);
        }
        return totalValue;
    }

    /**
     * @dev Get asset addresses
     */
    function getAssetAddresses(PortfolioState storage state) external view returns (address[] memory) {
        return state.assetAddresses;
    }

    /**
     * @dev Get asset details
     */
    function getAsset(PortfolioState storage state, address asset) external view returns (Asset memory) {
        return state.assets[asset];
    }

    /**
     * @dev Get asset balance
     */
    function getAssetBalance(address asset) external view returns (uint256) {
        return IERC20(asset).balanceOf(address(this));
    }

    /**
     * @dev Get ETH balance
     */
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }
} 