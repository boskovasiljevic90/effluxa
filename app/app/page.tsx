"use client";

import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
  OrganizationSwitcher,
  useAuth,
} from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";

export default function AppHome() {
  const { getToken, orgId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  const checkoutStatus = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("checkout");
  }, []);

  async function refreshStatus() {
    const token = await getToken({ template: "effluxa" });
    const res = await fetch("/api/billing/status", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token ?? ""}`,
        "X-CLERK-ORG-ID": orgId ?? "",
      },
    });
    const data = await res.json();
    setActive(Boolean(data.active));
  }

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);

        // If we returned from checkout success, activate subscription (test flow)
        if (checkoutStatus === "success") {
          const token = await getToken({ template: "effluxa" });
          await fetch("/api/billing/activate", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token ?? ""}`,
              "X-CLERK-ORG-ID": orgId ?? "",
            },
          }).catch(() => {});
          // clean URL
          if (typeof window !== "undefined") {
            const u = new URL(window.location.href);
            u.searchParams.delete("checkout");
            window.history.replaceState({}, "", u.toString());
          }
        }

        await refreshStatus();
      } catch {
        setActive(false);
      } finally {
        setLoading(false);
      }
    }

    // wait for orgId to be available; still allow status call (will return inactive if none)
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getToken, orgId]);

  async function startCheckout() {
    if (!orgId) {
      alert("Please select an organization first (top-right).");
      return;
    }

    setBusy(true);
    try {
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

      const data = JSON.parse(text);
      if (!data?.url) {
        alert("No checkout URL returned:\n\n" + text);
        return;
      }

      window.location.href = data.url;
    } finally {
      setBusy(false);
    }
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
              <p>
                <a href="/app/upload">Go to Upload →</a>
              </p>
            </section>
          ) : (
            <section style={{ marginTop: 24, maxWidth: 520 }}>
              <h2>Billing</h2>
              <p>An active subscription is required.</p>

              {!orgId ? (
                <div style={{ marginTop: 12, padding: 12, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff" }}>
                  <b>Step 1:</b> Select an Organization (top-right).  
                  <div style={{ opacity: 0.75, marginTop: 6 }}>
                    Checkout requires an organization context.
                  </div>
                </div>
              ) : null}

              <button
                onClick={startCheckout}
                disabled={!orgId || busy}
                style={{
                  marginTop: 16,
                  padding: "10px 16px",
                  fontSize: 16,
                  cursor: !orgId || busy ? "not-allowed" : "pointer",
                  opacity: !orgId || busy ? 0.6 : 1,
                }}
              >
                {busy ? "Opening checkout…" : "Subscribe Monthly"}
              </button>

              <div style={{ marginTop: 10, opacity: 0.6, fontSize: 12 }}>
                If you already paid and still see this screen, reload once.
              </div>
            </section>
          )}
        </main>
      </SignedIn>
    </>
  );
}
