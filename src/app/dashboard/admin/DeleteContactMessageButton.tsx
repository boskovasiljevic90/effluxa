"use client";

export default function DeleteContactMessageButton({
  messageId,
}: {
  messageId: string;
}) {
  async function handleDelete() {
    const confirmed = window.confirm("Delete this contact message?");
    if (!confirmed) return;

    const res = await fetch(`/api/admin/contact-messages/${messageId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("Failed to delete message.");
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
      Delete Message
    </button>
  );
}
