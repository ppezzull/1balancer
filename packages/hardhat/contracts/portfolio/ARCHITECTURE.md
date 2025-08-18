# 1Balancer Architecture

## Contract Architecture Tree
```
BalancerFactory (Ownable)
├─ createDriftBalancer(DriftParams) → DriftBalancer
├─ createTimeBalancer(TimeParams) → TimeBalancer
└─ Chainlink Automation integration

BaseBalancer (abstract)
├─ Ownable, Pausable, ReentrancyGuard
├─ IERC1271, AutomationCompatibleInterface
├─ using PortfolioCoreLib for Asset[]
├─ using AnalysisLib for deviation checks
├─ using GridLib for order generation
├─ using LimitOrderLib for 1inch orders
└─ Core functions: fund(), withdraw(), updateAssets()

DriftBalancer : BaseBalancer
├─ constructor(DriftParams)
├─ checkUpkeep() → drift-based triggers
├─ performUpkeep() → rebalance execution
└─ updateDriftPercentage(uint256)

TimeBalancer : BaseBalancer
├─ constructor(TimeParams)
├─ checkUpkeep() → time-based triggers
├─ performUpkeep() → periodic rebalance
└─ setRebalanceInterval(uint256)

Libraries (pure/view functions)
├─ PortfolioCoreLib
│  ├─ updateAssetMapping(Asset[])
│  ├─ fundAsset(address, uint256)
│  ├─ withdrawAsset(address, uint256)
│  └─ getTotalValue(Asset[], address oracle)
├─ AnalysisLib
│  ├─ detectDeviation(AnalysisConfig, address oracle)
│  ├─ checkAssetBalance(uint256 current, uint256 target)
│  └─ calculatePortfolioMetrics(uint256 total, uint256 stable)
├─ GridLib
│  ├─ generateGridOrders(address[], GridConfig)
│  ├─ calculateGridParams(uint256 value, uint256 levels)
│  └─ isPriceWithinBounds(uint256 price, GridConfig)
└─ LimitOrderLib
   ├─ createLimitOrder(Order)
   ├─ createRebalanceOrder(Order[])
   ├─ calculateOrderHash(Order)
   └─ submitOrders(Order[], address protocol, bytes signature)

Mocks (testing only)
├─ MockERC20
│  └─ mint(address to, uint256 amount)
├─ MockLimitOrderProtocol
│  └─ fillOrder(Order, bytes signature)
└─ DiaPushOracleReceiverMock
   ├─ setMockUpdate(string key, uint128 ts, uint128 value)
   └─ updates(string key) → (uint128 ts, uint128 value)
```

## File Structure
```
portfolio/
├─ factory/BalancerFactory.sol
├─ balancers/{Base,Drift,Time}Balancer.sol  
├─ libraries/{PortfolioCore,Analysis,Grid,LimitOrder}.sol
└─ interfaces/{IBalancerFactory,IOracleAdapter,IDiaPushOracleReceiver,ILimitOrderProtocol,IERC1271}.sol
mocks/{MockERC20,MockLimitOrderProtocol,DiaPushOracleReceiverMock}.sol
```

## Math
```
V_i = balance_i · price_i          // value per asset
V_s = Σ V_i where isStable=true     // aggregate stable value (treated as 1 unit)
Δ_s = |V_s/V − T_s|                 // stable slice drift vs target
Δ_j = |V_j/V − t_j|                 // individual non-stable drift
Trigger when Δ > driftBps / 10000
D_i = t_i·V − V_i                   // desired value shift
amount_i = |D_i| / price_i          // tokens to trade
```

## Data Structures
```solidity
struct Asset {
    address token;
    uint256 percentage;    // target allocation (0-10000 bps)
    bool isStable;
}

struct AnalysisConfig {
    address[] assets;      // subset to analyze
    uint256 minDrift;      // deviation threshold (bps)
    bool isStableGroup;    // stable-specific logic
}

struct GridConfig {
    uint256 lowerBound;    // price bounds (e.g. 0.995e18)
    uint256 upperBound;    // price bounds (e.g. 1.005e18)
    uint256 capitalRatio;  // % of value to deploy (bps)
    uint256 pegPrice;      // reference price (1e18)
    uint256 nLevels;       // grid depth
}

struct Order {
    address fromToken;
    address toToken;
    uint256 amount;
    uint256 limitPrice;    // 1e18 precision
}

## Contract initialization structs

struct BaseParams {
    address owner;
    address priceFeed;
    address limitOrderProtocol;
    Asset[] assets;        // all assets (stables have isStable=true)
}

struct DriftParams {
    BaseParams base;
    uint256 driftBps;      // drift tolerance (e.g. 50 = 0.5%)
}

struct TimeParams {
    BaseParams base;
    uint256 interval;      // rebalance interval in seconds
}

struct FactoryParams {
    address linkToken;
    address automationRegistrar;
    address automationRegistry;
}
```

## Libraries
| Library | Used In | Purpose |
|---------|---------|---------|
| `PortfolioCoreLib` | BaseBalancer | Asset CRUD, funding, withdrawals, total value |
| `AnalysisLib` | DriftBalancer, TimeBalancer | Deviation checks for any asset subset (global/stables) |
| `GridLib` | BaseBalancer | Grid orders for stables + global rebalancing |
| `LimitOrderLib` | BaseBalancer | 1inch order creation & EIP-712 hashing |

## Integrations
* **1inch** – limit orders via `LimitOrderLib`
* **DIA/Chainlink** – price feeds  
* **Chainlink Automation** – drift logs + time triggers
* **EIP-1271** – contract signature validation for 1inch orders
