import Link from "next/link";
import EffluxaBrand from "@/components/EffluxaBrand";

export default function PublicFooter() {
  return (
    <footer
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 24px",
        borderTop: "1px solid rgba(148,163,184,0.18)",
        display: "flex",
        justifyContent: "space-between",
        gap: "20px",
        flexWrap: "wrap",
        color: "#94a3b8",
      }}
    >
      <div>
        <EffluxaBrand className="public-footer-brand" />
        <div>© 2026 Effluxa. AI Financial Leak Audit.</div>
        <div style={{ marginTop: "8px", fontSize: "13px" }}>
          Effluxa is a product by{" "}
          <a href="https://needai.help" target="_blank" rel="noreferrer" style={{ color: "#60a5fa", fontWeight: 800 }}>
            NeedAIHelp
          </a>
          .
        </div>
      </div>

      <div className="public-footer-social">
        <div className="public-footer-social-label">Stay connected</div>
        <a
          className="public-footer-linkedin"
          href="https://www.linkedin.com/showcase/effluxa/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow Effluxa on LinkedIn"
        >
          <span className="public-footer-linkedin-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="presentation" focusable="false">
              <path d="M6.5 8.25H3.25V20.5H6.5V8.25ZM4.86 3.5C3.83 3.5 3 4.34 3 5.37C3 6.4 3.83 7.24 4.86 7.24C5.89 7.24 6.72 6.4 6.72 5.37C6.72 4.34 5.89 3.5 4.86 3.5ZM20.75 13.48C20.75 9.79 18.79 8.03 16.17 8.03C14.05 8.03 13.1 9.2 12.57 10.02V8.25H9.32V20.5H12.57V14.44C12.57 12.84 12.87 11.29 14.88 11.29C16.86 11.29 16.89 13.13 16.89 14.54V20.5H20.75V13.48Z" />
            </svg>
          </span>
          <span className="public-footer-linkedin-copy">
            <strong>Follow Effluxa on LinkedIn</strong>
            <span>Product news, financial insights and practical guidance.</span>
          </span>
          <span className="public-footer-linkedin-arrow" aria-hidden="true">↗</span>
        </a>
      </div>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <Link href="/tools">Free tools</Link>
        <Link href="/compare">Comparisons</Link>
        <Link href="/use-cases">Use cases</Link>
        <Link href="/security">Security &amp; DPA</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms of Service</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/login">Login</Link>
      </div>
    </footer>
  );
}
