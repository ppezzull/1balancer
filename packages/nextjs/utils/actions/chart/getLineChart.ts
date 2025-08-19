"use server";

import { LinesResponse } from "../../types/tokenCharts";
import { CHAIN_ID } from "../../constants";

export async function getLineChart(
  token0: string,
  token1: string,
  period: string
): Promise<LinesResponse | null> {
  // When running on the server, we need to provide the full URL to the proxy.
  // VERCEL_URL is a system environment variable provided by Vercel.
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const url = `${baseUrl}/api/1inch/charts/v1.0/chart/line/${token0}/${token1}/${period}/${CHAIN_ID}`;

  const res = await fetch(url);

  if (!res.ok) return null;
  return await res.json();
}
