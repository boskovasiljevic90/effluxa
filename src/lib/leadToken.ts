import { createHmac, timingSafeEqual } from "crypto";

/**
 * Signed opt-out token for cold outreach.
 *
 * Cold email must carry a working one-click unsubscribe link that does not
 * require a login. The token is an HMAC of the address, so the link can be
 * verified without storing a per-lead row.
 */
function secret() {
  // A dedicated secret keeps outreach opt-out links independent from the auth
  // signing key, and lets the sender run outside the deployment.
  return (
    process.env.LEAD_UNSUBSCRIBE_SECRET ||
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    ""
  );
}

export function signLeadToken(email: string) {
  const key = secret();
  if (!key) return "";

  return createHmac("sha256", key)
    .update(`lead-unsubscribe:${email.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 40);
}

export function verifyLeadToken(email: string, token: string) {
  const expected = signLeadToken(email);
  if (!expected || !token) return false;

  const provided = token.trim();
  if (provided.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export function leadUnsubscribeUrl(email: string, baseUrl?: string) {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://www.effluxa.com";
  const token = signLeadToken(email);
  return `${base}/api/leads/unsubscribe?e=${encodeURIComponent(email)}&t=${token}`;
}
