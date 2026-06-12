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
