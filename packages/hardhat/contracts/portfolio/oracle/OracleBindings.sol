// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/// [DIA] Push Oracle docs: https://www.diadata.org/docs/how-to-guides/fetch-price-data/push-based-oracles
/// Base mainnet Push Oracle (verify): see https://www.diadata.org/docs/how-to-guides/fetch-price-data/contract-addresses

/// Minimal read interface for DIA Push Oracle receivers
interface IDIAPushOracleReceiverMinimal {
    /// Updates keyed by e.g. "ETH/USD", "USDC/USD", etc.
    /// Docs refer to Pull V2 or V2 classic; for Push Receiver confirm ABI on Basescan.
    function updates(string calldata key) external view returns (uint128 ts, uint128 value);
}

/// Chain-agnostic binding that stores oracle address in storage
contract OracleBindings {
    address public immutable diaPushOracle;

    constructor(address _diaPushOracle) {
        require(_diaPushOracle != address(0), "oracle=0");
        diaPushOracle = _diaPushOracle;
    }

    function getUpdate(string calldata key) external view returns (uint128 ts, uint128 value) {
        (ts, value) = IDIAPushOracleReceiverMinimal(diaPushOracle).updates(key);
    }
}

