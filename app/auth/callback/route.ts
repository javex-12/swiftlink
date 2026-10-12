import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

/**
 * OAuth / magic-link callback handler.
 *
 * After Google authenticates the user, Supabase redirects here with a
 * short-lived `?code=` query parameter. We exchange it for a full session
 * (stored in the `sb-*` cookies that middleware reads) and then forward the
 * user to wherever they were heading — defaulting to `/pro`.
 *
 * Without this route, the `code` would arrive at whatever page was set as
 * `redirectTo` in `signInWithOAuth`, be silently ignored, and the middleware
 * would see no session cookie → infinite redirect back to /signup.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/pro";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Surface any OAuth-level errors to the sign-in page.
  if (error) {
    const signIn = new URL("/signup", origin);
    signIn.searchParams.set(
      "error",
      errorDescription ?? error ?? "OAuth sign-in failed."
    );
    return NextResponse.redirect(signIn);
  }

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      // Redirect to the intended destination (or /pro if unset).
      // `next` is already URL-encoded by the sign-in page; decode it safely.
      const destination = next.startsWith("/") ? next : "/pro";
      return NextResponse.redirect(new URL(destination, origin));
    }

    // Exchange failed — send back to sign-in with an error message.
    const signIn = new URL("/signup", origin);
    signIn.searchParams.set(
      "error",
      exchangeError.message ?? "Failed to complete sign-in. Please try again."
    );
    return NextResponse.redirect(signIn);
  }

  // No code at all — just go home.
  return NextResponse.redirect(new URL("/", origin));
}
