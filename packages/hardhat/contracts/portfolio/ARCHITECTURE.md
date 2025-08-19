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
├─ using OrderGridLib for order generation
├─ using LimitOrderLib for 1inch orders
└─ Core functions: fund(), withdraw(), updateAssets()

DriftBalancer : BaseBalancer
├─ constructor(DriftParams)
├─ checkUpkeep() → drift-based triggers
├─ performUpkeep() → rebalance execution
└─ updateDriftPercentage(uint256)

TimeBalancer : BaseBalancer
├─ constructor(TimeParams)
├─ checkUpkeep() → time-based global rebalance trigger OR stable deviation logger
├─ performUpkeep() → periodic global rebalance OR generate & execute stable rebalance orders
└─ setRebalanceInterval(uint256)

## Chainlink Automation — Upkeep behavior

This section documents the high-level Chainlink Automation (Upkeep) semantics implemented by the balancers. Both balancers expose the same automation contract interface (`checkUpkeep` and `performUpkeep`) but implement different trigger logic and actions.

checkUpkeep() → (bool upkeepNeeded, bytes performData)
- Purpose: cheaply inspect current state and return whether an upkeep is required and a compact `performData` payload describing the action.
- `performData` shape (high-level): { actionType, assetAddresses[], encodedAmounts[], metadata }
    - actionType examples: GLOBAL_REBALANCE, STABLE_REBALANCE, NOOP
    - metadata can include encoded timestamps, drift values, or grid params required by `performUpkeep`.

performUpkeep(bytes performData) → executes the requested action
- Purpose: called by Chainlink when `upkeepNeeded == true`; decodes `performData` and runs the corresponding rebalance flow (order generation + submission).

DriftBalancer automation
- checkUpkeep behaviour:
    - Runs two deviation checks in the same call: (1) stable deviation check and (2) global deviation check across all assets.
    - Stable deviation check uses a fixed constant drift of 0.01 (1%). If pairwise stable deviations exceed 0.01 the balancer sets `upkeepNeeded` and returns `performData` with actionType = STABLE_REBALANCE and the list of affected stable tokens.
    - Global deviation check uses the owner-configured global drift (driftBps). When the maximum asset deviation (including the aggregated stable slice) exceeds the configured global drift threshold the balancer sets `upkeepNeeded` and returns `performData` with actionType = GLOBAL_REBALANCE and all asset addresses.
    - If both stable and global triggers are active in the same call the balancer prefers the stable rebalance action first (STABLE_REBALANCE) — stable fixes are cheaper and localized.

- performUpkeep behaviour:
    - STABLE_REBALANCE: generates stable-only orders (grid or limit orders) using `OrderGridLib` + `LimitOrderLib` and submits them to the configured `limitOrderProtocol`.
    - GLOBAL_REBALANCE: generates rebalance orders that move every asset toward its target allocation (the stable slice is treated as a single aggregated asset in these calculations). Orders are created via `LimitOrderLib` (or as a sequence of limit orders) and submitted.

TimeBalancer automation
- checkUpkeep behaviour:
    - Time trigger: checks whether the configured interval has elapsed since the last global rebalance. If so, set `upkeepNeeded` and return `performData` with actionType = GLOBAL_REBALANCE and parameters required to reset allocations perfectly.
    - Stable logger: in the same `checkUpkeep` the contract also runs the stable deviation check (fixed 0.01 threshold). If stable deviation is detected it sets `upkeepNeeded` and returns `performData` with actionType = STABLE_REBALANCE. The stable logger path is used to generate stable rebalance orders without affecting the global time-scheduled reset.

- performUpkeep behaviour:
    - GLOBAL_REBALANCE (time-triggered): performs a deterministic, full rebalance that resets asset proportions to their configured targets (uses aggregated stable slice for calculations). This is intended to be an authoritative, owner-intended reset and may generate a larger set of orders.
    - STABLE_REBALANCE (log-triggered): identical to DriftBalancer's stable flow — generate stable-only orders and submit.

Notes
- The balancers treat stablecoins as a single aggregated slice (V_s) when computing global rebalance deltas; stable-specific logic (pairwise checking and grid generation) still operates at the individual stable token level when creating orders.
- `performData` is intentionally compact to minimize on-chain gas in `checkUpkeep` and is decoded in `performUpkeep` to perform heavier computations (order generation, hashing, submission).
- Order creation and submission always use `LimitOrderLib` (EIP-712 hashing + protocol interaction) and may reference `OrderGridLib` for grid-based stable deployments.

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
├─ OrderGridLib
│  ├─ generateGridOrders(address[], OrderGridConfig)
│  ├─ calculateGridParams(uint256 value, uint256 levels)
│  └─ isPriceWithinBounds(uint256 price, OrderGridConfig)
└─ LimitOrderLib
   ├─ createLimitOrder(Order)
   ├─ createRebalanceOrder(Order[])
   ├─ calculateOrderHash(Order)
   └─ submitOrders(Order[], address protocol, bytes signature)

### Mocks

The repository includes three testing mocks used by deploy helpers and unit/integration tests. Below are their roles and explicit file references where they are instantiated or wired in the test/deploy helpers.

