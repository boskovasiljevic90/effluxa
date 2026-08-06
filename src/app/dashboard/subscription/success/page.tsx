import { redirect } from "next/navigation";

export default function SubscriptionSuccessCompatibilityPage({
  searchParams,
}: {
  searchParams?: { transaction_id?: string | string[] };
}) {
  const rawTransactionId = searchParams?.transaction_id;
  const transactionId = Array.isArray(rawTransactionId)
    ? rawTransactionId[0]
    : rawTransactionId;

  if (transactionId) {
    redirect(`/billing/success?transaction_id=${encodeURIComponent(transactionId)}`);
  }

  redirect("/dashboard?billing=missing_transaction");
}
