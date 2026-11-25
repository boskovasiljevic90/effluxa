import jwt from "jsonwebtoken";
import { Resend } from "resend";

/**
 * Trial nurture sequence.
 *
 * A visitor who runs the free check can ask for the result by email. That is a
 * one-to-one, requested message, not a cold campaign. The sequence is capped at
 * five emails, always carries an unsubscribe link, and stops on purchase.
 */

export type NurtureStage = 0 | 1 | 2 | 3 | 4;

export type TeaserSnapshot = {
  totalFindings: number;
  duplicateExposure: number;
  avoidableCost: number;
  leakageScore: number;
  currency: string;
  fileName?: string;
};

export type NurtureEmail = {
  stage: NurtureStage;
  subject: string;
  html: string;
};

/** Hours after capture at which each stage becomes due. */
export const NURTURE_SCHEDULE_HOURS: Record<NurtureStage, number> = {
  0: 2,
  1: 24,
  2: 72,
  3: 168,
  4: 336,
};

export const NURTURE_STAGES: NurtureStage[] = [0, 1, 2, 3, 4];

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.effluxa.com";

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "EUR",
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  } catch {
    return `${Math.round(amount)} ${currency}`;
  }
}

function shell(body: string, unsubscribeUrl: string) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.65; color: #0f172a; max-width: 560px;">
      ${body}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 14px;" />
      <p style="font-size:12px;color:#64748b;">
        Effluxa is a screening and decision-support tool. Findings are review signals, not confirmed losses or guaranteed savings.
        <br />Effluxa by NeedAIHelp · <a href="${APP_URL}/security" style="color:#64748b;">Security and data processing</a> ·
        <a href="${unsubscribeUrl}" style="color:#64748b;">Unsubscribe</a>
      </p>
    </div>
  `;
}

function cta(label: string, href: string) {
  return `<p style="margin:22px 0;"><a href="${href}" style="display:inline-block;background:#1d4ed8;color:#ffffff;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:bold;">${label}</a></p>`;
}

export function buildNurtureEmail({
  stage,
  teaser,
  unsubscribeUrl,
}: {
  stage: NurtureStage;
  teaser: TeaserSnapshot;
  unsubscribeUrl: string;
}): NurtureEmail {
  const money = teaser.duplicateExposure + teaser.avoidableCost;
  const moneyText = money > 0 ? formatMoney(money, teaser.currency) : "";
  const remaining = Math.max(0, teaser.totalFindings - 3);

  if (stage === 0) {
    return {
      stage,
      subject: `Your file: ${teaser.totalFindings} review items`,
      html: shell(
        `<p>You asked for the result of the free Effluxa check${teaser.fileName ? ` on <strong>${teaser.fileName}</strong>` : ""}.</p>
         <p><strong>${teaser.totalFindings} review items</strong> were detected and the leakage score was ${teaser.leakageScore}/100.${
           moneyText ? ` The strongest recoverable signals total roughly <strong>${moneyText}</strong>.` : ""
         }</p>
         <p>The free view showed your top three findings. ${remaining > 0 ? `The other ${remaining}` : "The remainder"} only make sense with the source evidence, the calculation basis and the recommended owner for each one.</p>
         ${cta("Open the full report", `${APP_URL}/instant`)}
         <p>If you would rather compare this file against the next reporting period, Pro runs the same audit every month and shows what is new, recurring or no longer detected.</p>`,
        unsubscribeUrl,
      ),
    };
  }

  if (stage === 1) {
    return {
      stage,
      subject: "What the top three findings usually mean",
      html: shell(
        `<p>The first three findings are almost always the ones worth a conversation.</p>
         <ul>
           <li><strong>Duplicate or near-duplicate payment.</strong> Two rows share a vendor and amount, sometimes with a different reference. Verify payment status and credit notes before calling it a duplicate.</li>
           <li><strong>Vendor price increase.</strong> The unit price moved without a new agreement or a scope change. Compare like with like before negotiating.</li>
           <li><strong>Wasted recurring spend.</strong> Overlapping tools, unused seats or a legacy service that was never switched off.</li>
         </ul>
         <p>Each of those needs the source row to be defensible in front of a client, a board or a lender. That is what the full report adds.</p>
         ${cta("See the full audit", `${APP_URL}/signup?plan=full_audit`)}`,
        unsubscribeUrl,
      ),
    };
  }

  if (stage === 2) {
    return {
      stage,
      subject: "One file, €149, no call",
      html: shell(
        `<p>The full audit is €149 for one financial pack. It includes every finding, the source evidence, the calculation basis, a ranked action list and an executive PDF.</p>
         <p>No demo, no onboarding, no implementation project. You upload the file, you get the report.</p>
         <p>For a firm reviewing client files every month, Agency is €399/month for up to 100 client files with white-label PDFs and a portfolio view. It is priced per firm, not per seat.</p>
         ${cta("Unlock the full audit — €149", `${APP_URL}/signup?plan=full_audit`)}
         <p style="font-size:14px;color:#475569;">Or start with another free check on a different file.</p>`,
        unsubscribeUrl,
      ),
    };
  }

  if (stage === 3) {
    return {
      stage,
      subject: "Why a one-off audit stops working",
      html: shell(
        `<p>A single review finds what is wrong today. It does not tell you what changed after the fix.</p>
         <p>Pro (€99/month) re-runs the audit each period and shows three things that a one-off report cannot:</p>
         <ul>
           <li>which findings are new this period;</li>
           <li>which ones are recurring despite an action being assigned;</li>
           <li>which ones are no longer detected.</li>
         </ul>
         <p>That comparison is usually the difference between a report someone reads once and a control that actually closes.</p>
         ${cta("Start Pro — €99/month", `${APP_URL}/signup?plan=pro_monthly`)}`,
        unsubscribeUrl,
      ),
    };
  }

  return {
    stage,
    subject: "Closing your free check file",
    html: shell(
      `<p>This is the last email about your free check. If duplicate payments, vendor overcharging or cash pressure come up again, the check is always here and it takes one file.</p>
       <p>If you are running a client portfolio, the Agency plan includes white-label reports and a data-processing agreement is available before the first client file.</p>
       ${cta("Run another free check", `${APP_URL}/instant`)}`,
      unsubscribeUrl,
    ),
  };
}

export function buildUnsubscribeToken(email: string) {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  return jwt.sign({ email: email.toLowerCase(), purpose: "unsubscribe" }, secret, {
    expiresIn: "90d",
  });
}

export function verifyUnsubscribeToken(token: string) {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  try {
    const payload = jwt.verify(token, secret) as { email?: string; purpose?: string };
    if (payload.purpose !== "unsubscribe" || !payload.email) return null;
    return payload.email.toLowerCase();
  } catch {
    return null;
  }
}

export function unsubscribeUrlFor(email: string) {
  const token = buildUnsubscribeToken(email);
  return token ? `${APP_URL}/unsubscribe?token=${encodeURIComponent(token)}` : `${APP_URL}/unsubscribe`;
}

export async function sendNurtureEmail({
  to,
  email,
}: {
  to: string;
  email: NurtureEmail;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`RESEND_API_KEY missing. Nurture stage ${email.stage} to ${to}`);
    return false;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Effluxa <support@effluxa.com>";

  await resend.emails.send({
    from: fromEmail,
    to,
    subject: email.subject,
    html: email.html,
  });

  return true;
}
