export type RevenueAccount = {
  role: string;
  paddleSubscriptionId: string | null;
  billingPlan: string | null;
  subscriptionStatus: string | null;
  subscriptionEndDate: Date | string | null;
};

export type RevenueSummary = {
  activePaidAccounts: number;
  proAccounts: number;
  agencyAccounts: number;
  estimatedMrrCents: number;
  estimatedArrCents: number;
  unclassifiedActiveSubscriptions: number;
};

// These are normalized from the public Paddle list prices. The result is a
// run-rate proxy, not recognized revenue: taxes, Paddle fees, refunds,
// discounts, annual-plan cash timing, and churn timing are intentionally not
// inferred here.
const MONTHLY_EQUIVALENT_CENTS: Record<string, number> = {
  pro_monthly: 7900,
  pro_annual: Math.round(79000 / 12),
  agency_monthly: 29900,
  agency_annual: Math.round(299000 / 12),
};

function timeValue(value: Date | string | null) {
  if (!value) return null;
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function hasActiveSubscription(account: RevenueAccount, now: number) {
  if (!account.paddleSubscriptionId) return false;
  if (!account.subscriptionStatus || !["active", "trialing"].includes(account.subscriptionStatus)) {
    return false;
  }

  const endAt = timeValue(account.subscriptionEndDate);
  return endAt === null || endAt > now;
}

export function buildRevenueSummary(
  accounts: RevenueAccount[],
  now = new Date()
): RevenueSummary {
  const nowAt = now.getTime();
  let activePaidAccounts = 0;
  let proAccounts = 0;
  let agencyAccounts = 0;
  let estimatedMrrCents = 0;
  let unclassifiedActiveSubscriptions = 0;

  for (const account of accounts) {
    if (!hasActiveSubscription(account, nowAt)) continue;

    activePaidAccounts += 1;
    if (account.role === "PRO") proAccounts += 1;
    if (account.role === "BUSINESS") agencyAccounts += 1;

    const monthlyEquivalent = account.billingPlan
      ? MONTHLY_EQUIVALENT_CENTS[account.billingPlan]
      : undefined;

    if (monthlyEquivalent === undefined) {
      unclassifiedActiveSubscriptions += 1;
      continue;
    }

    estimatedMrrCents += monthlyEquivalent;
  }

  return {
    activePaidAccounts,
    proAccounts,
    agencyAccounts,
    estimatedMrrCents,
    estimatedArrCents: estimatedMrrCents * 12,
    unclassifiedActiveSubscriptions,
  };
}
