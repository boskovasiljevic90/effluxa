import type { Metadata } from "next";
import "./globals.css";

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
    url: "https://effluxa.vercel.app",
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
      <body>{children}</body>
    </html>
  );
}
