// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import { IDiaPushOracleReceiver } from "../interfaces/IDiaPushOracleReceiver.sol";

interface IAutomationCompatible {
    function checkUpkeep(bytes calldata) external returns (bool, bytes memory);
    function performUpkeep(bytes calldata) external;
}

interface ITimeBalancerHooks {
    function triggerTimeRebalance() external;
}

/// A lightweight conditional logger for TimeBalancer: this contract is optional.
/// The TimeBalancer already supports conditional upkeep via BaseBalancer hooks.
contract TimeBalancerLogger {
    address public immutable oracle;
    address public immutable targetBalancer; // TimeBalancer

    constructor(address _oracle, address _targetBalancer) {
        require(_oracle != address(0) && _targetBalancer != address(0), "addr=0");
        oracle = _oracle;
        targetBalancer = _targetBalancer;
    }

    /// Anyone can call to poke the balancer after external signals (e.g., off-chain cron)
    function poke() external {
        // Forward to the time balancer to run its own interval+stablecoin checks
        try ITimeBalancerHooks(targetBalancer).triggerTimeRebalance() { } catch {}
    }
}

