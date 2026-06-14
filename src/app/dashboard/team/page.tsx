export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import InviteTeamMemberForm from "./InviteTeamMemberForm";
import RemoveTeamMemberButton from "./RemoveTeamMemberButton";

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

export default async function TeamPage() {
  const user = await getUser();

  if (!user) redirect("/login");

  if (user.role !== "BUSINESS") {
    return (
      <>
        <h1 style={{ fontSize: "42px" }}>Team Seats</h1>
        <div className="card" style={{ marginTop: "34px" }}>
          <div className="card-title">Business Feature</div>
          <p className="gray" style={{ marginTop: "12px" }}>
            Team seats are available on the Business plan.
          </p>
        </div>
      </>
    );
  }

  const members = await prisma.teamMember.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
  });

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
          <div className="card-title">Account Owner</div>
          <p className="gray" style={{ marginTop: "12px" }}>
            {user.email}
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
            {members.map((member) => (
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
                  <div className="gray" style={{ marginTop: "6px", fontSize: "13px" }}>
                    Status: {member.status}
                  </div>
                </div>

                <RemoveTeamMemberButton memberId={member.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
