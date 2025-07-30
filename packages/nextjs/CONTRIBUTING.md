# Contributing

# Contributing

This document provides an overview of the server actions and type definitions in the project, updated to reflect the new directory structure under `packages/nextjs/utils`.

## Server Actions

All server actions are now organized in subfolders under `packages/nextjs/utils/actions`:

| Action | Description | Parameters | Returns | Location |
| --- | --- | --- | --- | --- |
| `getToken(address: string)` | Fetches details for a specific token. | `address`: The token's contract address. | `TokenDto` or `null` | `actions/token/getToken.ts` |
| `getLineChart(token0: string, token1: string, period: string)` | Fetches line chart data for a token pair over a given period. | `token0`, `token1`: Contract addresses. `period`: Chart period (e.g., '1d', '7d'). | `LinesResponse` or `null` | `actions/chart/getLineChart.ts` |
| `getCandleChart(token0: string, token1: string, seconds: number)` | Fetches candlestick chart data for a token pair. | `token0`, `token1`: Contract addresses. `seconds`: Candle interval in seconds. | `CandlesResponse` or `null` | `actions/chart/getCandleChart.ts` |
| `getTokenBalances(walletAddress: string, tokens: string[])` | Fetches balances for specified tokens in a wallet. | `walletAddress`: Wallet address. `tokens`: Array of contract addresses. | `TokenBalancesResponse` or `null` | `actions/token/getTokenBalances.ts` |
| `getMultiWalletBalances(request: CustomTokensAndWalletsRequest)` | Fetches balances for multiple tokens and wallets. | `request`: Object with `tokens` and `wallets` arrays. | `MultiWalletBalancesResponse` or `null` | `actions/token/getMultiWalletBalances.ts` |
| `createLimitOrder(...)` | Demonstrates creation and signing of a limit order using the official 1inch SDK and ethers.Wallet. | See file for params. | Order result object or error. | `actions/limit-order/createLimitOrder.ts` |

## Types

Type definitions are located in `packages/nextjs/utils/types`:

- `types/token.ts`: Types for tokens, wallet balances, and requests (`TokenDto`, `TokenBalancesResponse`, `CustomTokensAndWalletsRequest`, etc.)
- `types/tokenCharts.ts`: Types for chart data (`Line`, `Candle`, `LinesResponse`, `CandlesResponse`)

## Environment Variables

Make sure to create a `.env` file from `.env.example` and add your 1inch API key:

```
ONEINCH_API_KEY=your_1inch_api_key_here
CHAIN_ID=8453
```

## 1inch SDK Usage

### Limit Order Creation and Submission

The `createAndSubmitLimitOrder` server action in `actions/limit-order/createLimitOrder.ts` provides a complete implementation for creating, signing, and submitting a 1inch limit order.

It combines two key components:
1.  **Wagmi for Signing**: It accepts a `WalletClient` (from `viem`, provided by wagmi/Privy) to sign the transaction, ensuring compatibility with the existing `scaffold-eth` wallet infrastructure.
2.  **1inch SDK for API Interaction**: It uses the `Api` class from `@1inch/limit-order-sdk` to create the order structure and submit it to the 1inch API.

Here is a simplified overview of the logic:

```typescript
import { LimitOrder, MakerTraits, Address, Api, ... } from "@1inch/limit-order-sdk";
import { WalletClient } from 'viem';

// Simplified function signature
export async function createAndSubmitLimitOrder(
  walletClient: WalletClient, // From wagmi/Privy
  makerAddress: string, ...
) {
  // 1. Initialize the 1inch API
  const api = new Api({ ... });

  // 2. Create the order structure
  const order = new LimitOrder({ ... });

  // 3. Get typed data for signing
  const typedData = order.getTypedData();

  // 4. Sign with the user's wallet via wagmi
  const signature = await walletClient.signTypedData({ ... });

  // 5. Submit the signed order to the 1inch API
  await api.submitOrder(order, signature);

  return { order, signature, orderHash: ... };
}
```

This approach provides a secure and robust way to handle limit orders. For more details, refer to the full implementation in the file and the official [@1inch/limit-order-sdk npm page](https://www.npmjs.com/package/@1inch/limit-order-sdk).
