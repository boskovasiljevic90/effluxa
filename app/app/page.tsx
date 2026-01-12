import { UserButton } from "@clerk/nextjs";

export default function AppHome() {
  return (
    <main style={{ padding: 24 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Effluxa</h1>
        <div style={{ marginLeft: "auto" }}>
          <UserButton />
        </div>
      </header>

      <section style={{ marginTop: 24 }}>
        <p>✅ You are signed in.</p>
      </section>
    </main>
  );
}
