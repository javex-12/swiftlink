import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
  if (!url || !key || url.includes("dummy-project")) return response;

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

  if (user && matches(pathname, ADMIN_PREFIXES)) {
    const { data, error } = await supabase
      .from("system_admins")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) {
      const dashboard = request.nextUrl.clone();
      dashboard.pathname = "/pro";
      dashboard.search = "";
      return NextResponse.redirect(dashboard);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|workbox-.*|.*\\.(?:css|js|map|txt|xml|json|html|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2)$).*)",
  ],
};
