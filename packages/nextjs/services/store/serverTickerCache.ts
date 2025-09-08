import { CryptoData } from "~~/types";

type CacheEntry = { data: CryptoData[]; timestamp: number };

const DEFAULT_TTL_MS = Number(process.env.TICKER_TTL_MS ?? 5 * 60 * 1000); // 5 minutes by default

let cache: CacheEntry | null = null;
let inflight: Promise<CryptoData[]> | null = null;

export function getCachedTickerData(): CryptoData[] | null {
  if (!cache) return null;
  const age = Date.now() - cache.timestamp;
  if (age > DEFAULT_TTL_MS) return null;
  return cache.data;
}

export function setCachedTickerData(data: CryptoData[]) {
  cache = { data, timestamp: Date.now() };
}

export function clearTickerCache() {
  cache = null;
}

export async function getOrFetchTickerData(fetcher: () => Promise<CryptoData[]>): Promise<CryptoData[]> {
  const cached = getCachedTickerData();
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const data = await fetcher();
      setCachedTickerData(data);
      return data;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
