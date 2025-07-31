// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IHTLCManager
 * @author 1Balancer Team
 * @notice Interface for the HTLC Manager contract
 */
interface IHTLCManager {
    // -- Structs --
    struct HTLC {
        address maker;
        address taker;
        address token;
        uint256 amount;
        bytes32 hashlock;
        uint256 timelock;
        bool withdrawn;
        bool refunded;
        bytes32 secret;
    }

    // -- Events --
    event HTLCCreated(
        bytes32 indexed htlcId,
        address indexed maker,
        address indexed taker,
        address token,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock
    );
    
    event HTLCWithdrawn(bytes32 indexed htlcId, bytes32 secret);
    event HTLCRefunded(bytes32 indexed htlcId);

    // -- Functions --
    function createHTLC(
        address _taker,
        address _token,
        uint256 _amount,
        bytes32 _hashlock,
        uint256 _timelock
    ) external returns (bytes32 htlcId);

    function withdraw(bytes32 _htlcId, bytes32 _secret) external;
    
    function refund(bytes32 _htlcId) external;
    
    function getHTLC(bytes32 _htlcId) external view returns (HTLC memory);
    
    function canWithdraw(bytes32 _htlcId) external view returns (bool);
    
    function canRefund(bytes32 _htlcId) external view returns (bool);
}