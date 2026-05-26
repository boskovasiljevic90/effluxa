"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleLogin(e: any) {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed");
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      alert("Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div
        className="auth-grid"
        style={{
          minHeight: "100vh",
          display: "grid",
          gridTemplateColumns: "1fr 520px",
        }}
      >
        <div
          className="auth-hero"
          style={{
            padding: "80px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div className="logo" style={{ marginBottom: "40px" }}>
            Eff<span>luxa</span>
          </div>

          <div
            className="auth-title"
            style={{
              fontSize: "64px",
              lineHeight: 1.05,
              fontWeight: 800,
              maxWidth: "700px",
            }}
          >
            AI Financial Intelligence For Modern Businesses
          </div>

          <p
            className="gray"
            style={{
              fontSize: "22px",
              lineHeight: 1.7,
              marginTop: "30px",
              maxWidth: "720px",
            }}
          >
            Detect financial leakage, optimize operational spending,
            and uncover hidden savings opportunities using AI-powered audits.
          </p>

          <div
            style={{
              display: "flex",
              gap: "18px",
              marginTop: "40px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                padding: "12px 18px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              AI Financial Audits
            </div>

            <div
              style={{
                padding: "12px 18px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              Leakage Detection
            </div>

            <div
              style={{
                padding: "12px 18px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              Executive Reports
            </div>
          </div>
        </div>

        <div
          className="auth-panel"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
            backdropFilter: "blur(20px)",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "420px",
            }}
          >
            <div
              style={{
                fontSize: "34px",
                fontWeight: "bold",
                marginBottom: "10px",
              }}
            >
              Welcome Back
            </div>

            <p className="gray" style={{ marginBottom: "30px" }}>
              Login to continue using Effluxa AI.
            </p>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: "18px" }}>
                <div
                  style={{
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  Email
                </div>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "14px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)",
                    color: "white",
                    fontSize: "16px",
                  }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  Password
                </div>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "14px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)",
                    color: "white",
                    fontSize: "16px",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="primary-button"
                style={{
                  width: "100%",
                  padding: "18px",
                  fontSize: "16px",
                }}
              >
                {loading ? "Signing in..." : "Login to Effluxa"}
              </button>
            </form>

            <div
              style={{
                marginTop: "30px",
                paddingTop: "24px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  marginBottom: "12px",
                  color: "#94a3b8",
                }}
              >
                Demo accounts
              </div>

              <div style={{ lineHeight: 1.8 }}>
                <div>
                  FREE: free@effluxa.test
                </div>

                <div>
                  Password: Free123456!
                </div>
              </div>
            </div>

            <Link href="/">
              <div
                style={{
                  marginTop: "28px",
                  textAlign: "center",
                  color: "#60a5fa",
                  cursor: "pointer",
                }}
              >
                ← Back to homepage
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
