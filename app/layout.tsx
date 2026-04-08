import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { AppChrome } from "@/components/AppChrome";
import { SwiftLinkProvider } from "@/context/SwiftLinkContext";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const site = "https://swiftlinkpro.vercel.app";

export const metadata: Metadata = {
  title: "SwiftLink Pro | Command Center",
  description:
    "Turn your WhatsApp into a professional online catalog with SwiftLink Pro.",
  keywords: [
    "WhatsApp store",
    "online catalog",
    "SwiftLink Pro",
    "e-commerce",
  ],
  icons: [{ rel: "icon", url: "/logo.png" }],
  openGraph: {
    type: "website",
    url: site,
    title: "SwiftLink Pro | Professional WhatsApp Storefront",
    description:
      "Launch your online catalog in 60 seconds. Real-time live commerce for WhatsApp business.",
    images: [`${site}/logo.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "SwiftLink Pro | Professional WhatsApp Storefront",
    description:
      "Launch your online catalog in 60 seconds. Real-time live commerce for WhatsApp business.",
    images: [`${site}/logo.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <Suspense fallback={null}>
          <SwiftLinkProvider>
            <AppChrome>{children}</AppChrome>
          </SwiftLinkProvider>
        </Suspense>
      </body>
    </html>
  );
}
