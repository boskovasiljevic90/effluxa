import { prisma } from "./prisma";
import { ensureOrg } from "./org";

type Plan = "free" | "pro";

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export async function getPlan(orgId: string): Promise<{ plan: Plan; active: boolean }> {
  const org = await ensureOrg(orgId);
  const plan = (org.plan as Plan) || "free";
  return { plan, active: plan === "pro" };
}

export async function enforceWeeklyFreeLimit(orgId: string, kind: "invoices" | "payments" | "price-list") {
  const org = await ensureOrg(orgId);

  // reset weekly counters if needed
  const now = new Date();
  const resetAt = org.usageResetAt ?? now;
  const nextReset = addDays(resetAt, 7);

  let updated = org;
  if (now >= nextReset) {
    updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        usageResetAt: now,
        weeklyInvoiceUploads: 0,
        weeklyPaymentUploads: 0,
        weeklyPriceListUploads: 0,
      },
    });
  }

  const plan = ((updated.plan as Plan) || "free");
  if (plan !== "free") return; // Pro has no weekly limits here

  const field =
    kind === "invoices" ? "weeklyInvoiceUploads" :
    kind === "payments" ? "weeklyPaymentUploads" :
    "weeklyPriceListUploads";

  const current = (updated as any)[field] as number;

  if (current >= 1) {
    throw new Error(`Free plan limit reached: 1 ${kind} upload per week.`);
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: { [field]: current + 1 } as any,
  });
}
