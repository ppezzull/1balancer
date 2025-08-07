// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/*
 * OptimizedBalancerFactory
 *
 * Optimized factory contract that deploys OptimizedDriftBalancer or OptimizedTimeBalancer
 * instances with reduced contract sizes through library usage.
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "../balancers/OptimizedDriftBalancer.sol";
import "../balancers/OptimizedTimeBalancer.sol";
import "../interfaces/ILimitOrderProtocol.sol";


contract OptimizedBalancerFactory is Ownable {
    address public priceFeed;
    address[] public stablecoins;
    ILimitOrderProtocol public limitOrderProtocol;

    constructor(address _priceFeed, address[] memory _stablecoins, address _limitOrderProtocol) Ownable(msg.sender) {
        priceFeed = _priceFeed;
        stablecoins = _stablecoins;
        limitOrderProtocol = ILimitOrderProtocol(_limitOrderProtocol);
    }

    /// @dev Lists of deployed drift and time balancers per user
    mapping(address => address[]) public userDriftBalancers;
    mapping(address => address[]) public userTimeBalancers;

    /// @dev Emitted when a new balancer is created
    event BalancerCreated(address indexed owner, address indexed balancer, bool isTimeBased);

    error NoStablecoin();

    /**
     * @notice Create a new OptimizedDriftBalancer
     */
    function createDriftBalancer(
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        uint256[] memory _amounts,
        uint256 _driftPercentage
    ) external returns (address balancer) {

        // _checkUserTokenBalance(_assetAddresses, _amounts);

        balancer = address(new OptimizedDriftBalancer(
            msg.sender, 
            address(this), 
            _assetAddresses, 
            _percentages, 
            _driftPercentage, 
            stablecoins,
            address(limitOrderProtocol)
        ));

        _sendTokensToBalancer(balancer, _assetAddresses, _amounts);
        userDriftBalancers[msg.sender].push(balancer);
        emit BalancerCreated(msg.sender, balancer, false);
    }

    /**
     * @notice Create a new OptimizedTimeBalancer
     */
    function createTimeBalancer(
        address[] memory _assetAddresses,
        uint256[] memory _percentages,
        uint256[] memory _amounts,
        uint256 interval
    ) external returns (address balancer) {
        _checkUserTokenBalance(_assetAddresses, _amounts);
        // _requireAtLeastOneStablecoin(_assetAddresses);

        balancer = address(new OptimizedTimeBalancer(
            msg.sender, 
            address(this), 
            _assetAddresses, 
            _percentages, 
            interval, 
            stablecoins,
            address(limitOrderProtocol)
        ));

        _sendTokensToBalancer(balancer, _assetAddresses, _amounts);
        userTimeBalancers[msg.sender].push(balancer);
        emit BalancerCreated(msg.sender, balancer, true);
    }

    /**
     * @notice Internal function to send tokens to a newly created balancer
     */
    function _sendTokensToBalancer(address balancer, address[] memory tokens, uint256[] memory amounts) internal {
        require(tokens.length == amounts.length, "Tokens and amounts length mismatch");
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20(tokens[i]).transferFrom(msg.sender, balancer, amounts[i]);
        }
    }

    /**
     * @notice Internal function to check if the asset addresses contain at least one stablecoin
     * @dev This function is not used in the current implementation as the stablecoins adressess will be hardcoded in the factory
     */
    // function _requireAtLeastOneStablecoin(address[] memory _assetAddresses) internal view {
    //     for (uint i = 0; i < _assetAddresses.length; i++) {
    //         for (uint j = 0; j < stablecoins.length; j++) {
    //             if (_assetAddresses[i] == stablecoins[j]) {
    //                 return;
    //             }
    //         }
    //     }
    //     revert NoStablecoin();
    // }

    function _checkUserTokenBalance(address[] memory tokens, uint256[] memory amounts) internal view {
        require(tokens.length == amounts.length, "Tokens and amounts length mismatch");
        for (uint256 i = 0; i < tokens.length; i++) {
            require(IERC20(tokens[i]).balanceOf(msg.sender) >= amounts[i], "Insufficient token balance in factory");
        }
    }
} 