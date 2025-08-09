// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IOracleAdapter {
    function getRateToEth(address srcToken, bool useSrcWrappers) external view returns (uint256 weightedRate);
    function getRate(address srcToken, address dstToken, bool useWrappers) external view returns (uint256 weightedRate);
}

