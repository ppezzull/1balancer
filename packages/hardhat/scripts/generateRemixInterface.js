require('../env.config');
const fs = require('fs');
const path = require('path');

async function main() {
  const network = process.argv[2] || 'baseSepolia';
  const contractName = process.argv[3] || 'FusionPlusHub';
  
  console.log('\n🎨 GENERATING REMIX INTERFACE');
  console.log('════════════════════════════════════════════════════════════');
  
  // Load deployment
  const deploymentPath = path.join(__dirname, '..', 'deployments', network, `${contractName}.json`);
  if (!fs.existsSync(deploymentPath)) {
    console.error(`❌ No deployment found for ${contractName} on ${network}`);
    return;
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  
  // Generate simplified interface
  const interfaceContent = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ${contractName} Interface for Remix
 * @notice Use this with proxy address: ${deployment.address}
 * @dev Generated interface for interacting with deployed proxy contract
 */
interface I${contractName} {
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
 * 6. In "At Address" field, paste: ${deployment.address}
 * 7. Click "At Address" button
 * 8. The interface will appear below - you can now interact!
 */
`;
  
  // Save interface file
  const outputPath = path.join(__dirname, '..', 'exports');
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  
  const interfacePath = path.join(outputPath, `${contractName}_Remix_Interface.sol`);
  fs.writeFileSync(interfacePath, interfaceContent);
  
  console.log('✅ Remix interface generated!');
  console.log(`📄 File: exports/${contractName}_Remix_Interface.sol`);
  console.log('');
  console.log('📋 QUICK STEPS FOR REMIX:');
  console.log('1. Open https://remix.ethereum.org');
  console.log('2. Create new file in contracts folder');
  console.log('3. Copy contents from the generated file above');
  console.log('4. Compile the interface');
  console.log('5. Deploy tab → At Address → Paste proxy address');
  console.log(`   ${deployment.address}`);
  console.log('6. Click "At Address" - done!');
  console.log('');
}

main().catch(console.error);