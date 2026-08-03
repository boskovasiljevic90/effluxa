import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <PublicHeader />
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "60px 40px" }}>
        <Link href="/" style={{ color: "#60a5fa" }}>← Back to Effluxa</Link>

        <h1 style={{ fontSize: "44px", marginTop: "40px", marginBottom: "24px" }}>
          Privacy Policy
        </h1>

        <div className="audit-card" style={{ lineHeight: 1.8 }}>
          <p>
            Effluxa processes uploaded financial documents to generate AI-powered financial audit reports.
          </p>

          <h2 style={{ marginTop: "30px" }}>Data We Collect</h2>
          <p>
            We collect account email addresses, uploaded document names, AI-generated analysis results,
            payment status, and basic usage data required to operate the service.
          </p>

          <h2 style={{ marginTop: "30px" }}>Uploaded Documents</h2>
          <p>
            Uploaded documents are used only to generate financial leakage analysis and reports.
            Users should avoid uploading unnecessary sensitive personal information.
          </p>

          <h2 style={{ marginTop: "30px" }}>Retention and Deletion</h2>
          <p>
            Uploaded documents and generated report data are retained while needed to provide your
            account and reports. To request deletion of a document or account data, contact
            support@effluxa.com.
          </p>

          <h2 style={{ marginTop: "30px" }}>Payments</h2>
          <p>
            Payments are processed securely by Stripe. Effluxa does not store card numbers.
          </p>

          <h2 style={{ marginTop: "30px" }}>AI Processing</h2>
          <p>
            Uploaded content may be processed by third-party AI providers solely for generating the requested audit.
          </p>

          <h2 style={{ marginTop: "30px" }}>Contact</h2>
          <p>
            For privacy questions, contact: support@effluxa.com
          </p>
        </div>
      </div>
          <PublicFooter />
    </div>
  );
}
