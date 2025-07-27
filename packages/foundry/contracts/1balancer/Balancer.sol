// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Balancer
 * @notice A contract that manages asset allocation with configurable parameters
 * @dev Ownable contract that maintains asset percentages and rebalancing parameters
 */
contract Balancer is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Events
    event AssetMappingUpdated(address[] assets, uint256[] percentages);
    event DriftPercentageUpdated(uint256 oldDrift, uint256 newDrift);
    event PeriodicityUpdated(uint256 oldPeriodicity, uint256 newPeriodicity);
    event Funded(address indexed token, uint256 amount);
    event Withdrawn(address indexed token, uint256 amount, address indexed to);

    // State variables
    mapping(address => uint256) public assetPercentages; // asset address => percentage (in basis points, 10000 = 100%)
    address[] public assets; // array of asset addresses for iteration
    uint256 public driftPercentage; // maximum allowed drift in basis points
    uint256 public updatePeriodicity; // time in seconds between updates
    uint256 public lastUpdateTime; // timestamp of last update

    // Constants
    uint256 public constant MAX_BASIS_POINTS = 10000; // 100%

    /**
     * @notice Constructor to initialize the Balancer contract
     * @param _owner The owner of the contract
     * @param _assets Array of asset addresses
     * @param _percentages Array of percentages corresponding to assets (in basis points)
     * @param _driftPercentage Maximum allowed drift percentage (in basis points)
     * @param _updatePeriodicity Time between updates in seconds
     */
    constructor(
        address _owner,
        address[] memory _assets,
        uint256[] memory _percentages,
        uint256 _driftPercentage,
        uint256 _updatePeriodicity
    ) Ownable(_owner) {
        require(_owner != address(0), "Owner cannot be zero address");
        require(_assets.length == _percentages.length, "Assets and percentages length mismatch");
        require(_assets.length > 0, "Must have at least one asset");
        require(_driftPercentage <= MAX_BASIS_POINTS, "Drift percentage too high");
        require(_updatePeriodicity > 0, "Update periodicity must be positive");

        // Validate percentages sum to 100%
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < _percentages.length; i++) {
            require(_percentages[i] > 0, "Percentage must be positive");
            totalPercentage += _percentages[i];
        }
        require(totalPercentage == MAX_BASIS_POINTS, "Percentages must sum to 100%");

        // Owner is set by Ownable constructor

        // Initialize asset mapping
        assets = _assets;
        for (uint256 i = 0; i < _assets.length; i++) {
            require(_assets[i] != address(0), "Asset address cannot be zero");
            assetPercentages[_assets[i]] = _percentages[i];
        }

        driftPercentage = _driftPercentage;
        updatePeriodicity = _updatePeriodicity;
        lastUpdateTime = block.timestamp;

        emit AssetMappingUpdated(_assets, _percentages);
        emit DriftPercentageUpdated(0, _driftPercentage);
        emit PeriodicityUpdated(0, _updatePeriodicity);
    }

    /**
     * @notice Update the asset mapping with new assets and percentages
     * @param _assets Array of new asset addresses
     * @param _percentages Array of new percentages (in basis points)
     */
    function updateAssetMapping(
        address[] memory _assets,
        uint256[] memory _percentages
    ) external onlyOwner {
        require(_assets.length == _percentages.length, "Assets and percentages length mismatch");
        require(_assets.length > 0, "Must have at least one asset");

        // Validate percentages sum to 100%
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < _percentages.length; i++) {
            require(_percentages[i] > 0, "Percentage must be positive");
            totalPercentage += _percentages[i];
        }
        require(totalPercentage == MAX_BASIS_POINTS, "Percentages must sum to 100%");

        // Clear old mappings
        for (uint256 i = 0; i < assets.length; i++) {
            delete assetPercentages[assets[i]];
        }

        // Set new mappings
        assets = _assets;
        for (uint256 i = 0; i < _assets.length; i++) {
            require(_assets[i] != address(0), "Asset address cannot be zero");
            assetPercentages[_assets[i]] = _percentages[i];
        }

        emit AssetMappingUpdated(_assets, _percentages);
    }

    /**
     * @notice Update the drift percentage
     * @param _driftPercentage New drift percentage (in basis points)
     */
    function updateDriftPercentage(uint256 _driftPercentage) external onlyOwner {
        require(_driftPercentage <= MAX_BASIS_POINTS, "Drift percentage too high");
        
        uint256 oldDrift = driftPercentage;
        driftPercentage = _driftPercentage;
        
        emit DriftPercentageUpdated(oldDrift, _driftPercentage);
    }

    /**
     * @notice Update the periodicity for updates
     * @param _updatePeriodicity New update periodicity in seconds
     */
    function setUpdatePeriodicity(uint256 _updatePeriodicity) external onlyOwner {
        require(_updatePeriodicity > 0, "Update periodicity must be positive");
        
        uint256 oldPeriodicity = updatePeriodicity;
        updatePeriodicity = _updatePeriodicity;
        
        emit PeriodicityUpdated(oldPeriodicity, _updatePeriodicity);
    }

    /**
     * @notice Fund the contract with tokens
     * @param _token Token address to fund
     * @param _amount Amount of tokens to fund
     */
    function fund(address _token, uint256 _amount) external onlyOwner nonReentrant {
        require(_token != address(0), "Token address cannot be zero");
        require(_amount > 0, "Amount must be positive");
        
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        
        emit Funded(_token, _amount);
    }

    /**
     * @notice Withdraw tokens from the contract
     * @param _token Token address to withdraw
     * @param _amount Amount of tokens to withdraw
     * @param _to Address to send tokens to
     */
    function withdraw(
        address _token,
        uint256 _amount,
        address _to
    ) external onlyOwner nonReentrant {
        require(_token != address(0), "Token address cannot be zero");
        require(_amount > 0, "Amount must be positive");
        require(_to != address(0), "Recipient address cannot be zero");
        
        IERC20 token = IERC20(_token);
        require(token.balanceOf(address(this)) >= _amount, "Insufficient balance");
        
        token.safeTransfer(_to, _amount);
        
        emit Withdrawn(_token, _amount, _to);
    }

    /**
     * @notice Withdraw ETH from the contract
     * @param _amount Amount of ETH to withdraw
     * @param _to Address to send ETH to
     */
    function withdrawETH(uint256 _amount, address payable _to) external onlyOwner nonReentrant {
        require(_amount > 0, "Amount must be positive");
        require(_to != address(0), "Recipient address cannot be zero");
        require(address(this).balance >= _amount, "Insufficient ETH balance");
        
        _to.transfer(_amount);
        
        emit Withdrawn(address(0), _amount, _to);
    }

    /**
     * @notice Get all assets and their percentages
     * @return _assets Array of asset addresses
     * @return _percentages Array of corresponding percentages
     */
    function getAssetMapping() external view returns (address[] memory _assets, uint256[] memory _percentages) {
        _assets = assets;
        _percentages = new uint256[](assets.length);
        
        for (uint256 i = 0; i < assets.length; i++) {
            _percentages[i] = assetPercentages[assets[i]];
        }
    }

    /**
     * @notice Get the number of assets
     * @return Number of assets in the mapping
     */
    function getAssetCount() external view returns (uint256) {
        return assets.length;
    }

    /**
     * @notice Check if an update is due based on periodicity
     * @return True if update is due
     */
    function isUpdateDue() external view returns (bool) {
        return block.timestamp >= lastUpdateTime + updatePeriodicity;
    }

    /**
     * @notice Get contract balance for a specific token
     * @param _token Token address
     * @return Token balance
     */
    function getTokenBalance(address _token) external view returns (uint256) {
        return IERC20(_token).balanceOf(address(this));
    }

    /**
     * @notice Get ETH balance of the contract
     * @return ETH balance
     */
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Allow contract to receive ETH
     */
    receive() external payable {}
}