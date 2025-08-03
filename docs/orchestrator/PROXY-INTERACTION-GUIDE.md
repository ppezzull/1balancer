# 🔍 Proxy Contract Interaction Guide

## Understanding Proxy Contracts

When you deploy an upgradeable contract using OpenZeppelin's proxy pattern, you get:
- **Proxy Contract**: The address users interact with (e.g., `0x5938297bfdeeF3ac56EB4198E0B484b2A0B3adD8`)
- **Implementation Contract**: Where your actual code lives (e.g., `0x69D9f549E19a3FCF77F02a39363698cc5fFDf1E7`)

## Why You Can't See Code on Explorers

Block explorers (BaseScan, Etherscan) show only the minimal proxy bytecode by default. Your actual Solidity code is in the implementation contract.

## How to View Your Contract Code

### ⚠️ BaseScan Limitations (2025)
BaseScan Sepolia currently has known issues:
- "Contract ABI" section often missing for proxies
- "Write as Proxy" feature frequently unavailable
- Verification process can be buggy

### Method 1: View Implementation Contract
The implementation address contains your actual code, but BaseScan might not show the ABI properly.
```
https://sepolia.basescan.org/address/0x69D9f549E19a3FCF77F02a39363698cc5fFDf1E7
```

### Method 2: Use Our Tools (Recommended)
```bash
# View all functions and generate ABI file
make proxy-view NETWORK=baseSepolia CONTRACT=FusionPlusHub

# Get current interaction methods
make proxy-help NETWORK=baseSepolia CONTRACT=FusionPlusHub

# Generate Remix interface for easy interaction
make proxy-remix NETWORK=baseSepolia CONTRACT=FusionPlusHub
```

## How to Interact with Proxy Contracts

### Method 1: Command Line (Recommended)
```bash
# Read functions (no gas required)
make proxy-call NETWORK=baseSepolia CONTRACT=FusionPlusHub FUNCTION=paused
make proxy-call NETWORK=baseSepolia CONTRACT=FusionPlusHub FUNCTION=protocolFee
make proxy-call NETWORK=baseSepolia CONTRACT=FusionPlusHub FUNCTION=getContractAddresses

# Write functions (requires gas) - coming soon
make proxy-write NETWORK=baseSepolia CONTRACT=FusionPlusHub FUNCTION=pause
```

### Method 2: Remix IDE (Best Alternative to BaseScan)
Since BaseScan's proxy features are limited:
1. Run `make proxy-remix NETWORK=baseSepolia CONTRACT=FusionPlusHub`
2. Open https://remix.ethereum.org
3. Create new file and paste the generated interface
4. Compile the contract
5. Go to "Deploy & Run Transactions" tab
6. Select "Injected Provider - MetaMask"
7. Paste proxy address in "At Address" field: `0x5938297bfdeeF3ac56EB4198E0B484b2A0B3adD8`
8. Click "At Address" - now you can interact with all functions!

### Method 3: In Your Code
```javascript
// Using Hardhat
const FusionPlusHub = await ethers.getContractAt(
  "FusionPlusHub",  // Contract name
  "0x5938297bfdeeF3ac56EB4198E0B484b2A0B3adD8"  // Proxy address
);

// Call any function
const isPaused = await FusionPlusHub.paused();
const fee = await FusionPlusHub.protocolFee();
```

### Method 4: Using Ethers.js Directly
```javascript
// Load ABI from deployment file
const deployment = require('./deployments/baseSepolia/FusionPlusHub.json');

// Create contract instance
const contract = new ethers.Contract(
  deployment.address,  // Proxy address
  deployment.abi,      // Implementation ABI
  provider
);

// Use the contract
const result = await contract.protocolFee();
```

## Available Functions

### Read Functions (No Gas)
- `paused()` - Check if contract is paused
- `protocolFee()` - Get current protocol fee (in basis points)
- `getContractAddresses()` - Get integrated contract addresses
- `hasRole(role, account)` - Check if account has specific role
- `getOrderStatus(orderHash)` - Check order status

### Write Functions (Requires Gas)
- `createFusionPlusOrder(...)` - Create cross-chain swap order
- `updateOrderStatus(...)` - Update order status
- `pause()/unpause()` - Emergency controls
- `grantRole()/revokeRole()` - Access control
- `setProtocolFee()` - Update fee (admin only)

## Quick Reference

```bash
# Check deployment status
make deploy-base-status

# View proxy details
make proxy-view NETWORK=baseSepolia CONTRACT=FusionPlusHub

# Call read functions
make proxy-call NETWORK=baseSepolia CONTRACT=FusionPlusHub FUNCTION=paused
make proxy-call NETWORK=baseSepolia CONTRACT=FusionPlusHub FUNCTION=protocolFee

# Get implementation address
make proxy-impl NETWORK=baseSepolia CONTRACT=FusionPlusHub
```

## Troubleshooting

### "Cannot read contract"
- Make sure you're using the proxy address, not implementation
- Check that you're on the correct network

### "Function not found"
- View available functions with `make proxy-view`
- Check function name spelling and case sensitivity

### "Call revert exception"
- Contract might be paused
- You might need specific permissions (roles)
- Function might require different arguments

## Advanced: Verify Proxy on Explorer

To make the proxy show functions on BaseScan:
1. Verify the implementation contract first
2. Go to proxy address on BaseScan
3. Click "More Options" → "Is this a proxy?"
4. Follow the verification wizard
5. Link to your implementation contract

This will make the proxy page show all your functions directly!