import type { MetadataRoute } from "next";

const site = "https://swiftlinkpro.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/terms", "/store/"],
        disallow: [
          "/account",
          "/business",
          "/cart",
          "/dispatch",
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
