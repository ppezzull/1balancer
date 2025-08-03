// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title FusionPlusHub Interface for Remix
 * @notice Use this with proxy address: 0x5938297bfdeeF3ac56EB4198E0B484b2A0B3adD8
 * @dev Generated interface for interacting with deployed proxy contract
 */
interface IFusionPlusHub {
    // Read Functions
    function paused() external view returns (bool);
    function protocolFee() external view returns (uint256);
    function limitOrderProtocol() external view returns (address);
    function aggregationRouter() external view returns (address);
    function escrowFactory() external view returns (address);
    function feeRecipient() external view returns (address);
    function getContractAddresses() external view returns (address, address, address);
    function getOrderStatus(bytes32 orderHash) external view returns (uint8);
    function hasRole(bytes32 role, address account) external view returns (bool);
    function getRoleAdmin(bytes32 role) external view returns (bytes32);
    function calculateFee(uint256 amount) external view returns (uint256);
    
    // Role Constants
    function DEFAULT_ADMIN_ROLE() external view returns (bytes32);
    function RESOLVER_ROLE() external view returns (bytes32);
    function OPERATOR_ROLE() external view returns (bytes32);
    function UPGRADER_ROLE() external view returns (bytes32);
    
    // Write Functions
    function createFusionPlusOrder(
        bytes32 destinationChain,
        address srcToken,
        address dstToken,
        uint256 srcAmount,
        uint256 dstAmount,
        bytes calldata orderData
    ) external returns (bytes32 orderHash);
    
    function updateOrderStatus(bytes32 orderHash, uint8 newStatus) external;
    function pause() external;
    function unpause() external;
    function setProtocolFee(uint256 _fee) external;
    function setFeeRecipient(address _recipient) external;
    function grantRole(bytes32 role, address account) external;
    function revokeRole(bytes32 role, address account) external;
    function updateContracts(
        address _limitOrderProtocol,
        address _aggregationRouter,
        address _escrowFactory
    ) external;
}

/**
 * HOW TO USE IN REMIX:
 * 1. Copy this entire file to Remix
 * 2. Compile with Solidity 0.8.x
 * 3. Go to "Deploy & Run Transactions" tab
 * 4. Select "Injected Provider - MetaMask"
 * 5. Make sure you're on BASE Sepolia network
 * 6. In "At Address" field, paste: 0x5938297bfdeeF3ac56EB4198E0B484b2A0B3adD8
 * 7. Click "At Address" button
 * 8. The interface will appear below - you can now interact!
 */
