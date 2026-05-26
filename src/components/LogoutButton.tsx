"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="sidebar-item"
      style={{
        width: "100%",
        textAlign: "left",
        color: "white",
        cursor: "pointer",
      }}
    >
      Logout
    </button>
  );
}
