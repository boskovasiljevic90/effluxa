"use client";

import {
  UserButton,
  OrganizationSwitcher,
  useAuth,
} from "@clerk/nextjs";

export default function AppHome() {
  const { orgId, isLoaded } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (!orgId) {
    return (
      <main style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
        <h1>Effluxa</h1>
        <p>You must create or join an organization to continue.</p>

        <div style={{ marginTop: 24 }}>
          <OrganizationSwitcher
            hidePersonal
            afterCreateOrganizationUrl="/app"
            afterSelectOrganizationUrl="/app"
          />
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Effluxa</h1>

        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          <OrganizationSwitcher hidePersonal />
          <UserButton />
        </div>
      </header>

      <section style={{ marginTop: 24 }}>
        <p>✅ Organization active.</p>
        <p>Next: billing + uploads + analysis.</p>
      </section>
    </main>
  );
}
