"use client";

export default function DeleteReportButton({ reportId }: { reportId: string }) {
  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this report? This action cannot be undone."
    );

    if (!confirmed) return;

    const res = await fetch(`/api/reports/${reportId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("Failed to delete report.");
      return;
    }

    window.location.href = "/dashboard/reports";
  }

  return (
    <button
      onClick={handleDelete}
      style={{
        marginTop: "18px",
        padding: "12px 18px",
        borderRadius: "14px",
        border: "1px solid rgba(248,113,113,0.35)",
        background: "rgba(248,113,113,0.12)",
        color: "#fca5a5",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      Delete Report
    </button>
  );
}
