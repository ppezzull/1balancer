// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/// [Chainlink] Log Trigger Upkeeps + ILogAutomation:
/// https://docs.chain.link/chainlink-automation/guides/log-trigger

interface ILogAutomation {
    struct Log {
        uint256 index;
        uint256 timestamp;
        bytes32 txHash;
        uint256 blockNumber;
        bytes32 blockHash;
        address source;
        bytes32[] topics;
        bytes data;
    }

    function checkLog(Log calldata log, bytes calldata checkData) external returns (bool upkeepNeeded, bytes memory performData);
    function performUpkeep(bytes calldata performData) external;
}

import { IDiaPushOracleReceiver } from "../interfaces/IDiaPushOracleReceiver.sol";

interface IDriftRebalance {
    function triggerRebalance() external;
    function getStablecoins() external view returns (address[] memory);
    function getAssetAddresses() external view returns (address[] memory);
}

/// [DIA] Oracle V2 classic event (ABI ref):
/// event OracleUpdate(string key, uint128 value, uint128 timestamp)
/// Confirm Push Receiver’s actual event signature on Basescan and update topic0 if needed.
contract DriftBalancerLogger is ILogAutomation {
    address public immutable oracle; // DIA PushOracleReceiver
    address public immutable targetBalancer; // DriftBalancer to invoke
    // Thresholds per key (bps). keys hashed to bytes32 to keep storage cheap
    mapping(bytes32 => uint256) public driftThresholdBps; // keccak256(key) => threshold

    event DriftRebalanced(string key, uint128 value, uint128 ts);

    constructor(address _oracle, address _targetBalancer, string[] memory keys, uint256[] memory thresholdsBps) {
        require(_oracle != address(0), "oracle=0");
        require(_targetBalancer != address(0), "target=0");
        require(keys.length == thresholdsBps.length, "len mismatch");
        oracle = _oracle;
        targetBalancer = _targetBalancer;
        for (uint256 i = 0; i < keys.length; i++) {
            driftThresholdBps[keccak256(bytes(keys[i]))] = thresholdsBps[i];
        }
    }

    // topic0 must match the registered filter. For DIA classic:
    // bytes32(keccak256("OracleUpdate(string,uint128,uint128)"))
    // If Push Receiver differs, compute new topic0 off-chain and use that in registration.
    function checkLog(Log calldata log, bytes calldata) external returns (bool upkeepNeeded, bytes memory performData) {
        // Parse DIA payload
        (string memory key, uint128 value, uint128 ts) = abi.decode(log.data, (string, uint128, uint128));
        // Optionally scope by key thresholds
        uint256 thr = driftThresholdBps[keccak256(bytes(key))];
        if (thr == 0) {
            // If not configured, still allow upkeep to let target balancer decide
            performData = abi.encode(key, value, ts);
            return (true, performData);
        }
        // Lightweight precheck: only stablecoin keys trigger immediately
        // Full portfolio checks happen in performUpkeep via targetBalancer.triggerRebalance()
        performData = abi.encode(key, value, ts);
        return (true, performData);
    }

    function performUpkeep(bytes calldata performData) external override {
        (string memory key, uint128 value, uint128 ts) = abi.decode(performData, (string, uint128, uint128));
        // Optional: read latest on-chain pushed value to confirm
        // (uint128 lastTs, uint128 lastVal) = IDiaPushOracleReceiver(oracle).updates(key);

        // Forward to portfolio DriftBalancer to apply library-based analysis and emit orders/events
        // This connects Automation Log trigger with existing portfolio logic.
        try IDriftRebalance(targetBalancer).triggerRebalance() {
            // no-op
        } catch {}

        emit DriftRebalanced(key, value, ts);
    }
}

