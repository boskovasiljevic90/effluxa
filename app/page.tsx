export default function HomePage() {
  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "28px 20px" }}>
        <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#111827" }} />
          <div style={{ fontWeight: 900, letterSpacing: -0.3, fontSize: 18 }}>Effluxa</div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <a href="/app" style={linkBtn()}>
              Open App →
            </a>
          </div>
        </header>

        <main style={{ marginTop: 36 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24, alignItems: "start" }}>
            <section>
              <h1 style={{ margin: 0, fontSize: 48, lineHeight: 1.05, letterSpacing: -1.2 }}>
                Reconcile invoices & payments in minutes.
              </h1>
              <p style={{ marginTop: 14, fontSize: 18, lineHeight: 1.5, opacity: 0.82 }}>
                Effluxa ingests invoices (PDF/Excel/ZIP) and bank exports to automatically match payments,
                flag risk, and explain every decision — across languages.
              </p>

              <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href="/app" style={primaryBtn()}>
                  Try the app →
                </a>
                <a href="#pricing" style={linkBtn()}>
                  View pricing
                </a>
              </div>

              <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <div style={card()}>
                  <div style={cardTitle()}>PDF invoices</div>
                  <div style={cardBody()}>Upload PDF invoices directly — no templates.</div>
                </div>
                <div style={card()}>
                  <div style={cardTitle()}>Multi-upload</div>
                  <div style={cardBody()}>Upload many files at once (mixed formats).</div>
                </div>
                <div style={card()}>
                  <div style={cardTitle()}>Explainable results</div>
                  <div style={cardBody()}>Every status includes a human-friendly explanation.</div>
                </div>
              </div>

              <div style={{ marginTop: 18, fontSize: 12, opacity: 0.7 }}>
                Supported globally — Effluxa detects invoice language automatically.
              </div>
            </section>

            <aside style={card()}>
              <div style={{ fontWeight: 950, fontSize: 16 }}>What Effluxa does</div>
              <ul style={{ marginTop: 10, paddingLeft: 18, lineHeight: 1.7, opacity: 0.85 }}>
                <li>Upload invoices & bank exports</li>
                <li>Run reconciliation</li>
                <li>Review grouped results</li>
                <li>Drill down per invoice/vendor/currency</li>
              </ul>

              <div style={{ marginTop: 14, borderTop: "1px solid #e5e7eb", paddingTop: 14 }}>
                <div style={{ fontWeight: 900 }}>Contact</div>
                <div style={{ marginTop: 6, fontSize: 14, opacity: 0.85 }}>
                  Email: <a href="mailto:support@effluxa.com">support@effluxa.com</a>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.65 }}>
                  Effluxa is a subscription SaaS with monthly billing and cancel-anytime.
                </div>
              </div>
            </aside>
          </div>

          <section id="pricing" style={{ marginTop: 44 }}>
            <h2 style={{ margin: 0, fontSize: 28, letterSpacing: -0.5 }}>Pricing</h2>
            <p style={{ marginTop: 10, opacity: 0.8 }}>
              Simple: Free for evaluation, Pro for real work. Cancel anytime.
            </p>

            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              <div style={card()}>
                <div style={{ fontWeight: 950, fontSize: 16 }}>Free</div>
                <div style={{ marginTop: 6, fontSize: 34, fontWeight: 950 }}>€0</div>
                <div style={{ marginTop: 6, opacity: 0.8 }}>Limited evaluation usage</div>
                <ul style={{ marginTop: 10, paddingLeft: 18, lineHeight: 1.8, opacity: 0.85 }}>
                  <li>Upload invoices & payments</li>
                  <li>Run reconciliation</li>
                  <li>See explanations</li>
                </ul>
                <a href="/app" style={{ ...primaryBtn(), marginTop: 12, display: "inline-block" }}>
                  Start free →
                </a>
              </div>

              <div style={{ ...card(), border: "2px solid #111827" }}>
                <div style={{ fontWeight: 950, fontSize: 16 }}>Pro</div>
                <div style={{ marginTop: 6, fontSize: 34, fontWeight: 950 }}>€199</div>
                <div style={{ marginTop: 6, opacity: 0.8 }}>per month · cancel anytime</div>
                <ul style={{ marginTop: 10, paddingLeft: 18, lineHeight: 1.8, opacity: 0.85 }}>
                  <li>PDF/Excel/ZIP support</li>
                  <li>Multi-upload (mixed files)</li>
                  <li>Vendor & currency drill-down</li>
                  <li>Commercial grouping mode</li>
                </ul>
                <a href="/app" style={{ ...primaryBtn(), marginTop: 12, display: "inline-block" }}>
                  Subscribe in app →
                </a>
              </div>
            </div>
          </section>

          <footer style={{ marginTop: 46, paddingTop: 18, borderTop: "1px solid #e5e7eb", opacity: 0.7, fontSize: 12 }}>
            © {new Date().getFullYear()} Effluxa. All rights reserved.
          </footer>
        </main>
      </div>
    </div>
  );
}

function card(): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    background: "white",
  };
}
function cardTitle(): React.CSSProperties {
  return { fontWeight: 950, fontSize: 14 };
}
function cardBody(): React.CSSProperties {
  return { marginTop: 6, opacity: 0.8, lineHeight: 1.5, fontSize: 13 };
}
function primaryBtn(): React.CSSProperties {
  return {
    textDecoration: "none",
    padding: "10px 14px",
    borderRadius: 12,
    background: "#111827",
    color: "white",
    fontWeight: 900,
    border: "1px solid #111827",
  };
}
function linkBtn(): React.CSSProperties {
  return {
    textDecoration: "none",
    padding: "10px 14px",
    borderRadius: 12,
    background: "white",
    color: "#111827",
    fontWeight: 900,
    border: "1px solid #e5e7eb",
  };
}
