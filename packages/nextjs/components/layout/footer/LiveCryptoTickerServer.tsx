import { Suspense } from "react";
import LiveCryptoSkeleton from "./LiveCryptoSkeleton";
import { LiveCryptoTicker } from "./LiveCryptoTicker";
import { getTickerData } from "~~/utils/actions/1inch/chart/tickerData";

async function TickerWithData() {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[LiveCryptoTickerServer] fetching ticker data...");
  }
  const initial = await getTickerData();
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[LiveCryptoTickerServer] fetched: ${initial.length} items`);
  }
  return <LiveCryptoTicker initial={initial} />;
}

export default function LiveCryptoTickerServer() {
  return (
    <Suspense fallback={<LiveCryptoSkeleton />}>
      <TickerWithData />
      {/* Async Server Component */}
    </Suspense>
  );
}
