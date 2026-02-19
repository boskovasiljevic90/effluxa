import { prisma } from "../../../../lib/prisma";

export default async function InvoiceResultPage({ params }: any) {
  const { invoiceRowId } = params;

  const result = await prisma.reconcileResult.findFirst({
    where: { invoiceRowId },
  });

  if (!result) {
    return <div style={{ padding: 24 }}>No result found.</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>
        Invoice Result
      </h1>

      <div style={{ marginTop: 20 }}>
        <div>Status: {result.status}</div>
        <div>Currency: {result.currency}</div>
        <div>Paid: {result.paidTotal}</div>
        <div>Outstanding: {result.outstanding}</div>
      </div>
    </div>
  );
}
