"use client";

import { useState } from "react";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to send message.");
        setLoading(false);
        return;
      }

      setSent(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setLoading(false);
    } catch (error) {
      console.error(error);
      alert("Failed to send message.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <PublicHeader />

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <h1 style={{ fontSize: "56px", fontWeight: 900, letterSpacing: "-2px" }}>
            Contact Effluxa
          </h1>

          <p style={{ marginTop: "18px", fontSize: "20px", color: "#475569", lineHeight: 1.7 }}>
            Questions about your audit, upload, payment, or report? Send us a message.
          </p>
        </div>

        <div
          className="contact-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.2fr",
            gap: "28px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "34px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
              height: "fit-content",
            }}
          >
            <h2 style={{ fontSize: "26px", fontWeight: 900 }}>Support</h2>

            <p style={{ marginTop: "16px", color: "#475569", lineHeight: 1.8 }}>
              Use the form for upload issues, payment questions, report access, refunds, or product feedback.
            </p>

            <div style={{ marginTop: "28px" }}>
              <div style={{ fontWeight: 800 }}>Email</div>
              <div style={{ marginTop: "8px", color: "#475569" }}>
                support@effluxa.com
              </div>
            </div>

            <div style={{ marginTop: "28px" }}>
              <div style={{ fontWeight: 800 }}>Response time</div>
              <div style={{ marginTop: "8px", color: "#475569" }}>
                Business days, as soon as possible.
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "34px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
            }}
          >
            {sent && (
              <div
                style={{
                  marginBottom: "22px",
                  padding: "16px",
                  borderRadius: "14px",
                  background: "#dcfce7",
                  color: "#166534",
                  fontWeight: 700,
                }}
              >
                Message sent successfully.
              </div>
            )}

            <div style={{ display: "grid", gap: "18px" }}>
              <div>
                <label style={{ fontWeight: 700 }}>Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  placeholder="Your name"
                />
              </div>

              <div>
                <label style={{ fontWeight: 700 }}>Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label style={{ fontWeight: 700 }}>Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={inputStyle}
                  placeholder="Payment, report, upload..."
                />
              </div>

              <div>
                <label style={{ fontWeight: 700 }}>Message *</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    ...inputStyle,
                    minHeight: "150px",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                  placeholder="Tell us what happened..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  height: "58px",
                  borderRadius: "18px",
                  border: "none",
                  background: "#0f172a",
                  color: "white",
                  fontSize: "17px",
                  fontWeight: 900,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </div>
          </form>
        </div>

        <div style={{ marginTop: "50px", textAlign: "center" }}>
          <Link href="/signup" style={{ color: "#2563eb", fontWeight: 800 }}>
            Start a free audit instead →
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: "8px",
  padding: "15px 16px",
  borderRadius: "14px",
  border: "1px solid #cbd5e1",
  fontSize: "16px",
  color: "#0f172a",
  background: "#ffffff",
};
