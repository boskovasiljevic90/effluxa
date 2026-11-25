import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoPageView from "@/components/SeoPageView";
import { SEO_PAGES } from "@/content/seoPages";
import { SEO_PAGES_EXTRA } from "@/content/seoPagesExtra";

const pages = [...SEO_PAGES, ...SEO_PAGES_EXTRA].filter((page) => page.type === "use-case");

export function generateStaticParams() {
  return pages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const page = pages.find((item) => item.slug === params.slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `https://www.effluxa.com/use-cases/${page.slug}` },
    openGraph: { title: page.title, description: page.description, url: `https://www.effluxa.com/use-cases/${page.slug}`, siteName: "Effluxa", type: "article" },
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  const page = pages.find((item) => item.slug === params.slug);
  if (!page) notFound();
  return <SeoPageView page={page} hub={{ href: "/compare", label: "All use cases" }} />;
}
