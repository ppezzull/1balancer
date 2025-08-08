// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";

import "../interfaces/ISpotPriceAggregator.sol";
import "../interfaces/IBalancerFactory.sol";
import "../interfaces/ILimitOrderProtocol.sol";
import "../interfaces/IERC1271.sol";

import "../libraries/StablecoinGridLib.sol";
import "../libraries/LimitOrderLib.sol";
import "../libraries/PortfolioAnalysisLib.sol";
import "../libraries/StablecoinAnalysisLib.sol";

contract OptimizedDriftBalancer is Ownable, Pausable, ReentrancyGuard, IERC1271, AutomationCompatibleInterface {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // ===== State: Portfolio groups =====
    struct AssetGroup {
        uint256 percentage;
        address[] tokens;
        bool isStablecoinGroup;
    }
    mapping(uint256 => AssetGroup) public assetGroups;
    uint256 public assetGroupsCount;
    address[] public assetAddresses;
    uint256 public lastUpdateTimestamp;

    // ===== State: Stable limit and external integrations =====
    IBalancerFactory public factory;
    address[] public stablecoins;
    mapping(address => bool) public isStablecoin;
    ILimitOrderProtocol public limitOrderProtocol;
    bytes32 public domainSeparator;
    uint256 private nonce;
    address public authorizedSigner;

    // ===== Metadata / Config =====
    uint256 public driftPercentage;
    string public name;
    string public description;

    // ===== Chainlink Automation Forwarder =====
    // Forwarder address for this upkeep. See Chainlink docs: each upkeep gets a unique forwarder.
    // For custom/log-trigger upkeeps, restrict performUpkeep to this address for additional security.
    address public s_forwarderAddress;

    // EIP-1271 magic value
    bytes4 private constant MAGIC_VALUE = 0x1626ba7e;

    // ===== Events =====
    event DriftPercentageUpdated(uint256 newDriftPercentage);
    event RebalanceNeeded(address[] tokens, uint256[] deviations);
    event OrdersGenerated(StablecoinGridLib.Order[] orders);
    event StablecoinsUpdated(address[] newStablecoins);
    event LimitOrderCreated(bytes32 indexed orderHash, address indexed maker, address sellToken, address buyToken, uint256 sellAmount, uint256 buyAmount);
    event RebalanceOrderCreated(bytes32 indexed orderHash, address indexed maker, address sellToken, address buyToken, uint256 sellAmount, uint256 buyAmount, uint256 slippageTolerance);
    event ForwarderUpdated(address forwarder);

    constructor(
        address _owner,
        address _factory,
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        uint256 _driftPercentage,
        address[] memory _stablecoins,
        address _limitOrderProtocol
    ) Ownable(_owner) {
        factory = IBalancerFactory(_factory);
        limitOrderProtocol = ILimitOrderProtocol(_limitOrderProtocol);

        // Stablecoins setup
        for (uint256 i = 0; i < _stablecoins.length; i++) {
            stablecoins.push(_stablecoins[i]);
            isStablecoin[_stablecoins[i]] = true;
        }

        // EIP-712 domain separator
        domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("1inch Limit Order Protocol")),
                keccak256(bytes("4")),
                block.chainid,
                _limitOrderProtocol
            )
        );

        // Portfolio mapping: group stablecoins as single group + each non-stablecoin as its own group
        _updateAssetGroupMapping(_assetAddresses, _percentages, _stablecoins);
        lastUpdateTimestamp = block.timestamp;

        driftPercentage = _driftPercentage;
        authorizedSigner = _owner;
        name = "Optimized Drift Balancer";
        description = "Automatically rebalances when portfolio drift exceeds tolerance and stablecoin deviations are detected.";
    }

    // ===== Owner controls =====
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    function updateDriftPercentage(uint256 _newDriftPercentage) external onlyOwner {
        driftPercentage = _newDriftPercentage;
        emit DriftPercentageUpdated(_newDriftPercentage);
    }
    function updateMetadata(string calldata _name, string calldata _description) external onlyOwner {
        name = _name;
        description = _description;
    }
    function updateStablecoins(address[] memory _stablecoins) external onlyOwner {
        // reset mapping
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

    function updateAuthorizedSigner(address newSigner) external onlyOwner {
        authorizedSigner = newSigner;
    }

    // ===== Funding =====
    function fund(address _asset, uint256 _amount) external onlyOwner {
        require(_isValidAsset(_asset), "Asset not found in any group");
        IERC20(_asset).safeTransferFrom(msg.sender, address(this), _amount);
    }
    function withdraw(address _asset, uint256 _amount) external onlyOwner nonReentrant {
        require(_isValidAsset(_asset), "Asset not found in any group");
        IERC20(_asset).safeTransfer(msg.sender, _amount);
    }

    // ===== Automation-compatible API =====
    function checkUpkeep(bytes calldata /*checkData*/) external view override returns (bool upkeepNeeded, bytes memory performData) {
        // Require ~0.1% drift (1e15 in 18 decimals) to trigger upkeep
        return StablecoinAnalysisLib.detectDeviation(stablecoins, factory.priceFeed(), 1e15);
    }

    function performUpkeep(bytes calldata /*performData*/) external override whenNotPaused {
        // Restrict to the Chainlink Automation Forwarder for this upkeep (custom/log trigger)
        // Note: For time-based upkeeps you should use the Upkeep address instead of the forwarder.
        require(msg.sender == s_forwarderAddress, "Not authorized forwarder");
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

    /// @notice Set the forwarder address that is allowed to call performUpkeep
    /// @dev Call this after registering the upkeep and retrieving the forwarder via the Chainlink app or registry
    function setForwarderAddress(address forwarder) external onlyOwner {
        s_forwarderAddress = forwarder;
        emit ForwarderUpdated(forwarder);
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

    // ===== Limit order functions =====
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
        ILimitOrderProtocol.Order memory order = LimitOrderLib.createRebalanceOrder(rebalanceOrder, address(this), nonce++);
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

    // Helper removed: contract cannot produce ECDSA signatures on-chain. Kept for compatibility to avoid breaking ABI.
    function getOrderSignature(bytes32) external pure returns (bytes memory signature) {
        return bytes("");
    }

    // ===== EIP-1271 =====
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

    function _tryRecoverEthSigned(bytes32 _hash, bytes memory _signature) internal pure returns (address, bool) {
        if (_signature.length != 65) {
            return (address(0), false);
        }
        bytes32 r;
        bytes32 s;
        uint8 v;
        // Parse signature
        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }
        if (v < 27) v += 27;
        if (v != 27 && v != 28) {
            return (address(0), false);
        }
        // Reject malleable signatures by enforcing s in lower half order
        if (uint256(s) > 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0) {
            return (address(0), false);
        }
        bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash));
        address recovered = ecrecover(ethHash, v, r, s);
        if (recovered == address(0)) {
            return (address(0), false);
        }
        return (recovered, true);
    }

    function _tryRecoverRaw(bytes32 _hash, bytes memory _signature) internal pure returns (address, bool) {
        if (_signature.length != 65) {
            return (address(0), false);
        }
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }
        if (v < 27) v += 27;
        if (v != 27 && v != 28) {
            return (address(0), false);
        }
        if (uint256(s) > 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0) {
            return (address(0), false);
        }
        address recovered = ecrecover(_hash, v, r, s);
        if (recovered == address(0)) {
            return (address(0), false);
        }
        return (recovered, true);
    }

    // ===== Portfolio views =====
    function updateAssetMapping(
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        address[] memory _stablecoins
    ) external onlyOwner {
        _updateAssetGroupMapping(_assetAddresses, _percentages, _stablecoins);
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
        address priceFeedAddr = IBalancerFactory(factory).priceFeed();
        uint256 price = ISpotPriceAggregator(priceFeedAddr).getRateToEth(asset, false);
        return (amount * price) / 1e18;
    }

    function getPortfolioAnalysis() external view returns (uint256 portfolioValue, uint256 stablecoinRatio, bool isBalanced) {
        portfolioValue = getTotalValue();
        if (portfolioValue == 0) return (0, 0, true);
        uint256 totalStablecoinValue = _getTotalStablecoinValue();
        stablecoinRatio = PortfolioAnalysisLib.calculatePortfolioMetrics(portfolioValue, totalStablecoinValue);
        isBalanced = _checkIfBalanced(portfolioValue);
    }

    function getAssetAddresses() external view returns (address[] memory) { return assetAddresses; }
    function getAssetGroup(uint256 groupId) external view returns (AssetGroup memory) { return assetGroups[groupId]; }
    function getAssetBalance(address _asset) external view returns (uint256) { return IERC20(_asset).balanceOf(address(this)); }

    // ===== Internal helpers =====
    function _getTotalStablecoinValue() internal view returns (uint256) {
        uint256 totalValue = 0;
        for (uint256 i = 0; i < stablecoins.length; i++) {
            address stablecoin = stablecoins[i];
            uint256 balance = IERC20(stablecoin).balanceOf(address(this));
            if (balance > 0) {
                uint256 price = ISpotPriceAggregator(factory.priceFeed()).getRateToEth(stablecoin, false);
                totalValue += (balance * price) / 1e18;
            }
        }
        return totalValue;
    }

    function _isValidAsset(address _asset) internal view returns (bool) {
        for (uint256 i = 0; i < assetAddresses.length; i++) {
            if (assetAddresses[i] == _asset) return true;
        }
        return false;
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
                if (_assetAddresses[i] == _stablecoins[j]) { isStable = true; stablecoinCount++; break; }
            }
            if (!isStable) { nonStablecoinCount++; }
        }
        uint256 expectedPercentageCount = (stablecoinCount > 0 ? 1 : 0) + nonStablecoinCount;
        require(_percentages.length == expectedPercentageCount, "Wrong percentage count for asset groups");

        // reset old mappings
        for (uint256 i2 = 0; i2 < assetGroupsCount; i2++) { delete assetGroups[i2]; }
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
            for (uint256 j3 = 0; j3 < _stablecoins.length; j3++) { if (_assetAddresses[i4] == _stablecoins[j3]) { isStable2 = true; break; } }
            if (!isStable2) {
                address[] memory singleAsset = new address[](1);
                singleAsset[0] = _assetAddresses[i4];
                assetGroups[assetGroupsCount] = AssetGroup({ percentage: _percentages[percentageIndex], tokens: singleAsset, isStablecoinGroup: false });
                assetGroupsCount++;
                percentageIndex++;
            }
        }
    }

    receive() external payable {}
}
