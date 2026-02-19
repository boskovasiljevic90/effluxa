import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function safeString(v: any) {
  return v === null || v === undefined ? "" : String(v);
}

export default async function InvoiceResultPage({ params }: any) {
  const { invoiceRowId } = params;

  const invoiceRow = await prisma.invoiceRow.findUnique({
    where: { id: invoiceRowId },
  });

  const result = await prisma.reconcileResult.findFirst({
    where: { invoiceRowId },
    orderBy: { createdAt: "desc" },
  });

  if (!invoiceRow && !result) {
    return <div style={{ padding: 24 }}>No invoice/result found.</div>;
  }

  const raw: any = (invoiceRow as any)?.raw || {};

  return (
    <div style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Invoice Result</h1>

      <div style={{ marginTop: 16 }}>
        <div>
          <b>Invoice ID:</b> {invoiceRowId}
        </div>
        <div>
          <b>Invoice #:</b>{" "}
          {safeString(
            raw.invoiceNo ??
              raw.invoice_no ??
              raw.invoiceNumber ??
              raw["Invoice No"] ??
              raw["Invoice #"] ??
              ""
          ) || "(unknown)"}
        </div>
      </div>

      {result ? (
        <div
          style={{
            marginTop: 18,
            padding: 14,
            border: "1px solid #e5e7eb",
            borderRadius: 12,
          }}
        >
          <div>
            <b>Status:</b> {(result as any).status}
          </div>
          <div>
            <b>Currency:</b> {(result as any).currency || "-"}
          </div>
          <div>
            <b>Paid:</b> {(result as any).paidTotal ?? "-"}
          </div>
          <div>
            <b>Outstanding:</b> {(result as any).outstanding ?? "-"}
          </div>
          <div style={{ marginTop: 8, color: "#6b7280" }}>
            {new Date((result as any).createdAt).toLocaleString()}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 18, color: "#6b7280" }}>
          No reconcile result yet for this invoice.
        </div>
      )}

      <div style={{ marginTop: 22 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800 }}>Raw invoice data</h2>
        <pre
          style={{
            marginTop: 10,
            background: "#0b1020",
            color: "#e5e7eb",
            padding: 14,
            borderRadius: 12,
            overflowX: "auto",
            fontSize: 12,
          }}
        >
          {JSON.stringify(raw, null, 2)}
        </pre>
      </div>
    </div>
  );
}
