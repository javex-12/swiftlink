/* SwiftLink Pro service worker — hand-rolled, no build step.
 *
 * Why hand-rolled instead of Serwist/next-pwa: the production bundle is built
 * with `output: "standalone"` and must stay reproducible on a constrained
 * runner. A build-pipeline plugin adds a second compilation pass and a large
 * dependency tree for what is, in the end, ~150 lines of caching policy. This
 * file is served verbatim from `public/` and versioned by `VERSION` below.
 *
 * Caching policy
 *   - Navigations: network-first. Public pages (storefronts, marketing,
 *     `/offline`) are cached so a shopper can reopen a store without a
 *     connection; authenticated console routes are never cached, so a stale
 *     shell is never handed to a signed-out visitor.
 *   - Immutable build assets and media: cache-first (they are content-hashed).
 *   - Everything else — Supabase, `/api/*`, RSC payloads, non-GET — is left to
 *     the network untouched.
 */

const VERSION = "v1";
const PRECACHE = `swiftlink-precache-${VERSION}`;
const RUNTIME = `swiftlink-runtime-${VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-32.png",
];

// Authenticated console routes. Their HTML is a client-rendered shell, and
// caching it would risk showing a signed-out visitor a console frame.
const PRIVATE_NAV_PREFIXES = [
  "/pro",
  "/business",
  "/account",
  "/cart",
  "/signup",
  "/reset-password",
  "/dev",
];

const STATIC_ASSET = /\.(?:css|js|mjs|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      // Add individually so one 404 does not abort the whole install.
      await Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => undefined),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== PRECACHE && key !== RUNTIME)
          .map((key) => caches.delete(key)),
      );
      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.disable();
        } catch {
          /* not supported — nothing to do */
        }
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

function isPrivateNav(pathname) {
  return PRIVATE_NAV_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

async function cacheResponse(cacheName, request, response) {
  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  } catch {
    /* quota or opaque response — caching is best-effort */
  }
}

async function handleNavigate(request) {
  const url = new URL(request.url);
  const cacheable = !isPrivateNav(url.pathname);
  try {
    const response = await fetch(request);
    if (cacheable && response && response.ok && response.type === "basic") {
      await cacheResponse(RUNTIME, request, response);
    }
    return response;
  } catch {
    const runtime = await caches.open(RUNTIME);
    const cached = (await runtime.match(request, { ignoreSearch: true })) || (await caches.match(request));
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response("You are offline and this page is not available yet.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function handleStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === "basic") {
      await cacheResponse(RUNTIME, request, response);
    }
    return response;
  } catch {
    return new Response("", { status: 504, statusText: "Offline" });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Same-origin only. Supabase, Google and everything else stay on the network.
  if (url.origin !== self.location.origin) return;

  // Never intercept API or Next.js router data traffic.
  if (
    url.pathname.startsWith("/api/") ||
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-Prefetch") === "1" ||
    request.headers.get("Next-Router-State-Tree")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigate(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || STATIC_ASSET.test(url.pathname)) {
    event.respondWith(handleStatic(request));
  }
});
