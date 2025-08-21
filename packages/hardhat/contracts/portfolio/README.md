<div align="center">

# 1Balancer — Contract Layer

**Deterministic, signature‑gated portfolio state; monitoring, analytics, quoting and order routing live in Next.js + Postgres.**

</div>

## 0. TL;DR

Single generic `Balancer` contract that holds custody and enforces signed state transitions (EIP‑712). The off‑chain Next.js orchestrator decides WHEN (time or drift) and HOW (OrderDelta[]) to rebalance, signs proposals or maker orders, stores history in Postgres, and uses 1inch for quoting/settlement. On‑chain is intentionally minimal: no price feeds, no keepers.

---

## 1. Core Contracts (high level)

| File | Purpose |
|------|---------|
| `balancers/Balancer.sol` | Portfolio state + EIP‑712 proposal execution (`executeSignedRebalance`) |
| `factory/BalancerFactory.sol` | Optional deterministic deployment / registry helper |

---

## 2. Data Model (summary)

Storage (examples):
```solidity
address[] public assets;
mapping(address => uint256) public targetPercentageBps; // soft total 10_000
uint256 public nonce;                    // strictly increases after each accepted proposal
uint256 public lastRebalanceTimestamp;   // audit / recency
address public authorizedSigner;         // delegate allowed to sign instead of owner
```

OrderDelta (proposal item):
```solidity
struct OrderDelta {
  address token;
  int256  percentageDelta; // relative adjustment (bps)
  uint256 newPercentage;   // absolute override (bps); zero => ignore
  uint256 amount;          // token amount (optional)
  bool    isDeposit;       // true: pull from signer; false: send to owner
}
```

Proposal (EIP‑712 transient): nonce, deadline, `OrderDelta[]`.

Rules: if `newPercentage > 0` it wins over `percentageDelta`; off‑chain must ensure global consistency; negatives clamped on‑chain.

---

## 3. Web2: Orchestrator, Quoting and Persistence

- Next.js (server actions + worker/cron): reads on‑chain state, fetches prices/route hints (1inch), computes drift, builds `OrderDelta[]`, simulates, signs (EIP‑712), and submits signed proposals or stores signed maker orders.
- 1inch: used for frontend quoting, routing hints, and as a settlement path for off‑chain signed maker orders.
- Postgres: authoritative history for balancers, assets, proposals, proposal_deltas, orders, price_snapshots, metrics.
- Default settlement model: off‑chain signed limit/maker orders stored in Postgres and settled via 1inch or relayer; on‑chain posting is emergency/atomic only.

---

## 4. Interaction (time & drift triggers)

1. Server reads on‑chain targets, `nonce`, and balances.
2. Server fetches prices and route hints (1inch) and computes % drift vs targets.
3. If drift > `driftBps` (or on a scheduled time tick), server builds `OrderDelta[]`, simulates locally, signs EIP‑712 proposal (or maker orders), and persists the signed data in Postgres.
4. For immediate execution the server calls `executeSignedRebalance` with the signed payload; contract validates signature, applies deltas, emits `ProposalExecuted`, and increments `nonce`.
5. Server indexes events and updates Postgres with execution metadata.

Trigger modes:
- Drift: continuous polling (balances + 1inch prices) triggers rebalances only when thresholds exceeded.
- Time: periodic cron (e.g. 4/12/24h) to ensure periodic realignment; skip if within hysteresis.

---

## 5. EIP‑712 & Validation (brief)

Domain: name `"Balancer"`, version `"1"`, chainId, verifyingContract.

Validation in `executeSignedRebalance`: check `deadline`, recompute struct hashes, recover signer (owner or `authorizedSigner`), apply deltas sequentially, increment `nonce`, update timestamp.

TypeScript example and full type packing live in the `packages/shared` types (planned).

---

## 6. Security Model (summary)

- Replay/stale protection: strict `nonce` check and increment.
- Signature validation: EIP‑712 + on‑chain `isValidSignature` (EIP‑1271) fallback for contract signers.
- Deadlines: enforced to limit exposure of signed payloads.
- Off‑chain validation & monitoring: ensure proposals keep global invariants before signing.

---

## 7. Packages

- `packages/hardhat` — contracts, tests, deploy scripts.
- `packages/nextjs` — UI + orchestrator + server actions + worker + shared types.
- `packages/db` — migrations and docker-compose for Postgres.

---

## Immediate next steps
1. Create `packages/hardhat/contracts/Balancer.sol` (stub implementing `OrderDelta`, `executeSignedRebalance`, `nonce`, and EIP‑1271 support).
2. Add DB migration under `packages/db/migrations/` for `proposals`, `proposal_deltas`, `orders`, `price_snapshots`, and `proposal_metrics`.
3. Scaffold `packages/nextjs/server/orchestrator.ts` and `packages/nextjs/app/actions/rebalance.server.ts` plus `packages/shared/src/types.ts` for EIP‑712 shapes.

Tell me which artifact to scaffold first: Solidity stub, DB migration, or Next.js server action + shared types.