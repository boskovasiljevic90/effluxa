import Link from "next/link";

export default function PublicHeader() {
  return (
    <header
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "28px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        flexWrap: "wrap",
      }}
    >
      <Link href="/" style={{ fontSize: "30px", fontWeight: 900 }}>
        Eff<span style={{ color: "#2563eb" }}>luxa</span>
      </Link>

      <nav style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
        <Link href="/#how-it-works">How it works</Link>
        <Link href="/#pricing">Pricing</Link>
        <Link href="/login">Login</Link>
        <Link href="/signup">
          <button
            style={{
              padding: "12px 20px",
              borderRadius: "14px",
              border: "none",
              background: "#0f172a",
              color: "white",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Start Free
          </button>
        </Link>
      </nav>
    </header>
  );
}
