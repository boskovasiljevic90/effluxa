import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(to bottom, #f8fafc 0%, #ffffff 45%, #f8fafc 100%)",
        color: "#0f172a",
      }}
    >
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "100px 24px 70px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 18px",
            borderRadius: "999px",
            background: "#ecfeff",
            color: "#155e75",
            fontWeight: 700,
            fontSize: "14px",
            border: "1px solid #a5f3fc",
          }}
        >
          AI Financial Leak Detection
        </div>

        <h1
          style={{
            fontSize: "72px",
            lineHeight: 1,
            marginTop: "30px",
            fontWeight: 900,
            maxWidth: "980px",
            letterSpacing: "-3px",
          }}
        >
          Find Hidden Financial Leakage in Minutes
        </h1>

        <p
          style={{
            marginTop: "30px",
            fontSize: "24px",
            lineHeight: 1.6,
            maxWidth: "820px",
            color: "#334155",
          }}
        >
          Upload invoices, payment exports, or financial reports.
          Effluxa AI instantly detects overspending, duplicate vendors,
          pricing anomalies, and hidden savings opportunities.
        </p>

        <div
          style={{
            marginTop: "40px",
            display: "flex",
            gap: "18px",
            flexWrap: "wrap",
          }}
        >
          <Link href="/signup">
            <button
              style={{
                height: "62px",
                padding: "0 34px",
                borderRadius: "18px",
                border: "none",
                background: "#0f172a",
                color: "white",
                fontSize: "18px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Start Free Audit
            </button>
          </Link>

          <a href="#how-it-works">
            <button
              style={{
                height: "62px",
                padding: "0 34px",
                borderRadius: "18px",
                border: "1px solid #cbd5e1",
                background: "white",
                color: "#0f172a",
                fontSize: "18px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              See How It Works
            </button>
          </a>
        </div>

        <div
          style={{
            marginTop: "70px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: "22px",
          }}
        >
          {[
            {
              title: "AI Leakage Score",
              value: "78/100",
              desc: "Financial inefficiency detected",
            },
            {
              title: "Estimated Savings",
              value: "€18,420",
              desc: "Potential annual optimization",
            },
            {
              title: "Duplicate Vendors",
              value: "12",
              desc: "Potential payment overlap",
            },
          ].map((card, index) => (
            <div
              key={index}
              style={{
                background: "white",
                borderRadius: "24px",
                padding: "28px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
              }}
            >
              <div
                style={{
                  color: "#64748b",
                  fontSize: "15px",
                  fontWeight: 600,
                }}
              >
                {card.title}
              </div>

              <div
                style={{
                  marginTop: "16px",
                  fontSize: "42px",
                  fontWeight: 900,
                }}
              >
                {card.value}
              </div>

              <div
                style={{
                  marginTop: "12px",
                  color: "#475569",
                  lineHeight: 1.6,
                }}
              >
                {card.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "30px 24px 120px",
        }}
      >
        <h2
          style={{
            fontSize: "48px",
            fontWeight: 900,
            textAlign: "center",
            letterSpacing: "-2px",
          }}
        >
          How Effluxa Works
        </h2>

        <div
          style={{
            marginTop: "60px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: "26px",
          }}
        >
          {[
            {
              step: "1",
              title: "Upload Financial Files",
              desc: "PDF invoices, CSV exports, XLSX statements, and payment reports.",
            },
            {
              step: "2",
              title: "AI Analyzes Spending",
              desc: "Effluxa detects anomalies, waste, duplicate charges, and vendor inefficiencies.",
            },
            {
              step: "3",
              title: "Unlock Full Audit",
              desc: "Get a complete AI-generated savings report and downloadable PDF audit.",
            },
          ].map((item, index) => (
            <div
              key={index}
              style={{
                background: "white",
                borderRadius: "24px",
                padding: "34px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "16px",
                  background: "#0f172a",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "20px",
                }}
              >
                {item.step}
              </div>

              <h3
                style={{
                  marginTop: "24px",
                  fontSize: "26px",
                  fontWeight: 800,
                }}
              >
                {item.title}
              </h3>

              <p
                style={{
                  marginTop: "16px",
                  color: "#475569",
                  lineHeight: 1.8,
                  fontSize: "17px",
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "90px",
            textAlign: "center",
          }}
        >
          <Link href="/signup">
            <button
              style={{
                height: "68px",
                padding: "0 42px",
                borderRadius: "20px",
                border: "none",
                background: "#0f172a",
                color: "white",
                fontSize: "20px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Start Your First Free Audit
            </button>
          </Link>

          <p
            style={{
              marginTop: "18px",
              color: "#64748b",
              fontSize: "15px",
            }}
          >
            No setup required • Upload in minutes • AI-generated savings analysis
          </p>
        </div>
      </section>
    </main>
  );
}
