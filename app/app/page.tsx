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
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);

  useEffect(() => {
    async function check() {
      const token = await getToken({ template: "effluxa" });
      const res = await fetch("/api/billing/status", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setActive(Boolean(data.active));
      setLoading(false);
    }
    check();
  }, [getToken]);

  async function startCheckout() {
    const token = await getToken({ template: "effluxa" });
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
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
              <p>Next: upload invoices, payments and price list.</p>
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
