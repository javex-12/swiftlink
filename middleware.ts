import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|.*\\.(?:css|js|map|txt|xml|json|html|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2)$).*)',
  ],
}