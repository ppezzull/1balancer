// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
 * MockPriceFeed simulates a Chainlink AggregatorV3Interface with simple
 * functionality for testing. It stores an integer answer value representing
 * the price in 8 decimals and exposes both latestAnswer() used by StableLimit
 * and latestRoundData() used by BaseBalancer. The setter function is
 * unrestricted for convenience within tests.
 */

contract MockPriceFeed {
    int256 public answer;

    constructor(int256 _answer) {
        answer = _answer;
    }

    function latestAnswer() external view returns (int256) {
        return answer;
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer_,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (0, answer, 0, block.timestamp, 0);
    }

    function setAnswer(int256 _answer) external {
        answer = _answer;
    }
}