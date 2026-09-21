import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

/**
 * Server-side Supabase access.
 *
 * Every privileged read or write must go through here (or through RLS) — never
 * through a client-side check. See docs/00-AUDIT.md F-01/F-06.
 */

export function supabaseServerEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("dummy-project")) return null;
  return { url, key };
}

export function isServerSupabaseConfigured(): boolean {
  return supabaseServerEnv() !== null;
}

/**
 * Cookie-bound Supabase client for Server Components, Route Handlers and
 * Server Actions. Returns null when Supabase is not configured so that the
 * app can still run in local "demo mode" without credentials.
 */
export async function createSupabaseServerClient() {
  const env = supabaseServerEnv();
  if (!env) return null;

  const cookieStore = await cookies();

  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component render, where cookies are read-only.
          // Session refresh is handled by middleware, so this is safe to ignore.
        }
      },
    },
  });
}

/** Current authenticated user, or null. Never trusts client-side state. */
export async function getServerUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolve the current user for a protected route, redirecting to sign-in when
 * absent. In unconfigured "demo mode" there is no session concept, so the route
 * is allowed to render (nothing sensitive is reachable without Supabase).
 */
export async function requireUser(redirectTo = "/signup"): Promise<User | null> {
  if (!isServerSupabaseConfigured()) return null;
  const user = await getServerUser();
  if (!user) redirect(redirectTo);
  return user;
}

/** Server-side admin check against `system_admins`. */
export async function isServerAdmin(userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  try {
    const { data, error } = await supabase
      .from("system_admins")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    return Boolean(data && !error);
  } catch {
    return false;
  }
}

/** Require an authenticated admin, or redirect. */
export async function requireAdmin(): Promise<User | null> {
  const user = await requireUser();
  if (!user) return null; // demo mode
  if (!(await isServerAdmin(user.id))) redirect("/pro");
  return user;
}
