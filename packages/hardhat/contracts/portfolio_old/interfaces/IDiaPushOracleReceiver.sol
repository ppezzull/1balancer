// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// Minimal read interface for DIA Lumina Push Oracle Receiver.
// https://www.diadata.org/docs/how-to-guides/fetch-price-data/push-based-oracles
interface IDiaPushOracleReceiver {
    function updates(string calldata key) external view returns (uint128 ts, uint128 value);
}

