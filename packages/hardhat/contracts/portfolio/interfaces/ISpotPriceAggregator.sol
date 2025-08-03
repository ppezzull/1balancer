// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface ISpotPriceAggregator {
    function getRateToEth(
        address srcToken,
        bool useSrcWrappers
    ) external view returns (uint256 weightedRate);

    function getRate(
        address srcToken,
        address dstToken,
        bool useWrappers
    ) external view returns (uint256 weightedRate);

    function connectors() external view returns (address[] memory allConnectors);
    function oracles() external view returns (address[] memory allOracles, uint8[] memory oracleTypes);
    function owner() external view returns (address);
    
    // Additional functions from the ABI can be added here as needed
}
