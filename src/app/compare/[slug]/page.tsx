import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoPageView from "@/components/SeoPageView";
import { SEO_PAGES } from "@/content/seoPages";

const pages = SEO_PAGES.filter((page) => page.type === "comparison");

export function generateStaticParams() {
  return pages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const page = pages.find((item) => item.slug === params.slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `https://www.effluxa.com/compare/${page.slug}` },
    openGraph: { title: page.title, description: page.description, url: `https://www.effluxa.com/compare/${page.slug}`, siteName: "Effluxa", type: "article" },
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  const page = pages.find((item) => item.slug === params.slug);
  if (!page) notFound();
  return <SeoPageView page={page} hub={{ href: "/compare", label: "All comparisons" }} />;
}
