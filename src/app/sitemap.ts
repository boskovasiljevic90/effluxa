import type { MetadataRoute } from "next";

import { SEO_PAGES } from "@/content/seoPages";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.effluxa.com";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/sample-audit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/for-accounting-firms`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/partners`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.88,
    },
    {
      url: `${baseUrl}/instant`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.98,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools/duplicate-invoice-finder`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.92,
    },
    {
      url: `${baseUrl}/security`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/resources`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...[
      "duplicate-invoice-audit",
      "vendor-price-creep-audit",
      "recurring-software-spend-audit",
      "cash-flow-working-capital-audit",
      "accounting-firm-client-leakage-review",
    ].map((slug) => ({
      url: `${baseUrl}/resources/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/use-cases`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...SEO_PAGES.map((page) => ({
      url: `${baseUrl}/${page.type === "comparison" ? "compare" : "use-cases"}/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.82,
    })),
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
