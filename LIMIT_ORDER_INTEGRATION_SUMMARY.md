# 1Balancer Limit Order Integration System

## Overview

This document summarizes the comprehensive limit order integration system implemented for 1Balancer, which enables automated portfolio rebalancing through 1inch Limit Order Protocol with Chainlink Automation.

## Architecture

### 1. Smart Contracts (Hardhat Package)

#### Core Contracts
- **OptimizedStableLimit.sol**: Implements EIP-1271 for contract signatures and Chainlink Automation for stablecoin grid trading
- **OptimizedBaseBalancer.sol**: Abstract base contract with portfolio management and rebalancing logic
- **OptimizedDriftBalancer.sol**: Drift-based rebalancing with automatic limit order creation
- **OptimizedTimeBalancer.sol**: Time-based rebalancing with scheduled limit order generation
- **OptimizedBalancerFactory.sol**: Factory contract for creating balancer instances

#### Libraries
- **LimitOrderLib.sol**: Utilities for creating and managing 1inch limit orders
- **PortfolioCoreLib.sol**: Core portfolio management functions
- **RebalanceAnalysisLib.sol**: Portfolio drift analysis and rebalancing logic
- **StablecoinGridLib.sol**: Stablecoin grid trading algorithms

#### Interfaces
- **ILimitOrderProtocol.sol**: Interface for 1inch Limit Order Protocol
- **IERC1271.sol**: EIP-1271 signature validation interface
- **ISpotPriceAggregator.sol**: Price feed interface

#### Mock Contracts
- **MockLimitOrderProtocol.sol**: Mock implementation for testing
- **MockSpotPriceAggregator.sol**: Mock price aggregator for testing

### 2. Orchestrator Service (Express.js)

#### Services
- **BalancerEventListener**: Monitors balancer contracts for limit order events
- **OneInchOrderSubmitter**: Submits orders to 1inch API
- **OrderProcessor**: Processes order events and manages order lifecycle
- **InMemoryDatabase**: Stores order submissions and status

#### Features
- Real-time event listening for `LimitOrderCreated` and `RebalanceOrderCreated` events
- Automatic order submission to 1inch API
- Cron job for periodic order processing and status monitoring
- REST API endpoints for order management
- Graceful error handling and retry logic

### 3. Next.js Frontend Integration

#### API Routes
- **`/api/limit-orders/submit`**: Submit orders to 1inch API
- **`/api/limit-orders/status`**: Get order status from 1inch

#### React Components
- **LimitOrderManager.tsx**: React component using scaffold-eth hooks for contract interactions

## Key Features

### 1. EIP-1271 Contract Signatures
- Balancer contracts implement EIP-1271 for limit order signing
- Enables contract-based order creation without private key management
- Supports both individual and batch order signing

### 2. Chainlink Automation Integration
- Automated upkeep checks for portfolio drift detection
- Time-based rebalancing triggers
- Stablecoin depeg monitoring and grid trading

### 3. 1inch Limit Order Protocol Integration
- Full support for 1inch limit order creation and submission
- Order status monitoring and management
- Automatic order cancellation for expired orders

### 4. Portfolio Rebalancing Strategies
- **Drift-based**: Triggers rebalancing when asset allocations deviate beyond threshold
- **Time-based**: Scheduled rebalancing at fixed intervals
- **Stablecoin-specific**: Grid trading for stablecoin pairs with depeg protection

## Usage Examples

### 1. Creating a Drift Balancer
```typescript
// Using scaffold-eth hooks
const { writeAsync: createDriftBalancer } = useScaffoldContractWrite({
  contractName: 'BalancerFactory',
  functionName: 'createDriftBalancer',
});

await createDriftBalancer({
  args: [
    ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', '0x4200000000000000000000000000000000000006'], // USDC, WETH
    [40, 60], // Percentages
    ['1000000000', '1000000000000000000'], // Amounts
    5 // Drift percentage
  ],
});
```

### 2. Triggering Rebalancing
```typescript
// Manual rebalancing trigger
const { writeAsync: triggerRebalance } = useScaffoldContractWrite({
  contractName: 'DriftBalancer',
  functionName: 'triggerRebalance',
});

await triggerRebalance();
```

### 3. Submitting Orders to 1inch
```typescript
// API call to submit order
const response = await fetch('/api/limit-orders/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderHash: '0x...',
    balancerAddress: '0x...',
    sellToken: '0x...',
    buyToken: '0x...',
    sellAmount: '1000000000',
    buyAmount: '5000000000000000000'
  })
});
```

## Testing

### 1. Contract Testing
```bash
cd packages/hardhat
npx hardhat test test/LimitOrderIntegrationTest.ts
```

### 2. Orchestrator Testing
```bash
cd packages/limit-order-orchestrator
npm run test
```

### 3. Frontend Testing
```bash
cd packages/nextjs
npm run dev
```

## Deployment

### 1. Deploy Contracts
```bash
cd packages/hardhat
npx hardhat deploy --tags OptimizedContracts --network baseFork
```

### 2. Start Orchestrator
```bash
cd packages/limit-order-orchestrator
npm run dev
```

### 3. Configure Environment Variables
```env
# .env
RPC_URL=https://mainnet.base.org
CHAIN_ID=8453
ONEINCH_API_KEY=your_api_key
ONEINCH_API_URL=https://api.1inch.dev
CRON_SCHEDULE=*/5 * * * *
```

## Security Considerations

### 1. Access Control
- All balancer contracts inherit from OpenZeppelin's `Ownable`
- EIP-1271 signature validation for contract-based orders
- Role-based access control for critical functions

### 2. Reentrancy Protection
- All external calls are protected with `ReentrancyGuard`
- Checks-Effects-Interactions pattern implemented

### 3. Price Feed Security
- Chainlink price feeds for reliable price data
- Multiple price source validation
- Slippage protection mechanisms

## Monitoring and Analytics

### 1. Event Monitoring
- Real-time event listening for order creation
- Portfolio rebalancing event tracking
- Stablecoin depeg detection

### 2. Order Status Tracking
- Order submission status monitoring
- Fill rate analytics
- Failed order analysis

### 3. Performance Metrics
- Gas usage optimization
- Order execution latency
- Portfolio drift tracking

## Future Enhancements

### 1. Advanced Order Types
- Stop-loss orders
- Take-profit orders
- Trailing stop orders

### 2. Multi-Chain Support
- Cross-chain portfolio management
- Bridge integration for asset transfers
- Multi-chain order routing

### 3. Advanced Analytics
- Portfolio performance tracking
- Risk management tools
- Historical rebalancing analysis

## Conclusion

The 1Balancer Limit Order Integration System provides a comprehensive solution for automated portfolio rebalancing using 1inch Limit Order Protocol. The system combines smart contract automation with external API integration to create a robust, secure, and efficient portfolio management platform.

The modular architecture allows for easy extension and customization, while the comprehensive testing suite ensures reliability and security. The integration with scaffold-eth provides a seamless developer experience for frontend development and contract interaction. 