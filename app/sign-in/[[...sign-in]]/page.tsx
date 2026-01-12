"use client";

import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <SignIn
        redirectUrl="/app"
        afterSignInUrl="/app"
      />
    </main>
  );
}
