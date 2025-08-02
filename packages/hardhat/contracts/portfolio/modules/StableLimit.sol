// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/ISpotPriceAggregator.sol";
import "../interfaces/IBalancerFactory.sol";

/// @title StableLimit
/// @notice Manages stablecoin grid trading strategies and monitors price pegs.
/// @dev Implements Chainlink Automation to trigger rebalancing when stablecoin prices deviate.
abstract contract StableLimit is Ownable, Pausable, AutomationCompatibleInterface {
    using SafeERC20 for IERC20;

    // -- Structs --
    struct Order {
        address fromToken;
        address toToken;
        uint256 amount;
        uint256 limitPrice; // Price with 1e18 precision
    }

    // -- Constants --
    uint256 private constant _PRICE_PRECISION = 1e18;

    // Grid strategy parameters (Mainnet addresses)
    address public USDC;
    address public USDT;
    address public DAI;
    uint256 private constant USDC_DECIMALS = 6;
    uint256 private constant DAI_DECIMALS = 18;

    // -- State --
    IBalancerFactory public factory;
    address[] public stablecoins;
    mapping(address => bool) public isStablecoin;

    // Price deviation bounds (1e18 representation)
    uint256 public constant lowerBound = 998 * 1e15; // 0.998
    uint256 public constant upperBound = 1002 * 1e15; // 1.002

    // -- Events --
    event LimitOrderPlaced(Order order);
    event OrdersGenerated(Order[] orders);
    event StablecoinsUpdated(address[] newStablecoins);
    event StablecoinAdded(address indexed stablecoin);
    event StablecoinRemoved(address indexed stablecoin);
    event OrdersGenerated(address indexed balancer, address[] tokens, uint256[] amounts, uint256[] prices);

    // Modifiers
    modifier onlyFactoryOrOwner() {
        require(msg.sender == address(factory) || msg.sender == owner(), "StableLimit__Unauthorized");
        _;
    }

    constructor(address initialOwner, address _factory, address[] memory _stablecoins) {
        _transferOwnership(initialOwner);
        _pause(); // Start paused
        _unpause(); // Then unpause
        factory = IBalancerFactory(_factory);
        for (uint i = 0; i < _stablecoins.length; i++) {
            stablecoins.push(_stablecoins[i]);
            isStablecoin[_stablecoins[i]] = true;
            
            // Set specific stablecoin addresses
            if (_stablecoins[i] == 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913) {
                USDC = _stablecoins[i];
            } else if (_stablecoins[i] == 0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2) {
                USDT = _stablecoins[i];
            } else if (_stablecoins[i] == 0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb) {
                DAI = _stablecoins[i];
            }
        }
    }

    /**
     * @dev Check if an asset's balance is within acceptable percentage range based on price
     * @param currentPercentage The current percentage allocation of the token
     * @param targetPercentage The target percentage allocation of the token
     * @return isWithinRange Whether the asset is within acceptable range
     * @return deviation The percentage deviation from target
     */
    function checkAssetBalance(
        address /* token */,
        uint256 /* currentBalance */,
        uint256 currentPercentage,
        uint256 targetPercentage,
        uint256 /* price */
    ) public view returns (bool isWithinRange, uint256 deviation) {
        // If token is not a stablecoin, we don't check it here
        // if (!isStablecoin[token]) {
        //     return (true, 0);
        // }

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

    // -- Automation Functions --

    function checkUpkeep(
        bytes calldata /* checkData */
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        // Check all stablecoin pairs for deviation
        for (uint i = 0; i < stablecoins.length; i++) {
            for (uint j = i + 1; j < stablecoins.length; j++) {
                // Get rate between stablecoin pair using 1inch spot price aggregator
                uint256 currentPrice = ISpotPriceAggregator(factory.priceFeed()).getRate(stablecoins[i], stablecoins[j], false);
                // For stablecoin pairs, we expect the price to be around 1 (1e18)
                if (currentPrice < lowerBound || currentPrice > upperBound) {
                    return (true, abi.encode(stablecoins[i], stablecoins[j], currentPrice));
                }
            }
        }

        return (false, bytes(""));
    }

    function performUpkeep(bytes calldata performData) external override whenNotPaused {
        // Decode the performData to get the token pair and price
        abi.decode(performData, (address, address, uint256));

        // Get the total value of stablecoins in the contract
        uint256 stablecoinValue = _getTotalStablecoinValue();

        // Use a portion of the stablecoin value for grid trading
        uint256 capitalToUse = stablecoinValue / 10; // Use 10% of stablecoin value

        Order[] memory orders = _generateGridOrders(
            capitalToUse,
            5, // n_livelli
            10 * (10 ** USDC_DECIMALS), // min_order_size
            capitalToUse, // max_order_size
            15, // grid_range_bps (0.0015 * 10000 = 15)
            1 * _PRICE_PRECISION // peg_price (1 USD for stablecoins)
        );

        emit OrdersGenerated(orders);

        // Mocked: Actual limit order placement is not executed
        // for (uint i = 0; i < orders.length; i++) {
        //     _placeLimitOrder(orders[i]);
        // }
    }

    // -- Internal Logic --

    function _generateGridOrders(
        uint256 capital,
        uint256 nLevels,
        uint256 minOrderSize,
        uint256 maxOrderSize,
        uint256 gridRangeBps,
        uint256 pegPrice
    ) internal view returns (Order[] memory) {
        if (nLevels == 0) return new Order[](0);

        uint256 nPairs = stablecoins.length > 1 ? stablecoins.length : 0;
        if (nPairs < 2) return new Order[](0);

        uint256 nLevelsAdjusted = nLevels;
        uint256 baseOrderAmount = capital / (nLevels * 2 * (nPairs - 1));

        if (baseOrderAmount < minOrderSize) {
            nLevelsAdjusted = capital / (minOrderSize * 2 * (nPairs - 1));
            if (nLevelsAdjusted == 0) nLevelsAdjusted = 1;
        } else if (baseOrderAmount > maxOrderSize) {
            nLevelsAdjusted = capital / (maxOrderSize * 2 * (nPairs - 1));
            uint256 maxLevels = 100;
            if (nLevelsAdjusted > maxLevels) nLevelsAdjusted = maxLevels;
        }

        if (nLevelsAdjusted == 0) return new Order[](0);

        uint256 finalOrderAmount = capital / (nLevelsAdjusted * 2 * (nPairs - 1));
        Order[] memory orders = new Order[](nLevelsAdjusted * 2 * (nPairs - 1));
        uint256 idx = 0;

        for (uint256 pair = 0; pair < nPairs - 1; pair++) {
            address fromToken = stablecoins[pair];
            address toToken = stablecoins[(pair + 1) % nPairs];
            for (uint256 i = 0; i < nLevelsAdjusted; i++) {
                uint256 offset = ((((i + 1) * _PRICE_PRECISION) / nLevelsAdjusted) * gridRangeBps) / 10000;
                orders[idx++] = Order(fromToken, toToken, finalOrderAmount, pegPrice + offset);
                orders[idx++] = Order(toToken, fromToken, finalOrderAmount, pegPrice - offset);
            }
        }

        return orders;
    }

    function _placeLimitOrder(Order memory order) internal {
        // Mocked: Emits event instead of executing trade
        emit LimitOrderPlaced(order);
    }

    function _getTotalStablecoinValue() internal view returns (uint256) {
        uint256 totalValue = 0;
        for (uint256 i = 0; i < stablecoins.length; i++) {
            address stablecoin = stablecoins[i];
            uint256 balance = IERC20(stablecoin).balanceOf(address(this));
            if (balance > 0) {
                // Get the price of the stablecoin in ETH using 1inch spot price aggregator
                uint256 price = ISpotPriceAggregator(factory.priceFeed()).getRateToEth(stablecoin, false);
                // Convert balance to ETH value (assuming 18 decimal precision for price)
                totalValue += (balance * price) / 1e18;
            }
        }
        return totalValue;
    }

    function updateStablecoins(address[] memory _stablecoins) external onlyOwner {
        stablecoins = _stablecoins;
        emit StablecoinsUpdated(_stablecoins);
    }

    // -- Pausable Functions --

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
}
