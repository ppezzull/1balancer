# 1Balancer Economics

> Draft economic analysis for operating a single DriftBalancer instance over a 30‑day period. Figures are illustrative only (NOT financial advice) and depend on on‑chain gas prices, Chainlink Automation network parameters, portfolio volatility, and chosen configuration.

## Scope
Applies to the DriftBalancer variant (combined stable + global deviation logic). TimeBalancer adds a deterministic interval trigger but otherwise shares the same cost components for deviation (stable) upkeeps.

## Components
1. Chainlink Automation execution fees (dominant predictable infra cost)
2. On‑chain gas for rebalancing transactions (Automation perform + any subsequent order settlement transactions if executed by the balancer itself)
3. Sponsored gas (optional) if the protocol/operator covers limit order fills or subsidizes user interactions
4. Opportunity impact (tracking error / slippage avoided)
5. Operational risk buffers (minimum upkeep balance in LINK or native)

## Chainlink Automation Fee Formula
From Chainlink Automation economics (Registry v2.3 style, adapted):

If paying in LINK:
```
Fee_LINK = [ gasPrice_native * (gasUsed + gasOverhead) * (1 + premium%) ] / (LINK/NativeRate)
```
If paying in native (e.g. ETH on Base):
```
Fee_native = gasPrice_native * (gasUsed + gasOverhead) * (1 + premium%)
```
Where:
- gasOverhead: fixed (≈ 80,000 gas per docs example)
- premium%: network premium (assumption required if not published for Base; we assume 20% for Base in examples — adjust when official value differs)
- gasUsed: actual `performUpkeep` execution gas (excludes overhead)
- gasPrice_native: prevailing block gas price (in wei)

### Assumptions (Editable)
| Parameter | Symbol | Baseline | Low | High | Notes |
|-----------|--------|----------|-----|------|-------|
| Stable-only perform gas | G_stable | 140,000 | 120k | 180k | deviation calc + small order batch |
| Global perform gas | G_global | 300,000 | 250k | 400k | recalculation + multi-asset order prep |
| Overhead | G_over | 80,000 | 80k | 80k | Per Chainlink docs |
| Premium | p | 0.20 (20%) | 0.15 | 0.30 | Placeholder until Base published |
| Avg gas price (Base) | g | 0.30 gwei | 0.20 | 0.50 | 1 gwei = 1e9 wei |
| LINK/Base exchange | R | 1 LINK = 0.00035 ETH | — | — | Illustrative (update with oracle rate) |

Conversions:
```
g (wei) = g_gwei * 1e9
Cost_native = g * (G_x + G_over) * (1 + p)
Cost_LINK  = Cost_native / R
```

### Per-Upkeep Example Costs (Baseline)
```
g = 0.30 gwei = 0.30 * 1e9 = 3.0e8 wei
Stable perform gas total = (140k + 80k) * (1 + 0.20) = 220k * 1.20 = 264,000 gas-equivalent
Stable fee (native) = 264,000 * 3.0e8 = 7.92e13 wei ≈ 0.0000792 ETH

Global perform gas total = (300k + 80k) * 1.20 = 456,000
Global fee (native) = 456,000 * 3.0e8 = 1.368e14 wei ≈ 0.0001368 ETH

If R = 0.00035 ETH / LINK → 1 LINK = 0.00035 ETH
Stable fee in LINK ≈ 0.0000792 / 0.00035 ≈ 0.226 LINK
Global fee in LINK ≈ 0.0001368 / 0.00035 ≈ 0.391 LINK
```
IMPORTANT: Replace R with the live LINK/ETH price on Base (or omit if paying native). Example LINK figures merely scale costs; if paying in native, ignore the division.

### Frequency Modeling (30 Days)
We model three drift scenarios:

| Scenario | Stable Rebalances / Month | Global Rebalances / Month | Rationale |
|----------|---------------------------|----------------------------|-----------|
| Low Vol | 8 (≈ bi-weekly) | 2 | Very stable portfolio |
| Base Case | 30 (daily stable deviation) | 8 | Weekly-ish global + extra events |
| High Vol | 60 (2/day) | 15 | Elevated volatility / tighter driftBps |

Monthly Cost (Native ETH on Base) = Σ (count_i * fee_i)

