// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../interfaces/ISpotPriceAggregator.sol";
import "../interfaces/IBalancerFactory.sol";
import "../interfaces/ILimitOrderProtocol.sol";
import "../interfaces/IERC1271.sol";
import "../libraries/StablecoinGridLib.sol";
import "../libraries/LimitOrderLib.sol";

/// @title OptimizedStableLimit
/// @notice Optimized stablecoin grid trading with reduced contract size
/// @dev Implements Chainlink Automation to trigger rebalancing when stablecoin prices deviate
/// Implements EIP-1271 for limit order signing
abstract contract OptimizedStableLimit is Ownable, Pausable, AutomationCompatibleInterface, IERC1271 {
    using SafeERC20 for IERC20;
    using StablecoinGridLib for *;
    using LimitOrderLib for *;
    using ECDSA for bytes32;

    // -- State --
    IBalancerFactory public factory;
    address[] public stablecoins;
    mapping(address => bool) public isStablecoin;
    
    // Limit order protocol integration
    ILimitOrderProtocol public limitOrderProtocol;
    bytes32 public domainSeparator;
    uint256 private nonce;
    
    // EIP-1271 magic value
    bytes4 private constant MAGIC_VALUE = 0x1626ba7e;

    // -- Events --
    event LimitOrderPlaced(StablecoinGridLib.Order order);
    event OrdersGenerated(StablecoinGridLib.Order[] orders);
    event StablecoinsUpdated(address[] newStablecoins);
    event LimitOrderCreated(bytes32 indexed orderHash, address indexed maker, address sellToken, address buyToken, uint256 sellAmount, uint256 buyAmount);
    event RebalanceOrderCreated(bytes32 indexed orderHash, address indexed maker, address sellToken, address buyToken, uint256 sellAmount, uint256 buyAmount, uint256 slippageTolerance);

    // Modifiers
    modifier onlyFactoryOrOwner() {
        require(msg.sender == address(factory) || msg.sender == owner(), "StableLimit__Unauthorized");
        _;
    }

    constructor(address initialOwner, address _factory, address[] memory _stablecoins, address _limitOrderProtocol) {
        _transferOwnership(initialOwner);
        _pause(); // Start paused
        _unpause(); // Then unpause
        factory = IBalancerFactory(_factory);
        limitOrderProtocol = ILimitOrderProtocol(_limitOrderProtocol);
        
        for (uint i = 0; i < _stablecoins.length; i++) {
            stablecoins.push(_stablecoins[i]);
            isStablecoin[_stablecoins[i]] = true;
        }
        
        // Initialize domain separator for EIP-712
        domainSeparator = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes("1inch Limit Order Protocol")),
            keccak256(bytes("4")),
            block.chainid,
            _limitOrderProtocol
        ));
    }

    /**
     * @dev Check if an asset's balance is within acceptable percentage range based on price
     */
    function checkAssetBalance(
        address /* token */,
        uint256 /* currentBalance */,
        uint256 currentPercentage,
        uint256 targetPercentage,
        uint256 /* price */
    ) virtual public pure returns (bool isWithinRange, uint256 deviation) {
        if (currentPercentage > targetPercentage) {
            deviation = currentPercentage - targetPercentage;
        } else {
            deviation = targetPercentage - currentPercentage;
        }

        isWithinRange = deviation <= 5;
        return (isWithinRange, deviation);
    }

    // -- Automation Functions --

    function checkUpkeep(
        bytes calldata /* checkData */
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        // Check all stablecoin pairs for deviation
        for (uint i = 0; i < stablecoins.length; i++) {
            for (uint j = i + 1; j < stablecoins.length; j++) {
                uint256 currentPrice = ISpotPriceAggregator(factory.priceFeed()).getRate(stablecoins[i], stablecoins[j], false);
                if (!StablecoinGridLib.isPriceWithinBounds(currentPrice)) {
                    return (true, abi.encode(stablecoins[i], stablecoins[j], currentPrice));
                }
            }
        }
        return (false, bytes(""));
    }

    function performUpkeep(bytes calldata performData) external override whenNotPaused {
        // // Decode the performData to get the token pair and price
        // (address token1, address token2, uint256 currentPrice) = abi.decode(performData, (address, address, uint256));

        // Get the total value of stablecoins in the contract
        uint256 stablecoinValue = _getTotalStablecoinValue();

        // Calculate grid parameters
        StablecoinGridLib.GridParams memory params = StablecoinGridLib.calculateGridParams(
            stablecoinValue,
            5, // n_levels
            15 // grid_range_bps (0.0015 * 10000 = 15)
        );

        // Generate grid orders
        StablecoinGridLib.Order[] memory orders = StablecoinGridLib.generateGridOrders(stablecoins, params);

        emit OrdersGenerated(orders);

        // Create actual limit orders for stablecoin pairs
        for (uint i = 0; i < orders.length; i++) {
            StablecoinGridLib.Order memory gridOrder = orders[i];
            
            // Create limit order for this grid level
            bytes32 orderHash = createStablecoinGridOrder(
                gridOrder.fromToken,
                gridOrder.toToken,
                gridOrder.amount,
                gridOrder.limitPrice
            );
            
            // Emit event for order submission
            emit LimitOrderCreated(
                orderHash,
                address(this),
                gridOrder.fromToken,
                gridOrder.toToken,
                gridOrder.amount,
                gridOrder.limitPrice
            );
        }
    }

    // -- Internal Logic --

    function _placeLimitOrder(StablecoinGridLib.Order memory order) internal {
        // Mocked: Emits event instead of executing trade
        emit LimitOrderPlaced(order);
    }

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

    function updateStablecoins(address[] memory _stablecoins) external onlyOwner {
        stablecoins = _stablecoins;
        emit StablecoinsUpdated(_stablecoins);
    }

    // -- EIP-1271 Implementation --

    /**
     * @dev EIP-1271 signature validation
     */
    function isValidSignature(
        bytes32 _hash,
        bytes memory _signature
    ) external view override returns (bytes4 magicValue) {
        // For now, only the owner can sign orders
        // In a real implementation, you might want more sophisticated signature validation
        address signer = _hash.recover(_signature);
        if (signer == owner()) {
            return MAGIC_VALUE;
        }
        return 0xffffffff;
    }

    // -- Limit Order Functions --

    /**
     * @dev Create a rebalancing limit order
     */
    function createRebalanceOrder(
        address sellToken,
        address buyToken,
        uint256 sellAmount,
        uint256 buyAmount,
        uint256 slippageTolerance
    ) external onlyOwner returns (bytes32 orderHash) {
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
            nonce++
        );

        orderHash = LimitOrderLib.calculateOrderHash(order, domainSeparator);

        emit RebalanceOrderCreated(
            orderHash,
            address(this),
            sellToken,
            buyToken,
            sellAmount,
            buyAmount,
            slippageTolerance
        );
    }

    /**
     * @dev Create a stablecoin grid limit order
     */
    function createStablecoinGridOrder(
        address fromToken,
        address toToken,
        uint256 amount,
        uint256 limitPrice
    ) public onlyOwner returns (bytes32 orderHash) {
        ILimitOrderProtocol.Order memory order = LimitOrderLib.createLimitOrder({
            maker: address(this),
            receiver: address(this),
            makerAsset: fromToken,
            takerAsset: toToken,
            makingAmount: amount,
            takingAmount: (amount * limitPrice) / 1e18,
            salt: nonce++,
            allowPartialFills: true,
            allowMultipleFills: false,
            expiration: block.timestamp + 3600 // 1 hour
        });

        orderHash = LimitOrderLib.calculateOrderHash(order, domainSeparator);

        emit LimitOrderCreated(
            orderHash,
            address(this),
            fromToken,
            toToken,
            amount,
            (amount * limitPrice) / 1e18
        );
    }

    /**
     * @dev Get order signature for submission to 1inch API
     */
    function getOrderSignature(bytes32 orderHash) external view onlyOwner returns (bytes memory signature) {
        // Create a signature that can be validated by EIP-1271
        // This is a simplified implementation - in production you'd want more sophisticated signing
        signature = abi.encodePacked(
            bytes32(0), // r
            bytes32(0), // s
            uint8(27)   // v
        );
    }

    /**
     * @dev Update limit order protocol address
     */
    function updateLimitOrderProtocol(address _limitOrderProtocol) external onlyOwner {
        limitOrderProtocol = ILimitOrderProtocol(_limitOrderProtocol);
    }

    // -- Pausable Functions --

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
} 