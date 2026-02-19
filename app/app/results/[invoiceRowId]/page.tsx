import { prisma } from "../../../../lib/prisma";

export default async function InvoiceResultPage({ params }: any) {
  const { invoiceRowId } = params;

  const result = await prisma.reconcileResult.findFirst({
    where: {
      invoiceRowId,
    },
    include: {
      invoiceRow: true,
    },
  });

  if (!result) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Result not found</h1>
      </div>
    );
  }

  const inv: any = result.invoiceRow || {};
  const raw: any = inv.raw || {};

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

      <div style={{ marginTop: 30 }}>
        <h2 style={{ fontWeight: 700 }}>Raw Invoice Data</h2>
        <pre
          style={{
            background: "#f3f4f6",
            padding: 12,
            borderRadius: 8,
            marginTop: 10,
            overflow: "auto",
          }}
        >
          {JSON.stringify(raw, null, 2)}
        </pre>
      </div>
    </div>
  );
}
