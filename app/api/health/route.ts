import { NextResponse } from "next/server";
import { supabaseServerEnv } from "@/lib/supabase/server";

/**
 * Readiness probe.
 *
 * A blue-green (or rolling) release needs a way to answer one question before
 * traffic is switched: *is the new environment actually able to serve?* Without
 * it the switch is a guess. This endpoint answers it for both the app process
 * and its one hard dependency, the database.
 *
 * Contract:
 *   - `200` `{ status: "ok" }` — the app booted and either the database is
 *     reachable, or Supabase is not configured at all (local demo mode, where
 *     nothing sensitive is reachable).
 *   - `503` `{ status: "degraded" }` — Supabase *is* configured but unreachable
 *     (checked twice before deciding, see `DB_PROBE_ATTEMPTS`). Do not switch
 *     traffic to an environment in this state.
 *
 * Deliberately excluded from `middleware.ts`: a probe must not depend on the
 * auth stack it is being used to validate, and it must stay fast under load.
 *
 * Never returns credentials, the database hostname, or any row data — only
 * liveness facts.
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * One slow round trip must not mark an environment unready.
 *
 * With a single 3 s attempt this probe reported `503 degraded` for a Supabase
 * project that was answering fine a second later (~1.3 s on success, but the
 * shared auth endpoint spikes past 3 s). Because the smoke gate and the
 * blue-green promotion both gate on this, that is a fail-closed false negative:
 * safe, but it blocks a release that is actually healthy. So: a slightly larger
 * per-attempt budget, and one retry before declaring the database unreachable.
 * Worst case (a genuinely down dependency) is ~8 s, which only happens when the
 * deploy is already being rejected.
 */
const DB_PROBE_TIMEOUT_MS = 4000;
const DB_PROBE_ATTEMPTS = 2;

async function probeDatabaseOnce(url: string, key: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DB_PROBE_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    // GoTrue's own health endpoint: cheapest possible round trip that still
    // proves the project answers, and it needs no table and no RLS policy.
    const response = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      signal: controller.signal,
      cache: "no-store",
    });
    return {
      reachable: response.ok,
      latencyMs: Date.now() - startedAt,
      detail: response.ok ? "ok" : `http ${response.status}`,
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      reachable: false,
      latencyMs: Date.now() - startedAt,
      detail: aborted ? "timeout" : "unreachable",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function probeDatabase(url: string, key: string) {
  let last = { reachable: false, latencyMs: 0, detail: "unreachable" };
  for (let attempt = 0; attempt < DB_PROBE_ATTEMPTS; attempt += 1) {
    const result = await probeDatabaseOnce(url, key);
    if (result.reachable) return result;
    last = result;
  }
  return last;
}

export async function GET() {
  const env = supabaseServerEnv();

  const db = env
    ? await probeDatabase(env.url, env.key)
    : { reachable: false, latencyMs: 0, detail: "not configured" };

  const configured = env !== null;
  const healthy = !configured || db.reachable;

  const body = {
    status: healthy ? "ok" : "degraded",
    app: {
      name: "swiftlink-pro",
      env: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
      commit:
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.GIT_COMMIT_SHA ||
        "unknown",
      uptimeSeconds: Math.round(process.uptime()),
    },
    db: {
      configured,
      reachable: db.reachable,
      latencyMs: db.latencyMs,
      detail: db.detail,
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: healthy ? 200 : 503,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
