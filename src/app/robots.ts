import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.effluxa.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/sample-audit",
          "/signup",
          "/login",
          "/contact",
          "/privacy",
          "/terms",
        ],
        disallow: [
          "/dashboard",
          "/api",
          "/share",
          "/client-share",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
