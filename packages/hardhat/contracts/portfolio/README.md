# Portfolio Management Contracts

This directory contains the 1Balancer core business logic for portfolio management. The system is designed for modularity, capital efficiency, and high composability using inheritance and separation of concerns.

---

## 🚀 Optimized Architecture with 1inch Limit Order Integration

The system has been fully optimized and upgraded to integrate with the 1inch Limit Order Protocol for automated portfolio rebalancing. This enables:

- **EIP-1271 Smart Contract Signatures**: Balancers can sign limit orders directly
- **Automated Order Creation**: Portfolio drift triggers automatic limit order generation
- **Stablecoin Grid Trading**: Dedicated stablecoin rebalancing with Chainlink Automation
- **Event-Driven Architecture**: Real-time event emission for order tracking

### Key Components:

1. **OptimizedBalancerFactory**: Deploys optimized balancer instances with limit order protocol integration
2. **OptimizedStableLimit**: EIP-1271 compatible stablecoin grid trading module
3. **OptimizedBaseBalancer**: Core portfolio management with rebalancing logic
4. **LimitOrderLib**: 1inch limit order utilities and order creation
5. **Mock Contracts**: Testing infrastructure for price feeds and limit order protocol

---

## 📁 Contract Structure

### Libraries (`libraries/`)
- **LimitOrderLib.sol**: 1inch limit order utilities, order creation, and signature handling
- **StablecoinGridLib.sol**: Stablecoin grid trading algorithms
- **PortfolioCoreLib.sol**: Core portfolio management functions
- **PortfolioAnalysisLib.sol**: Portfolio analysis and drift detection

### Balancers (`balancers/`)
- **OptimizedDriftBalancer.sol**: Value-based rebalancing with drift detection
- **OptimizedTimeBalancer.sol**: Time-based rebalancing with configurable intervals

### Modules (`modules/`)
- **OptimizedBaseBalancer.sol**: Abstract base contract with shared portfolio logic
- **OptimizedStableLimit.sol**: EIP-1271 compatible stablecoin management

### Factory (`factory/`)
- **OptimizedBalancerFactory.sol**: Factory for deploying optimized balancer instances

### Interfaces (`interfaces/`)
- **ILimitOrderProtocol.sol**: 1inch Limit Order Protocol interface
- **IERC1271.sol**: EIP-1271 signature validation interface
- **ISpotPriceAggregator.sol**: Price feed interface
- **IBalancerFactory.sol**: Factory interface

### Mocks (`mocks/`)
- **MockSpotPriceAggregator.sol**: Mock price feed for testing
- **MockLimitOrderProtocol.sol**: Mock 1inch limit order protocol
- **MockERC20.sol**: Mock ERC20 token for testing

---

## 🧪 Testing Event Emissions

### Quick Start for Event Testing

1. **Deploy Contracts**:
```bash
cd packages/hardhat
npx hardhat deploy --tags OptimizedContracts --network baseFork
```

2. **Run Event Emission Test**:
```bash
npx hardhat test test/balancer/EventEmissionTest.ts
```

3. **Run Demonstration Script**:
```bash
npx hardhat run scripts/demonstrateEventEmissions.ts --network baseFork
```

### Event Types Tested

#### Balancer Creation Events
- `BalancerCreated`: Emitted when new balancer instances are created
- Parameters: `balancerAddress`, `owner`, `balancerType`

#### Rebalancing Events
- `PortfolioRebalanceTriggered`: Emitted when portfolio rebalancing is triggered
- Parameters: `timestamp`, `totalValue`, `driftPercentage`

#### Order Creation Events
- `RebalanceOrderCreated`: Emitted when rebalancing orders are created
- Parameters: `orderHash`, `sellToken`, `buyToken`, `sellAmount`, `buyAmount`
- `LimitOrderCreated`: Emitted when limit orders are created
- Parameters: `orderHash`, `maker`, `sellToken`, `buyToken`

#### Stablecoin Grid Events
- `LimitOrderCreated`: Emitted for stablecoin grid trading orders
- Parameters: `orderHash`, `maker`, `sellToken`, `buyToken`

---

## 🔧 Price Manipulation Testing

The system includes comprehensive price manipulation testing to verify event emissions:

### Token Addresses (Base Mainnet)
```solidity
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDT = "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2";
const DAI = "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb";
const WETH = "0x4200000000000000000000000000000000000006";
const INCH = "0xc5fecC3a29Fb57B5024eEc8a2239d4621e111CBE";
```

