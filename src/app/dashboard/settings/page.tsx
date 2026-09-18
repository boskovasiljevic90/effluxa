export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ChangePasswordForm from "./ChangePasswordForm";
import BillingPortalButton from "./BillingPortalButton";
import BusinessBrandingForm from "./BusinessBrandingForm";
import EmailPreferencesForm from "./EmailPreferencesForm";
import DeleteAccountForm from "./DeleteAccountForm";
import ReferralLinkActions from "./ReferralLinkActions";
import { displayPlanLabel } from "@/lib/planDisplay";
import { hasComplimentaryAgencyAccess } from "@/lib/complimentaryAccess";
import { getReferralLink } from "@/lib/referrals";
import { getWorkspaceOwner } from "@/lib/workspace";

async function getUser() {
  const token = cookies().get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    return await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
  } catch {
    return null;
  }
}

export default async function SettingsPage() {
  const user = await getUser();

  if (!user) redirect("/login");

  const workspace = await getWorkspaceOwner(user);
  const hasBusinessAccess = workspace.hasBusinessAccess;
  const complimentaryAgencyAccess = hasComplimentaryAgencyAccess(user);
  const displayPlan = hasBusinessAccess
    ? "AGENCY"
    : user.role === "BUSINESS"
      ? "AGENCY INACTIVE"
      : displayPlanLabel(user.role);

  return (
    <>
      <h1 style={{ fontSize: "42px" }}>Account Settings</h1>

      <p className="gray" style={{ marginTop: "10px" }}>
        Manage your Effluxa account, plan, and support access.
      </p>

      <div className="report-grid" style={{ marginTop: "34px" }}>
        <div className="card">
          <div className="card-title">Account Email</div>
          <p className="gray">{user.email}</p>
        </div>

        <div className="card">
          <div className="card-title">Current Plan</div>
          <div className="metric-value">{displayPlan}</div>

          {complimentaryAgencyAccess && user.complimentaryAgencyAccessUntil && (
            <p className="gray" style={{ marginTop: "12px", lineHeight: 1.7 }}>
              Complimentary partner access active until {new Date(user.complimentaryAgencyAccessUntil).toLocaleDateString()}.
            </p>
          )}

          {hasBusinessAccess && user.role !== "FREE" && user.subscriptionEndDate && (
            <p className="gray" style={{ marginTop: "12px", lineHeight: 1.7 }}>
              Active until {new Date(user.subscriptionEndDate).toLocaleDateString()}.
            </p>
          )}
        </div>

        {user.referralCode && (
          <div className="card full-width">
            <div className="card-title">Partner Referrals</div>
            <p className="gray" style={{ lineHeight: 1.7, marginTop: "10px" }}>
              Share this link with companies that should try Effluxa. Signups from the link are attributed to your partner account for 30 days.
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
              {getReferralLink(user.referralCode)}
            </div>
            <ReferralLinkActions referralLink={getReferralLink(user.referralCode)} />
          </div>
        )}

        <div className="card">
          <div className="card-title">
            {!hasBusinessAccess && user.role !== "PRO"
              ? "Free Audit Usage"
              : `${displayPlan} Usage`}
          </div>
          <div className="metric-value">
            {!hasBusinessAccess && user.role !== "PRO"
              ? `${user.weeklyUploadCount}/3`
              : "Unlimited"}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Support</div>
          <p className="gray" style={{ lineHeight: 1.7 }}>
            Need help with upload, checkout, report access, or billing?
          </p>

          <Link href="/contact">
            <button className="primary-button" style={{ marginTop: "18px" }}>
              Contact Support
            </button>
          </Link>
        </div>

        {hasBusinessAccess && user.role === "BUSINESS" && (
          <div className="card full-width">
            <div className="card-title">Report Branding</div>
            <p className="gray" style={{ lineHeight: 1.7 }}>
              Customize company name and footer text shown on downloadable audit PDFs.
            </p>
            <BusinessBrandingForm
              defaultCompanyName={user.companyName}
              defaultReportFooter={user.reportFooter}
            />
          </div>
        )}

        {user.role !== "FREE" && user.paddleSubscriptionId && (
          <div className="card full-width">
            <div className="card-title">Manage Subscription</div>
            <p className="gray" style={{ lineHeight: 1.7 }}>
              Update payment method, view invoices, or manage your subscription.
            </p>
            <BillingPortalButton />
          </div>
        )}

        <div className="card full-width">
          <div className="card-title">Email Preferences</div>
          <p className="gray">
            Choose which automated Effluxa emails you want to receive.
          </p>

          <EmailPreferencesForm
            defaultMonthlySummary={user.emailMonthlySummary}
            defaultProductUpdates={user.emailProductUpdates}
            defaultAuditReminders={user.emailAuditReminders}
          />
        </div>

        <div className="card full-width">
          <div className="card-title">Change Password</div>
          <p className="gray">
            Update your account password securely.
          </p>
          <ChangePasswordForm />
        </div>

        <div className="card full-width account-danger-card">
          <div className="card-title">Delete Account</div>
          <p className="gray" style={{ lineHeight: 1.7 }}>
            You can delete individual reports and clients from their respective pages.
            Use the control below to permanently remove the complete Effluxa account.
          </p>
          <DeleteAccountForm email={user.email} />
        </div>

        <div className="card full-width">
          <div className="card-title">Privacy & Legal</div>

          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <Link href="/privacy">
              <button className="primary-button">Privacy Policy</button>
            </Link>

            <Link href="/terms">
              <button className="primary-button">Terms of Service</button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