Baseline gas price & premium:
```
Low Vol: 8 * 0.0000792 + 2 * 0.0001368 ≈ 0.0006336 + 0.0002736 = 0.0009072 ETH
Base Case: 30 * 0.0000792 + 8 * 0.0001368 ≈ 0.002376 + 0.0010944 = 0.0034704 ETH
High Vol: 60 * 0.0000792 + 15 * 0.0001368 ≈ 0.004752 + 0.002052 = 0.006804 ETH
```
Even the high‑vol baseline remains < 0.007 ETH at the assumed 0.30 gwei. Sensitivity: if gas doubles (0.60 gwei), simply double the totals.

### LINK Funding Guidance
If paying in LINK (using example LINK cost earlier):
```
Base Case LINK ≈ 30 * 0.226 + 8 * 0.391 ≈ 6.78 + 3.13 ≈ 9.91 LINK / month
```
Maintain a buffer ≥ 2× expected month to survive gas spikes & retries → target 20 LINK funded. (Adjust after real measurement of `gasUsed`.)

### Minimum Balance Buffer
Per docs, minimum balance uses fast gas * gasLimit * multiplier. If (gasLimit = 500k) and fast gas ~ 0.50 gwei, multiplier 1.3 (illustrative):
```
Required buffer ≈ 0.50 gwei * 500,000 * 1.3 = 3.25e11 wei ≈ 0.000325 ETH
```
Add 10–20× that for multi-day coverage → 0.003–0.0065 ETH or corresponding LINK.

## Order Execution Gas
The upkeep costs cover *trigger & orchestration*. Actual limit order settlement on 1inch / protocol side typically paid by takers. If the balancer ever posts on-chain actions beyond Automation (e.g., signing is off-chain, submission might still require a tx for certain batch flows), estimate:
| Action | Est Gas | Frequency (Base Case) | Monthly Gas (k) |
|--------|---------|-----------------------|-----------------|
| Batch stable order posting (if on-chain) | 120k | 30 | 3,600k |
| Global multi-order posting | 200k | 8 | 1,600k |
Native cost (same gas price & premium logic) would add negligibly (~0.002–0.004 ETH) if required. If purely off-chain signed orders, this section is near-zero chain cost.

## Sponsored Gas (Optional)
If protocol subsidizes user deposit/withdraw interactions or limit order fills:
| Interaction | Assumed Gas | Est Monthly Count | Added ETH @0.30 gwei |
|-------------|-------------|-------------------|----------------------|
| User fund() | 70k | 40 | ~0.000084 ETH |
| User withdraw() | 80k | 20 | ~0.0000576 ETH |
| TOTAL | — | — | ~0.00014 ETH |
Still minor vs. opportunity gains.

## Potential Gains / Economic Rationale
1. Tracking Error Reduction: Frequent small rebalances keep allocation drift low (reduces variance vs. target weights → improved risk-adjusted performance). Even 1–2% drift reduction can materially improve Sharpe in diversified baskets.
2. Stable Aggregation Efficiency: Treating stables as one slice reduces unnecessary churn; only pairwise divergence events trigger a stable-only sequence, minimizing gas.
3. Slippage Control: Pre-computed limit (grid) orders stage liquidity; reduces price impact compared to reactive market orders.
4. Capital Efficiency: Global rebalances triggered only when meaningful drift (owner-defined) vs. time-scheduled approach reduces redundant trades under low volatility.
5. Operational Predictability: Chainlink Automation eliminates manual monitoring costs; small, predictable monthly fee vs. potential performance drag of delayed human intervention.

### Illustrative Performance Offset
If improved drift management recovers even 5 bps of monthly portfolio performance on a $500k portfolio:
```
Gain ≈ 0.0005 * 500,000 = $250
```
Compare to Baseline automation gas (< $15 at $2,000/ETH and 0.0035 ETH spend) → high ROI multiple.

## Risk & Sensitivity Matrix
| Variable | Upside if ↓ | Downside if ↑ | Mitigation |
|----------|-------------|---------------|------------|
| Gas price | Lower cost | Higher upkeep fees | Dynamic drift threshold, batching |
| Premium% | Lower fee | Higher fee | Monitor network premium; migrate if cheaper chain |
| Volatility | Fewer triggers | More triggers (cost ↑) | Adaptive hysteresis / widening drift bands |
| Asset count | Simpler global calc | Higher gas per global rebalance | Pre-cached weight sums, partial rebalance subsets |

