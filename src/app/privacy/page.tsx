import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <PublicHeader />
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "60px 40px" }}>
        <Link href="/" style={{ color: "#60a5fa" }}>← Back to Effluxa</Link>

        <h1 style={{ fontSize: "44px", marginTop: "40px", marginBottom: "12px" }}>
          Privacy Policy
        </h1>

        <p style={{ color: "#64748b", marginBottom: "24px" }}>Last updated: 19 August 2026</p>

        <div className="audit-card" style={{ lineHeight: 1.8 }}>
          <p>
            Effluxa is a product by NeedAIHelp. Effluxa processes uploaded financial documents to generate
            AI-powered financial audit reports.
          </p>

          <h2 style={{ marginTop: "30px" }}>Data We Collect</h2>
          <p>
            We collect account email addresses, uploaded document names, AI-generated analysis results,
            payment status, support messages, and basic usage data required to operate and protect the service.
          </p>

          <h2 style={{ marginTop: "30px" }}>Uploaded Documents</h2>
          <p>
            Uploaded documents are processed to generate the requested financial leakage analysis. In the
            current Effluxa deployment, the original file is not stored as a separate downloadable archive;
            the account stores the filename and generated report data. Users should avoid uploading
            unnecessary sensitive personal information.
          </p>

          <h2 style={{ marginTop: "30px" }}>Retention and Deletion</h2>
          <p>
            Generated reports and account data are retained while your account is active so that you can
            review your audit history. You can delete individual reports and clients from the dashboard,
            or permanently delete the complete account from Account Settings. Account deletion removes the
            Effluxa profile, reports, clients, support messages and account events in the application.
          </p>
          <p style={{ marginTop: "14px" }}>
            Expired password-reset tokens are removed automatically. Operational events are normally kept
            for up to 180 days and contact messages for up to 24 months, unless a longer period is required
            for security, dispute handling, tax, accounting, or other legal obligations. Paddle may retain
            transaction and billing records as Merchant of Record.
          </p>

          <h2 style={{ marginTop: "30px" }}>Payments</h2>
          <p>
            Payments are processed securely by Paddle. Effluxa does not store card numbers. Paddle may process
            billing and transaction information needed to complete purchases and manage subscriptions.
          </p>

          <h2 style={{ marginTop: "30px" }}>AI Processing</h2>
          <p>
            Uploaded content may be processed by third-party AI providers solely for generating the requested
            audit. Effluxa does not use uploaded customer documents to sell advertising.
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
