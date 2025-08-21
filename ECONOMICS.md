# 1Balancer PoC Economics

PoC configuration: Next.js hosted on Vercel (Free) and Postgres on Supabase (Free). Frontend/off-chain swap simulation uses 1inch APIs for quotes and routing. These free tiers are intended for proof-of-concept only.

Assumptions
- ETH = $2,000
- Gas price (base) = 0.30 gwei
- Avg per-proposal gas (base) ≈ 207.5k (validation + transfers + occasional posting)
- Proposals per month = 12

PoC cost (per balancer)
- Web3 (on-chain): 12 * 207.5k gas * 0.30 gwei ≈ 2.49M gas → ~0.00075 ETH ≈ $1.50 / month
- Web2 (off-chain): Vercel Free + Supabase Free → $0 / month (subject to provider quotas)

Total PoC estimate: ≈ 0.00075 ETH / month ≈ $1.50 / month (per balancer)

Buffer recommendation
- Keep ~0.001 ETH funded per balancer to cover spikes and retries.

Keep this file focused on PoC economics only.
