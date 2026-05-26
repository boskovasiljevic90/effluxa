import Link from "next/link";

export default function HomePage() {
  return (
    <div className="page-container">
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "80px",
          }}
        >
          <div className="logo">
            Eff<span>luxa</span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <Link href="/login">
              <button
                style={{
                  background: "transparent",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                Login
              </button>
            </Link>

            <Link href="/signup">
              <button className="primary-button">
                Create Account
              </button>
            </Link>
          </div>
        </div>

        <div
          style={{
            paddingTop: "80px",
            paddingBottom: "120px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "10px 18px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.08)",
              marginBottom: "30px",
              fontSize: "14px",
            }}
          >
            AI-Powered Financial Leak Detection
          </div>

          <h1
            style={{
              fontSize: "72px",
              lineHeight: 1.05,
              maxWidth: "980px",
              margin: "0 auto",
              fontWeight: 800,
            }}
          >
            Detect Hidden Financial Leakage Before It Costs You Thousands
          </h1>

          <p
            className="gray"
            style={{
              fontSize: "22px",
              lineHeight: 1.7,
              maxWidth: "900px",
              margin: "30px auto",
            }}
          >
            Effluxa uses AI to analyze invoices, financial statements,
            operational expenses, and vendor spending to uncover hidden
            inefficiencies and savings opportunities.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              marginTop: "40px",
              flexWrap: "wrap",
            }}
          >
            <Link href="/signup">
              <button
                className="primary-button"
                style={{
                  fontSize: "18px",
                  padding: "18px 32px",
                }}
              >
                Start AI Audit
              </button>
            </Link>

            <a href="#pricing">
              <button
                style={{
                  padding: "18px 32px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.08)",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                View Pricing
              </button>
            </a>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: "24px",
            marginBottom: "120px",
          }}
        >
          <div className="card">
            <div className="card-title">
              AI Leakage Detection
            </div>

            <p className="gray" style={{ lineHeight: 1.7 }}>
              Detect unnecessary spending, hidden operational inefficiencies,
              duplicate expenses, and vendor overspending.
            </p>
          </div>

          <div className="card">
            <div className="card-title">
              Instant Savings Insights
            </div>

            <p className="gray" style={{ lineHeight: 1.7 }}>
              Effluxa estimates realistic savings opportunities based on your
              uploaded financial data and expense structure.
            </p>
          </div>

          <div className="card">
            <div className="card-title">
              Executive AI Reports
            </div>

            <p className="gray" style={{ lineHeight: 1.7 }}>
              Generate professional AI-powered financial audit summaries in
              seconds without manual analysis.
            </p>
          </div>
        </div>

        <div
          id="pricing"
          style={{
            paddingTop: "40px",
            paddingBottom: "120px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "50px",
            }}
          >
            <h2
              style={{
                fontSize: "52px",
                marginBottom: "20px",
              }}
            >
              Simple Pricing
            </h2>

            <p
              className="gray"
              style={{
                fontSize: "20px",
              }}
            >
              Pay only when you unlock a full AI audit.
            </p>
          </div>

          <div
            style={{
              maxWidth: "560px",
              margin: "0 auto",
            }}
          >
            <div
              className="card"
              style={{
                textAlign: "center",
                padding: "50px",
                border: "1px solid rgba(96,165,250,0.3)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  marginBottom: "20px",
                  color: "#60a5fa",
                  fontWeight: "bold",
                }}
              >
                AI Financial Leak Audit
              </div>

              <div
                style={{
                  fontSize: "72px",
                  fontWeight: 800,
                  marginBottom: "10px",
                }}
              >
                €29
              </div>

              <p
                className="gray"
                style={{
                  marginBottom: "30px",
                }}
              >
                One-time payment per audit
              </p>

              <div
                style={{
                  textAlign: "left",
                  marginBottom: "40px",
                  lineHeight: 2,
                }}
              >
                <div>✓ AI financial analysis</div>
                <div>✓ Leakage score</div>
                <div>✓ Savings opportunities</div>
                <div>✓ Vendor insights</div>
                <div>✓ Executive summary</div>
                <div>✓ AI recommendations</div>
              </div>

              <Link href="/signup">
                <button
                  className="primary-button"
                  style={{
                    width: "100%",
                    fontSize: "18px",
                    padding: "18px",
                  }}
                >
                  Start Audit
                </button>
              </Link>
            </div>
          </div>
        </div>
      
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: "40px",
            paddingBottom: "40px",
            display: "flex",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
            color: "#94a3b8",
          }}
        >
          <div>© 2026 Effluxa. AI Financial Leak Audit.</div>

          <div style={{ display: "flex", gap: "20px" }}>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/login">Login</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
