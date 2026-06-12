"use client";

import { useState } from "react";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const res = await fetch("/api/account/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to change password.");
      setLoading(false);
      return;
    }

    alert("Password changed successfully.");
    setCurrentPassword("");
    setNewPassword("");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "18px" }}>
      <input
        type="password"
        placeholder="Current password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        required
        style={inputStyle}
      />

      <input
        type="password"
        placeholder="New password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        minLength={8}
        style={inputStyle}
      />

      <button
        type="submit"
        disabled={loading}
        className="primary-button"
        style={{ marginTop: "14px" }}
      >
        {loading ? "Updating..." : "Change Password"}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontSize: "15px",
  marginBottom: "12px",
};
