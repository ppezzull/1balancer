# 1Balancer Bot — Design and Operations

This document describes how the off-chain bot operates across the monorepo to power portfolio rebalancing and 1inch limit-order making. The bot lives in the Next.js package as a server-side worker.

## Goals
- Detect drift between on-chain targets and current balances.
- Build and sign proposals (EIP-712) for on-chain execution when needed.
- Create and submit 1inch Limit Orders where appropriate.
- Fetch spot prices via 1inch APIs using Next.js server actions.
- Read Balancer allowances using viem (and wagmi hooks in the UI as needed).
- Persist history in Postgres for auditability.

## Packages involved
- `packages/hardhat` — Balancer contracts, types, and ABIs used by the bot to read state and build transactions.
- `packages/nextjs` — Bot runtime, HTTP clients for 1inch, server actions (spot prices), scheduling/cron, and DB access.
- `packages/db` — SQL migrations and database where the bot persists proposals, orders, and metrics.
- `limit-order-sdk` — Vendor SDK used to build typed orders (imported as npm dependency in Next.js package).

## High-level architecture
1. Poller loop loads portfolios from DB, fetches on-chain state (assets, targets, nonce, balances), and prices via 1inch.
2. If drift exceeds thresholds, bot builds OrderDelta[], simulates off-chain, and decides:
   - Post a signed proposal to chain (executeSignedRebalance) for immediate correction; or
   - Create maker limit orders via 1inch SDK and submit them to the orderbook.
3. Before placing orders, ensure Balancer has the necessary allowances toward 1inch LimitOrderProtocol (per token). If missing, send private approve txs via Flashbots Protect RPC.
4. Persist all decisions (snapshots, signatures, tx hashes, order hashes) to DB. Index on-chain events and reconcile outcomes.

## Data flow
- Read:
  - On-chain: Balancer.targetPercentageBps, nonce, balances (ERC20.balanceOf).
  - Off-chain: 1inch spot prices/quotes via server actions, latest orders (optional), DB configs.
- Write:
  - Orders to 1inch API, proposals to chain, approvals to chain, records to DB.

## Credentials and endpoints
- 1inch Auth Key: `ONEINCH_AUTH_KEY` (Next.js runtime env). Used by Limit Order SDK and REST quotes.
- Flashbots Protect RPC: `FLASHBOTS_RPC_URL` (default `https://rpc.flashbots.net`).
- Signer key: `BOT_SIGNER_PK` — EOA that is the owner or `authorizedSigner` of the Balancer. Stored securely outside git.
- RPC URL: `RPC_URL` for reading chain state and sending txs.
- Database: connection string managed by Next.js package `.env`.

## Bot components
- `services/bot/portfolio-poller.ts` — Schedules and runs the polling loop.
- `services/bot/pricing.ts` — Thin wrapper over 1inch spot price/quote API, invoked via server actions where appropriate.
- `services/bot/orders.ts` — 1inch SDK integration: build typed orders and submit.
- `services/bot/proposals.ts` — Build and sign EIP-712 proposals for Balancer.
- `services/bot/approvals.ts` — Ensure/adjust ERC20 allowances from Balancer to LOP; allowance reads use viem.
- `services/bot/execution.ts` — Send private transactions via Flashbots Protect.
- `services/bot/store.ts` — DB persistence helpers.

These modules are small, focused, and testable. They can be triggered by cron, API routes, or server actions.

## Maker orders via 1inch
- Maker address is the Balancer contract.
- Orders are signed off-chain by the EOA that controls Balancer (owner or `authorizedSigner`).
- 1inch LOP will validate via Balancer.isValidSignature (EIP-1271) at fill time.
- Ensure Balancer approvals to LOP are in place for maker assets.

## On-chain proposals (optional)
- For immediate adjustments or emergencies, bot signs the Balancer proposal (EIP-712) and sends `executeSignedRebalance` privately.
- The contract accepts both EOA (ECDSA) and EIP-1271 validations for owner/authorizedSigner.

## Scheduling
- Start with a simple interval (e.g., every 60s) per portfolio.
- Backoff if no drift or if market is closed for your strategy.
- Long-running process can be a Next.js server Worker or a dedicated Node.js script invoked by PM2/Docker.
- Serverless option (Vercel free): use `app/api/balance/route.ts` with Vercel Cron to invoke a single tick across all Balancers (e.g., every 5 minutes).

## Minimal types (Next.js)
- Portfolio: id, balancerAddress, assets[], targets, thresholds.
- Snapshot: balances, prices, drift by asset, timestamp.
- OrderRecord: order hash, pair, making/taking, status.
- ProposalRecord: nonce, deadline, signature, tx hash, status.

## Environment (.env)
- `ONEINCH_AUTH_KEY=...`
- `RPC_URL=...`
- `FLASHBOTS_RPC_URL=https://rpc.flashbots.net` (optional; not needed for pricing)
- `BOT_SIGNER_PK=...`  # EOA used to sign orders and proposals
- `NETWORK_ID=1`
- `DB_URL=postgres://...`

## Deploying on Vercel (free) + Supabase (free)

Vercel free plan does not support background workers, but you can run the bot via a serverless cron that triggers one tick each time:

1. Route included: `POST /api/balance` (see `app/api/balance/route.ts`). It calls `services/bot/tick.ts`.
2. Configure Vercel Cron in your project’s Settings → Cron Jobs, e.g. every 5 minutes:
  - Target: `https://<your-app>.vercel.app/api/balance`
  - Method: POST
3. Store secrets in Vercel Env (Project → Settings → Environment Variables):
  - ONEINCH_AUTH_KEY, RPC_URL, FLASHBOTS_RPC_URL, BOT_SIGNER_PK, NETWORK_ID
  - SUPABASE_URL, SUPABASE_ANON_KEY (or service role key if needed)
4. Use Supabase free Postgres as your DB; add a minimal table set for portfolios, snapshots, orders, proposals.
5. Limitations: serverless max duration applies per tick. Keep one tick lightweight (few portfolios) or split portfolios across multiple cron jobs.

For self-hosted continuous mode, use `yarn workspace @se-2/nextjs bot` with PM2/systemd.

## Security notes
- Keep `BOT_SIGNER_PK` out of the repo; prefer KMS/secret manager.
- Use private RPCs and Flashbots Protect for txs that reveal strategy.
- Limit order amounts and expirations to reduce risk of stale quotes.

## Testing strategy
- Unit test pricing/order builders with fixtures.
- Use a local Hardhat network plus the included contracts to run end-to-end dry runs.
- Mock 1inch API responses for deterministic CI.

## Future improvements
- Risk checks on deltas vs liquidity.
- Automatic allowance right-sizing.
- Multi-chain orchestration.
- Backtesting module based on recorded snapshots.
