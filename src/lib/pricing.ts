export const PRICING = {
  FULL_AUDIT: {
    name: "Full AI Audit",
    amount: 9900,
    currency: "eur",
    priceEnv: "PADDLE_FULL_AUDIT_PRICE_ID",
  },

  PRO_MONTHLY: {
    name: "Effluxa Pro Monthly",
    amount: 7900,
    currency: "eur",
    priceEnv: "PADDLE_PRO_MONTHLY_PRICE_ID",
  },

  PRO_ANNUAL: {
    name: "Effluxa Pro Annual",
    amount: 79000,
    currency: "eur",
    priceEnv: "PADDLE_PRO_ANNUAL_PRICE_ID",
  },

  AGENCY_MONTHLY: {
    name: "Effluxa Agency Monthly",
    amount: 29900,
    currency: "eur",
    priceEnv: "PADDLE_AGENCY_MONTHLY_PRICE_ID",
  },

  AGENCY_ANNUAL: {
    name: "Effluxa Agency Annual",
    amount: 299000,
    currency: "eur",
    priceEnv: "PADDLE_AGENCY_ANNUAL_PRICE_ID",
  },
} as const;


export function getPriceId(
  key: keyof typeof PRICING
) {
  const envKey = PRICING[key].priceEnv;

  return process.env[envKey];
}


export function isProRole(role?: string | null) {
  return role === "PRO";
}


export function isAgencyRole(role?: string | null) {
  return role === "BUSINESS";
}


export function isPaidRole(role?: string | null) {
  return (
    role === "PRO" ||
    role === "BUSINESS"
  );
}
