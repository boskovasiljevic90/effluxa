export async function getSubscriptionStatus(orgId: string) {
  return {
    plan: "free",
    active: false,
  };
}

export async function hasActiveSubscription(orgId: string) {
  return false;
}
