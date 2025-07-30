"use server";

import { CandlesResponse } from "../../types/tokenCharts";
import { CHAIN_ID, API_KEY } from "../../constants";

export async function getCandleChart(
  token0: string,
  token1: string,
  seconds: number
): Promise<CandlesResponse | null> {
  const url = `https://api.1inch.dev/charts/v1.0/chart/aggregated/candle/${token0}/${token1}/${seconds}/${CHAIN_ID}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  if (!res.ok) return null;
  return await res.json();
}
