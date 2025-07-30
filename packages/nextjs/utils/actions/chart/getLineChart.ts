"use server";

import { LinesResponse } from "../../types/tokenCharts";
import { CHAIN_ID, API_KEY } from "../../constants";

export async function getLineChart(token0: string, token1: string, period: string): Promise<LinesResponse | null> {
  const url = `https://api.1inch.dev/charts/v1.0/chart/line/${token0}/${token1}/${period}/${CHAIN_ID}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  if (!res.ok) return null;
  return await res.json();
}
