import type { MetadataRoute } from "next";

/**
 * PWA manifest, served at `/manifest.webmanifest`.
 *
 * Replaces `public/manifest.json`, which shipped three defects:
 *   1. `"sizes": "192x192 512x512"` on a single icon entry — an invalid value,
 *      so browsers ignored the icon and installed the app with a screenshot.
 *   2. `theme_color: "#10b981"` did not match the app's `#0a1210` surface
 *      (`styles/tokens.css` `--app-bg`), so the installed task switcher and
 *      status bar flashed the wrong colour.
 *   3. `start_url: "/pro"` is behind auth middleware, so a cold launch of the
 *      installed app bounced to `/signup` and lost the entry in history.
 *
 * `start_url` now points at the landing route, which routes an authenticated
 * merchant straight into the console and offers sign-in to everyone else.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "SwiftLink Pro — WhatsApp Commerce Workspace",
    short_name: "SwiftLink Pro",
    description:
      "Build a storefront for your business in minutes. Publish a fast, mobile-first catalog, manage your products and branding, and take orders straight to WhatsApp.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#0a1210",
    theme_color: "#0a1210",
    lang: "en",
    dir: "ltr",
    categories: ["business", "shopping", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // Chrome shows screenshots in the richer install prompt; it needs one
    // "narrow" (phone) and one "wide" (desktop) entry to render it.
    screenshots: [
      {
        src: "/screenshots/home_390x844.png",
        sizes: "390x1076",
        type: "image/png",
        form_factor: "narrow",
        label: "SwiftLink Pro storefront on mobile",
      },
      {
        src: "/screenshots/home_1440x900.png",
        sizes: "1440x900",
        type: "image/png",
        form_factor: "wide",
        label: "SwiftLink Pro on desktop",
      },
    ],
    shortcuts: [
      {
        name: "Open dashboard",
        short_name: "Dashboard",
        url: "/pro",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "View analytics",
        short_name: "Analytics",
        url: "/pro/analytics",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
