# 1Balancer — Architecture

One line: on-chain holds custody and target percentages; off-chain (Next.js + Postgres) does pricing, drift detection, order construction, signing and history.

## Web3
- Contracts: single `Balancer` (custody + targets). Optional `BalancerFactory`.
- Structs: `Asset(token,address; percentage,uint16; isStable,bool)`, `Config(driftBps,stableDriftBps,hysteresisBps,emergencyGlobalBps,dustThreshold)`, `OrderDelta(assetIndex,uint16; value,int256)`.
- Proposal: minimal EIP‑712 containing nonce, expiry, drift snapshot and `OrderDelta[]` (no prices/slippage on-chain).
- Functions: `executeSignedRebalance`, `emergencyRebalance`, `setConfig`, `updateAssets`, `fund`/`withdraw`, `isValidSignature` (EIP‑1271).

## Web2
- Next.js: orchestrator + server actions for manual/operator flows; server worker for polling.
	- 1inch APIs for frontend quoting, routing and for off-chain swap simulation (use 1inch SDK or REST APIs for price/route hints).
	- Off‑chain signed limit orders are the default: Next.js builds & EIP‑712 signs maker orders, stores them in Postgres, and publishes/settles via 1inch (or relayer). On‑chain posting is only for emergency/atomic cases.
- Postgres: authoritative history (balancers, assets, proposals, proposal_deltas, orders, price_snapshots).

## Interaction
1. Server reads on-chain targets & balances + prices.
2. Server computes drift, builds & simulates `OrderDelta[]`, stores snapshot in Postgres.
3. Server signs EIP‑712 proposal and submits `executeSignedRebalance` to chain.
4. Contract applies deltas; emits events; server updates Postgres with results.

## Packages
- `packages/hardhat` — contracts, tests, deploy scripts.
- `packages/nextjs` — UI + orchestrator + server actions + worker + shared types.
- `packages/db` — migrations and docker-compose.

## Immediate next steps
1. Create `packages/hardhat/contracts/Balancer.sol` (stub).
2. Add DB migration `packages/db/migrations/001_init_balancer.sql`.
3. Scaffold `packages/nextjs/server/orchestrator.ts` and `packages/nextjs/app/actions/rebalance.server.ts`.

Tell me which artifact to scaffold first: Solidity stub, DB migration, or Next.js server action + shared types.
