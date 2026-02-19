"use client";

import { useState } from "react";

export default function UploadPage() {
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [priceFile, setPriceFile] = useState<File | null>(null);
  const [response, setResponse] = useState<any>(null);

  async function upload(kind: string, file: File | null) {
    if (!file) return alert("Select file first");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/upload/${kind}`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResponse(data);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800 }}>
        Upload (Free Plan)
      </h1>

      <div style={{ marginTop: 30 }}>
        <h3>Invoices</h3>
        <input type="file" onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)} />
        <br />
        <button
          style={{ marginTop: 10 }}
          onClick={() => upload("invoices", invoiceFile)}
        >
          Upload Invoice
        </button>
      </div>

      <div style={{ marginTop: 40 }}>
        <h3>Payments</h3>
        <input type="file" onChange={(e) => setPaymentFile(e.target.files?.[0] || null)} />
        <br />
        <button
          style={{ marginTop: 10 }}
          onClick={() => upload("payments", paymentFile)}
        >
          Upload Payment
        </button>
      </div>

      <div style={{ marginTop: 40 }}>
        <h3>Price List</h3>
        <input type="file" onChange={(e) => setPriceFile(e.target.files?.[0] || null)} />
        <br />
        <button
          style={{ marginTop: 10 }}
          onClick={() => upload("price-list", priceFile)}
        >
          Upload Price List
        </button>
      </div>

      {response && (
        <pre style={{ marginTop: 40 }}>
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
}
