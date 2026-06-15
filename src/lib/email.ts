import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log("RESEND_API_KEY missing. Reset URL:", resetUrl);
    return;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "Effluxa <support@effluxa.com>";

  await resend.emails.send({
    from: fromEmail,
    to,
    subject: "Reset your Effluxa password",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Reset your Effluxa password</h2>
        <p>Click the button below to create a new password.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#0f172a;color:white;padding:14px 20px;border-radius:10px;text-decoration:none;font-weight:bold;">
            Reset Password
          </a>
        </p>
        <p>This link expires in 30 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}


export async function sendContactNotificationEmail({
  name,
  email,
  subject,
  message,
}: {
  name?: string;
  email: string;
  subject?: string;
  message: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const recipients = Array.from(
    new Set(
      [
        process.env.SUPPORT_EMAIL,
        process.env.ADMIN_EMAIL,
      ].filter(Boolean)
    )
  ) as string[];

  if (recipients.length === 0) return;

  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    "Effluxa <noreply@effluxa.com>";

  await resend.emails.send({
    from: fromEmail,
    to: recipients,
    subject: `New Contact Form Submission`,
    html: `
      <h2>New Contact Message</h2>

      <p><strong>Name:</strong> ${name || "N/A"}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject || "N/A"}</p>

      <hr />

      <p>${message}</p>
    `,
  });
}


export async function sendTeamInviteEmail({
  to,
  ownerEmail,
}: {
  to: string;
  ownerEmail: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    "Effluxa <noreply@effluxa.com>";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.effluxa.com";

  await resend.emails.send({
    from: fromEmail,
    to,
    subject: "You have been invited to an Effluxa Business workspace",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>You're invited to Effluxa</h2>
        <p>${ownerEmail} invited you to join their Effluxa Business workspace.</p>
        <p>Use this same email address to create your account or log in.</p>
        <p>
          <a href="${appUrl}/signup" style="display:inline-block;background:#0f172a;color:white;padding:14px 20px;border-radius:10px;text-decoration:none;font-weight:bold;">
            Join Workspace
          </a>
        </p>
      </div>
    `,
  });
}


export async function sendMonthlyExecutiveSummaryEmail({
  to,
  companyName,
  auditsCount,
  totalSavings,
  highestRiskScore,
  averageLeakageScore,
}: {
  to: string;
  companyName?: string | null;
  auditsCount: number;
  totalSavings: number;
  highestRiskScore: number;
  averageLeakageScore: number;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    "Effluxa <noreply@effluxa.com>";

  await resend.emails.send({
    from: fromEmail,
    to,
    subject: "Effluxa Monthly Executive Summary",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>${companyName || "Effluxa"} Monthly Executive Summary</h2>

        <p>Your latest financial intelligence summary is ready.</p>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin-top:20px;">
          <p><strong>Audits generated:</strong> ${auditsCount}</p>
          <p><strong>Potential savings found:</strong> €${totalSavings.toLocaleString()}</p>
          <p><strong>Highest risk score:</strong> ${highestRiskScore}/100</p>
          <p><strong>Average leakage score:</strong> ${averageLeakageScore}/100</p>
        </div>

        <p style="margin-top:24px;">
          Log in to Effluxa to review your audit history, reports, team activity, and recommendations.
        </p>

        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://www.effluxa.com"}/dashboard"
             style="display:inline-block;background:#0f172a;color:white;padding:14px 20px;border-radius:10px;text-decoration:none;font-weight:bold;">
            Open Dashboard
          </a>
        </p>

        <p style="font-size:12px;color:#64748b;margin-top:30px;">
          Effluxa reports are AI-generated and provided for informational purposes only.
        </p>
      </div>
    `,
  });
}
