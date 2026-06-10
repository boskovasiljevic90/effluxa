import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 24px",
        borderTop: "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-between",
        gap: "20px",
        flexWrap: "wrap",
        color: "#64748b",
      }}
    >
      <div>© 2026 Effluxa. AI Financial Leak Audit.</div>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms of Service</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/login">Login</Link>
      </div>
    </footer>
  );
}
