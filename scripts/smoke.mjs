#!/usr/bin/env node
/**
 * Post-deploy smoke test — the readiness gate for a blue-green switch.
 *
 * `npm run smoke -- https://green.example.com`
 *
 * Run this against the *idle* environment before pointing traffic at it. It
 * exits non-zero on the first class of failure, so a pipeline can refuse the
 * switch automatically instead of a human eyeballing a page.
 *
 * Checks the contracts that have actually broken in this repo's history:
 *   - the readiness probe itself (`/api/health`)
 *   - the canonical storefront `/<handle>` and the legacy `/store/<handle>` 308
 *   - a real 404 for an unknown handle (not the old soft-200)
 *   - the PWA surface (`/manifest.webmanifest`, `/sw.js`, `/offline`)
 *   - the auth gate on `/pro`
 *
 * Set `SMOKE_STORE_HANDLE=cyder` to also assert a known live store. Without it,
 * the store-specific checks are skipped rather than guessed.
 *
 * On Vercel with Deployment Protection on, every preview and per-deployment URL
 * answers 302 to the Vercel SSO instead of the app — so a gate against the idle
 * ("green") environment cannot work unauthenticated. Vercel's answer is a
 * Protection Bypass for Automation secret (Project Settings → Deployment
 * Protection), which it also injects into builds as
 * `VERCEL_AUTOMATION_BYPASS_SECRET`; when either that or
 * `SMOKE_PROTECTION_BYPASS` is set, it is sent on every request here. Without
 * one, this script still verifies the public production alias.
 */

const base = (process.argv[2] || process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const handle = process.env.SMOKE_STORE_HANDLE || "";
const unknownHandle = `definitely-not-a-store-${Date.now().toString(36)}`;
const bypass = process.env.SMOKE_PROTECTION_BYPASS || process.env.VERCEL_AUTOMATION_BYPASS_SECRET || "";

/** Protection bypass goes on every request, including the ones that pass their own headers. */
function withBypass(headers) {
  if (!bypass) return headers;
  return { ...(headers || {}), "x-vercel-protection-bypass": bypass };
}

let failures = 0;
let passes = 0;

function record(ok, label, detail) {
  if (ok) {
    passes += 1;
    console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function check(path, { expect, label, headers, parse } = {}) {
  const url = `${base}${path}`;
  let response;
  try {
    response = await fetch(url, { redirect: "manual", headers: withBypass(headers) });
  } catch (error) {
    record(false, label || path, `request failed: ${error.message}`);
    return null;
  }

  const expected = Array.isArray(expect) ? expect : [expect];
  const ok = expected.includes(response.status);
  const contentType = response.headers.get("content-type") || "";

  if (!ok) {
    record(false, label || path, `expected ${expected.join("/")}, got ${response.status}`);
    return response;
  }

  if (parse) {
    try {
      const body = await response.json();
      const problem = parse(body, response);
      record(!problem, label || path, problem || `${response.status} ${contentType}`);
      return response;
    } catch (error) {
      record(false, label || path, `unparseable body: ${error.message}`);
      return response;
    }
  }

  record(true, label || path, `${response.status}${contentType ? ` ${contentType.split(";")[0]}` : ""}`);
  return response;
}

console.log(`\nSmoke test against ${base}\n`);

await check("/api/health", {
  expect: 200,
  label: "/api/health",
  parse: (body) => (body.status === "ok" ? null : `status is "${body.status}" (db: ${body.db?.detail})`),
});

await check("/", { expect: 200, label: "/ (landing)" });
await check("/terms", { expect: 200, label: "/terms" });
await check("/privacy", { expect: 200, label: "/privacy" });
await check("/offline", { expect: 200, label: "/offline" });

await check("/manifest.webmanifest", {
  expect: 200,
  label: "/manifest.webmanifest",
  parse: (body) => {
    if (!body.start_url) return "missing start_url";
    if (!Array.isArray(body.icons) || body.icons.length === 0) return "no icons";
    if (!body.icons.some((icon) => icon.purpose === "maskable")) return "no maskable icon";
    return null;
  },
});

await check("/sw.js", { expect: 200, label: "/sw.js" });

await check("/pro", { expect: 307, label: "/pro (auth gate → signup)" });

await check(`/${unknownHandle}`, { expect: 404, label: `/${unknownHandle} (unknown handle → real 404)` });

if (handle) {
  await check(`/${handle}`, { expect: 200, label: `/${handle} (canonical storefront)` });
  await check(`/store/${handle}`, {
    expect: 308,
    label: `/store/${handle} (legacy → 308)`,
    headers: { "cache-control": "no-cache" },
  });
} else {
  console.log("  SKIP  store checks — set SMOKE_STORE_HANDLE=<handle> to include them");
}

console.log(`\n${passes} passed, ${failures} failed\n`);

/*
 * `process.exitCode`, not `process.exit()`. Node's global fetch keeps a
 * keep-alive socket open, and exiting while it is closing trips a libuv
 * assertion on Windows (`!(handle->flags & UV_HANDLE_CLOSING)`), which prints a
 * crash trace after a green run. The exit status is what the pipeline reads, so
 * setting it lets the loop drain and the script still fail the gate correctly.
 */
process.exitCode = failures === 0 ? 0 : 1;
