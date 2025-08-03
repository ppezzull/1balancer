// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/ISpotPriceAggregator.sol";
import "../interfaces/IBalancerFactory.sol";
import "../libraries/PortfolioAnalysisLib.sol";
import "./OptimizedStableLimit.sol";

/**
 * @title OptimizedBaseBalancer
 * @notice Optimized version of BaseBalancer with reduced contract size
 */
abstract contract OptimizedBaseBalancer is Ownable, ReentrancyGuard, OptimizedStableLimit {
    using SafeERC20 for IERC20;
    using PortfolioAnalysisLib for uint256;

    // -- Constants --
    uint256 public constant MAX_BASIS_POINTS = 100;

    // -- State --
    struct Asset {
        uint256 percentage;
    }

    mapping(address => Asset) public assets;
    address[] public assetAddresses;
    uint256 public lastUpdateTimestamp;

    // -- Events --
    event Funded(address indexed asset, uint256 amount);
    event Withdrawn(address indexed asset, uint256 amount);
    event AssetMappingUpdated(address[] assets, uint256[] percentages);

    // -- Errors --
    error InvalidAssetCount();
    error InvalidPercentagesSum();
    error AssetNotFound(address asset);
    error ZeroAddressNotAllowed();

    constructor(
        address initialOwner,
        address _factory,
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        address[] memory _stablecoins,
        address _limitOrderProtocol
    ) Ownable(initialOwner) OptimizedStableLimit(initialOwner, _factory, _stablecoins, _limitOrderProtocol) {
        _updateAssetMapping(_assetAddresses, _percentages);
        lastUpdateTimestamp = block.timestamp;
    }

    /**
     * @notice Fund the contract with a specific ERC20 token
     */
    function fund(address _asset, uint256 _amount) external onlyOwner {
        if (assets[_asset].percentage == 0) revert AssetNotFound(_asset);
        IERC20(_asset).safeTransferFrom(msg.sender, address(this), _amount);
        emit Funded(_asset, _amount);
    }

    /**
     * @notice Withdraw a specific ERC20 token from the contract
     */
    function withdraw(address _asset, uint256 _amount) external onlyOwner nonReentrant {
        if (assets[_asset].percentage == 0) revert AssetNotFound(_asset);
        IERC20(_asset).safeTransfer(msg.sender, _amount);
        emit Withdrawn(_asset, _amount);
    }

    /**
     * @notice Update the asset mapping
     */
    function updateAssetMapping(address[] memory _assetAddresses, uint256[] memory _percentages) external onlyOwner {
        _updateAssetMapping(_assetAddresses, _percentages);
    }

    /**
     * @notice Get total portfolio value in ETH
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

    /**
     * @notice Get price of an asset in ETH
     */
    function getPrice(address asset, uint256 amount) public view returns (uint256) {
        address priceFeedAddr = IBalancerFactory(factory).priceFeed();
        uint256 price = ISpotPriceAggregator(priceFeedAddr).getRateToEth(asset, false);
        return (amount * price) / 1e18;
    }

    /**
     * @notice Check asset balance using library
     */
    function checkAssetBalance(
        address token,
        uint256 currentBalance,
        uint256 currentPercentage,
        uint256 targetPercentage,
        uint256 price
    ) public pure override returns (bool isWithinRange, uint256 deviation) {
        return PortfolioAnalysisLib.checkAssetBalance(currentPercentage, targetPercentage);
    }

    /**
     * @notice Get basic portfolio analysis
     */
    function getPortfolioAnalysis() external view returns (
        uint256 portfolioValue,
        uint256 stablecoinRatio,
        bool isBalanced
    ) {
        portfolioValue = getTotalValue();
        if (portfolioValue == 0) return (0, 0, true);

        uint256 totalStablecoinValue = _getTotalStablecoinValue();
        stablecoinRatio = PortfolioAnalysisLib.calculatePortfolioMetrics(portfolioValue, totalStablecoinValue);
        
        isBalanced = _checkIfBalanced(portfolioValue);
    }

    // -- Internal Functions --
    function _updateAssetMapping(address[] memory _newAssetAddresses, uint256[] memory _newPercentages) internal {
        if (_newAssetAddresses.length != _newPercentages.length) revert InvalidAssetCount();

        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < _newPercentages.length; i++) {
            totalPercentage += _newPercentages[i];
        }
        if (totalPercentage != MAX_BASIS_POINTS) revert InvalidPercentagesSum();

        for (uint256 i = 0; i < _newAssetAddresses.length; i++) {
            if (_newAssetAddresses[i] == address(0)) revert ZeroAddressNotAllowed();
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

    function _checkIfBalanced(uint256 portfolioValue) internal view returns (bool) {
        for (uint256 i = 0; i < assetAddresses.length; i++) {
            address token = assetAddresses[i];
            uint256 balance = IERC20(token).balanceOf(address(this));
            uint256 currentValue = getPrice(token, balance);
            uint256 currentPercentage = (currentValue * 100) / portfolioValue;
            uint256 targetPercentage = assets[token].percentage;
            
            (bool withinRange, ) = PortfolioAnalysisLib.checkAssetBalance(currentPercentage, targetPercentage);
            if (!withinRange) return false;
        }
        return true;
    }

    // -- View Functions --
    function getAssetAddresses() external view returns (address[] memory) {
        return assetAddresses;
    }

    function getAsset(address _asset) external view returns (Asset memory) {
        return assets[_asset];
    }

    function getAssetBalance(address _asset) external view returns (uint256) {
        return IERC20(_asset).balanceOf(address(this));
    }

    receive() external payable {}
}
