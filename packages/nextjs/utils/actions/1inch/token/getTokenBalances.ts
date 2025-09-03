"use server";

import { CHAIN_ID } from "../../constants";
import { type TokenBalancesResponse } from "../../types/token";

export async function getTokenBalances(walletAddress: string, tokens: string[]): Promise<TokenBalancesResponse | null> {
  // When running on the server, we need to provide the full URL to the proxy.
  // VERCEL_URL is a system environment variable provided by Vercel.
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

  const url = `${baseUrl}/api/1inch/balance/v1.2/${CHAIN_ID}/balances/${walletAddress}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tokens }),
  });

  if (!res.ok) return null;
  return await res.json();
}
