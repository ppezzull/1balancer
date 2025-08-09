// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "../interfaces/IOracleAdapter.sol";
import "../interfaces/IDiaPushOracleReceiver.sol";

// OracleAdapter consumes DIA Push Receiver "updates(key)" to compute token/ETH and cross rates.
// Keys like "ETH/USD", "USDC/USD" should be configured for each token.
// References:
// - Lumina integrated chains: https://www.diadata.org/docs/intro-to-lumina/integrated-chains
// - Pull model ABI/flow (for reference): https://www.diadata.org/docs/how-to-guides/fetch-price-data/pull-based-oracles
contract OracleAdapter is IOracleAdapter {
    address public immutable diaPush;
    mapping(address => string) public tokenToUsdKey;
    string public ethUsdKey;

    error NoKeyForToken();
    error NoEthKey();

    constructor(address _diaPush, string memory _ethUsdKey) {
        require(_diaPush != address(0), "dia=0");
        require(bytes(_ethUsdKey).length != 0, "ethKey=empty");
        diaPush = _diaPush;
        ethUsdKey = _ethUsdKey;
    }

    function setTokenUsdKey(address token, string calldata key) external {
        require(token != address(0), "tok=0");
        require(bytes(key).length != 0, "key=empty");
        tokenToUsdKey[token] = key;
    }

    function setEthUsdKey(string calldata key) external {
        require(bytes(key).length != 0, "key=empty");
        ethUsdKey = key;
    }

    function getRateToEth(address srcToken, bool) external view override returns (uint256 weightedRate) {
        string memory srcKey = tokenToUsdKey[srcToken];
        if (bytes(srcKey).length == 0) revert NoKeyForToken();
        if (bytes(ethUsdKey).length == 0) revert NoEthKey();

        (, uint128 srcUsd) = IDiaPushOracleReceiver(diaPush).updates(srcKey);
        (, uint128 ethUsd) = IDiaPushOracleReceiver(diaPush).updates(ethUsdKey);
        if (ethUsd == 0) return 0;
        return (uint256(srcUsd) * 1e18) / uint256(ethUsd);
    }

    function getRate(address srcToken, address dstToken, bool) external view override returns (uint256 weightedRate) {
        string memory srcKey = tokenToUsdKey[srcToken];
        string memory dstKey = tokenToUsdKey[dstToken];
        if (bytes(srcKey).length == 0 || bytes(dstKey).length == 0) revert NoKeyForToken();

        (, uint128 srcUsd) = IDiaPushOracleReceiver(diaPush).updates(srcKey);
        (, uint128 dstUsd) = IDiaPushOracleReceiver(diaPush).updates(dstKey);
        if (dstUsd == 0) return 0;
        return (uint256(srcUsd) * 1e18) / uint256(dstUsd);
    }
}

