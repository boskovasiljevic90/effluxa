import {
  Environment,
  Paddle,
  type Subscription,
  type Transaction,
} from "@paddle/paddle-node-sdk";

export type PaddleProduct =
  | "full_audit_unlock"
  | "pro_subscription"
  | "agency_subscription";

export type PaddlePlan =
  | "full_audit"
  | "pro_monthly"
  | "pro_annual"
  | "agency_monthly"
  | "agency_annual";

export type PaddleCustomData = {
  userId: string;
  product: PaddleProduct;
  plan: PaddlePlan;
  reportId?: string;
};

let paddleClient: Paddle | null = null;

function normalizePaddleEnvValue(value?: string | null) {
  return value?.replace(/\\[rn]/g, "").trim();
}

export function getPaddle() {
  if (paddleClient) {
    return paddleClient;
  }

  const apiKey = normalizePaddleEnvValue(process.env.PADDLE_API_KEY);

  if (!apiKey) {
    throw new Error("PADDLE_API_KEY is not configured.");
  }

  const environment =
    normalizePaddleEnvValue(process.env.PADDLE_ENVIRONMENT) === "sandbox"
      ? Environment.sandbox
      : Environment.production;

  paddleClient = new Paddle(apiKey, { environment });
  return paddleClient;
}

export function getPaddlePriceId(plan: PaddlePlan) {
  const priceEnv: Record<PaddlePlan, string> = {
    full_audit: "PADDLE_FULL_AUDIT_PRICE_ID",
    pro_monthly: "PADDLE_PRO_MONTHLY_PRICE_ID",
    pro_annual: "PADDLE_PRO_ANNUAL_PRICE_ID",
    agency_monthly: "PADDLE_AGENCY_MONTHLY_PRICE_ID",
    agency_annual: "PADDLE_AGENCY_ANNUAL_PRICE_ID",
  };

  return normalizePaddleEnvValue(process.env[priceEnv[plan]]);
}

export async function createPaddleCheckoutTransaction({
  priceId,
  customerId,
  customData,
}: {
  priceId: string;
  customerId?: string | null;
  customData: PaddleCustomData;
}) {
  const checkoutUrl = normalizePaddleEnvValue(process.env.PADDLE_CHECKOUT_URL);
  const shouldUseCheckoutUrl =
    normalizePaddleEnvValue(process.env.PADDLE_ENVIRONMENT) !== "sandbox";

  const transaction = await getPaddle().transactions.create({
    items: [{ priceId, quantity: 1 }],
    customerId: customerId || undefined,
    customData,
    checkout: shouldUseCheckoutUrl && checkoutUrl
      ? { url: checkoutUrl }
      : undefined,
  });

  if (!transaction.checkout?.url) {
    throw new Error(
      "Paddle checkout URL is missing. Configure a default payment link in Paddle."
    );
  }

  return transaction;
}

export function subscriptionEndDate(subscription: Pick<Subscription, "currentBillingPeriod" | "nextBilledAt">) {
  const periodEnd = subscription.currentBillingPeriod?.endsAt;

  if (periodEnd) {
    return new Date(periodEnd);
  }

  if (subscription.nextBilledAt) {
    return new Date(subscription.nextBilledAt);
  }

  return null;
}

export function roleFromPaddleProduct(product?: string | null) {
  if (product === "pro_subscription") {
    return "PRO" as const;
  }

  if (product === "agency_subscription") {
    return "BUSINESS" as const;
  }

  return null;
}

export function isActivePaddleSubscription(status?: string | null) {
  return status === "active" || status === "trialing";
}

export function transactionCustomData(transaction: Pick<Transaction, "customData">) {
  return (transaction.customData || {}) as Partial<PaddleCustomData>;
}
