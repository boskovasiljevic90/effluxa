import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { safeVerifyToken } from "@/lib/auth";
import { claimInstantAudit, getInstantAudit } from "@/lib/instantStore";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your free Effluxa check | Effluxa",
  robots: { index: false, follow: false },
};

type TeaserShape = {
  fileName?: string;
  leakageScore?: number;
  riskLevel?: string;
  verdict?: string;
  totalFindings?: number;
  currency?: string;
  actNow?: Array<{ title?: string; severity?: string; amount?: number | null }>;
};

export default async function SavedInstantAuditPage({ params }: { params: { token: string } }) {
  const audit = await getInstantAudit(params.token);
  if (!audit) notFound();

  const cookieToken = cookies().get("token")?.value;
  const decoded = cookieToken ? safeVerifyToken(cookieToken) : null;

  if (decoded) {
    const claimed = await claimInstantAudit({ token: params.token, userId: decoded.userId });
    if ("reportId" in claimed) {
      redirect(`/dashboard/reports/${claimed.reportId}`);
    }
  }

  const teaser = (audit.teaser || {}) as TeaserShape;
  const actNow = Array.isArray(teaser.actNow) ? teaser.actNow : [];

  return (
    <main className="public-dark-page" style={{ background: "#0b1020", color: "#f8fafc", minHeight: "100vh" }}>
      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px 70px" }}>
        <PublicHeader />

        <div style={{ marginTop: "52px" }}>
          <p className="eyebrow" style={{ color: "#c7d2fe" }}>
            Saved free check{teaser.fileName ? ` · ${teaser.fileName}` : ""}
          </p>
          <h1 className="landing-hero-title" style={{ marginTop: "12px", fontSize: "46px", lineHeight: 1.06, letterSpacing: "-1.6px", fontWeight: 950 }}>
            {teaser.leakageScore ? `${teaser.leakageScore}/100 leakage score` : "Your saved check"}
            {teaser.riskLevel ? ` · ${teaser.riskLevel} risk` : ""}
          </h1>
          {teaser.verdict ? (
            <p style={{ marginTop: "16px", fontSize: "18px", color: "#cbd5e1", lineHeight: 1.7 }}>{teaser.verdict}</p>
          ) : null}
        </div>

        {actNow.length > 0 ? (
          <div style={{ marginTop: "30px", display: "grid", gap: "12px" }}>
            {actNow.map((finding, index) => (
              <div key={`${finding.title}-${index}`} className="instant-finding">
                <div className="instant-finding-top">
                  <span className={`instant-badge instant-badge-${String(finding.severity || "medium").toLowerCase()}`}>
                    {finding.severity || "MEDIUM"}
                  </span>
                  {finding.amount ? <span className="instant-finding-amount">€{Math.round(finding.amount).toLocaleString("en-GB")}</span> : null}
                </div>
                <h4>{finding.title || "Review item"}</h4>
              </div>
            ))}
          </div>
        ) : null}

        <div className="instant-paywall" style={{ marginTop: "30px" }}>
          <div>
            <p className="eyebrow" style={{ color: "#c7d2fe" }}>Keep this report</p>
            <h2 style={{ fontSize: "28px", fontWeight: 950, marginTop: "8px" }}>
              Create an account and the full report moves into your dashboard
            </h2>
            <p style={{ color: "#cbd5e1", marginTop: "10px", lineHeight: 1.7 }}>
              No second upload. The free check you already ran is attached to your account, and unlocking the full
              audit takes one payment.
            </p>
          </div>
          <div className="instant-paywall-actions">
            <Link href={`/signup?plan=full_audit&instant=${encodeURIComponent(params.token)}`}>
              <button className="primary-button" style={{ width: "100%", padding: "16px 22px" }}>
                Create account and keep it
              </button>
            </Link>
            <Link href="/login" className="instant-ghost">I already have an account</Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
