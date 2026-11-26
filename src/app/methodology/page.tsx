import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "How Effluxa works, and what it cannot do | Effluxa",
  description:
    "The rule set, the evidence standard and the explicit limits behind an Effluxa audit. Written for finance professionals who need to know what the analysis can and cannot support.",
  alternates: { canonical: "https://www.effluxa.com/methodology" },
};

const ruleGroups: Array<[string, string[]]> = [
  ["Duplicate and split payments", ["Exact duplicate invoice (vendor, reference, amount)", "Near-duplicate invoice within a 45-day window", "Invoices split below the approval threshold", "Recurring round-sum payments"]],
  ["Vendor and purchasing control", ["Vendor bank-detail change shortly before payment", "Material vendor price increase between dated records", "Vendor concentration", "Related-party price change without a new agreement"]],
  ["Receivables and cash", ["Receivable over recorded credit limit", "Material overdue receivable", "Unapplied customer credits and unapplied cash", "Cash and financing cost items"]],
  ["Payroll and expenses", ["Overtime above policy or without completed approval", "Overtime trend escalation by department", "Hotel expense above the stated nightly cap", "Duplicate employee expense claim", "Personal or out-of-policy expense items"]],
  ["Inventory and assets", ["Slow-moving inventory", "Negative or impossible stock balance", "Inventory provision gap", "Inventory write-off trend"]],
  ["Financing and risk", ["Debt covenant exception recorded", "Unhedged foreign-currency commitment above policy", "Director or related-party receivable", "Gross-margin and EBITDA variance against budget"]],
];

const limits: Array<[string, string]> = [
  ["It is not an audit opinion", "Effluxa produces a screening report. It is not an audit, a review engagement, a tax opinion or accounting advice."],
  ["It cannot judge what it was not given", "If the contract, purchase order, credit note or bank confirmation is not in the file, the finding stays a review signal rather than a conclusion."],
  ["It does not do bookkeeping", "Effluxa does not reconcile your ledger, post entries, file taxes or replace your accounting system."],
  ["Some findings need human judgement", "Whether an expense was personal, whether a price rise was agreed, or whether a duplicate was already credited is a decision a person makes."],
  ["Data quality changes the answer", "A single exported PDF gives a weaker result than a complete pack. When extraction is incomplete, the report is labelled as limited data instead of being issued as a clean result."],
];

export default function MethodologyPage() {
  return (
    <main className="public-dark-page" style={{ background: "#0b1020", color: "#f8fafc", minHeight: "100vh" }}>
      <section style={{ maxWidth: "980px", margin: "0 auto", padding: "32px 24px 70px" }}>
        <PublicHeader />

        <div style={{ maxWidth: "820px", marginTop: "52px" }}>
          <div className="eyebrow" style={{ color: "#c7d2fe" }}>Methodology and limits</div>
          <h1 className="landing-hero-title" style={{ marginTop: "14px", fontSize: "50px", lineHeight: 1.05, letterSpacing: "-1.8px", fontWeight: 950 }}>
            What the audit does, and what it cannot do
          </h1>
          <p style={{ marginTop: "18px", fontSize: "18px", lineHeight: 1.7, color: "#cbd5e1" }}>
            Your judgement stays central. Effluxa gets you to the rows that deserve that judgement faster, and shows the
            evidence behind each one so you can confirm or dismiss it. This page states the rule set, the evidence
            standard and the limits, because a finance professional should not have to guess them.
          </p>
        </div>

        <div className="dash-card" style={{ marginTop: "34px", background: "rgba(255,255,255,0.045)", border: "1px solid rgba(148,163,184,0.18)" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 950 }}>The rule set</h2>
          <p style={{ marginTop: "10px", color: "#cbd5e1", lineHeight: 1.7 }}>
            The engine applies 32 deterministic rules. The language model reads the file; the rules decide the findings.
            That split is deliberate: a rule either matches the extracted records or it does not, and every match has to
            carry evidence.
          </p>
          <div style={{ display: "grid", gap: "18px", marginTop: "22px", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
            {ruleGroups.map(([group, rules]) => (
              <div key={group}>
                <div style={{ fontWeight: 800, fontSize: "14px", color: "#f8fafc" }}>{group}</div>
                <ul style={{ marginTop: "8px", paddingLeft: "18px", color: "#94a3b8", lineHeight: 1.7, fontSize: "13.5px" }}>
                  {rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-card" style={{ marginTop: "22px", background: "rgba(255,255,255,0.045)", border: "1px solid rgba(148,163,184,0.18)" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 950 }}>The evidence standard</h2>
          <ul style={{ marginTop: "12px", paddingLeft: "20px", color: "#cbd5e1", lineHeight: 1.8 }}>
            <li>Every finding names the source: page for a PDF, row for a ledger, sheet for a workbook.</li>
            <li>Every quantified finding states the calculation basis, not only the amount.</li>
            <li>Every finding carries a confidence level based on evidence completeness, not on how confident the language sounds.</li>
            <li>Potential exposure, control risk and estimated opportunity are kept separate from confirmed loss or realised savings.</li>
            <li>A finding can be marked true, false, unclear or acted on, and that mark is kept with the report.</li>
          </ul>
        </div>

        <div className="dash-card" style={{ marginTop: "22px", background: "rgba(255,255,255,0.045)", border: "1px solid rgba(148,163,184,0.18)" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 950 }}>What Effluxa cannot do</h2>
          <div style={{ display: "grid", gap: "14px", marginTop: "14px" }}>
            {limits.map(([title, body]) => (
              <div key={title} style={{ borderTop: "1px solid rgba(148,163,184,0.12)", paddingTop: "12px" }}>
                <div style={{ fontWeight: 800, fontSize: "14.5px" }}>{title}</div>
                <p style={{ marginTop: "4px", color: "#94a3b8", lineHeight: 1.65, fontSize: "14px" }}>{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-card" style={{ marginTop: "22px", background: "rgba(255,255,255,0.045)", border: "1px solid rgba(148,163,184,0.18)" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 950 }}>When an audit fails</h2>
          <p style={{ marginTop: "10px", color: "#cbd5e1", lineHeight: 1.7 }}>
            If extraction is incomplete or a processing step fails, the audit retries automatically. If it still cannot
            produce a reliable result, the report is labelled as limited data and you are told what to upload instead.
            A limited report is never presented as a clean result, and you can request a re-run or a refund on a paid
            audit that was not generated.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "18px" }}>
            <Link href="/security" className="instant-ghost">Data handling and sub-processors</Link>
            <Link href="/sample-audit" className="instant-ghost">See a labelled sample report</Link>
          </div>
        </div>

        <p style={{ marginTop: "28px", color: "#64748b", fontSize: "13px", lineHeight: 1.6, maxWidth: "820px" }}>
          This page is a description of method and limits, not legal, tax or accounting advice. Where a finding depends on
          a contract or a judgement, a qualified person should make that call.
        </p>
      </section>

      <PublicFooter />
    </main>
  );
}
