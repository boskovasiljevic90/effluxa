"use client";

import SubscriptionButton from "@/components/subscription/SubscriptionButton";

type Props = {
  currentRole?: string | null;
  hasBusinessAccess?: boolean;
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
  hasBusinessAccess = false,
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

  const visiblePlans = plans.filter((item) => {
    if (isPro && item.tier === "pro") {
      return false;
    }

    if (isAgency && item.tier === "pro") {
      return false;
    }

    return true;
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
        {visiblePlans.map((item) => (
          <SubscriptionButton
            key={item.plan}
            plan={item.plan}
            label={item.label}
          />
        ))}
      </div>
    </>
  );
}
