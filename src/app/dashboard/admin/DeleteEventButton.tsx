"use client";

export default function DeleteEventButton({ eventId }: { eventId: string }) {
  async function handleDelete() {
    const confirmed = window.confirm("Delete this event?");
    if (!confirmed) return;

    const res = await fetch(`/api/admin/events/${eventId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("Failed to delete event.");
      return;
    }

    window.location.reload();
  }

  return (
    <button
      onClick={handleDelete}
      style={{
        marginTop: "14px",
        padding: "9px 14px",
        borderRadius: "12px",
        border: "none",
        background: "rgba(248,113,113,0.14)",
        color: "#fca5a5",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      Delete Event
    </button>
  );
}
