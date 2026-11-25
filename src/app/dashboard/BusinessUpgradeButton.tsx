"use client";

import { DISPLAY_PRICE, eur, perMonth, perYear } from "@/lib/pricingDisplay";

import SubscriptionButton from "@/components/subscription/SubscriptionButton";
import type { SubscriptionPlan } from "@/components/subscription/SubscriptionButton";

type Props = {
  currentRole?: string | null;
  hasBusinessAccess?: boolean;
  preferredPlan?: SubscriptionPlan | null;
  /** "compact" renders one primary upgrade action instead of four buttons. */
  variant?: "full" | "compact";
};

const plans = [
  {
    plan: "pro_monthly",
    label: `Upgrade to Pro ${perMonth(DISPLAY_PRICE.proMonthly)}`,
    tier: "pro",
  },
  {
    plan: "pro_annual",
    label: `Upgrade to Pro ${perYear(DISPLAY_PRICE.proAnnual)}`,
    tier: "pro",
  },
  {
    plan: "agency_monthly",
    label: `Agency ${perMonth(DISPLAY_PRICE.agencyMonthly)}`,
    tier: "agency",
  },
  {
    plan: "agency_annual",
    label: `Agency ${perYear(DISPLAY_PRICE.agencyAnnual)}`,
    tier: "agency",
  },
] as const;

export default function BusinessUpgradeButton({
  currentRole,
  hasBusinessAccess = false,
  preferredPlan = null,
  variant = "full",
}: Props) {
  const role = currentRole || "FREE";

  const isPro = role === "PRO";
  const isAgency = role === "BUSINESS";

  if (isAgency && hasBusinessAccess) {
    return (
      <p
        className="gray"
        style={{
          marginTop: "16px",
        }}
      >
        Agency workspace access is active. Manage billing from Settings.
      </p>
    );
  }

  if (variant === "compact") {
    return (
      <div style={{ display: "grid", gap: "10px" }}>
        <SubscriptionButton
          plan="pro_monthly"
          label={`Upgrade to Pro ${perMonth(DISPLAY_PRICE.proMonthly)}`}
        />
        <a
          href="/#pricing"
          style={{ fontSize: "13px", color: "#93c5fd", fontWeight: 700, textAlign: "center" }}
        >
          Compare Pro and Agency
        </a>
      </div>
    );
  }

  const visiblePlans = plans.filter((item) => {
    if (isPro && item.tier === "pro") {
      return false;
    }

    if (isAgency && item.tier === "pro") {
      return false;
    }

    return true;
  });

  const orderedPlans = [...visiblePlans].sort((left, right) => {
    if (left.plan === preferredPlan) return -1;
    if (right.plan === preferredPlan) return 1;
    return 0;
  });

  return (
    <>
      {isAgency && !hasBusinessAccess && (
        <p className="gray" style={{ marginTop: "12px", lineHeight: 1.7 }}>
          Agency access is currently inactive. Reactivate an Agency plan to restore workspace features.
        </p>
      )}

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginTop: "16px",
        }}
      >
        {orderedPlans.map((item) => (
          <div key={item.plan} style={{ display: "grid", gap: "6px" }}>
            <SubscriptionButton
              plan={item.plan}
              label={item.label}
            />
            {item.plan === preferredPlan && (
              <span className="gray" style={{ fontSize: "12px", fontWeight: 700 }}>
                Selected from pricing
              </span>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
