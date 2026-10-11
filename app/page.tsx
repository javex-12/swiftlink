import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeClient } from "@/components/HomeClient";
import { SEO_SITE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "SwiftLink — Create a Free Online Store That Orders on WhatsApp",
  description:
    "Launch your free mobile-first online store in 60 seconds with SwiftLink. Add products, accept orders directly via WhatsApp, and manage your inventory with 0% commission.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SwiftLink — Launch Your Free Online Store in 60 Seconds",
    description:
      "Sell directly on WhatsApp with zero code, zero platform fees, and fast setup. Turn clicks into instant conversations and sales.",
    url: SEO_SITE,
    siteName: "SwiftLink",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SwiftLink — Create a Free Online Store That Orders on WhatsApp",
    description:
      "Sell directly on WhatsApp with zero code, zero platform fees, and fast setup.",
  },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "SwiftLink",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description:
          "Free mobile-first online store builder enabling merchants to sell products and receive orders directly on WhatsApp.",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={null}>
        <HomeClient />
      </Suspense>
    </>
  );
}
