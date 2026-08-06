"use client";

import Script from "next/script";
import { useState } from "react";

type PaddleCheckoutEvent = {
  name?: string;
  data?: {
    transaction_id?: string;
  };
};

declare global {
  interface Window {
    Paddle?: {
      Environment: {
        set: (environment: "sandbox" | "production") => void;
      };
      Initialize: (options: {
        token: string;
        eventCallback?: (event: PaddleCheckoutEvent) => void;
      }) => void;
    };
  }
}

export default function CheckoutPage() {
  const [error, setError] = useState<string | null>(null);
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const environment =
    process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "sandbox"
      ? "sandbox"
      : "production";

  function initializePaddle() {
    if (!token || !window.Paddle) {
      setError("Checkout is temporarily unavailable. Please try again later.");
      return;
    }

    if (environment === "sandbox") {
      window.Paddle.Environment.set("sandbox");
    }

    window.Paddle.Initialize({
      token,
      eventCallback: (event) => {
        if (event.name !== "checkout.completed") {
          return;
        }

        const transactionId = event.data?.transaction_id;

        if (transactionId) {
          window.location.href = `/billing/success?transaction_id=${encodeURIComponent(transactionId)}`;
          return;
        }

        window.location.href = "/dashboard?billing=success";
      },
    });
  }

  return (
    <main style={{ minHeight: "100vh", padding: "48px 24px", background: "#f8fafc" }}>
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        strategy="afterInteractive"
        onLoad={initializePaddle}
        onError={() => setError("Checkout is temporarily unavailable. Please try again later.")}
      />

      <div style={{ maxWidth: "760px", margin: "0 auto", textAlign: "center" }}>
        <p style={{ color: "#2563eb", fontWeight: 700 }}>Effluxa secure checkout</p>
        <h1 style={{ fontSize: "40px", margin: "16px 0" }}>Complete your payment</h1>
        <p style={{ color: "#475569", lineHeight: 1.7 }}>
          Paddle securely handles payment, tax, receipts and subscription management.
        </p>
        {!error && <p style={{ marginTop: "32px", color: "#64748b" }}>Loading checkout…</p>}
        {error && <p style={{ marginTop: "32px", color: "#b91c1c" }}>{error}</p>}
      </div>
    </main>
  );
}
