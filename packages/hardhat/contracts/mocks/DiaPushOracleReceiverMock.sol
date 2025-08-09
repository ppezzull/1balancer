// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import { IDiaPushOracleReceiver } from "../portfolio/interfaces/IDiaPushOracleReceiver.sol";

contract DiaPushOracleReceiverMock is IDiaPushOracleReceiver {
    struct Data { uint128 ts; uint128 value; }
    mapping(string => Data) private keyToData;

    event MockUpdate(string key, uint128 ts, uint128 value);

    function setMockUpdate(string calldata key, uint128 timestamp, uint128 value) external {
        keyToData[key] = Data({ts: timestamp, value: value});
        emit MockUpdate(key, timestamp, value);
    }

    function updates(string calldata key) external view override returns (uint128 ts, uint128 value) {
        Data memory d = keyToData[key];
        return (d.ts, d.value);
    }
}

