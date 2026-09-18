export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReferralLinkActions from "../settings/ReferralLinkActions";
import { getReferralLink } from "@/lib/referrals";

async function getUser() {
  const token = cookies().get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, referralCode: true },
    });
  } catch {
    return null;
  }
}

export default async function PartnerHubPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!user.referralCode) redirect("/dashboard/settings");

  const referralLink = getReferralLink(user.referralCode);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="page-title">Partner Launchpad</div>
          <p className="gray" style={{ marginTop: "10px" }}>
            Everything needed to start a focused Effluxa pilot with one finance professional.
          </p>
        </div>
        <div className="plan-badge plan-free">PARTNER</div>
      </div>

      <div
        className="card full-width"
        style={{
          marginTop: "28px",
          border: "1px solid rgba(129,140,248,0.38)",
          background: "linear-gradient(135deg, rgba(79,70,229,0.16), rgba(37,99,235,0.08))",
        }}
      >
        <div className="card-title">The first pilot conversation</div>
        <h1 style={{ marginTop: "12px", fontSize: "32px", lineHeight: 1.15 }}>
          Start with one approved file and one concrete question.
        </h1>
        <p className="gray" style={{ marginTop: "14px", maxWidth: "780px", lineHeight: 1.7 }}>
          The strongest first use case is not a broad software demo. Ask an accounting, bookkeeping, fractional-CFO or SME finance contact to choose one recent invoice batch, bank statement, CSV export or expense file they are allowed to review.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
            gap: "12px",
            marginTop: "22px",
          }}
        >
          {[
            ["1", "Context", "What spend, vendor or control question do you want to examine?"],
            ["2", "Permission", "Use an approved, redacted file. Never upload data without the client's permission."],
            ["3", "Evidence", "Review source context, confidence and recommended action together."],
            ["4", "Follow-up", "Track ownership and compare the next period instead of promising guaranteed savings."],
          ].map(([number, title, description]) => (
            <div
              key={number}
              style={{
                padding: "17px",
                borderRadius: "14px",
                background: "rgba(15,23,42,0.28)",
                border: "1px solid rgba(199,210,254,0.14)",
              }}
            >
              <div style={{ color: "#c7d2fe", fontWeight: 950 }}>{number}</div>
              <div style={{ marginTop: "8px", fontWeight: 850 }}>{title}</div>
              <div className="gray" style={{ marginTop: "6px", fontSize: "13px", lineHeight: 1.55 }}>
                {description}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "22px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/for-accounting-firms">
            <button className="primary-button">Open partner positioning</button>
          </Link>
          <Link href="/sample-audit">
            <button className="primary-button" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}>
              Open sample audit
            </button>
          </Link>
          <Link href="/dashboard/upload">
            <button className="primary-button" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}>
              Upload your pilot file
            </button>
          </Link>
        </div>
      </div>

      <div className="card full-width" style={{ marginTop: "28px" }}>
        <div className="card-title">Your referral invitation</div>
        <p className="gray" style={{ marginTop: "10px", lineHeight: 1.7 }}>
          This link attributes a new signup to your partner account for 30 days. It contains no customer data and is safe to share with the person you are inviting.
        </p>
        <div
          style={{
            marginTop: "16px",
            padding: "14px 16px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            wordBreak: "break-all",
            color: "#bfdbfe",
          }}
        >
          {referralLink}
        </div>
        <ReferralLinkActions referralLink={referralLink} />
      </div>

      <div className="card full-width" style={{ marginTop: "28px" }}>
        <div className="card-title">Responsible pilot language</div>
        <p className="gray" style={{ marginTop: "10px", lineHeight: 1.7 }}>
          Present Effluxa as a fast screening and control-follow-up layer. Findings are review signals, not guaranteed losses; estimated savings are not recovered cash; and the finance professional remains responsible for validating the source evidence before action.
        </p>
        <div style={{ marginTop: "18px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/resources">
            <button className="primary-button" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}>
              Open audit resources
            </button>
          </Link>
          <Link href="/contact?subject=Partner%20pilot&source=partner_pilot">
            <button className="primary-button">Request partner support</button>
          </Link>
        </div>
      </div>
    </>
  );
}
