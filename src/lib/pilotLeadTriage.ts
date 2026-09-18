export type PilotLeadTriageTier = "HIGH" | "MEDIUM" | "LOW";

export type PilotLeadTriage = {
  score: number;
  maxScore: number;
  tier: PilotLeadTriageTier;
  rationale: string[];
};

const ROLE_POINTS: Record<string, number> = {
  accounting_bookkeeping: 4,
  fractional_cfo: 4,
  in_house_finance: 2,
  other: 1,
};

const PORTFOLIO_POINTS: Record<string, number> = {
  "50_plus": 4,
  "21_50": 3,
  "6_20": 2,
  "1_5": 1,
};

const ROLE_LABELS: Record<string, string> = {
  accounting_bookkeeping: "accounting/bookkeeping firm",
  fractional_cfo: "fractional-CFO or finance consultancy",
  in_house_finance: "in-house finance team",
  other: "other finance professional",
};

const PORTFOLIO_LABELS: Record<string, string> = {
  "50_plus": "50+ client portfolio",
  "21_50": "21–50 client portfolio",
  "6_20": "6–20 client portfolio",
  "1_5": "1–5 client portfolio",
};

const FOCUS_LABELS: Record<string, string> = {
  duplicate_payments: "duplicate-payment focus",
  recurring_spend: "recurring-spend focus",
  cash_flow: "cash-flow focus",
};

const MAX_SCORE = 11;

export function buildPilotLeadTriage(profile: unknown): PilotLeadTriage {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    return {
      score: 0,
      maxScore: MAX_SCORE,
      tier: "LOW",
      rationale: ["Pilot profile is incomplete"],
    };
  }

  const values = profile as Record<string, unknown>;
  const role = typeof values.role === "string" ? values.role : "";
  const portfolioSize = typeof values.portfolioSize === "string" ? values.portfolioSize : "";
  const focus = typeof values.focus === "string" ? values.focus : "";
  const canProvideRedactedFile = values.canProvideRedactedFile === true;

  let score = 0;
  const rationale: string[] = [];

  if (ROLE_POINTS[role]) {
    score += ROLE_POINTS[role];
    rationale.push(ROLE_LABELS[role]);
  }

  if (PORTFOLIO_POINTS[portfolioSize]) {
    score += PORTFOLIO_POINTS[portfolioSize];
    rationale.push(PORTFOLIO_LABELS[portfolioSize]);
  }

  if (canProvideRedactedFile) {
    score += 2;
    rationale.push("redacted file available");
  }

  if (FOCUS_LABELS[focus]) {
    score += 1;
    rationale.push(FOCUS_LABELS[focus]);
  }

  const tier: PilotLeadTriageTier = score >= 8
    ? "HIGH"
    : score >= 5
      ? "MEDIUM"
      : "LOW";

  return {
    score,
    maxScore: MAX_SCORE,
    tier,
    rationale: rationale.length > 0 ? rationale : ["Pilot profile is incomplete"],
  };
}
