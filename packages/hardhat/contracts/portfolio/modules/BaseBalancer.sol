// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/ISpotPriceAggregator.sol";
import "./StableLimit.sol";

/**
 * @title Balancer
 * @author @ppezzull
 * @notice Manages a portfolio of assets, ensuring they are balanced according to specified percentages.
 */
abstract contract BaseBalancer is Ownable, ReentrancyGuard, StableLimit {
    using SafeERC20 for IERC20;

    // -- Constants --
    uint256 public constant MAX_BASIS_POINTS = 100; // 100%

    // -- State --
    struct Asset {
        uint256 percentage; // In percentage (100 = 100%)
    }

    mapping(address => Asset) public assets;
    address[] public assetAddresses;

    uint256 public lastUpdateTimestamp;

    // -- Events --
    event Funded(address indexed asset, uint256 amount);
    event Withdrawn(address indexed asset, uint256 amount);
    event ETHWithdrawn(address indexed to, uint256 amount);
    event AssetMappingUpdated(address[] assets, uint256[] percentages);
    event UpdatePeriodicitySet(uint256 newUpdatePeriodicity);

    // -- Errors --
    error Balancer__InvalidAssetCount();
    error Balancer__InvalidPercentagesSum();
    error Balancer__AssetNotFound(address asset);
    error Balancer__ZeroAddressNotAllowed();
    error Balancer__WithdrawalFailed();

    constructor(
        address initialOwner,
        address _factory,
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        address[] memory _stablecoins
    ) Ownable(initialOwner) StableLimit(initialOwner, _factory, _stablecoins) {
        _updateAssetMapping(_assetAddresses, _percentages);
        lastUpdateTimestamp = block.timestamp;
    }

    // -- External Functions --

    /**
     * @notice Allows the owner to fund the contract with a specific ERC20 token.
     * @param _asset The address of the ERC20 token.
     * @param _amount The amount of the token to deposit.
     */
    function fund(address _asset, uint256 _amount) external onlyOwner {
        if (assets[_asset].percentage == 0) {
            revert Balancer__AssetNotFound(_asset);
        }
        IERC20(_asset).safeTransferFrom(msg.sender, address(this), _amount);
        emit Funded(_asset, _amount);
    }

    /**
     * @notice Allows the owner to withdraw a specific ERC20 token from the contract.
     * @param _asset The address of the ERC20 token.
     * @param _amount The amount of the token to withdraw.
     */
    function withdraw(address _asset, uint256 _amount) external onlyOwner nonReentrant {
        if (assets[_asset].percentage == 0) {
            revert Balancer__AssetNotFound(_asset);
        }
        IERC20(_asset).safeTransfer(msg.sender, _amount);
        emit Withdrawn(_asset, _amount);
    }

    /**
     * @notice Allows the owner to withdraw ETH from the contract.
     * @param _to The recipient address.
     * @param _amount The amount of ETH to withdraw.
     */
    function withdrawETH(address _to, uint256 _amount) external onlyOwner nonReentrant {
        (bool success, ) = _to.call{ value: _amount }("");
        if (!success) {
            revert Balancer__WithdrawalFailed();
        }
        emit ETHWithdrawn(_to, _amount);
    }

    /**
     * @notice Updates the asset mapping.
     * @param _assetAddresses The new list of asset addresses.
     * @param _percentages The new list of percentages.
     */
    function updateAssetMapping(address[] memory _assetAddresses, uint256[] memory _percentages) external onlyOwner {
        _updateAssetMapping(_assetAddresses, _percentages);
    }

    // -- Internal Functions --

    /**
     * @notice Internal function to update the asset mapping.
     * @param _newAssetAddresses The new list of asset addresses.
     * @param _newPercentages The new list of percentages.
     */
    function _updateAssetMapping(address[] memory _newAssetAddresses, uint256[] memory _newPercentages) internal {
        if (_newAssetAddresses.length != _newPercentages.length) {
            revert Balancer__InvalidAssetCount();
        }

        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < _newPercentages.length; i++) {
            totalPercentage += _newPercentages[i];
        }
        if (totalPercentage != MAX_BASIS_POINTS) {
            revert Balancer__InvalidPercentagesSum();
        }

        for (uint256 i = 0; i < _newAssetAddresses.length; i++) {
            if (_newAssetAddresses[i] == address(0)) {
                revert Balancer__ZeroAddressNotAllowed();
            }
        }

        // Clear old mapping
        for (uint256 i = 0; i < assetAddresses.length; i++) {
            delete assets[assetAddresses[i]];
        }

        assetAddresses = _newAssetAddresses;
        for (uint256 i = 0; i < assetAddresses.length; i++) {
            assets[assetAddresses[i]] = Asset({ percentage: _newPercentages[i] });
        }

        emit AssetMappingUpdated(_newAssetAddresses, _newPercentages);
    }

    // -- View Functions --

    /**
     * @notice Gets the total value of all assets in the contract in ETH.
     * @return The total value in ETH.
     */
    function getTotalValue() public view returns (uint256) {
        uint256 totalValue = 0;
        for (uint256 i = 0; i < assetAddresses.length; i++) {
            address asset = assetAddresses[i];
            uint256 balance = IERC20(asset).balanceOf(address(this));
            totalValue += getPrice(asset, balance);
        }
        return totalValue;
    }

    /// @notice Returns the value of an asset in 18 decimals, given its address and amount
    function getPrice(address asset, uint256 amount) public view returns (uint256) {
        // Fetch price from the 1inch spot price aggregator
        address priceFeedAddr = IBalancerFactory(factory).priceFeed();
        uint256 price = ISpotPriceAggregator(priceFeedAddr).getRateToEth(asset, false);
        // Convert amount to 18 decimals if needed
        // The 1inch aggregator returns rates with 1e18 precision
        return (amount * price) / 1e18;
    }

    /**
     * @notice Returns the list of asset addresses.
     */
    function getAssetAddresses() external view returns (address[] memory) {
        return assetAddresses;
    }

    /**
     * @notice Returns the details of a specific asset.
     * @param _asset The address of the asset.
     */
    function getAsset(address _asset) external view returns (Asset memory) {
        return assets[_asset];
    }

    /**
     * @notice Returns the balance of a specific asset in the contract.
     * @param _asset The address of the asset.
     */
    function getAssetBalance(address _asset) external view returns (uint256) {
        return IERC20(_asset).balanceOf(address(this));
    }

    /**
     * @notice Returns the ETH balance of the contract.
     */
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // -- Receive Function --

    receive() external payable {}
}
