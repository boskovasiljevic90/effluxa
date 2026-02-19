import Link from "next/link";

export default function AppPage() {
  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>
        Effluxa Dashboard
      </h1>

      <p style={{ marginTop: 20 }}>
        You are using the Free plan.
      </p>

      <div style={{ marginTop: 30 }}>
        <Link
          href="/app/upload"
          style={{
            padding: "10px 18px",
            background: "#111",
            color: "#fff",
            borderRadius: 6,
            textDecoration: "none",
            marginRight: 12,
          }}
        >
          Upload Invoices
        </Link>

        <Link
          href="/app/results"
          style={{
            padding: "10px 18px",
            background: "#e5e7eb",
            color: "#111",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          View Results
        </Link>
      </div>

      <div style={{ marginTop: 50 }}>
        <Link
          href="/billing"
          style={{
            padding: "8px 14px",
            background: "#2563eb",
            color: "#fff",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          Upgrade to Pro
        </Link>
      </div>
    </div>
  );
}
