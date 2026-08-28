type ComplimentaryAgencyAccessUser = {
  role?: string | null;
  complimentaryAgencyAccessUntil?: Date | string | null;
  complimentaryAgencyAccessRevokedAt?: Date | string | null;
};

type PaidSubscriptionUser = {
  role?: string | null;
  paddleSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
  subscriptionEndDate?: Date | string | null;
};

export function hasComplimentaryAgencyAccess(
  user?: ComplimentaryAgencyAccessUser | null,
  now = new Date()
) {
  if (
    !user ||
    user.role !== "BUSINESS" ||
    user.complimentaryAgencyAccessRevokedAt ||
    !user.complimentaryAgencyAccessUntil
  ) {
    return false;
  }

  return new Date(user.complimentaryAgencyAccessUntil) > now;
}

export function hasActivePaidSubscription(
  user?: PaidSubscriptionUser | null,
  now = new Date()
) {
  if (
    !user?.paddleSubscriptionId ||
    !["active", "trialing"].includes(user.subscriptionStatus || "")
  ) {
    return false;
  }

  return (
    !user.subscriptionEndDate ||
    new Date(user.subscriptionEndDate) > now
  );
}

export function hasActiveAgencyAccess(
  user?: (ComplimentaryAgencyAccessUser & PaidSubscriptionUser) | null,
  now = new Date()
) {
  return (
    user?.role === "BUSINESS" &&
    (hasComplimentaryAgencyAccess(user, now) ||
      hasActivePaidSubscription(user, now))
  );
}
