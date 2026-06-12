"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to reset password.");
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <PublicHeader />

      <main style={{ maxWidth: "520px", margin: "0 auto", padding: "80px 24px" }}>
        <h1 style={{ fontSize: "42px", fontWeight: 900 }}>
          Create New Password
        </h1>

        {!token ? (
          <p style={{ marginTop: "20px", color: "#b91c1c" }}>
            Missing reset token.
          </p>
        ) : done ? (
          <div
            style={{
              marginTop: "32px",
              background: "#dcfce7",
              color: "#166534",
              borderRadius: "18px",
              padding: "24px",
              lineHeight: 1.7,
            }}
          >
            Password changed successfully.
            <br />
            <Link href="/login" style={{ fontWeight: 900 }}>
              Go to login
            </Link>
          </div>
        ) : (
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
            <label style={{ fontWeight: 800 }}>New Password</label>

            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              {loading ? "Saving..." : "Reset Password"}
            </button>
          </form>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
