"use client";

export default function RemoveTeamMemberButton({
  memberId,
}: {
  memberId: string;
}) {
  async function handleRemove() {
    const confirmed = window.confirm("Remove this team member?");
    if (!confirmed) return;

    const res = await fetch("/api/team/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ memberId }),
    });

    if (!res.ok) {
      alert("Failed to remove team member.");
      return;
    }

    window.location.reload();
  }

  return (
    <button
      onClick={handleRemove}
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
      Remove
    </button>
  );
}
