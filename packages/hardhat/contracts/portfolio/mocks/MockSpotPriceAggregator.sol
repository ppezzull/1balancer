// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/ISpotPriceAggregator.sol";

contract MockSpotPriceAggregator is Ownable {
    // Mapping from token pair to mock price (token1 => token2 => price)
    mapping(address => mapping(address => uint256)) public mockPrices;
    // Mapping from token to ETH price
    mapping(address => uint256) public mockEthPrices;
    
    // Base mainnet token addresses
    address public constant WETH = 0x4200000000000000000000000000000000000006;
    address public constant INCH = 0xc5fecC3a29Fb57B5024eEc8a2239d4621e111CBE;
    
    // Stablecoin addresses (Base mainnet)
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address public constant USDT = 0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2;
    address public constant DAI = 0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb;

    constructor(address initialOwner) Ownable(initialOwner) {
        _initializeDefaultPrices();
    }

    function _initializeDefaultPrices() internal {
        // Initialize stable prices (1 USD = 1e18)
        uint256 oneUSD = 1e18;
        
        // Stablecoin to stablecoin pairs (around 1.0)
        mockPrices[USDC][USDT] = oneUSD;
        mockPrices[USDT][USDC] = oneUSD;
        mockPrices[USDC][DAI] = oneUSD;
        mockPrices[DAI][USDC] = oneUSD;
        mockPrices[USDT][DAI] = oneUSD;
        mockPrices[DAI][USDT] = oneUSD;
        
        // ETH prices (example: ETH = $3000, 1INCH = $0.5)
        mockEthPrices[WETH] = 1e18; // 1 ETH = 1 ETH
        mockEthPrices[USDC] = 1e15; // 1 USDC = 0.001 ETH (1/3000)
        mockEthPrices[USDT] = 1e15; // 1 USDT = 0.001 ETH
        mockEthPrices[DAI] = 1e15;  // 1 DAI = 0.001 ETH
        mockEthPrices[INCH] = 5e14; // 1 1INCH = 0.0005 ETH (0.5/1000)
        
        // Token to token prices
        mockPrices[WETH][USDC] = 3000e18; // 1 ETH = 3000 USDC
        mockPrices[USDC][WETH] = 333333333333333; // 1 USDC = 1/3000 ETH
        mockPrices[WETH][USDT] = 3000e18;
        mockPrices[USDT][WETH] = 333333333333333;
        mockPrices[WETH][DAI] = 3000e18;
        mockPrices[DAI][WETH] = 333333333333333;
        mockPrices[WETH][INCH] = 6000e18; // 1 ETH = 6000 1INCH
        mockPrices[INCH][WETH] = 166666666666666;
        
        // 1INCH to stablecoins
        mockPrices[INCH][USDC] = 5e17; // 1 1INCH = 0.5 USDC
        mockPrices[USDC][INCH] = 2e18; // 1 USDC = 2 1INCH
        mockPrices[INCH][USDT] = 5e17;
        mockPrices[USDT][INCH] = 2e18;
        mockPrices[INCH][DAI] = 5e17;
        mockPrices[DAI][INCH] = 2e18;
    }

    function getRate(
        address srcToken,
        address dstToken,
        bool /* useWrappers */
    ) external view returns (uint256) {
        if (srcToken == dstToken) return 1e18;
        
        uint256 price = mockPrices[srcToken][dstToken];
        require(price > 0, "MockSpotPriceAggregator: Price not set");
        return price;
    }

    function getRateToEth(
        address srcToken,
        bool /* useSrcWrappers */
    ) external view returns (uint256) {
        if (srcToken == WETH) return 1e18;
        
        uint256 price = mockEthPrices[srcToken];
        require(price > 0, "MockSpotPriceAggregator: ETH price not set");
        return price;
    }

    // Owner functions to manipulate prices for testing
    function setMockPrice(address srcToken, address dstToken, uint256 price) external onlyOwner {
        mockPrices[srcToken][dstToken] = price;
    }

    function setMockEthPrice(address token, uint256 price) external onlyOwner {
        mockEthPrices[token] = price;
    }

    // Helper functions for testing stablecoin deviations
    function setStablecoinDeviation(address stablecoin1, address stablecoin2, uint256 deviationBps) external onlyOwner {
        // deviationBps: 100 = 1%, 50 = 0.5%
        uint256 basePrice = 1e18;
        uint256 deviatedPrice = basePrice + (basePrice * deviationBps) / 10000;
        
        mockPrices[stablecoin1][stablecoin2] = deviatedPrice;
        mockPrices[stablecoin2][stablecoin1] = (1e36) / deviatedPrice;
    }

    function resetStablecoinPrices() external onlyOwner {
        uint256 oneUSD = 1e18;
        
        mockPrices[USDC][USDT] = oneUSD;
        mockPrices[USDT][USDC] = oneUSD;
        mockPrices[USDC][DAI] = oneUSD;
        mockPrices[DAI][USDC] = oneUSD;
        mockPrices[USDT][DAI] = oneUSD;
        mockPrices[DAI][USDT] = oneUSD;
    }
}
