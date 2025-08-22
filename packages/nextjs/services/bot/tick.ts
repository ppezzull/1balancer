/*
  Shared bot tick used by:
  - serverless route (/api/bot/tick) so Vercel Cron can schedule free plan runs
  - long-running worker (services/bot/worker.mjs) for self-hosted/pm2/docker
*/

/* eslint-disable no-console */

export async function runBotTick(): Promise<void> {
  // TODO: wire real logic (pricing, drift, orders, approvals, txs, persistence)
  console.log("[bot] tick invoked", new Date().toISOString());
}
