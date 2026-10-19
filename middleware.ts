import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isReservedFirstSegment, normalizeStoreUsername } from "@/lib/utils";


/**
 * Server-side route protection + session refresh.
 *
 * Replaces the previous no-op middleware (see docs/00-AUDIT.md F-01). The
 * client-side `PROTECTED_PATHS` check in SwiftLinkContext stays as a UX nicety
 * but is no longer load-bearing.
 */

// Merchant-only routes. `/cart` is intentionally excluded: the customer cart
// lives inside the storefront and anonymous shoppers must reach it.
const PROTECTED_PREFIXES = ["/pro", "/business", "/account"];

// Routes that additionally require an entry in `system_admins`.
const ADMIN_PREFIXES = ["/pro/admin"];

/**
 * Whether this request is for the platform itself rather than a merchant domain.
 *
 * `NEXT_PUBLIC_APP_HOST` covers the production app if it runs on its own custom
 * domain (e.g. `swiftlink.pro`); without it, the app's own domain would be
 * treated as a merchant hostname and rewritten to a store.
 */
function isPlatformHost(host: string): boolean {
  if (!host) return true;
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
  if (host.endsWith(".vercel.app")) return true;
  const appHost = process.env.NEXT_PUBLIC_APP_HOST?.trim().toLowerCase();
  return Boolean(appHost && host === appHost);
}

const SIGN_IN_PATH = "/signup";

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const { pathname } = request.nextUrl;
  const needsUser = matches(pathname, PROTECTED_PREFIXES);

  // Unconfigured environment (local demo mode): nothing is reachable that needs
  // protecting, so let the request through untouched.
  if (!url || !key || !url.startsWith("http") || url.includes("dummy-project") || url.includes("your-project")) return response;
  try {
    new URL(url);
  } catch {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  /*
   * Custom domains.
   *
   * A merchant's own hostname serves their storefront, so it is rewritten to the
   * canonical `/<handle>` route — the same page, metadata and JSON-LD as the
   * shared link, with no second rendering path to keep in sync. The lookup only
   * returns verified domains (`resolve_store_domain`), so adding a row in
   * Settings does not let anyone serve a store on a hostname they do not control.
   *
   * Unknown merchant hosts fall through untouched and get the normal 404 —
   * answering with something clever there would leak which domains are claimed.
   */
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  if (host && !isPlatformHost(host)) {
    const { data } = await supabase.rpc("resolve_store_domain", { hostname: host });
    const resolved = (Array.isArray(data) ? data[0] : data) as { handle?: string } | null;
    const handle = resolved?.handle ? normalizeStoreUsername(String(resolved.handle)) : null;
    if (handle) {
      const target = request.nextUrl.clone();
      target.pathname = `/${handle}`;
      const rewritten = NextResponse.rewrite(target, { request });
      // Keep any cookie the auth client refreshed while we were here.
      response.cookies.getAll().forEach((cookie) => rewritten.cookies.set(cookie));
      return rewritten;
    }
  }

  // Legacy storefront URL → canonical, as a real 308.
  //
  // `/store/<handle>?shop=<id>` was the shared URL before the canonical
  // `/<handle>` shape. Redirecting here (rather than in the page) keeps the
  // redirect a genuine HTTP 308; a server-component `permanentRedirect` inside
  // the app shell is delivered as a client-side redirect with a 200, which is
  // exactly the SEO ambiguity this work is removing.
  const legacy = pathname.match(/^\/store\/([^/]+)\/?$/);
  if (legacy) {
    const shop = request.nextUrl.searchParams.get("shop");
    let handle: string | null = null;

    if (shop) {
      const { data } = await supabase
        .from("stores")
        .select("store_username")
        .eq("id", shop)
        .maybeSingle();
      if (data?.store_username) handle = normalizeStoreUsername(String(data.store_username)) || null;
    }
    if (!handle) handle = normalizeStoreUsername(legacy[1]) || null;

    const target = new URL(request.url);
    target.search = "";
    target.pathname = handle ? `/${handle}` : "/";
    return NextResponse.redirect(target, 308);
  }

  // Refreshes the session cookie when expired — must run on every request.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (needsUser && !user) {
    const signIn = request.nextUrl.clone();
    signIn.pathname = SIGN_IN_PATH;
    signIn.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(signIn);
  }

  // Canonical storefront guard.
  //
  // `/<handle>` is a catch-all dynamic route, so an unknown handle still matches
  // it. The page calls `notFound()`, but by then the app shell has streamed (the
  // root layout wraps children in Suspense so pages using `useSearchParams` can
  // bail out to client rendering), and a flushed response cannot change its
  // status — the unknown handle would be served as a 200 "soft 404".
  //
  // Resolving the handle here, before rendering, keeps the real 404: unknown
  // handles rewrite to a path no route matches, which Next serves with its
  // not-found page and a 404 status.
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 1 && !isReservedFirstSegment(segments[0])) {
    const handle = normalizeStoreUsername(segments[0]);
    if (handle) {
      const { data } = await supabase
        .from("stores")
        .select("id")
        .ilike("store_username", handle)
        .maybeSingle();

      if (!data) {
        const missing = request.nextUrl.clone();
        missing.pathname = "/__missing__/__missing__/__missing__";
        missing.search = "";
        return NextResponse.rewrite(missing);
      }
    }
  }

  if (user && matches(pathname, ADMIN_PREFIXES)) {
    const { data, error } = await supabase
      .from("system_admins")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) {
      // Send the user somewhere that can explain itself. A bare redirect to
      // `/pro` looked identical to the page not existing
      // (docs/05-IMPROVEMENT-PLAN.md R-01/R-14); `/pro` renders an explicit
      // "admin access required" notice for this flag.
      const dashboard = request.nextUrl.clone();
      dashboard.pathname = "/pro";
      dashboard.search = "?denied=admin";
      return NextResponse.redirect(dashboard);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // `api/health` and `api/errors` are excluded so neither depends on the auth
    // stack: the readiness probe must be cheap under a load balancer, and error
    // reporting must still work when auth is what broke.
    // `auth/callback` is excluded so the OAuth code-exchange route never gets
    // caught by the session guard (which would redirect to /signup before the
    // session cookie is even written).
    "/((?!api/(?:health|errors)|auth/callback|_next/static|_next/image|favicon.ico|manifest\\.(?:json|webmanifest)|sw\\.js|workbox-.*|.*\\.(?:css|js|map|txt|xml|json|html|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2)$).*)",
  ],
};
