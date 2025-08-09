// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";

import "../interfaces/IBalancerFactory.sol";
import "../interfaces/IOracleAdapter.sol";
import "../interfaces/IERC1271.sol";
import "../interfaces/ILimitOrderProtocol.sol";
import "../libraries/LimitOrderLib.sol";
import "../libraries/PortfolioAnalysisLib.sol";

abstract contract BaseBalancer is Ownable, Pausable, ReentrancyGuard, IERC1271, AutomationCompatibleInterface {
    using ECDSA for bytes32;
    using SafeERC20 for IERC20;
    struct AssetGroup {
        uint256 percentage;
        address[] tokens;
        bool isStablecoinGroup;
    }

    mapping(uint256 => AssetGroup) public assetGroups;
    uint256 public assetGroupsCount;
    address[] public assetAddresses;
    uint256 public lastUpdateTimestamp;

    IBalancerFactory public factory;
    address[] public stablecoins;
    mapping(address => bool) public isStablecoin;
    
    // Signature auth and automation forwarder
    address public authorizedSigner;
    address public s_forwarderAddress;
    
    // Orders / protocol
    ILimitOrderProtocol public limitOrderProtocol;
    bytes32 public domainSeparator;
    uint256 internal nonce;
    
    // Metadata
    string public name;
    string public description;

    event StablecoinsUpdated(address[] newStablecoins);
    event ForwarderUpdated(address forwarder);

    constructor(
        address _owner,
        address _factory,
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        address[] memory _stablecoins,
        address _limitOrderProtocol
    ) Ownable(_owner) {
        factory = IBalancerFactory(_factory);

        for (uint256 i = 0; i < _stablecoins.length; i++) {
            stablecoins.push(_stablecoins[i]);
            isStablecoin[_stablecoins[i]] = true;
        }

        _updateAssetGroupMapping(_assetAddresses, _percentages, _stablecoins);
        lastUpdateTimestamp = block.timestamp;

        authorizedSigner = _owner;
        // Default forwarder to owner to enable local testing and safe manual calls
        s_forwarderAddress = _owner;
        name = "Optimized Balancer";
        description = "Shared base for Drift/Time Balancers";

        // Limit order protocol and domain separator
        limitOrderProtocol = ILimitOrderProtocol(_limitOrderProtocol);
        domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("1inch Limit Order Protocol")),
                keccak256(bytes("4")),
                block.chainid,
                _limitOrderProtocol
            )
        );
    }

    function updateStablecoins(address[] memory _stablecoins) external onlyOwner {
        for (uint256 i = 0; i < stablecoins.length; i++) {
            isStablecoin[stablecoins[i]] = false;
        }
        delete stablecoins;
        for (uint256 i2 = 0; i2 < _stablecoins.length; i2++) {
            stablecoins.push(_stablecoins[i2]);
            isStablecoin[_stablecoins[i2]] = true;
        }
        emit StablecoinsUpdated(_stablecoins);
    }

    function updateAssetMapping(
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        address[] memory _stablecoins
    ) external onlyOwner {
        _updateAssetGroupMapping(_assetAddresses, _percentages, _stablecoins);
    }

    // ===== Authorization controls =====
    function updateAuthorizedSigner(address newSigner) external onlyOwner {
        authorizedSigner = newSigner;
    }

    function updateMetadata(string calldata _name, string calldata _description) external onlyOwner {
        name = _name;
        description = _description;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ===== Automation-compatible API (common gating) =====
    function checkUpkeep(bytes calldata checkData) external view virtual override returns (bool upkeepNeeded, bytes memory performData) {
        return _checkUpkeep(checkData);
    }

    function performUpkeep(bytes calldata performData) external virtual override whenNotPaused {
        require(msg.sender == s_forwarderAddress, "Not authorized forwarder");
        _performUpkeep(performData);
    }

    function setForwarderAddress(address forwarder) external onlyOwner {
        s_forwarderAddress = forwarder;
        emit ForwarderUpdated(forwarder);
    }

    // Strategy hooks to implement per balancer
    function _checkUpkeep(bytes calldata checkData) internal view virtual returns (bool, bytes memory);
    function _performUpkeep(bytes calldata performData) internal virtual;

    // ===== Funding =====
    function fund(address _asset, uint256 _amount) external onlyOwner {
        require(_isValidAsset(_asset), "Asset not found in any group");
        IERC20(_asset).safeTransferFrom(msg.sender, address(this), _amount);
    }
    function withdraw(address _asset, uint256 _amount) external onlyOwner nonReentrant {
        require(_isValidAsset(_asset), "Asset not found in any group");
        IERC20(_asset).safeTransfer(msg.sender, _amount);
    }

    function getTotalValue() public view returns (uint256) {
        uint256 totalValue = 0;
        for (uint256 i = 0; i < assetAddresses.length; i++) {
            address asset = assetAddresses[i];
            uint256 balance = IERC20(asset).balanceOf(address(this));
            totalValue += getPrice(asset, balance);
        }
        return totalValue;
    }

    function getPrice(address asset, uint256 amount) public view returns (uint256) {
        address priceFeedAddr = factory.priceFeed();
        uint256 price = IOracleAdapter(priceFeedAddr).getRateToEth(asset, false);
        return (amount * price) / 1e18;
    }

    function getPortfolioAnalysis() external view returns (uint256 portfolioValue, uint256 stablecoinRatio, bool isBalanced) {
        portfolioValue = getTotalValue();
        if (portfolioValue == 0) return (0, 0, true);
        uint256 totalStablecoinValue = _getTotalStablecoinValue();
        stablecoinRatio = PortfolioAnalysisLib.calculatePortfolioMetrics(portfolioValue, totalStablecoinValue);
        isBalanced = _checkIfBalanced(portfolioValue);
    }

    // ===== EIP-1271 =====
    bytes4 private constant MAGIC_VALUE = 0x1626ba7e;

    function isValidSignature(bytes32 _hash, bytes memory _signature) external view override returns (bytes4 magicValue) {
        // Try EIP-191 personal_sign digest first
        bytes32 ethDigest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash));
        (address rec1, ECDSA.RecoverError err1, ) = ECDSA.tryRecover(ethDigest, _signature);
        if (err1 == ECDSA.RecoverError.NoError && (rec1 == authorizedSigner || rec1 == owner())) {
            return MAGIC_VALUE;
        }
        // Fallback to raw hash (e.g., EIP-712 already-digested input)
        (address rec2, ECDSA.RecoverError err2, ) = ECDSA.tryRecover(_hash, _signature);
        if (err2 == ECDSA.RecoverError.NoError && (rec2 == authorizedSigner || rec2 == owner())) {
            return MAGIC_VALUE;
        }
        return 0xffffffff;
    }

    // Helper: contract cannot produce ECDSA signatures on-chain, keep for ABI compatibility
    function getOrderSignature(bytes32) external pure returns (bytes memory signature) {
        return bytes("");
    }

    // ===== Orders (shared) =====
    event LimitOrderCreated(
        bytes32 indexed orderHash,
        address indexed maker,
        address sellToken,
        address buyToken,
        uint256 sellAmount,
        uint256 buyAmount
    );
    event RebalanceOrderCreated(
        bytes32 indexed orderHash,
        address indexed maker,
        address sellToken,
        address buyToken,
        uint256 sellAmount,
        uint256 buyAmount,
        uint256 slippageTolerance
    );

    function createRebalanceOrder(
        address sellToken,
        address buyToken,
        uint256 sellAmount,
        uint256 buyAmount,
        uint256 slippageTolerance
    ) public onlyOwner returns (bytes32 orderHash) {
        LimitOrderLib.RebalanceOrder memory rebalanceOrder = LimitOrderLib.RebalanceOrder({
            sellToken: sellToken,
            buyToken: buyToken,
            sellAmount: sellAmount,
            buyAmount: buyAmount,
            slippageTolerance: slippageTolerance
        });
        ILimitOrderProtocol.Order memory order = LimitOrderLib.createRebalanceOrder(
            rebalanceOrder,
            address(this),
            nonce++,
            block.timestamp + 3600
        );
        orderHash = LimitOrderLib.calculateOrderHash(order, domainSeparator);
        emit RebalanceOrderCreated(orderHash, address(this), sellToken, buyToken, sellAmount, buyAmount, slippageTolerance);
    }

    function createStablecoinGridOrder(
        address fromToken,
        address toToken,
        uint256 amount,
        uint256 limitPrice
    ) public onlyOwner returns (bytes32 orderHash) {
        ILimitOrderProtocol.Order memory order = LimitOrderLib.createLimitOrder(
            address(this),
            address(this),
            fromToken,
            toToken,
            amount,
            (amount * limitPrice) / 1e18,
            nonce++,
            true,
            false,
            block.timestamp + 3600
        );
        orderHash = LimitOrderLib.calculateOrderHash(order, domainSeparator);
        emit LimitOrderCreated(orderHash, address(this), fromToken, toToken, amount, (amount * limitPrice) / 1e18);
    }

    // ===== Portfolio helpers shared =====
    function _getTotalStablecoinValue() internal view returns (uint256) {
        uint256 totalValue = 0;
        for (uint256 i = 0; i < stablecoins.length; i++) {
            address stablecoin = stablecoins[i];
            uint256 balance = IERC20(stablecoin).balanceOf(address(this));
            if (balance > 0) {
                uint256 price = IOracleAdapter(factory.priceFeed()).getRateToEth(stablecoin, false);
                totalValue += (balance * price) / 1e18;
            }
        }
        return totalValue;
    }

    function _checkIfBalanced(uint256 portfolioValue) internal view returns (bool) {
        for (uint256 groupId = 0; groupId < assetGroupsCount; groupId++) {
            AssetGroup memory group = assetGroups[groupId];
            uint256 groupValue = 0;
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

    function getAssetAddresses() external view returns (address[] memory) {
        return assetAddresses;
    }

    function getStablecoins() external view returns (address[] memory) {
        return stablecoins;
    }

    function getAssetGroup(uint256 groupId) external view returns (AssetGroup memory) {
        return assetGroups[groupId];
    }

    function getAssetBalance(address _asset) external view returns (uint256) {
        return IERC20(_asset).balanceOf(address(this));
    }

    function _isValidAsset(address _asset) internal view returns (bool) {
        for (uint256 i = 0; i < assetAddresses.length; i++) {
            if (assetAddresses[i] == _asset) return true;
        }
        return false;
    }

    function _updateAssetGroupMapping(
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        address[] memory _stablecoins
    ) internal {
        require(_percentages.length > 0, "No percentages provided");
        require(_assetAddresses.length > 0, "No assets provided");

        uint256 nonStablecoinCount = 0;
        uint256 stablecoinCount = 0;
        for (uint256 i = 0; i < _assetAddresses.length; i++) {
            bool isStable = false;
            for (uint256 j = 0; j < _stablecoins.length; j++) {
                if (_assetAddresses[i] == _stablecoins[j]) {
                    isStable = true;
                    stablecoinCount++;
                    break;
                }
            }
            if (!isStable) {
                nonStablecoinCount++;
            }
        }
        uint256 expectedPercentageCount = (stablecoinCount > 0 ? 1 : 0) + nonStablecoinCount;
        require(_percentages.length == expectedPercentageCount, "Wrong percentage count for asset groups");

        for (uint256 i2 = 0; i2 < assetGroupsCount; i2++) {
            delete assetGroups[i2];
        }
        assetAddresses = _assetAddresses;
        assetGroupsCount = 0;

        if (stablecoinCount > 0) {
            address[] memory stablecoinAssets = new address[](stablecoinCount);
            uint256 stablecoinIndex = 0;
            for (uint256 i3 = 0; i3 < _assetAddresses.length; i3++) {
                for (uint256 j2 = 0; j2 < _stablecoins.length; j2++) {
                    if (_assetAddresses[i3] == _stablecoins[j2]) {
                        stablecoinAssets[stablecoinIndex] = _assetAddresses[i3];
                        stablecoinIndex++;
                        break;
                    }
                }
            }
            assetGroups[assetGroupsCount] = AssetGroup({ percentage: _percentages[0], tokens: stablecoinAssets, isStablecoinGroup: true });
            assetGroupsCount++;
        }

        uint256 percentageIndex = stablecoinCount > 0 ? 1 : 0;
        for (uint256 i4 = 0; i4 < _assetAddresses.length; i4++) {
            bool isStable2 = false;
            for (uint256 j3 = 0; j3 < _stablecoins.length; j3++) {
                if (_assetAddresses[i4] == _stablecoins[j3]) {
                    isStable2 = true;
                    break;
                }
            }
            if (!isStable2) {
                address[] memory singleAsset = new address[](1);
                singleAsset[0] = _assetAddresses[i4];
                assetGroups[assetGroupsCount] = AssetGroup({ percentage: _percentages[percentageIndex], tokens: singleAsset, isStablecoinGroup: false });
                assetGroupsCount++;
                percentageIndex++;
            }
        }
    }
}

