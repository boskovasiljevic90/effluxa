import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const dynamic = "force-dynamic";

export default function ContactPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <PublicHeader />

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <h1 style={{ fontSize: "56px", fontWeight: 900, letterSpacing: "-2px" }}>
            Contact Effluxa
          </h1>

          <p style={{ marginTop: "18px", fontSize: "20px", color: "#475569", lineHeight: 1.7 }}>
            Need help with an audit, payment, upload, or report? We’re here to help.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: "24px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "34px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
            }}
          >
            <h2 style={{ fontSize: "24px", fontWeight: 800 }}>Support Email</h2>
            <p style={{ marginTop: "14px", color: "#475569", lineHeight: 1.7 }}>
              For help with uploads, checkout, reports, or account access.
            </p>
            <p style={{ marginTop: "22px", fontWeight: 800 }}>
              support@effluxa.com
            </p>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "34px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
            }}
          >
            <h2 style={{ fontSize: "24px", fontWeight: 800 }}>What To Include</h2>
            <p style={{ marginTop: "14px", color: "#475569", lineHeight: 1.8 }}>
              Include your account email, report filename, payment status, and a short description of the issue.
            </p>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "34px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
            }}
          >
            <h2 style={{ fontSize: "24px", fontWeight: 800 }}>Response Time</h2>
            <p style={{ marginTop: "14px", color: "#475569", lineHeight: 1.8 }}>
              We aim to respond as quickly as possible during business days.
            </p>
          </div>
        </div>

        <div style={{ marginTop: "50px", textAlign: "center" }}>
          <Link href="/signup">
            <button
              style={{
                height: "58px",
                padding: "0 30px",
                borderRadius: "18px",
                border: "none",
                background: "#0f172a",
                color: "white",
                fontSize: "17px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Start Free Audit
            </button>
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
