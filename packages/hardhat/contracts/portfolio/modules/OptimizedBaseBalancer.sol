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
    struct AssetGroup {
        uint256 percentage;
        address[] tokens; // For stablecoins, this will contain multiple tokens
        bool isStablecoinGroup;
    }

    mapping(uint256 => AssetGroup) public assetGroups;
    uint256 public assetGroupsCount;
    address[] public assetAddresses; // All tokens (including stablecoins)
    uint256 public lastUpdateTimestamp;

    // -- Events --
    event Funded(address indexed asset, uint256 amount);
    event Withdrawn(address indexed asset, uint256 amount);
    event AssetMappingUpdated(address[] assets, uint256[] percentages);

    // -- Errors --
    error InvalidAssetCount();
    error InvalidPercentagesSum();
    error AssetGroupNotFound(uint256 groupId);
    error ZeroAddressNotAllowed();

    constructor(
        address initialOwner,
        address _factory,
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        address[] memory _stablecoins,
        address _limitOrderProtocol
    ) Ownable(initialOwner) OptimizedStableLimit(initialOwner, _factory, _stablecoins, _limitOrderProtocol) {
        _updateAssetGroupMapping(_assetAddresses, _percentages, _stablecoins);
        lastUpdateTimestamp = block.timestamp;
    }

    /**
     * @notice Fund the contract with a specific ERC20 token
     */
    function fund(address _asset, uint256 _amount) external onlyOwner {
        require(_isValidAsset(_asset), "Asset not found in any group");
        IERC20(_asset).safeTransferFrom(msg.sender, address(this), _amount);
        emit Funded(_asset, _amount);
    }

    /**
     * @notice Withdraw a specific ERC20 token from the contract
     */
    function withdraw(address _asset, uint256 _amount) external onlyOwner nonReentrant {
        require(_isValidAsset(_asset), "Asset not found in any group");
        IERC20(_asset).safeTransfer(msg.sender, _amount);
        emit Withdrawn(_asset, _amount);
    }

    /**
     * @notice Update the asset mapping
     */
    function updateAssetMapping(
        address[] memory _assetAddresses, 
        uint256[] memory _percentages,
        address[] memory _stablecoins
    ) external onlyOwner {
        _updateAssetGroupMapping(_assetAddresses, _percentages, _stablecoins);
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
        address,
        uint256,
        uint256 currentPercentage,
        uint256 targetPercentage,
        uint256
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
    function _updateAssetGroupMapping(
        address[] memory _assetAddresses, 
        uint256[] memory _percentages,
        address[] memory _stablecoins
    ) internal {
        require(_percentages.length > 0, "No percentages provided");
        require(_assetAddresses.length > 0, "No assets provided");
        
        // Count non-stablecoin assets
        uint256 nonStablecoinCount = 0;
        uint256 stablecoinCount = 0;
        
        for (uint256 i = 0; i < _assetAddresses.length; i++) {
            bool isStablecoin = false;
            for (uint256 j = 0; j < _stablecoins.length; j++) {
                if (_assetAddresses[i] == _stablecoins[j]) {
                    isStablecoin = true;
                    stablecoinCount++;
                    break;
                }
            }
            if (!isStablecoin) {
                nonStablecoinCount++;
            }
        }
        
        // Calculate expected percentage count: 1 for stablecoins (if any) + 1 for each non-stablecoin
        uint256 expectedPercentageCount = (stablecoinCount > 0 ? 1 : 0) + nonStablecoinCount;
        
        require(_percentages.length == expectedPercentageCount, "Wrong percentage count for asset groups");
        
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < _percentages.length; i++) {
            totalPercentage += _percentages[i];
        }
        if (totalPercentage != MAX_BASIS_POINTS) revert InvalidPercentagesSum();

        // Clear old mappings
        for (uint256 i = 0; i < assetGroupsCount; i++) {
            delete assetGroups[i];
        }
        
        assetAddresses = _assetAddresses;
        assetGroupsCount = 0;

        // Create stablecoin group if we have stablecoins in the asset list
        if (stablecoinCount > 0) {
            address[] memory stablecoinAssets = new address[](stablecoinCount);
            uint256 stablecoinIndex = 0;
            
            for (uint256 i = 0; i < _assetAddresses.length; i++) {
                for (uint256 j = 0; j < _stablecoins.length; j++) {
                    if (_assetAddresses[i] == _stablecoins[j]) {
                        stablecoinAssets[stablecoinIndex] = _assetAddresses[i];
                        stablecoinIndex++;
                        break;
                    }
                }
            }
            
            assetGroups[assetGroupsCount] = AssetGroup({
                percentage: _percentages[0], // First percentage is for stablecoins
                tokens: stablecoinAssets,
                isStablecoinGroup: true
            });
            assetGroupsCount++;
        }
        
        // Create groups for non-stablecoin assets
        uint256 percentageIndex = stablecoinCount > 0 ? 1 : 0;
        for (uint256 i = 0; i < _assetAddresses.length; i++) {
            bool isStablecoin = false;
            for (uint256 j = 0; j < _stablecoins.length; j++) {
                if (_assetAddresses[i] == _stablecoins[j]) {
                    isStablecoin = true;
                    break;
                }
            }
            
            if (!isStablecoin) {
                address[] memory singleAsset = new address[](1);
                singleAsset[0] = _assetAddresses[i];
                
                assetGroups[assetGroupsCount] = AssetGroup({
                    percentage: _percentages[percentageIndex],
                    tokens: singleAsset,
                    isStablecoinGroup: false
                });
                assetGroupsCount++;
                percentageIndex++;
            }
        }

        emit AssetMappingUpdated(_assetAddresses, _percentages);
    }
    
    function _isValidAsset(address _asset) internal view returns (bool) {
        for (uint256 i = 0; i < assetAddresses.length; i++) {
            if (assetAddresses[i] == _asset) {
                return true;
            }
        }
        return false;
    }

    function _checkIfBalanced(uint256 portfolioValue) internal view returns (bool) {
        for (uint256 groupId = 0; groupId < assetGroupsCount; groupId++) {
            AssetGroup memory group = assetGroups[groupId];
            uint256 groupValue = 0;
            
            // Calculate total value for this group
            for (uint256 i = 0; i < group.tokens.length; i++) {
                uint256 balance = IERC20(group.tokens[i]).balanceOf(address(this));
                groupValue += getPrice(group.tokens[i], balance);
            }
            
            uint256 currentPercentage = (groupValue * 100) / portfolioValue;
            uint256 targetPercentage = group.percentage;
            
            (bool withinRange, ) = PortfolioAnalysisLib.checkAssetBalance(currentPercentage, targetPercentage);
            if (!withinRange) return false;
        }
        return true;
    }

    // -- View Functions --
    function getAssetAddresses() external view returns (address[] memory) {
        return assetAddresses;
    }

    function getAssetGroup(uint256 groupId) external view returns (AssetGroup memory) {
        return assetGroups[groupId];
    }

    function getAssetBalance(address _asset) external view returns (uint256) {
        return IERC20(_asset).balanceOf(address(this));
    }
    
    function getStablecoinGroupValue() external view returns (uint256) {
        for (uint256 groupId = 0; groupId < assetGroupsCount; groupId++) {
            if (assetGroups[groupId].isStablecoinGroup) {
                uint256 groupValue = 0;
                for (uint256 i = 0; i < assetGroups[groupId].tokens.length; i++) {
                    uint256 balance = IERC20(assetGroups[groupId].tokens[i]).balanceOf(address(this));
                    groupValue += getPrice(assetGroups[groupId].tokens[i], balance);
                }
                return groupValue;
            }
        }
        return 0;
    }

    receive() external payable {}
}
