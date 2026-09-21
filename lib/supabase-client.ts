import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The concrete client type every call site types against.
 *
 * Declared explicitly rather than via `ReturnType<typeof createBrowserClient>`
 * because `ReturnType` resolves an overloaded function to its *last* overload,
 * which loses the generic parameter defaults — and with them the inferred types
 * inside every `.then(({ data: { session } }) => …)` callback in the codebase
 * (they all became implicit `any` and failed the strict-mode build).
 */
export type SupabaseBrowserClient = SupabaseClient;

/**
 * Browser-side Supabase client.
 *
 * The storage choice here is load-bearing, which is why it is commented: it used
 * to be plain `createClient`, whose default is **localStorage**. Meanwhile
 * `middleware.ts` (P0, F-01) validates the session from **cookies** on every
 * request. The result was that login "worked" — `signInWithPassword` succeeded,
 * the user object was even cached — and then `router.push("/pro")` bounced
 * straight back to `/signup`, because the browser sent no `sb-*` cookie for the
 * middleware to read. An infinite redirect loop that looks exactly like
 * "login is broken".
 *
 * `createBrowserClient` stores the session in cookies (the same ones the
 * middleware refreshes), so the client, the middleware and the server components
 * all see one session. This is the standard Supabase SSR arrangement:
 * https://supabase.com/docs/guides/auth/server-side/nextjs
 *
 * Everything in the app imports this singleton, so no call site changed.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * A module-level singleton: `createBrowserClient` wires up listeners to keep the
 * cookie in sync, and creating one per import would have them fighting each
 * other. Created lazily so that builds without env vars never touch the network,
 * and a clear error (instead of a silent dummy client) surfaces when a call is
 * attempted without configuration.
 */
let client: SupabaseBrowserClient | null = null;

export function getSupabaseBrowserClient(): SupabaseBrowserClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see docs/04-SUPABASE-WORKFLOW.md §4).",
    );
  }
  if (!client) {
    client = createBrowserClient(supabaseUrl!, supabaseAnonKey!) as SupabaseBrowserClient;
  }
  return client;
}

/**
 * Backwards-compatible singleton for existing call sites.
 *
 * In an unconfigured environment this is a stub that never touches the network;
 * `isSupabaseConfigured()` gates every auth/data path that matters, and demo mode
 * relies on that instead of on this object throwing. Kept as a plain object with
 * lazy proxies so importing this module stays side-effect free at build time.
 */
export const supabase: SupabaseBrowserClient = new Proxy({} as SupabaseBrowserClient, {
  get(_target, prop) {
    const real = getSupabaseBrowserClient() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export function isSupabaseConfigured() {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.includes("supabase.co") &&
      !supabaseUrl.includes("dummy-project"),
  );
}