### Price Manipulation Scenarios
1. **WETH Price Increase**: $3000 → $5000 to trigger portfolio drift
2. **USDT Stablecoin Drift**: $1.00 → $1.02 to trigger stablecoin rebalancing
3. **INCH Price Drop**: $0.50 → $0.30 to test downside protection

---

## 📊 Event Emission Verification

### Test Coverage
- ✅ **Balancer Creation**: Verify `BalancerCreated` events
- ✅ **Price Manipulation**: Test drift detection and event emission
- ✅ **Rebalancing Triggers**: Verify `PortfolioRebalanceTriggered` events
- ✅ **Order Creation**: Test `RebalanceOrderCreated` and `LimitOrderCreated` events
- ✅ **Stablecoin Grid**: Verify stablecoin grid order events
- ✅ **Time-Based Rebalancing**: Test time-triggered rebalancing events
- ✅ **Event Data Verification**: Validate event parameters and data integrity
- ✅ **Error Handling**: Test graceful handling of invalid scenarios

### Event Data Structure
```typescript
// BalancerCreated Event
{
  balancerAddress: string,
  owner: string,
  balancerType: string
}

// PortfolioRebalanceTriggered Event
{
  timestamp: number,
  totalValue: BigNumber,
  driftPercentage: number
}

// RebalanceOrderCreated Event
{
  orderHash: string,
  sellToken: string,
  buyToken: string,
  sellAmount: BigNumber,
  buyAmount: BigNumber
}

// LimitOrderCreated Event
{
  orderHash: string,
  maker: string,
  sellToken: string,
  buyToken: string
}
```

---

## 🚀 Deployment Scripts

### Essential Deployment Files
- **`deploy/balancer/03_deploy_optimized_contracts.ts`**: Main deployment script for optimized contracts
- **`test/balancer/EventEmissionTest.ts`**: Comprehensive event emission testing
- **`scripts/demonstrateEventEmissions.ts`**: Demonstration script for event testing

### Deployment Process
1. Deploy mock contracts (price aggregator, limit order protocol)
2. Deploy optimized balancer factory
3. Configure initial prices for Base mainnet tokens
4. Verify price configuration
5. Test balancer creation and event emissions

---

## 🔗 Integration with 1inch Protocol

### EIP-1271 Implementation
The `OptimizedStableLimit` contract implements EIP-1271 to enable smart contract signature validation:

```solidity
function isValidSignature(bytes32 _hash, bytes memory _signature) 
    external view override returns (bytes4 magicValue)
```

### Limit Order Creation
The system creates 1inch-compatible limit orders with:
- **Maker Traits**: Order parameters and flags
- **Taker Traits**: Filling parameters and interactions
- **Order Hash**: EIP-712 compliant order hashing
- **Signature**: EIP-1271 smart contract signatures

---

## 📈 Performance Optimizations

### Contract Size Reduction
- **Library Extraction**: Common logic moved to dedicated libraries
- **Modular Design**: Separation of concerns across specialized contracts
- **Gas Optimization**: High optimization settings (100,000 runs)
- **IR-Based Compilation**: Via IR for complex contract structures

### Event Efficiency
- **Targeted Events**: Only essential data emitted
- **Gas-Efficient Logging**: Optimized event parameter selection
- **Batch Processing**: Multiple events in single transactions

---

## 🛠️ Development Commands

### Compilation
```bash
npx hardhat compile
```

### Testing
```bash
# Run all tests
npx hardhat test

# Run specific event emission test
npx hardhat test test/balancer/EventEmissionTest.ts

# Run with gas reporting
REPORT_GAS=true npx hardhat test
```

### Deployment
```bash
# Deploy to local fork
npx hardhat deploy --tags OptimizedContracts --network baseFork

# Deploy to Base mainnet
npx hardhat deploy --tags OptimizedContracts --network base
```

### Demonstration
```bash
# Run event emission demonstration
npx hardhat run scripts/demonstrateEventEmissions.ts --network baseFork
```

---

## 📋 System Requirements

- **Hardhat**: Development and testing framework
- **Ethers.js**: Ethereum interaction library
- **Chai**: Testing framework
- **Base Network**: Target deployment network
- **1inch Protocol**: Limit order integration
- **Chainlink Automation**: Automated rebalancing triggers

---

## 🎯 Next Steps

1. **Event Monitoring**: Set up event listeners for production monitoring
2. **Order Execution**: Integrate with 1inch API for order fulfillment
3. **Gas Optimization**: Further optimize contract gas usage
4. **Security Audits**: Comprehensive security review
5. **Production Deployment**: Mainnet deployment with real tokens

---

*This system provides a complete automated portfolio management solution with real-time event emission for monitoring and order tracking.*
