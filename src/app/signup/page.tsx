"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { trackClientEvent } from "@/lib/clientAnalytics";
import { normalizeReferralCode } from "@/lib/referrals";
import type { SubscriptionPlan } from "@/components/subscription/SubscriptionButton";

const subscriptionPlanIntents: SubscriptionPlan[] = [
  "pro_monthly",
  "pro_annual",
  "agency_monthly",
  "agency_annual",
];

const subscriptionPlanLabels: Record<SubscriptionPlan, string> = {
  pro_monthly: "Pro monthly",
  pro_annual: "Pro annual",
  agency_monthly: "Agency monthly",
  agency_annual: "Agency annual",
};

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasPartnerInvitation, setHasPartnerInvitation] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    const referralCode = normalizeReferralCode(
      new URLSearchParams(window.location.search).get("ref")
    );

    if (!referralCode) return;

    setHasPartnerInvitation(true);
    trackClientEvent("referral_signup_started", {
      acquisition_channel: "partner_referral",
    });
  }, []);

  useEffect(() => {
    const rawPlan = new URLSearchParams(window.location.search).get("plan");
    if (!subscriptionPlanIntents.includes(rawPlan as SubscriptionPlan)) return;

    const plan = rawPlan as SubscriptionPlan;
    setSelectedPlan(plan);
    trackClientEvent("signup_plan_intent", { plan });
  }, []);

  async function handleSignup(e: any) {
    e.preventDefault();

    try {
      setLoading(true);
      trackClientEvent("signup_started");

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          termsAccepted,
          planIntent: selectedPlan,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      trackClientEvent("signup_completed");
      const destination = selectedPlan
        ? `/dashboard?plan=${encodeURIComponent(selectedPlan)}`
        : "/dashboard";
      window.location.href = destination;
    } catch (err) {
      console.error(err);
      alert("Signup failed");
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <PublicHeader />
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
            <img src="/brand/effluxa-wordmark.svg" alt="Effluxa" />
          </div>

          <div
            className="auth-title"
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
            Create a free Effluxa account, upload a financial PDF, CSV, or Excel file,
            and discover hidden leakage opportunities in minutes.
          </p>
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
          <div className="card" style={{ width: "100%", maxWidth: "420px" }}>
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

            {selectedPlan && (
              <div
                role="status"
                style={{
                  marginBottom: "24px",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  background: "rgba(37,99,235,0.14)",
                  border: "1px solid rgba(96,165,250,0.35)",
                  color: "#bfdbfe",
                  fontSize: "14px",
                  lineHeight: 1.55,
                }}
              >
                You selected {subscriptionPlanLabels[selectedPlan]}. Create your free account first; secure checkout will be ready in the dashboard.
              </div>
            )}

            {hasPartnerInvitation && (
              <div
                role="status"
                style={{
                  marginBottom: "24px",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  background: "rgba(99,102,241,0.14)",
                  border: "1px solid rgba(129,140,248,0.45)",
                  color: "#c7d2fe",
                  fontSize: "14px",
                  lineHeight: 1.55,
                }}
              >
                Partner invitation detected. Your signup will be attributed
                automatically — no code is needed.
              </div>
            )}

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

              <div style={{ marginBottom: "22px" }}>
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

              <label
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  color: "#cbd5e1",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  marginBottom: "24px",
                }}
              >
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  style={{ marginTop: "5px" }}
                />

                <span>
                  I agree to Effluxa&apos;s{" "}
                  <Link href="/terms" style={{ color: "#60a5fa" }}>
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" style={{ color: "#60a5fa" }}>
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              {!termsAccepted && (
                <p
                  style={{
                    color: "#fca5a5",
                    fontSize: "14px",
                    marginBottom: "16px",
                    lineHeight: 1.5,
                  }}
                >
                  Please accept the Terms of Service and Privacy Policy to create your account.
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !termsAccepted}
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
                  cursor: loading || !termsAccepted ? "not-allowed" : "pointer",
                  opacity: loading || !termsAccepted ? 0.6 : 1,
                }}
              >
                Already have an account? Login
              </div>
            </Link>
          </div>
        </div>
      </div>
          <PublicFooter />
    </div>
  );
}
