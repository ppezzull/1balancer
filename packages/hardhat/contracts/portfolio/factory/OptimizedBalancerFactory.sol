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
import "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";

// ===== Programmatic Upkeep Registration (file-level types) =====
// Minimal interfaces based on Chainlink docs
// https://docs.chain.link/chainlink-automation/guides/register-upkeep-in-contract
struct RegistrationParams {
    string name;
    bytes encryptedEmail;
    address upkeepContract;
    uint32 gasLimit;
    address adminAddress;
    uint8 triggerType; // 0 = conditional, 1 = log
    bytes checkData; // forwarded to checkUpkeep
    bytes triggerConfig; // 0x for conditional
    bytes offchainConfig; // optional CBOR config
    uint96 amount; // LINK amount (in wei) to fund at registration
}

interface IAutomationRegistrar {
    function registerUpkeep(RegistrationParams calldata requestParams) external returns (uint256);
}

// Minimal registry interface for reading the Forwarder
interface IAutomationRegistryMinimal {
    function getForwarder(uint256 upkeepId) external view returns (address);
}


contract OptimizedBalancerFactory is Ownable {
    address public priceFeed;
    address[] public stablecoins;
    ILimitOrderProtocol public limitOrderProtocol;

    // ===== Chainlink Automation (programmatic registration) =====
    LinkTokenInterface public linkToken;
    address public automationRegistrar; // Automation Registrar (v2.1)
    address public automationRegistry; // Automation Registry (v2.1)

    // balancer => upkeepId (if registered via this factory)
    mapping(address => uint256) public balancerToUpkeepId;

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
    event PriceFeedUpdated(address priceFeed);
    event AutomationAddressesSet(address linkToken, address registrar, address registry);
    event UpkeepRegistered(address indexed balancer, uint256 indexed upkeepId, address forwarder);

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

    function setPriceFeed(address _priceFeed) external onlyOwner {
        priceFeed = _priceFeed;
        emit PriceFeedUpdated(_priceFeed);
    }

    // Note: public dynamic array `stablecoins` already exposes `stablecoins(uint256)` getter

    // ===== Programmatic Upkeep Registration =====

    function setAutomationAddresses(address _linkToken, address _registrar, address _registry) external onlyOwner {
        linkToken = LinkTokenInterface(_linkToken);
        automationRegistrar = _registrar;
        automationRegistry = _registry;
        emit AutomationAddressesSet(_linkToken, _registrar, _registry);
    }

    /// @notice Programmatically register a custom-logic upkeep for a deployed balancer
    /// @dev Approves LINK to registrar and calls registerUpkeep. Optionally sets forwarder if registry is provided.
    function registerBalancerUpkeep(
        address balancer,
        uint32 gasLimit,
        uint96 amountLinkWei,
        bytes calldata checkData
    ) external onlyOwner returns (uint256 upkeepId) {
        require(balancer != address(0), "balancer=0");
        require(address(linkToken) != address(0) && automationRegistrar != address(0), "Automation not set");

        // 1) Approve LINK to the registrar
        linkToken.approve(automationRegistrar, amountLinkWei);

        // 2) Build params and register
        RegistrationParams memory params = RegistrationParams({
            name: string(abi.encodePacked("1Balancer-", _shortAddr(balancer))),
            encryptedEmail: bytes("") /* 0x */, 
            upkeepContract: balancer,
            gasLimit: gasLimit,
            adminAddress: owner(),
            triggerType: 0, // conditional
            checkData: checkData,
            triggerConfig: bytes("") /* 0x */, 
            offchainConfig: bytes("") /* 0x */, 
            amount: amountLinkWei
        });

        upkeepId = IAutomationRegistrar(automationRegistrar).registerUpkeep(params);
        require(upkeepId != 0, "Registrar returned 0");
        balancerToUpkeepId[balancer] = upkeepId;

        // 3) If registry is set, fetch forwarder and set it on the balancer
        address forwarder = address(0);
        if (automationRegistry != address(0)) {
            try IAutomationRegistryMinimal(automationRegistry).getForwarder(upkeepId) returns (address fwd) {
                forwarder = fwd;
                try OptimizedDriftBalancer(payable(balancer)).setForwarderAddress(forwarder) {} catch {}
            } catch {}
        }

        emit UpkeepRegistered(balancer, upkeepId, forwarder);
    }

    /// @notice Refresh and set the forwarder on a balancer from a known upkeepId
    function refreshBalancerForwarder(address balancer) external {
        uint256 upkeepId = balancerToUpkeepId[balancer];
        require(upkeepId != 0 && automationRegistry != address(0), "No upkeep or registry");
        address forwarder = IAutomationRegistryMinimal(automationRegistry).getForwarder(upkeepId);
        OptimizedDriftBalancer(payable(balancer)).setForwarderAddress(forwarder);
        emit UpkeepRegistered(balancer, upkeepId, forwarder);
    }

    function _shortAddr(address a) internal pure returns (string memory) {
        bytes20 b = bytes20(a);
        bytes memory out = new bytes(4);
        out[0] = b[18];
        out[1] = b[19];
        out[2] = b[0];
        out[3] = b[1];
        return string(out);
    }
} 