## Optimization Strategies

### Lever Overview
| Lever | Mechanism | Primary Effect | Qualitative Savings* |
|-------|-----------|----------------|----------------------|
| Adaptive Drift Bands | Dynamic driftBps widen/narrow | Fewer global upkeeps in calm markets | Medium |
| Interval Length (TimeBalancer) | Longer interval | Fewer time-based globals | Medium |
| Stable Cooldown / Debounce | Min time between stable rebalances | Fewer stable upkeeps | Medium |
| Hysteresis | Different trigger / clear thresholds | Avoid re-trigger churn | Low-Med |
| Multi-Portfolio Upkeep | One upkeep loops N balancers | Amortize overhead | High (fleet) |
| performData Compression | Bitmaps / indices | Lower check+perform gas | Low |
| Caching Totals | Pre-store totals & stable sum | Lower per-call gas | Low |
| Netting & Dust Filtering | Skip tiny orders | Lower order gen gas & fills | Low |
| Batch Signatures | Single EIP-712 for bundle | Fewer hash/sign ops | Low |
| Off-peak Scheduling | Trigger in low gas windows | Lower gas price factor | Medium |
| Funding Buffer | Avoid underfunded retries | Prevent premium spikes | Risk Mitigation |
| Telemetry Feedback | Tune parameters from data | Sustained efficiency | Enabler |
| Off-chain Drift Forecast | Skip likely-no-op checks | Fewer checks & performs | Medium |

*Savings categories are directional; actual impact depends on volatility & portfolio size.

### Detailed Tactics
1. Frequency Control
	- Increase `driftBps` modestly when realized volatility (e.g., trailing 24h std dev) is low.
	- Lengthen TimeBalancer interval once tracking error (ex-post) remains within SLA.
	- Introduce a `stableCooldown` to block consecutive stable-only events inside short windows.
2. Upkeep Consolidation
	- Deploy a manager contract that iterates a list of balancer addresses; stops when gas limit threshold reached; encodes actions sequentially.
3. Path Prioritization
	- If both stable & global triggers detected, choose the path yielding higher drift reduction per gas unit (telemetry-driven) rather than static ordering.
4. performData Minimization
	- Encode asset inclusion via a packed uint256 bitmap; decode with bit operations in `performUpkeep`.
5. Computation Caching
	- Maintain cached `totalValue` & `stableValue`; update only on fund/withdraw or oracle price push (if push-based) instead of recomputing whole arrays each check.
6. Order Generation Efficiency
	- Net all token deltas then drop those below `dustThreshold = feeEquivalent * marginFactor`.
	- Group multiple small stable adjustments into a single aggregated limit order when economically equivalent.
7. Storage/Layout
	- Re-pack config structs for minimized slot usage; mark immutable addresses to save warm SLOAD costs.
8. Off-chain Simulation
	- External keeper can simulate drift projections and skip on-chain `checkUpkeep` unless projected drift > X% in next window.
9. Telemetry
	- Emit `GasProfile` events; off-chain process computes `gasPerDriftReduced` metric to guide threshold tuning.
10. Payment Optimization
	- Compare effective LINK vs native costs ( (gas*(1+p))/R ) and choose cheaper payment rail; schedule heavy operations during historically low gas hours.
11. Risk Mitigation
	- Prefund ≥2× monthly cost; auto-refill when <1× to prevent failed performs (which can increase realized premium / repeat costs).
12. Governance / Parameter Automation
	- Optional: controller contract that updates thresholds weekly based on moving averages of drift & gas.

### Example Savings (Base Case Single Balancer)
Baseline (Base Case): 30 stable, 8 global → 0.0034704 ETH/month.
1. Reduce stable triggers 30 → 20 (same global): New monthly = 20*0.0000792 + 8*0.0001368 = 0.0026784 ETH (−22.8%).
2. Off-peak gas drop 0.30 → 0.25 gwei (−16.7%): 0.0026784 * (0.25/0.30) ≈ 0.0022319 ETH.
3. Caching & compression (assume 5% perform gas reduction on both upkeep types): multiply by 0.95 ≈ 0.0021203 ETH.
Net illustrative reduction ≈ 39% vs baseline (0.0034704 → 0.00212 ETH).

Fleet Level: Applying same % to 100 balancers Base Case monthly 0.34704 ETH → ≈ 0.211 ETH (saves ~0.136 ETH / month).

