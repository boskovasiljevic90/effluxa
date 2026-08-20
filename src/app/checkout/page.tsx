"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

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
      Checkout: {
        open: (options: { transactionId: string }) => void;
      };
    };
  }
}

export default function CheckoutPage() {
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.replace(/\\[rn]/g, "").trim();
  const environment =
    process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT?.replace(/\\[rn]/g, "").trim() === "sandbox"
      ? "sandbox"
      : "production";

  function initializePaddle() {
    if (initialized.current) {
      return;
    }

    if (!token || !window.Paddle?.Checkout) {
      setError("Checkout is temporarily unavailable. Please try again later.");
      return;
    }

    initialized.current = true;

    try {
      if (environment === "sandbox") {
        window.Paddle.Environment.set("sandbox");
      }

      window.Paddle.Initialize({
        token,
        eventCallback: (event) => {
          if (event.name === "checkout.error") {
            setError("Checkout is temporarily unavailable. Please try again later.");
            return;
          }

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

      const transactionId = new URLSearchParams(window.location.search).get("_ptxn");

      if (transactionId) {
        window.Paddle.Checkout.open({ transactionId });
      }
    } catch {
      initialized.current = false;
      setError("Checkout is temporarily unavailable. Please try again later.");
    }
  }

  useEffect(() => {
    const pollForPaddle = window.setInterval(() => {
      if (window.Paddle?.Checkout) {
        initializePaddle();
      }

      if (initialized.current) {
        window.clearInterval(pollForPaddle);
      }
    }, 200);

    const timeout = window.setTimeout(() => {
      if (!initialized.current && !error) {
        setError("Checkout is temporarily unavailable. Please try again later.");
      }
    }, 10000);

    return () => {
      window.clearInterval(pollForPaddle);
      window.clearTimeout(timeout);
    };
  }, [error]);

  return (
    <main style={{ minHeight: "100vh", padding: "48px 24px", background: "#f8fafc" }}>
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        strategy="afterInteractive"
        onReady={initializePaddle}
        onError={() => setError("Checkout is temporarily unavailable. Please try again later.")}
      />

      <div style={{ maxWidth: "760px", margin: "0 auto", textAlign: "center" }}>
        <img src="/brand/effluxa-wordmark-light.svg" alt="Effluxa" style={{ width: "170px", height: "auto", margin: "0 auto 18px" }} />
        <p style={{ color: "#2563eb", fontWeight: 700 }}>Secure checkout</p>
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
