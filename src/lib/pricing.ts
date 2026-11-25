/**
 * Public pricing model.
 *
 * Pricing is anchored to the service Effluxa replaces (a forensic or
 * recovery-audit review that starts in the thousands of euros), not to
 * per-seat workpaper software. The free check is the acquisition entry point;
 * the one-off audit is an impulse purchase with proof shown before payment;
 * subscriptions monetise recurrence.
 *
 * Paddle price IDs are read from the environment and are unchanged by this
 * file. When the display amount changes, the matching Paddle price must be
 * created and its ID written to the same environment variable before the
 * change is announced, otherwise checkout will show a different amount.
 */
export const PRICING = {
  FREE_CHECK: {
    name: "Free File Check",
    amount: 0,
    currency: "eur",
    cadence: "free",
    priceEnv: null,
  },

  FULL_AUDIT: {
    name: "Full AI Audit",
    amount: 14900,
    currency: "eur",
    cadence: "one_time",
    priceEnv: "PADDLE_FULL_AUDIT_PRICE_ID",
  },

  PRO_MONTHLY: {
    name: "Effluxa Pro Monthly",
    amount: 9900,
    currency: "eur",
    cadence: "monthly",
    priceEnv: "PADDLE_PRO_MONTHLY_PRICE_ID",
  },

  PRO_ANNUAL: {
    name: "Effluxa Pro Annual",
    amount: 99000,
    currency: "eur",
    cadence: "annual",
    priceEnv: "PADDLE_PRO_ANNUAL_PRICE_ID",
  },

  AGENCY_MONTHLY: {
    name: "Effluxa Agency Monthly",
    amount: 39900,
    currency: "eur",
    cadence: "monthly",
    priceEnv: "PADDLE_AGENCY_MONTHLY_PRICE_ID",
  },

  AGENCY_ANNUAL: {
    name: "Effluxa Agency Annual",
    amount: 399000,
    currency: "eur",
    cadence: "annual",
    priceEnv: "PADDLE_AGENCY_ANNUAL_PRICE_ID",
  },
} as const;

/** Presentation-ready amounts so UI copy cannot drift from the model above. */
export function formatPrice(key: keyof typeof PRICING) {
  const entry = PRICING[key];
  return `€${Math.round(entry.amount / 100).toLocaleString("en-GB")}`;
}

export function getPriceId(key: keyof typeof PRICING) {
  const envKey = PRICING[key].priceEnv;
  if (!envKey) return undefined;

  return process.env[envKey];
}

export function isProRole(role?: string | null) {
  return role === "PRO";
}

export function isAgencyRole(role?: string | null) {
  return role === "BUSINESS";
}

export function isPaidRole(role?: string | null) {
  return role === "PRO" || role === "BUSINESS";
}
