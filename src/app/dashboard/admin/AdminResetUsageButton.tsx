"use client";

export default function AdminResetUsageButton({ userId }: { userId: string }) {
  async function handleReset() {
    const confirmed = window.confirm("Reset this user's free audit usage?");
    if (!confirmed) return;

    const res = await fetch("/api/admin/users/reset-usage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      alert("Failed to reset usage.");
      return;
    }

    window.location.reload();
  }

  return (
    <button
      onClick={handleReset}
      style={{
        padding: "9px 14px",
        borderRadius: "12px",
        border: "none",
        background: "rgba(96,165,250,0.18)",
        color: "#93c5fd",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      Reset Usage
    </button>
  );
}
