"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleSignup(e: any) {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await fetch("/api/auth/signup", {
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
        alert(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      alert("Signup failed");
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          gridTemplateColumns: "1fr 520px",
        }}
      >
        <div
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
            style={{
              fontSize: "64px",
              lineHeight: 1.05,
              fontWeight: 800,
              maxWidth: "720px",
            }}
          >
            Start Your First AI Financial Leak Audit
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
            Create a free Effluxa account, upload a financial PDF, and discover hidden leakage opportunities in minutes.
          </p>
        </div>

        <div
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
              Create Account
            </div>

            <p className="gray" style={{ marginBottom: "30px" }}>
              Start free. Unlock full audits only when you need them.
            </p>

            <form onSubmit={handleSignup}>
              <div style={{ marginBottom: "18px" }}>
                <div style={{ marginBottom: "10px", fontSize: "14px" }}>
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
                <div style={{ marginBottom: "10px", fontSize: "14px" }}>
                  Password
                </div>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
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
                {loading ? "Creating account..." : "Create Free Account"}
              </button>
            </form>

            <Link href="/login">
              <div
                style={{
                  marginTop: "28px",
                  textAlign: "center",
                  color: "#60a5fa",
                  cursor: "pointer",
                }}
              >
                Already have an account? Login
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
