import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Plus_Jakarta_Sans,
  Instrument_Serif,
  Cinzel,
  DM_Sans,
  Bricolage_Grotesque,
} from "next/font/google";
import { AppChrome } from "@/components/AppChrome";
import { SwiftLinkProvider } from "@/context/SwiftLinkContext";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { ErrorMonitor } from "@/components/ErrorMonitor";
import "@/styles/tokens.css";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
});

/**
 * Fonts are self-hosted through `next/font`, which removes the two
 * `fonts.googleapis.com` preconnects and the render-blocking stylesheet that
 * loaded four families (docs/00-AUDIT.md F-19, F-20).
 *
 * It also fixes a quieter bug: `app/globals.css` used to declare
 * `font-family: var(--font-inter), system-ui` while `--font-inter` was defined
 * **nowhere**, so the whole list was invalid at computed-value time and body copy
 * silently rendered in the system font. Registering the `variable` names below is
 * what makes `--font-sans` in `styles/tokens.css` resolve.
 *
 * `preload: false` on the two display faces: they appear only on two console
 * screens and must not sit on the critical path. Next self-hosts them, so there
 * is no third-party request either way.
 *
 * The storefront's selectable font *pairings* land with the storefront rebuild in
 * P4 (`docs/02-BUILDER-ARCHITECTURE.md` §7); the pairing is already part of the
 * tenant theme contract (`lib/theme/theme-schema.ts`).
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
  variable: "--font-instrument-serif",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-cinzel",
});

const site = "https://swiftlinkpro.vercel.app";
const siteName = "SwiftLink Pro";
const title = "SwiftLink Pro | The High-Fidelity WhatsApp Commerce Workspace";
const description =
  "Build a storefront for your business in minutes. Publish a fast, mobile-first product catalog, manage your products and branding, and take orders straight to WhatsApp with SwiftLink Pro.";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  applicationName: siteName,
  title: {
    default: title,
    template: `%s | ${siteName}`,
  },
  description,
  keywords: [
    "WhatsApp e-commerce",
    "Global WhatsApp Storefront",
    "WhatsApp Catalog Builder",
    "Multi-store management software",
    "Custom storefront builder",
    "WhatsApp catalog builder pro",
    "SwiftLink Pro Workspace",
    "Premium WhatsApp storefront",
    "No-code ecommerce for vendors",
    "Global business automation",
  ],
  authors: [{ name: "SwiftLink Pro" }],
  creator: "SwiftLink Pro",
  publisher: "SwiftLink Pro",
  category: "Business Software",
  alternates: {
    canonical: "/",
  },
  // Real, correctly-sized assets. `app/manifest.ts` carries the PWA icon set;
  // these are the tab/favicon and iOS home-screen variants.
  icons: [
    { rel: "icon", url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    { rel: "icon", url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    { rel: "apple-touch-icon", url: "/icons/apple-touch-icon.png", sizes: "180x180" },
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName,
    locale: "en_US",
    url: site,
    title,
    description,
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "SwiftLink Pro logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/logo.png"],
  },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteName,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: site,
  image: `${site}/logo.png`,
  description,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "WhatsApp storefront builder",
    "Product catalog management",
    "Customer cart and WhatsApp ordering",
    "Storefront visual editor",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${dmSans.variable} ${bricolage.variable} ${jakarta.variable} ${instrumentSerif.variable} ${cinzel.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
        {/* Fonts are self-hosted by next/font — no third-party stylesheet here.
            The manifest <link> is injected automatically from app/manifest.ts. */}
        <meta name="theme-color" content="#0a1210" />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <Suspense fallback={null}>
          <SwiftLinkProvider>
            <AppChrome>{children}</AppChrome>
          </SwiftLinkProvider>
          <PWAInstallPrompt />
          <ServiceWorkerRegister />
          <ErrorMonitor />
        </Suspense>
      </body>
    </html>
  );
}
