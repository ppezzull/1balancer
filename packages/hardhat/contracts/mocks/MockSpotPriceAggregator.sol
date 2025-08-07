// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../portfolio/interfaces/ISpotPriceAggregator.sol";

contract MockSpotPriceAggregator is Ownable {
    // Mapping from token pair to mock price (token1 => token2 => price)
    mapping(address => mapping(address => uint256)) public mockPrices;
    // Mapping from token to ETH price
    mapping(address => uint256) public mockEthPrices;
    
    // ETH address (will be set during deployment)
    address public wethAddress;

    constructor(address initialOwner) Ownable(initialOwner) {
        // No hardcoded initialization - prices will be set via external calls
    }

    function setWethAddress(address _wethAddress) external onlyOwner {
        wethAddress = _wethAddress;
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
        if (srcToken == wethAddress) return 1e18;
        
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
        // This function is now a placeholder - specific stablecoin addresses need to be provided
        // The actual reset will be done via setMockPrice calls with the deployed token addresses
    }

    // Batch price setting for efficiency
    function setBatchPrices(
        address[] calldata srcTokens,
        address[] calldata dstTokens,
        uint256[] calldata prices
    ) external onlyOwner {
        require(
            srcTokens.length == dstTokens.length && dstTokens.length == prices.length,
            "MockSpotPriceAggregator: Array lengths mismatch"
        );
        
        for (uint256 i = 0; i < srcTokens.length; i++) {
            mockPrices[srcTokens[i]][dstTokens[i]] = prices[i];
        }
    }

    // Batch ETH price setting
    function setBatchEthPrices(
        address[] calldata tokens,
        uint256[] calldata prices
    ) external onlyOwner {
        require(tokens.length == prices.length, "MockSpotPriceAggregator: Array lengths mismatch");
        
        for (uint256 i = 0; i < tokens.length; i++) {
            mockEthPrices[tokens[i]] = prices[i];
        }
    }
}
