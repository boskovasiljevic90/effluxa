export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import InviteTeamMemberForm from "./InviteTeamMemberForm";
import RemoveTeamMemberButton from "./RemoveTeamMemberButton";
import ResendInviteButton from "./ResendInviteButton";
import { getWorkspaceOwner } from "@/lib/workspace";

async function getUser() {
  const token = cookies().get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    return await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
  } catch {
    return null;
  }
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "Never";
  return new Date(date).toLocaleString();
}

export default async function TeamPage() {
  const user = await getUser();

  if (!user) redirect("/login");

  const workspace = await getWorkspaceOwner(user);

  if (!workspace.hasBusinessAccess || !workspace.isOwner) {
    return (
      <>
        <h1 style={{ fontSize: "42px" }}>Team Seats</h1>
        <div className="card" style={{ marginTop: "34px" }}>
          <div className="card-title">Business Feature</div>
          <p className="gray" style={{ marginTop: "12px" }}>
            Team seats are available only for active Business workspace owners.
          </p>
        </div>
      </>
    );
  }

  const members = await prisma.teamMember.findMany({
    where: { ownerId: workspace.owner.id },
    orderBy: { createdAt: "desc" },
  });

  const memberEmails = members.map((member) => member.email);

  const registeredUsers = await prisma.user.findMany({
    where: {
      email: {
        in: memberEmails,
      },
    },
    select: {
      email: true,
      createdAt: true,
    },
  });

  const registeredMap = new Map(
    registeredUsers.map((registeredUser) => [
      registeredUser.email.toLowerCase(),
      registeredUser,
    ])
  );

  const activeMembers = members.filter((member) => member.status === "ACTIVE").length;
  const invitedMembers = members.filter((member) => member.status !== "ACTIVE").length;

  return (
    <>
      <h1 style={{ fontSize: "42px" }}>Team Seats</h1>

      <p className="gray" style={{ marginTop: "10px" }}>
        Business plan includes 5 seats total: account owner + 4 invited team members.
      </p>

      <div className="report-grid" style={{ marginTop: "34px" }}>
        <div className="card">
          <div className="card-title">Seats Used</div>
          <div className="metric-value">{members.length + 1}/5</div>
        </div>

        <div className="card">
          <div className="card-title">Active Members</div>
          <div className="metric-value green">{activeMembers}</div>
        </div>

        <div className="card">
          <div className="card-title">Invited Members</div>
          <div className="metric-value">{invitedMembers}</div>
        </div>

        <div className="card">
          <div className="card-title">Account Owner</div>
          <p className="gray" style={{ marginTop: "12px" }}>
            {workspace.owner.email}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: "28px" }}>
        <div className="card-title">Invite Team Member</div>
        <p className="gray" style={{ marginTop: "12px" }}>
          Add finance, accounting, operations, or external advisor emails.
        </p>

        <InviteTeamMemberForm />
      </div>

      <div className="card" style={{ marginTop: "28px" }}>
        <div className="card-title">Team Members</div>

        {members.length === 0 ? (
          <p className="gray" style={{ marginTop: "12px" }}>
            No team members invited yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "18px" }}>
            {members.map((member) => {
              const registeredUser = registeredMap.get(member.email.toLowerCase());
              const isActive = member.status === "ACTIVE";
              const statusLabel = isActive
                ? "Active"
                : registeredUser
                  ? "Registered / Invited"
                  : "Invited / Not Registered";

              const statusColor = isActive
                ? "#4ade80"
                : registeredUser
                  ? "#facc15"
                  : "#cbd5e1";

              return (
                <div
                  key={member.id}
                  style={{
                    padding: "18px",
                    borderRadius: "14px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "16px",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "bold" }}>{member.email}</div>

                    <div style={{ marginTop: "8px", color: statusColor, fontWeight: 900 }}>
                      {statusLabel}
                    </div>

                    <div className="gray" style={{ marginTop: "8px", fontSize: "13px" }}>
                      Invited: {formatDate(member.invitedAt)}
                    </div>

                    <div className="gray" style={{ marginTop: "6px", fontSize: "13px" }}>
                      Registered: {registeredUser ? formatDate(registeredUser.createdAt) : "Not yet"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {!isActive && <ResendInviteButton memberId={member.id} />}
                    <RemoveTeamMemberButton memberId={member.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
