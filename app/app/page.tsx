"use client";

import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
  OrganizationSwitcher,
} from "@clerk/nextjs";

export default function AppHome() {
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

          <section style={{ marginTop: 24 }}>
            <p>✅ Signed in successfully.</p>
            <p>Next: organization enforcement + billing.</p>
          </section>
        </main>
      </SignedIn>
    </>
  );
}
