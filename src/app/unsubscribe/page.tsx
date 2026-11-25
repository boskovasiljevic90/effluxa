import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "Unsubscribe | Effluxa",
  description: "Stop receiving Effluxa follow-up emails.",
  robots: { index: false, follow: false },
};

export default function UnsubscribePage() {
  return (
    <main className="public-dark-page" style={{ background: "#0b1020", color: "#f8fafc", minHeight: "100vh" }}>
      <section style={{ maxWidth: "760px", margin: "0 auto", padding: "32px 24px 80px" }}>
        <PublicHeader />

        <div style={{ marginTop: "60px" }}>
          <h1 style={{ fontSize: "40px", fontWeight: 950 }}>Unsubscribe</h1>
          <p style={{ marginTop: "16px", color: "#cbd5e1", lineHeight: 1.7 }}>
            Open the unsubscribe link from the email you received and this page will confirm it. The link is unique to
            your address and stops all Effluxa follow-up email, including product updates and audit reminders.
          </p>
          <p style={{ marginTop: "14px", color: "#94a3b8", lineHeight: 1.7 }}>
            Account, billing and security emails are still sent while you have an active account, because they are part
            of the service.
          </p>
          <div style={{ marginTop: "26px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/contact" className="instant-ghost">Contact support</Link>
            <Link href="/" className="instant-ghost">Back to Effluxa</Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
