import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { syncPaddleTransactionById } from "@/lib/paddleProvisioning";

export const dynamic = "force-dynamic";

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams?: { transaction_id?: string | string[] };
}) {
  const rawTransactionId = searchParams?.transaction_id;
  const transactionId = Array.isArray(rawTransactionId)
    ? rawTransactionId[0]
    : rawTransactionId;

  if (!transactionId) {
    redirect("/dashboard?billing=missing_transaction");
  }

  const token = cookies().get("token")?.value;

  if (!token) {
    redirect(
      `/login?returnTo=${encodeURIComponent(
        `/billing/success?transaction_id=${transactionId}`
      )}`
    );
  }

  let userId: string;

  try {
    userId = (jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }).userId;
  } catch {
    redirect(
      `/login?returnTo=${encodeURIComponent(
        `/billing/success?transaction_id=${transactionId}`
      )}`
    );
  }

  let customData: Awaited<ReturnType<typeof syncPaddleTransactionById>>;

  try {
    customData = await syncPaddleTransactionById(transactionId, userId);
  } catch (error) {
    console.error("PADDLE BILLING SUCCESS SYNC FAILED:", error);
    redirect("/dashboard?billing=sync_failed");
  }

  if (customData.product === "full_audit_unlock" && customData.reportId) {
    redirect(`/dashboard/reports/${customData.reportId}?billing=success`);
  }

  redirect("/dashboard?billing=success");
}
