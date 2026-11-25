/**
 * Client-safe display values for the public price list.
 *
 * Server code reads the authoritative model in `pricing.ts`. Any component that
 * renders a price imports from here so a price change cannot leave stale copy
 * in the dashboard while checkout charges a different amount.
 */
export const DISPLAY_PRICE = {
  fullAudit: 149,
  proMonthly: 99,
  proAnnual: 990,
  agencyMonthly: 399,
  agencyAnnual: 3990,
} as const;

export function eur(amount: number) {
  return `€${amount.toLocaleString("en-GB")}`;
}

export function perMonth(amount: number) {
  return `${eur(amount)}/month`;
}

export function perYear(amount: number) {
  return `${eur(amount)}/year`;
}
