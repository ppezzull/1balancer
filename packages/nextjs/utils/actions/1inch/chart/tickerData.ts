"use server";

import { getLineChart } from "./line-chart";
import { clearTickerCache, getOrFetchTickerData, setCachedTickerData } from "~~/services/store/serverTickerCache";
import { CryptoData, LinesResponse, TOKEN_ADDRESS_MAP } from "~~/types";

const BASE_CHAIN_ID = 8453; // Base mainnet

function computeFromLine(symbol: string, line: LinesResponse | null): CryptoData | null {
  if (!line || !line.data?.length) return null;
  const points = line.data;
  const first = points[0];
  const last = points[points.length - 1];
  const price = last.value ?? 0;
  const change24h = first.value ? ((price - first.value) / first.value) * 100 : 0;
  return {
    symbol,
    name: symbol,
    price,
    change24h,
    trend: change24h > 0 ? "up" : "down",
    volume: "-",
    marketCap: "-",
    sparkline: points.map(p => p.value ?? 0),
  } satisfies CryptoData;
}

/**
 * Return ticker data for all symbols in TOKEN_ADDRESS_MAP and persist to server cache.
 */
export async function getTickerData(): Promise<CryptoData[]> {
  // Use server cache to avoid spamming upstream on every render.
  return getOrFetchTickerData(async () => {
    const list = Object.keys(TOKEN_ADDRESS_MAP).filter(s => !!TOKEN_ADDRESS_MAP[s]);

    const usdc = TOKEN_ADDRESS_MAP.USDC;
    const usdt = TOKEN_ADDRESS_MAP.USDT;

    if (process.env.NODE_ENV !== "production") {
      console.debug(`[getTickerData] start: ${list.length} symbols -> ${list.join(", ")}`);
    }

    console.time?.("getTickerData:total");
    const results = await Promise.all(
      list.map(async symbol => {
        const base = TOKEN_ADDRESS_MAP[symbol];
        if (!base) {
          if (process.env.NODE_ENV !== "production") {
            console.debug(`[getTickerData] skip ${symbol}: no base address`);
          }
          return null;
        }
        const quote = symbol === "USDC" ? usdt : usdc;
        if (process.env.NODE_ENV !== "production") {
          console.debug(`[getTickerData] fetching ${symbol}: ${base} vs ${quote} period=24H chainId=${BASE_CHAIN_ID}`);
        }
        console.time?.(`getTickerData:${symbol}`);
        const line = await getLineChart(base, quote, "24H", BASE_CHAIN_ID);
        console.timeEnd?.(`getTickerData:${symbol}`);
        const computed = computeFromLine(symbol, line);
        if (process.env.NODE_ENV !== "production") {
          console.debug(`[getTickerData] ${symbol} => ${computed ? "ok" : "null"}${!line ? " (no line)" : ""}`);
        }
        return computed;
      }),
    );
    console.timeEnd?.("getTickerData:total");

    const data = results.filter(Boolean) as CryptoData[];
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[getTickerData] done: ${data.length}/${list.length} computed`);
    }
    // persist in cache explicitly as it's useful for logging as well
    setCachedTickerData(data);
    return data;
  });
}

/**
 * Fetch 24h line for a single symbol vs USDC on Base.
 */
export async function getSingleTokenLine(symbol: keyof typeof TOKEN_ADDRESS_MAP): Promise<LinesResponse | null> {
  const base = TOKEN_ADDRESS_MAP[symbol];
  const usdc = TOKEN_ADDRESS_MAP.USDC;
  if (!base || !usdc) return null;
  return getLineChart(base, usdc, "24H", BASE_CHAIN_ID);
}

/**
 * Client-callable server action to refresh the ticker data.
 */
export async function refreshTicker() {
  // Clear cache and refetch
  clearTickerCache();
  const data = await getTickerData();
  return data;
}
