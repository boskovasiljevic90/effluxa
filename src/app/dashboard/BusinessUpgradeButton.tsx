"use client";

import SubscriptionButton from "@/components/subscription/SubscriptionButton";


export default function BusinessUpgradeButton(){

  return (

    <div
      style={{
        display:"flex",
        gap:"12px",
        flexWrap:"wrap"
      }}
    >

      <SubscriptionButton
        plan="pro_monthly"
        label="Upgrade to Pro €79/month"
      />

      <SubscriptionButton
        plan="pro_annual"
        label="Upgrade to Pro €790/year"
      />

      <SubscriptionButton
        plan="agency_monthly"
        label="Agency €299/month"
      />

      <SubscriptionButton
        plan="agency_annual"
        label="Agency €2,990/year"
      />

    </div>

  );

}
