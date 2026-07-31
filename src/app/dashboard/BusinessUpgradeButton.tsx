"use client";

import SubscriptionButton from "@/components/subscription/SubscriptionButton";

type Props = {
  currentRole?: string | null;
};

const plans = [
  {
    plan: "pro_monthly",
    label: "Upgrade to Pro €79/month",
    tier: "pro",
  },
  {
    plan: "pro_annual",
    label: "Upgrade to Pro €790/year",
    tier: "pro",
  },
  {
    plan: "agency_monthly",
    label: "Agency €299/month",
    tier: "agency",
  },
  {
    plan: "agency_annual",
    label: "Agency €2,990/year",
    tier: "agency",
  },
] as const;

export default function BusinessUpgradeButton({
  currentRole,
}: Props) {
  const role = currentRole || "FREE";

  const isPro = role === "PRO";
  const isAgency = role === "BUSINESS";

  if (isAgency) {
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

  const visiblePlans = plans.filter((item) => {
    if (isPro && item.tier === "pro") {
      return false;
    }

    return true;
  });

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        marginTop: "16px",
      }}
    >
      {visiblePlans.map((item) => (
        <SubscriptionButton
          key={item.plan}
          plan={item.plan}
          label={item.label}
        />
      ))}
    </div>
  );
}
