import { NextRequest } from "next/server";
import { runBotTick } from "@/services/bot/tick";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const started = Date.now();
  try {
    // In the cron tick, run a single pass that should iterate all Balancers from DB (Supabase)
    await runBotTick();
    return new Response(
      JSON.stringify({ ok: true, started, finished: Date.now() }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || String(err) }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
