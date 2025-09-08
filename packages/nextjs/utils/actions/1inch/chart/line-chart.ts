"use server";

import { LinesResponse } from "~~/types";

/**
 * Server action: fetch line chart from 1inch proxy.
 * Uses the Next.js API route at /api/1inch to attach the API key.
 *
 * Example (server):
 *   await getLineChart(token0, token1, "24H", 8453);
 */
export async function getLineChart(
  token0: string,
  token1: string,
  period: string | number,
  chainId = 8453, // Base mainnet
): Promise<LinesResponse | null> {
  // Build absolute proxy URL (server-side fetch needs absolute)
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT || 3000}`);
  const proxyPath = `/api/1inch/charts/v1.0/chart/line/${token0}/${token1}/${period}/${chainId}`;
  const proxyUrl = `${baseUrl}${proxyPath}`;

  console.time?.(`[getLineChart] ${token0}/${token1}`);

  // 1) Try proxy
  try {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 7_500);
    try {
      const res = await fetch(proxyUrl, { cache: "no-store", signal: controller.signal, next: { revalidate: 0 } });
      if (process.env.NODE_ENV !== "production") {
        console.debug(
          `[getLineChart] via proxy ${token0}/${token1} period=${period} chainId=${chainId} => ${res.ok ? "ok" : "failed"}`,
        );
      }
      if (res.ok) {
        const json = (await res.json()) as LinesResponse;
        return json;
      }
    } finally {
      clearTimeout(to);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[getLineChart] proxy error for ${token0}/${token1}:`, err);
    }
  }

  // 2) Fallback: direct 1inch call
  const directUrl = `https://api.1inch.dev/charts/v1.0/chart/line/${token0}/${token1}/${period}/${chainId}`;
  const apiKey = process.env.ONEINCH_API_KEY;
  try {
    const controller2 = new AbortController();
    const to2 = setTimeout(() => controller2.abort(), 7_500);
    try {
      const res2 = await fetch(directUrl, {
        cache: "no-store",
        signal: controller2.signal,
        headers: apiKey
          ? {
              Authorization: `Bearer ${apiKey}`,
              "x-api-key": apiKey,
              Accept: "application/json",
            }
          : undefined,
      });
      if (process.env.NODE_ENV !== "production") {
        console.debug(`[getLineChart] direct => ${res2.ok ? "ok" : `failed (${res2.status})`}`);
      }
      if (!res2.ok) return null;
      const json2 = (await res2.json()) as LinesResponse;
      return json2;
    } finally {
      clearTimeout(to2);
    }
  } catch (err2) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[getLineChart] direct error for ${token0}/${token1}:`, err2);
    }
    return null;
  } finally {
    console.timeEnd?.(`[getLineChart] ${token0}/${token1}`);
  }
}
