# Chainlink Automation Integration for Portfolio Balancers

This guide explains how Automation is wired into `@portfolio/` contracts and how to deploy on Base mainnet.

## What’s implemented

- `OptimizedDriftBalancer.sol` implements `AutomationCompatibleInterface`:
  - `checkUpkeep`: off-chain detection of stablecoin deviations via `StablecoinAnalysisLib.detectDeviation`.
  - `performUpkeep`: generates stablecoin grid orders; protected by a forwarder.
  - `setForwarderAddress(address)`: owner-only, sets Chainlink Automation Forwarder.

Notes:
- For security, `performUpkeep` requires `msg.sender == s_forwarderAddress` (custom/log upkeep). For CRON/time-based upkeeps, use the upkeep address instead of forwarder per Chainlink docs.

## Base Mainnet Parameters

- Registry: `0xf4bAb6A129164aBa9B113cB96BA4266dF49f8743`
- Registrar: `0xE28Adc50c7551CFf69FCF32D45d037e5F6554264`

Reference: Chainlink docs “Supported Networks → Base”.

## Base Sepolia Testnet Parameters

- Registry: `0x91D4a4C3D448c7f3CB477332B1c7D420a5810aC3`
- Registrar: `0xf28D56F3A707E25B71Ce529a21AF388751E1CF2A`

Use testnet LINK from `https://faucets.chain.link/` (select Base Sepolia, ERC-677 LINK). Register the upkeep on the Base Sepolia network in the Automation app.

## Deploy flow (Base mainnet)

1) Deploy mocks (optional for staging) and factory/contracts

```bash
cd packages/hardhat
npx hardhat deploy --tags OptimizedContracts --network base
```

2) Create a balancer instance

- Call `OptimizedBalancerFactory.createDriftBalancer(...)` with assets, percentages, amounts, drift.
- Record the deployed balancer address (the upkeep target).

3) Register a Custom Logic upkeep

- Open the Chainlink Automation app and register:
  - Upkeep target: the balancer address
  - Gas limit: start with 200,000–350,000; measure and tune
  - Starting LINK balance: per needs (must be ERC-677 LINK on Base)
  - Check data: leave blank (not required)

4) Set the Forwarder address

- After registration, fetch the upkeep Forwarder from the app (Details → Forwarder) or via Registry `getForwarder(upkeepId)`.
- Call on the balancer (owner only):

```solidity
balancer.setForwarderAddress(<forwarderAddress>);
```

5) Fund and monitor

- Keep the upkeep funded above minimum balance in LINK.
- Monitor events:
  - `OrdersGenerated`
  - `LimitOrderCreated`

## Deploy flow (Base Sepolia testnet)

1) Configure the network (if not already present)

`hardhat.config.ts` example:

```ts
networks: {
  baseSepolia: {
    chainId: 84532,
    url: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
    accounts: [process.env.DEPLOYER_PK!],
  },
}
```

2) Deploy to Base Sepolia

```bash
cd packages/hardhat
npx hardhat deploy --tags OptimizedContracts --network baseSepolia
```

3) Register upkeep on Base Sepolia

- Open the Automation app, choose Base Sepolia, and register a Custom Logic upkeep targeting your balancer.
- Gas limit: start with 200,000–350,000.
- Fund with testnet LINK from the faucet.

4) Set the Forwarder address

- From the app, copy the Forwarder and call:

```solidity
balancer.setForwarderAddress(<forwarderAddress>);
```

5) Verify

- Introduce a small stablecoin deviation using your deployed `MockSpotPriceAggregator` (optional) and call `checkUpkeep` to confirm it returns true. The network will then perform `performUpkeep` and emit `OrdersGenerated`/`LimitOrderCreated`.

## Local testing with mocks

Use `MockSpotPriceAggregator` to simulate deviations:

```solidity
mock.setMockPrice(USDC, USDT, 1.01e18); // 1% deviation
```

Then call `checkUpkeep` on the balancer to verify it returns true and `performUpkeep` to emit order events. For permission checks locally, you can temporarily set `s_forwarderAddress` to your EOA or a helper sender during tests.

## Tips

- Move heavy computation into `checkUpkeep` and pass compact `performData` when needed. Current implementation keeps computation minimal on-chain.
- Keep `performUpkeep` idempotent and safe if called redundantly.

