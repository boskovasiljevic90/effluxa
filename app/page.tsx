export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        background: "#f8fafc",
      }}
    >
      <h1 style={{ fontSize: 36, fontWeight: 800 }}>
        Effluxa
      </h1>

      <p style={{ marginTop: 16, fontSize: 18 }}>
        AI Invoice Reconciliation Platform
      </p>

      <a
        href="/app"
        style={{
          marginTop: 24,
          padding: "12px 20px",
          background: "#111827",
          color: "#ffffff",
          borderRadius: 8,
          textDecoration: "none",
        }}
      >
        Go to App
      </a>
    </main>
  );
}