These are illustrative; deploy telemetry to validate each lever and adjust compositions incrementally (avoid simultaneous large parameter shifts which obscure attribution).

## Funding & Operations Checklist
| Item | Recommendation |
|------|---------------|
| Initial LINK (or native) funding | ≥ 2× projected monthly spend |
| Refill threshold | 1× monthly spend remaining |
| Monitoring | Off-chain script alerts when balance < threshold |
| Gas anomaly handling | Auto-raise driftBps temporarily if gas spikes > X% |
| Metrics | Track: #stable rebalances, #global, avg drift at trigger, avg slippage |

## Updating Estimates
After deployment, replace assumed parameters with empirical averages from emitted events and actual `checkUpkeep` → `performUpkeep` gas usage. Recompute:
```
MonthlyCost = Σ_i count_i * gasPrice_avg * (gasUsed_i + gasOverhead) * (1 + premium%)
```
Maintain a rolling 7‑day projection for funding decisions.

## Summary
Even under a high volatility scenario, monthly automation + (optional) on-chain posting costs are modest (< 0.01 ETH at current Base gas). The economic justification relies on preserving allocation targets and minimizing tracking error; modest performance improvements greatly outweigh infrastructure expenses.

## Monthly & Annual ETH Requirements
This section scales per-upkeep baseline fees into monthly & annual ETH needs for individual balancers and for a 100-balancer fleet (50 DriftBalancer, 50 TimeBalancer). TimeBalancer shares stable deviation logic; its global component is time-driven (weekly here) unless volatility forces additional drift-style triggers.

### Baseline Per-Upkeep Fees (native ETH)
| Upkeep Type | Fee (ETH) |
|-------------|-----------|
| Stable deviation | 0.0000792 |
| Global rebalance | 0.0001368 |

### DriftBalancer (Single) — Scenario Costs
| Scenario | Stable / Mo | Global / Mo | Monthly ETH | Annual ETH |
|----------|-------------|-------------|-------------|------------|
| Low Vol | 8 | 2 | 0.0009072 | 0.0108864 |
| Base Case | 30 | 8 | 0.0034704 | 0.0416448 |
| High Vol | 60 | 15 | 0.0068040 | 0.0816480 |

Formula: Monthly = S*0.0000792 + G*0.0001368 ; Annual = 12 * Monthly.

### TimeBalancer (Single)
Assume weekly global (8 per 30‑day month avg) and same stable deviation counts as DriftBalancer Base Case (30). Thus identical Base Case cost:
Monthly 0.0034704 ETH ; Annual 0.0416448 ETH.

If interval differs: NewMonthly = 30*0.0000792 + G_new*0.0001368.

### Fleet of 100 (50 Drift / 50 Time)
Three homogeneous fleet scenarios plus one mixed illustration.

#### All Low Vol
Per balancer (Low) 0.0009072 ETH → 100 * 0.0009072 = 0.09072 ETH / month
Annual ≈ 1.08864 ETH

#### All Base Case
Per balancer (Base) 0.0034704 ETH → 100 * 0.0034704 = 0.34704 ETH / month
Annual ≈ 4.16448 ETH

#### All High Vol
Per balancer (High) 0.0068040 ETH → 100 * 0.0068040 = 0.68040 ETH / month
Annual ≈ 8.16480 ETH

#### Mixed Example (50 Drift Base, 50 Time Low)
Monthly = 50*0.0034704 + 50*0.0009072 = 0.21888 ETH
Annual ≈ 2.62656 ETH

### Buffer Guidance
Maintain ≥ 2× projected monthly spend funded: Base fleet → ~0.70 ETH buffer. Scale if gas volatility historically >2× or if premium% rises.

### Sensitivity Shortcuts
Gas price doubles → multiply all figures by 2. Premium increases from 20%→30% → multiply by (1.30/1.20)=1.0833 (~+8.3%).

### USD Illustration (@ $2,000/ETH)
| Item | Monthly USD |
|------|-------------|
| Single Balancer Base | 0.0034704 * 2000 ≈ $6.94 |
| Fleet Base (100) | 0.34704 * 2000 ≈ $694 |
Update with live rates in reporting dashboards.

## Disclaimer
All numbers are illustrative; replace assumptions with live network data before budgeting. Not investment advice.
