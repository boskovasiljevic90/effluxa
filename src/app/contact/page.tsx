import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ContactPage() {
  return (
    <div className="page-container">
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "60px 40px" }}>
        <Link href="/" style={{ color: "#60a5fa" }}>← Back to Effluxa</Link>

        <h1 style={{ fontSize: "44px", marginTop: "40px", marginBottom: "24px" }}>
          Contact Support
        </h1>

        <div className="audit-card" style={{ lineHeight: 1.8 }}>
          <p>
            Need help with your Effluxa audit, payment, upload, or report?
          </p>

          <h2 style={{ marginTop: "30px" }}>Support Email</h2>
          <p>
            support@effluxa.com
          </p>

          <h2 style={{ marginTop: "30px" }}>What to Include</h2>
          <p>
            Please include your account email, report name, and a short description of the issue.
          </p>

          <h2 style={{ marginTop: "30px" }}>Response Time</h2>
          <p>
            We aim to respond as quickly as possible during business days.
          </p>
        </div>
      </div>
    </div>
  );
}
