import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { AppChrome } from "@/components/AppChrome";
import { SwiftLinkProvider } from "@/context/SwiftLinkContext";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const site = "https://swiftlinkpro.vercel.app";
const siteName = "SwiftLink Pro";
const title = "SwiftLink Pro | The High-Fidelity WhatsApp Commerce Workspace";
const description =
  "The elite command center for Nigerian brands. Build cinematic WhatsApp storefronts, manage multiple brands, track real-time dispatch, and dominate your niche with SwiftLink Pro.";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  applicationName: siteName,
  title: {
    default: title,
    template: `%s | ${siteName}`,
  },
  description,
  keywords: [
    "WhatsApp e-commerce Nigeria",
    "Visual Store Designer",
    "Cinematic Storefront Templates",
    "Multi-store management software",
    "Real-time dispatch tracking Nigeria",
    "WhatsApp catalog builder pro",
    "SwiftLink Pro Workspace",
    "Premium WhatsApp storefront",
    "No-code ecommerce for vendors",
    "Nigerian business automation",
  ],
  authors: [{ name: "SwiftLink Pro" }],
  creator: "SwiftLink Pro",
  publisher: "SwiftLink Pro",
  category: "Business Software",
  alternates: {
    canonical: "/",
  },
  icons: [{ rel: "icon", url: "/logo.png" }],
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
    priceCurrency: "NGN",
  },
  featureList: [
    "WhatsApp storefront builder",
    "Product catalog management",
    "Customer cart and WhatsApp ordering",
    "Delivery tracking portal",
    "Storefront visual editor",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <Suspense fallback={null}>
          <SwiftLinkProvider>
            <AppChrome>{children}</AppChrome>
          </SwiftLinkProvider>
          <PWAInstallPrompt />
        </Suspense>
      </body>
    </html>
  );
}
