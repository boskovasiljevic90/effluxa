export const REFERRAL_COOKIE = "effluxa_referral";

const REFERRAL_CODE_PATTERN = /^[A-Z0-9_-]{4,64}$/;

export function normalizeReferralCode(value: unknown) {
  if (typeof value !== "string") return null;

  const code = value.trim().toUpperCase();
  return REFERRAL_CODE_PATTERN.test(code) ? code : null;
}

export function buildReferralCode(userId: string) {
  const compactUserId = userId.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return `EFLX${compactUserId.slice(0, 16)}`;
}

export function getReferralLink(code: string) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.effluxa.com").replace(/\/+$/, "");
  return `${appUrl}/?ref=${encodeURIComponent(code)}`;
}
