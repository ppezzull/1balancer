"use client";

import { useState } from "react";
import { useSupabase } from "~~/components/layout/providers/SupabaseProvider";
import { useAccount, useChainId } from "wagmi";
import Link from "next/link";

export default function DemoPage() {
  const { supabase, session, user, loading } = useSupabase();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [cronResult, setCronResult] = useState<string>("");
  const [cronLoading, setCronLoading] = useState(false);

  async function triggerCron() {
    try {
      setCronLoading(true);
      const res = await fetch("/api/balance", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      setCronResult(JSON.stringify(json, null, 2));
    } catch (e: any) {
      setCronResult(String(e?.message || e));
    } finally {
      setCronLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Demo: Auth & Web3 Status</h1>

      <section className="rounded-lg border p-4 space-y-2">
        <h2 className="text-lg font-medium">Supabase</h2>
        <div className="text-sm text-muted-foreground">loading: {String(loading)}</div>
        <div className="text-sm">user id: {user?.id || "-"}</div>
        <div className="text-sm">email: {user?.email || "-"}</div>
        <div className="text-sm">session exp: {session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : "-"}</div>
        <div className="flex gap-2 pt-2">
          <Link href="/auth/login" className="px-3 py-2 rounded bg-black text-white inline-block">Login</Link>
          <Link href="/auth/sign-up" className="px-3 py-2 rounded border inline-block">Sign up</Link>
          <button className="px-3 py-2 rounded border" onClick={() => supabase.auth.signOut()} disabled={loading}>Sign out</button>
        </div>
      </section>

      <section className="rounded-lg border p-4 space-y-2">
        <h2 className="text-lg font-medium">Wagmi</h2>
        <div className="text-sm">isConnected: {String(isConnected)}</div>
        <div className="text-sm">address: {address || "-"}</div>
        <div className="text-sm">chainId: {chainId || "-"}</div>
      </section>

      <section className="rounded-lg border p-4 space-y-2">
        <h2 className="text-lg font-medium">Cron test (/api/balance)</h2>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-indigo-600 text-white disabled:opacity-50" onClick={triggerCron} disabled={cronLoading}>{cronLoading ? "Running..." : "Trigger tick"}</button>
        </div>
        {cronResult && (
          <pre className="mt-3 whitespace-pre-wrap text-xs bg-muted p-3 rounded border overflow-auto max-h-64">{cronResult}</pre>
        )}
      </section>

      <section className="rounded-lg border p-4 space-y-2">
        <h2 className="text-lg font-medium">Client env</h2>
        <div className="text-sm">NEXT_PUBLIC_SUPABASE_URL present: {String(Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL))}</div>
  <div className="text-sm">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY present: {String(Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY))}</div>
      </section>
    </div>
  );
}
