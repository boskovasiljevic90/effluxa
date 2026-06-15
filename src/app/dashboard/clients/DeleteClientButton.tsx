"use client";

export default function DeleteClientButton({ clientId }: { clientId: string }) {
  async function handleDelete() {
    const confirmed = window.confirm("Delete this client?");
    if (!confirmed) return;

    const res = await fetch("/api/clients/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ clientId }),
    });

    if (!res.ok) {
      alert("Failed to delete client.");
      return;
    }

    window.location.reload();
  }

  return (
    <button
      onClick={handleDelete}
      style={{
        padding: "9px 14px",
        borderRadius: "12px",
        border: "none",
        background: "rgba(248,113,113,0.14)",
        color: "#fca5a5",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      Delete
    </button>
  );
}
