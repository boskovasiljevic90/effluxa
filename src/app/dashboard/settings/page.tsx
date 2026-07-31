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
import { displayPlanLabel } from "@/lib/planDisplay";

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
          <div className="metric-value">{displayPlanLabel(user.role)}</div>

          {user.role === "BUSINESS" && user.subscriptionEndDate && (
            <p className="gray" style={{ marginTop: "12px", lineHeight: 1.7 }}>
              Active until {new Date(user.subscriptionEndDate).toLocaleDateString()}.
            </p>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            {user.role === "FREE"
              ? "Free Audit Usage"
              : `${displayPlanLabel(user.role)} Usage`}
          </div>
          <div className="metric-value">
            {user.role === "FREE"
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

        {user.role === "BUSINESS" && (
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

        {user.role === "BUSINESS" && (
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
