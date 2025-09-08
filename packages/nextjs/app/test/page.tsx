"use client";

import { useState } from "react";
import { refreshTicker } from "~~/utils/actions/1inch/chart/tickerData";

type Item = {
  symbol: string;
  ok: boolean;
  status?: number;
  error?: string;
};

export default function TestChartsPage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Call the server action which itself calls getTickerData and returns CryptoData[]
      const data = await refreshTicker();
      const out: Item[] = data.map((d: any) => ({ symbol: d.symbol, ok: true, status: 200 }));
      setItems(out);
    } catch (e: any) {
      setItems([
        {
          symbol: "ALL",
          ok: false,
          status: 0,
          error: e?.message || String(e),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">1inch Charts API Tester</h1>
      <p className="text-sm text-gray-500">Fetches ticker data server-side via getTickerData().</p>

      <button
        onClick={handleRefresh}
        disabled={loading}
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
      >
        {loading ? "Refreshing…" : "Refresh charts now"}
      </button>

      <div className="mt-4">
        {items === null ? (
          <div className="text-sm text-gray-400">No results yet.</div>
        ) : (
          <ul className="space-y-2">
            {items.map(it => (
              <li key={it.symbol} className="text-sm">
                <span className="font-mono mr-2">{it.symbol}</span>
                <span className={it.ok ? "text-green-500" : "text-red-500"}>{it.status ?? "-"}</span>
                {!it.ok && it.error && <span className="ml-2 text-xs text-gray-500 break-all">{it.error}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
