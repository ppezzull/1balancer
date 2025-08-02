// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/*
 * BalancerFactory
 *
 * A simple factory contract that deploys DriftBalancer or TimeBalancer
 * instances directly. Each user may create multiple balancers depending
 * on their strategy. The factory keeps track of created balancers and
 * emits an event upon deployment. Deployed balancers are owned by the
 * caller and initialized with custom portfolio parameters during creation.
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "../balancers/MinimalDriftBalancer.sol";
import "../balancers/MinimalTimeBalancer.sol";

contract BalancerFactory is Ownable {
    address public priceFeed;
    address[] public stablecoins;

    constructor(address _priceFeed, address[] memory _stablecoins) Ownable(msg.sender) {
        priceFeed = _priceFeed;
        stablecoins = _stablecoins;
    }
    /// @dev Lists of deployed drift and time balancers per user
    mapping(address => address[]) public userDriftBalancers;
    mapping(address => address[]) public userTimeBalancers;

    /// @dev Emitted when a new balancer is created
    event BalancerCreated(address indexed owner, address indexed balancer, bool isTimeBased);

    error NoStablecoin();

    /**
     * @notice Create a new DriftBalancer
     * @param _assetAddresses The addresses of the assets in the portfolio
     * @param _percentages The percentages of the assets in the portfolio
     * @param _amounts The amounts of the assets to send to the balancer
     * @param _driftPercentage The percentage of drift allowed
     */
    function createDriftBalancer(
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        uint256[] memory _amounts,
        uint256 _driftPercentage
    ) external returns (address balancer) {
        _checkUserTokenBalance(_assetAddresses, _amounts);
        _requireAtLeastOneStablecoin(_assetAddresses);

        balancer = address(new MinimalDriftBalancer(msg.sender, address(this), _assetAddresses, _percentages, _driftPercentage, stablecoins));

        _sendTokensToBalancer(balancer, _assetAddresses, _amounts);
        userDriftBalancers[msg.sender].push(balancer);
        emit BalancerCreated(msg.sender, balancer, false);
    }

    /**
     * @notice Create a new TimeBalancer
     * @param _assetAddresses The addresses of the assets in the portfolio
     * @param _percentages The percentages of the assets in the portfolio
     * @param _amounts The amounts of the assets to send to the balancer
     * @param interval Rebalance interval in seconds
     */
    function createTimeBalancer(
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        uint256[] memory _amounts,
        uint256 interval
    ) external returns (address balancer) {
        _checkUserTokenBalance(_assetAddresses, _amounts);
        _requireAtLeastOneStablecoin(_assetAddresses);

        balancer = address(new MinimalTimeBalancer(msg.sender, address(this), _assetAddresses, _percentages, interval, stablecoins));

        _sendTokensToBalancer(balancer, _assetAddresses, _amounts);
        userTimeBalancers[msg.sender].push(balancer);
        emit BalancerCreated(msg.sender, balancer, true);
    }

    /**
     * @notice Internal function to send tokens to a newly created balancer
     * @param balancer The address of the balancer contract
     * @param tokens The addresses of the tokens to send
     * @param amounts The amounts of the tokens to send
     */
    function _sendTokensToBalancer(address balancer, address[] memory tokens, uint256[] memory amounts) internal {
        require(tokens.length == amounts.length, "Tokens and amounts length mismatch");
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20(tokens[i]).transferFrom(msg.sender, balancer, amounts[i]);
        }
    }

    function _requireAtLeastOneStablecoin(address[] memory _assetAddresses) internal view {
        for (uint i = 0; i < _assetAddresses.length; i++) {
            for (uint j = 0; j < stablecoins.length; j++) {
                if (_assetAddresses[i] == stablecoins[j]) {
                    return;
                }
            }
        }
        revert NoStablecoin();
    }

    function _checkUserTokenBalance(address[] memory tokens, uint256[] memory amounts) internal view {
        require(tokens.length == amounts.length, "Tokens and amounts length mismatch");
        for (uint256 i = 0; i < tokens.length; i++) {
            require(IERC20(tokens[i]).balanceOf(msg.sender) >= amounts[i], "Insufficient token balance in factory");
        }
    }
}
