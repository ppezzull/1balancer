// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
 * 1Balancer StableLimit
 *
 * This contract represents a simplified “micro‑balancer” for stablecoin allocations
 * within a broader portfolio. The original 1Balancer design embeds a StableLimit
 * module into every portfolio contract to monitor stablecoin pegs and produce
 * limit orders when those pegs deviate beyond a configured tolerance. For the
 * purposes of this hackathon we implement a minimal version that illustrates
 * the core ideas without integrating the full 1inch limit order protocol.
 *
 * The contract exposes a Chainlink Automation (Keeper) compatible interface
 * consisting of `checkUpkeep` and `performUpkeep`. Off‑chain Keepers call
 * `checkUpkeep` to determine whether an action is required (i.e. a stablecoin
 * has drifted outside of its peg tolerance). When a deviation is detected
 * `performUpkeep` will emit a `LimitOrderCreated` event signalling that an
 * off‑chain relayer should create an on‑chain limit order via the 1inch API.
 *
 * A production implementation would validate signatures using EIP‑1271 and
 * sign the limit order data for the relayer. Here we simply emit the event
 * carrying the relevant parameters. The parent balancer contract can inherit
 * from this contract to gain stablecoin monitoring functionality.
 */

import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";

interface IPriceFeed {
    function latestAnswer() external view returns (int256);
}

/// @title StableLimit
/// @notice Minimal stablecoin peg monitor and limit order generator
abstract contract StableLimit is AutomationCompatibleInterface {
    /// @dev Address of the stablecoin being monitored (e.g. USDC, DAI)
    address public immutable stableToken;

    /// @dev Address of the price feed providing the stablecoin price in USD (8 decimals)
    IPriceFeed public immutable priceFeed;

    /// @dev Lower and upper bounds for acceptable price deviation (1e8 representation)
    uint256 public immutable lowerBound;
    uint256 public immutable upperBound;

    /// @dev Emitted when a limit order should be placed due to peg deviation
    event LimitOrderCreated(address indexed token, uint256 price, uint256 timestamp);

    constructor(address _stableToken, address _priceFeed, uint256 _lowerBound, uint256 _upperBound) {
        require(_lowerBound < _upperBound, "Invalid bounds");
        stableToken = _stableToken;
        priceFeed = IPriceFeed(_priceFeed);
        lowerBound = _lowerBound;
        upperBound = _upperBound;
    }

    /**
     * @notice Check if the stablecoin price is outside the acceptable range
     * @dev Called by Chainlink Automation nodes to determine if upkeep is needed
     */
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory) {
        int256 price = priceFeed.latestAnswer();
        if (price <= 0) return (false, bytes("invalid price"));
        uint256 uPrice = uint256(price);
        if (uPrice < lowerBound || uPrice > upperBound) {
            return (true, abi.encode(uPrice));
        }
        return (false, bytes("within bounds"));
    }

    /**
     * @notice Perform upkeep by emitting a limit order event when peg deviation is detected
     * @dev The encoded data should contain the current price
     */
    function performUpkeep(bytes calldata performData) external override {
        uint256 price = abi.decode(performData, (uint256));
        // Emit an event indicating that a limit order should be created.
        emit LimitOrderCreated(stableToken, price, block.timestamp);
    }
}