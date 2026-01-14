"use client";

import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
  OrganizationSwitcher,
  useAuth,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function AppHome() {
  const { getToken, orgId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const token = await getToken({ template: "effluxa" });
        const res = await fetch("/api/billing/status", {
          method: "POST",
          headers: { Authorization: `Bearer ${token ?? ""}` },
        });
        const data = await res.json();
        setActive(Boolean(data.active));
      } catch {
        setActive(false);
      } finally {
        setLoading(false);
      }
    }
    check();
  }, [getToken]);

  async function startCheckout() {
    const token = await getToken({ template: "effluxa" });

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token ?? ""}`,
        "X-CLERK-ORG-ID": orgId ?? "",
      },
    });

    const text = await res.text();
    if (!res.ok) {
      alert("Checkout error: " + res.status + "\n\n" + text);
      return;
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      alert("Checkout returned non-JSON:\n\n" + text);
      return;
    }

    if (!data?.url) {
      alert("No checkout URL returned:\n\n" + text);
      return;
    }

    window.location.href = data.url;
  }

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>

      <SignedIn>
        <main style={{ padding: 24 }}>
          <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ margin: 0 }}>Effluxa</h1>
            <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
              <OrganizationSwitcher hidePersonal />
              <UserButton />
            </div>
          </header>

          {loading ? (
            <p>Loading…</p>
          ) : active ? (
            <section style={{ marginTop: 24 }}>
              <p>✅ Subscription active. App unlocked.</p>
            </section>
          ) : (
            <section style={{ marginTop: 24 }}>
              <h2>Billing</h2>
              <p>An active subscription is required.</p>

              <button
                onClick={startCheckout}
                style={{
                  marginTop: 16,
                  padding: "10px 16px",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                Subscribe Monthly
              </button>
            </section>
          )}
        </main>
      </SignedIn>
    </>
  );
}
