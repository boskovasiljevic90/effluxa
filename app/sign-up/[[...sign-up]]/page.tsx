"use client";

import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <SignUp
        redirectUrl="/app"
        afterSignUpUrl="/app"
      />
    </main>
  );
}
