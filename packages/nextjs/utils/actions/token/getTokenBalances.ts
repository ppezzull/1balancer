"use server";

import { type TokenBalancesResponse } from "../../types/token";
import { CHAIN_ID, API_KEY } from "../../constants";

export async function getTokenBalances(
  walletAddress: string,
  tokens: string[]
): Promise<TokenBalancesResponse | null> {
  const url = `https://api.1inch.dev/balance/v1.2/${CHAIN_ID}/balances/${walletAddress}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tokens }),
  });

  if (!res.ok) return null;
  return await res.json();
}
