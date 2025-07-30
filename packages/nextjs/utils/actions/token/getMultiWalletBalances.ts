"use server";

import { CustomTokensAndWalletsRequest, MultiWalletBalancesResponse } from "../../types/token";
import { CHAIN_ID, API_KEY } from "../../constants";

export async function getMultiWalletBalances(
  request: CustomTokensAndWalletsRequest
): Promise<MultiWalletBalancesResponse | null> {
  const url = `https://api.1inch.dev/balance/v1.2/${CHAIN_ID}/balances/multiple/walletsAndTokens`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) return null;
  return await res.json();
}
