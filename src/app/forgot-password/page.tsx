"use client";

import { useState } from "react";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to generate reset link.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <PublicHeader />

      <main style={{ maxWidth: "520px", margin: "0 auto", padding: "80px 24px" }}>
        <h1 style={{ fontSize: "42px", fontWeight: 900 }}>
          Reset Password
        </h1>

        <p style={{ marginTop: "14px", color: "#475569", lineHeight: 1.7 }}>
          Enter your email address to receive a password reset link.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: "32px",
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "24px",
            padding: "30px",
          }}
        >
          <label style={{ fontWeight: 800 }}>Email</label>

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              marginTop: "10px",
              padding: "15px 16px",
              borderRadius: "14px",
              border: "1px solid #cbd5e1",
              fontSize: "16px",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "20px",
              width: "100%",
              height: "56px",
              borderRadius: "18px",
              border: "none",
              background: "#0f172a",
              color: "white",
              fontWeight: 900,
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Sending..." : "Send Reset Email"}
          </button>

          {success && (
            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                borderRadius: "14px",
                background: "#dcfce7",
                color: "#166534",
                lineHeight: 1.6,
              }}
            >
              <strong>✅ Password reset email sent.</strong>

              <div style={{ marginTop: "8px" }}>
                Please check your inbox and spam folder.
              </div>
            </div>
          )}
        </form>

        <Link href="/login">
          <div
            style={{
              marginTop: "24px",
              color: "#2563eb",
              fontWeight: 800,
            }}
          >
            Back to login
          </div>
        </Link>
      </main>

      <PublicFooter />
    </div>
  );
}
