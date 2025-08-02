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

    /**
     * @dev Check if an asset's balance is within acceptable percentage range based on price
     * @param token The token address to check
     * @param currentBalance The current balance of the token
     * @param currentPercentage The current percentage allocation of the token
     * @param targetPercentage The target percentage allocation of the token
     * @param price The current price of the token
     * @return isWithinRange Whether the asset is within acceptable range
     * @return deviation The percentage deviation from target
     */
    function checkAssetBalance(
        address token,
        uint256 currentBalance,
        uint256 currentPercentage,
        uint256 targetPercentage,
        uint256 price
    ) public pure override returns (bool isWithinRange, uint256 deviation) {
        // Calculate the deviation from target percentage
        if (currentPercentage > targetPercentage) {
            deviation = currentPercentage - targetPercentage;
        } else {
            deviation = targetPercentage - currentPercentage;
        }

        // Check if deviation is within acceptable range (5% for now)
        isWithinRange = deviation <= 5;

        return (isWithinRange, deviation);
    }

    /**
     * @notice Check stablecoin balances managed by StableLimit
     * @return totalStablecoinValue Total value of all stablecoins in ETH
     * @return stablecoinBalances Array of balances for each stablecoin
     * @return stablecoinValues Array of values in ETH for each stablecoin
     */
    function checkStablecoinBalances() 
        external 
        view 
        returns (
            uint256 totalStablecoinValue,
            uint256[] memory stablecoinBalances,
            uint256[] memory stablecoinValues
        ) 
    {
        uint256 stablecoinCount = stablecoins.length;
        stablecoinBalances = new uint256[](stablecoinCount);
        stablecoinValues = new uint256[](stablecoinCount);
        totalStablecoinValue = 0;

        for (uint256 i = 0; i < stablecoinCount; i++) {
            address stablecoin = stablecoins[i];
            uint256 balance = IERC20(stablecoin).balanceOf(address(this));
            uint256 value = getPrice(stablecoin, balance);
            
            stablecoinBalances[i] = balance;
            stablecoinValues[i] = value;
            totalStablecoinValue += value;
        }
    }

    /**
     * @notice Check non-stablecoin token balances
     * @return nonStablecoinTokens Array of non-stablecoin token addresses
     * @return nonStablecoinBalances Array of balances for non-stablecoin tokens
     * @return nonStablecoinValues Array of values in ETH for non-stablecoin tokens
     * @return totalNonStablecoinValue Total value of all non-stablecoin tokens in ETH
     */
    function checkNonStablecoinBalances()
        external
        view
        returns (
            address[] memory nonStablecoinTokens,
            uint256[] memory nonStablecoinBalances,
            uint256[] memory nonStablecoinValues,
            uint256 totalNonStablecoinValue
        )
    {
        // Count non-stablecoin tokens
        uint256 nonStablecoinCount = 0;
        for (uint256 i = 0; i < assetAddresses.length; i++) {
            if (!isStablecoin[assetAddresses[i]]) {
                nonStablecoinCount++;
            }
        }

        nonStablecoinTokens = new address[](nonStablecoinCount);
        nonStablecoinBalances = new uint256[](nonStablecoinCount);
        nonStablecoinValues = new uint256[](nonStablecoinCount);
        totalNonStablecoinValue = 0;

        uint256 index = 0;
        for (uint256 i = 0; i < assetAddresses.length; i++) {
            address token = assetAddresses[i];
            if (!isStablecoin[token]) {
                uint256 balance = IERC20(token).balanceOf(address(this));
                uint256 value = getPrice(token, balance);
                
                nonStablecoinTokens[index] = token;
                nonStablecoinBalances[index] = balance;
                nonStablecoinValues[index] = value;
                totalNonStablecoinValue += value;
                index++;
            }
        }
    }

    /**
     * @notice Get comprehensive portfolio analysis
     * @return portfolioValue Total portfolio value in ETH
     * @return stablecoinRatio Percentage of portfolio in stablecoins (basis points)
     * @return isBalanced Whether the portfolio is balanced within acceptable ranges
     * @return rebalanceNeeded Whether rebalancing is needed
     */
    function getPortfolioAnalysis()
        external
        view
        returns (
            uint256 portfolioValue,
            uint256 stablecoinRatio,
            bool isBalanced,
            bool rebalanceNeeded
        )
    {
        portfolioValue = getTotalValue();
        
        if (portfolioValue == 0) {
            return (0, 0, true, false);
        }

        // Get stablecoin value
        uint256 totalStablecoinValue = 0;
        for (uint256 i = 0; i < stablecoins.length; i++) {
            address stablecoin = stablecoins[i];
            if (assets[stablecoin].percentage > 0) { // Only check if it's in portfolio
                uint256 balance = IERC20(stablecoin).balanceOf(address(this));
                totalStablecoinValue += getPrice(stablecoin, balance);
            }
        }

        stablecoinRatio = (totalStablecoinValue * 10000) / portfolioValue; // Basis points

        // Check if portfolio is balanced
        isBalanced = true;
        rebalanceNeeded = false;
        
        for (uint256 i = 0; i < assetAddresses.length; i++) {
            address token = assetAddresses[i];
            uint256 balance = IERC20(token).balanceOf(address(this));
            uint256 currentValue = getPrice(token, balance);
            uint256 currentPercentage = (currentValue * 100) / portfolioValue;
            uint256 targetPercentage = assets[token].percentage;
            
            (bool withinRange, uint256 deviation) = checkAssetBalance(
                token,
                balance,
                currentPercentage,
                targetPercentage,
                currentValue
            );
            
            if (!withinRange) {
                isBalanced = false;
                if (deviation > 10) { // If deviation > 10%, rebalancing is needed
                    rebalanceNeeded = true;
                }
            }
        }
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
