import type { MetadataRoute } from "next";
import { SEO_SITE } from "@/lib/seo";

const site = SEO_SITE;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/stores", "/terms", "/store/"],
        disallow: [
          "/account",
          "/business",
          "/cart",
          "/pro",
          "/reset-password",
          "/signup",
        ],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