├─ MockERC20
│  ├─ Role: Generic ERC-20 test token with mint/burn and configurable decimals. Used to seed balances, simulate approvals and transfers during tests.
│  ├─ Used for: `PortfolioCoreLib` (fund/withdraw tests), `OrderGridLib` (order sizing/allocation tests), `LimitOrderLib` (maker/taker balance & allowance tests).
│
├─ MockLimitOrderProtocol
│  ├─ Role: Mock implementation of `ILimitOrderProtocol` that records orders and emits fill events to simulate the 1inch limit-order protocol during tests.
│  ├─ Used for: `LimitOrderLib` (order submission, hashing and fill flows), and integration tests where the balancer submits orders to the protocol.
│
└─ DiaPushOracleReceiverMock
    ├─ Role: Deterministic oracle stub that supports `setMockUpdate` / `updates` so tests can control price values used for valuation and deviation detection.
    ├─ Used for: `AnalysisLib` (detectDeviation / calculatePortfolioMetrics), `PortfolioCoreLib` (getTotalValue tests), `OrderGridLib` (price/peg inputs for grid generation), and test setups that need deterministic prices for slippage/limit pricing

```

## File Structure
```
portfolio/
├─ factory/BalancerFactory.sol
├─ balancers/{Base,Drift,Time}Balancer.sol
├─ libraries/PortfolioCore.sol
├─ libraries/Analysis.sol
├─ libraries/OrderGrid.sol
├─ libraries/LimitOrderLib.sol          
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

struct OrderGridConfig {
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
| `AnalysisLib` | DriftBalancer, TimeBalancer | Deviation checks across all assets; supports an aggregated stable slice |
| `OrderGridLib` | BaseBalancer | Grid orders for stables + global rebalancing |
| `LimitOrderLib` | BaseBalancer | 1inch order creation & EIP-712 hashing |

## Integrations
* **1inch** – limit orders via `LimitOrderLib`
* **DIA/Chainlink** – price feeds  
* **Chainlink Automation** – drift logs + time triggers
* **EIP-1271** – contract signature validation for 1inch orders

## Key concepts

- Global rebalance — bring the whole portfolio back to target allocations across all assets. Stablecoins are aggregated and counted as a single slice (one unit) when computing required shifts. It can be triggered either by time (interval) or by drift (max deviation across assets). When triggered the balancer will generate orders (grid or rebalance orders) to move assets toward their targets.

- Stable rebalance — monitors only the aggregated stable slice. It uses a fixed drift threshold of 0.01 (1e-2, i.e. 1%) as the trigger. When pairwise stable deviations exceed 0.01 the contract emits an event and will generate & submit orders to rebalance the affected stable tokens.

## Cost & Gas Optimization Considerations

The architecture deliberately exposes several tunable levers to minimize upkeep frequency and on-chain gas per execution while preserving portfolio tracking quality.

### 1. Frequency Control
- Drift Threshold (`driftBps`): Increasing driftBps reduces global rebalance frequency; adaptive bands can widen during low volatility and tighten after large moves.
- Time Interval (TimeBalancer): Lengthening (e.g. weekly → bi-weekly) directly scales global time-triggered upkeeps down.
- Stable Cooldown: Optional minimum elapsed time (or blocks) after a stable-only rebalance before another can trigger (debounces oscillations).
- Hysteresis: Require deviation to fall below (threshold * 0.5) before clearing an active drift condition to avoid rapid re-triggering.

### 2. Upkeep Consolidation
- Multi-Portfolio Loop: A single upkeep ID could iterate across multiple balancers (if total gas stays < registry limit) amortizing Chainlink overhead across instances.
- Action Prioritization: If both stable + global criteria are met in the same `checkUpkeep`, only encode the global action (absorbs stable adjustments) or vice‑versa depending on gas efficiency heuristics; currently stable prioritized due to cheaper, localized correction.

### 3. performData Minimization
- Compact Encoding: Use enums / uint8 flags, bitmaps for asset inclusion, and index arrays instead of full addresses where registry or internal mapping can resolve.
- Off-Chain Pre-Computation: Pre-compute candidate asset indices & provide in performData; `performUpkeep` trusts and validates minimal set.

### 4. Execution Path Pruning
- Early Return: Abort global path mid-loop if cumulative residual deviation drops below a secondary micro-threshold.
- Combined Pass: When executing a global rebalance, stable slice adjustments are folded into the same order netting flow (avoids separate stable loop gas).

### 5. Computation Caching
- Cached Totals: Maintain rolling total portfolio value & stable aggregate (updated on fund/withdraw) to avoid recomputing full sums inside `checkUpkeep`.
- Prepacked Targets: Store target value ratios scaled (e.g. Q128) to remove divisions at runtime.

### 6. Order Generation Efficiency
- Netting: Aggregate per-token deltas across stable + global contexts before building orders; skip near-zero amounts below dust threshold.
- Threshold Floor: Do not emit orders whose economic value < (fee * marginFactor) to avoid negative expected value fills.
- Batch Signatures: If protocol supports, produce a single EIP-712 signature for a bundle of transfers.

### 7. Storage & Layout
- Struct Packing: Reorder fields (e.g. uint128/uint64) inside config structs to reduce SLOAD/SSTORE count and cold access cost.
- Immutable Parameters: Promote rarely changed addresses (oracle, protocol) to immutable to save gas in reads.

### 8. Off-Chain Simulation & Prediction
- Off-chain drift projection (using recent price velocity) can be used in a custom Keeper script to skip calling `checkUpkeep` when drift unlikely to exceed threshold soon.

### 9. Telemetry & Feedback
- Emit `GasProfile(actionType, gasUsed, driftBefore, assetsTouched)` events to feed an optimizer that tunes thresholds automatically.

### 10. Funding Strategy
- Maintain ≥2× monthly expected cost in the registry to prevent underfunded retries (which raise effective premium). Replenish at 1× threshold.

These design hooks keep the protocol flexible: base deployment can start with conservative parameters, then gradually reduce cost by activating more aggressive batching / caching once empirical gas metrics are collected.
