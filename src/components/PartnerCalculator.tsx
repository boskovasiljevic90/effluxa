"use client";

import { useMemo, useState } from "react";
import { DISPLAY_PRICE, eur } from "@/lib/pricingDisplay";

/**
 * Partner earnings calculator.
 *
 * Revenue share is 25% of the referred subscription for the first 12 months.
 * One-off audits pay 25% of the audit fee. The calculator is deliberately
 * conservative: it does not assume upgrades, annual plans or price increases.
 */
const SHARE = 0.25;

function money(value: number) {
  return eur(Math.round(value));
}

export default function PartnerCalculator() {
  const [plan, setPlan] = useState<"pro" | "agency">("pro");
  const [clients, setClients] = useState(20);
  const [auditsPerMonth, setAuditsPerMonth] = useState(6);

  const monthlyPlan = plan === "pro" ? DISPLAY_PRICE.proMonthly : DISPLAY_PRICE.agencyMonthly;

  const result = useMemo(() => {
    const subscriptionRevenue = clients * monthlyPlan;
    const subscriptionShare = subscriptionRevenue * SHARE;
    const auditShare = auditsPerMonth * DISPLAY_PRICE.fullAudit * SHARE;
    const monthly = subscriptionShare + auditShare;
    return {
      subscriptionRevenue,
      subscriptionShare,
      auditShare,
      monthly,
      firstYear: monthly * 12,
    };
  }, [clients, monthlyPlan, auditsPerMonth]);

  return (
    <div className="partner-calc">
      <div className="partner-calc-inputs">
        <div>
          <label className="tool-label" htmlFor="calc-plan">
            Plan your clients choose
          </label>
          <select
            id="calc-plan"
            value={plan}
            onChange={(event) => setPlan(event.target.value === "agency" ? "agency" : "pro")}
          >
            <option value="pro">Pro - {eur(DISPLAY_PRICE.proMonthly)}/month</option>
            <option value="agency">Agency - {eur(DISPLAY_PRICE.agencyMonthly)}/month</option>
          </select>
        </div>

        <div>
          <label className="tool-label" htmlFor="calc-clients">
            Paying clients you refer
          </label>
          <input
            id="calc-clients"
            type="number"
            min={0}
            max={500}
            value={clients}
            onChange={(event) => setClients(Math.max(0, Math.min(500, Number(event.target.value) || 0)))}
          />
        </div>

        <div>
          <label className="tool-label" htmlFor="calc-audits">
            One-off audits per month
          </label>
          <input
            id="calc-audits"
            type="number"
            min={0}
            max={200}
            value={auditsPerMonth}
            onChange={(event) => setAuditsPerMonth(Math.max(0, Math.min(200, Number(event.target.value) || 0)))}
          />
        </div>
      </div>

      <div className="partner-calc-result">
        <div>
          <div className="partner-calc-label">Your share per month</div>
          <div className="partner-calc-value">{money(result.monthly)}</div>
          <div className="partner-calc-hint">
            {money(result.subscriptionShare)} from subscriptions + {money(result.auditShare)} from one-off audits
          </div>
        </div>

        <div>
          <div className="partner-calc-label">First 12 months</div>
          <div className="partner-calc-value">{money(result.firstYear)}</div>
          <div className="partner-calc-hint">
            Subscription revenue referred: {money(result.subscriptionRevenue)} per month, your share 25%
          </div>
        </div>
      </div>

      <p className="partner-calc-note">
        Revenue share applies to the first 12 months of each referred subscription and is paid monthly by bank
        transfer. Annual plans pay the same 25%. Figures exclude taxes and are not a forecast or a guarantee.
      </p>
    </div>
  );
}
