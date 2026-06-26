import type { Metadata } from "next";
import "./globals.css";
import AnalyticsScripts from "@/components/analytics/AnalyticsScripts";
import CookieConsent from "@/components/analytics/CookieConsent";

export const metadata: Metadata = {
  title: "Effluxa — AI Financial Leak Audit",
  description:
    "Upload financial files and detect hidden financial leakage, vendor waste, and savings opportunities with AI.",
  keywords: [
    "AI financial audit",
    "financial leakage detection",
    "expense analysis",
    "AI finance tool",
    "vendor audit",
    "cost savings AI",
  ],
  openGraph: {
    title: "Effluxa — AI Financial Leak Audit",
    description:
      "Find hidden financial leakage in minutes with AI-powered financial audits.",
    url: "https://www.effluxa.com",
    siteName: "Effluxa",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Effluxa — AI Financial Leak Audit",
    description:
      "Upload financial files and discover hidden savings opportunities with AI.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AnalyticsScripts />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
