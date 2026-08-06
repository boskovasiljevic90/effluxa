import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <PublicHeader />
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "60px 40px" }}>
        <Link href="/" style={{ color: "#60a5fa" }}>← Back to Effluxa</Link>

        <h1 style={{ fontSize: "44px", marginTop: "40px", marginBottom: "24px" }}>
          Terms of Service
        </h1>

        <div className="audit-card" style={{ lineHeight: 1.8 }}>
          <p>
            Effluxa provides AI-generated financial leakage audit reports for informational purposes.
          </p>

          <h2 style={{ marginTop: "30px" }}>No Financial Advice</h2>
          <p>
            Effluxa reports are not financial, legal, accounting, investment, or tax advice.
            Users should consult qualified professionals before making financial decisions.
          </p>

          <h2 style={{ marginTop: "30px" }}>User Responsibility</h2>
          <p>
            Users are responsible for ensuring that uploaded documents are accurate and that they have
            permission to upload and process them.
          </p>

          <h2 style={{ marginTop: "30px" }}>Payments</h2>
          <p>
            Full AI audit unlocks are one-time digital purchases. Payment processing is handled by Paddle.
          </p>

          <h2 style={{ marginTop: "30px" }}>Limitations</h2>
          <p>
            AI-generated reports may contain errors or incomplete interpretations. Effluxa does not guarantee
            specific savings or financial outcomes.
          </p>

          <h2 style={{ marginTop: "30px" }}>Contact</h2>
          <p>
            For support, contact: support@effluxa.com
          </p>
        </div>
      </div>
          <PublicFooter />
    </div>
  );
}
