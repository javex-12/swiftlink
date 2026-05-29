import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/pro') || 
                          request.nextUrl.pathname.startsWith('/business') ||
                          request.nextUrl.pathname.startsWith('/dispatch');

  if (isProtectedRoute) {
    if (!user) {
      return NextResponse.redirect(new URL('/signup?mode=login', request.url))
    }
    
    // THE FIX: Check if email is verified
    // For Google/Social logins, this is usually true instantly.
    // For Email/Password, they MUST click the link we send them.
    if (user.app_metadata.provider === 'email' && !user.email_confirmed_at) {
      return NextResponse.redirect(new URL('/signup?mode=login&error=unverified', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/pro/:path*',
    '/business/:path*',
    '/dispatch/:path*',
    '/account/:path*',
  ],
}