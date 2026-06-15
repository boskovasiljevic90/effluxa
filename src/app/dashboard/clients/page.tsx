export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWorkspaceOwner } from "@/lib/workspace";
import CreateClientForm from "./CreateClientForm";
import DeleteClientButton from "./DeleteClientButton";
import Link from "next/link";

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

export default async function ClientsPage() {
  const user = await getUser();

  if (!user) redirect("/login");

  const workspace = await getWorkspaceOwner(user);

  if (!workspace.hasBusinessAccess) {
    return (
      <>
        <h1 style={{ fontSize: "42px" }}>Clients</h1>

        <div className="card" style={{ marginTop: "34px" }}>
          <div className="card-title">Business Feature</div>
          <p className="gray" style={{ marginTop: "12px" }}>
            Client management is available on the Business plan.
          </p>
        </div>
      </>
    );
  }

  const clients = await prisma.client.findMany({
    where: {
      ownerId: workspace.owner.id,
    },
    include: {
      uploads: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <>
      <h1 style={{ fontSize: "42px" }}>Clients</h1>

      <p className="gray" style={{ marginTop: "10px" }}>
        Organize audit work by client, company, or account.
      </p>

      <div className="report-grid" style={{ marginTop: "34px" }}>
        <div className="card">
          <div className="card-title">Total Clients</div>
          <div className="metric-value">{clients.length}</div>
        </div>

        <div className="card">
          <div className="card-title">Client Audits</div>
          <div className="metric-value">
            {clients.reduce((sum, client) => sum + client.uploads.length, 0)}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Client Savings</div>
          <div className="metric-value green">
            €
            {clients
              .reduce((sum, client) => {
                return (
                  sum +
                  client.uploads.reduce((innerSum, upload) => {
                    const data = upload.parsedData as any;
                    return innerSum + (Number(data?.estimated_savings) || 0);
                  }, 0)
                );
              }, 0)
              .toLocaleString()}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Workspace</div>
          <p className="gray" style={{ marginTop: "12px" }}>
            {workspace.isTeamMember ? "Team Workspace" : "Owner Workspace"}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: "28px" }}>
        <div className="card-title">Create Client</div>
        <p className="gray" style={{ marginTop: "12px" }}>
          Add a client or company that future audits can be attached to.
        </p>

        <CreateClientForm />
      </div>

      <div className="card" style={{ marginTop: "28px" }}>
        <div className="card-title">Client List</div>

        {clients.length === 0 ? (
          <p className="gray" style={{ marginTop: "12px" }}>
            No clients created yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "18px" }}>
            {clients.map((client) => {
              const totalSavings = client.uploads.reduce((sum, upload) => {
                const data = upload.parsedData as any;
                return sum + (Number(data?.estimated_savings) || 0);
              }, 0);

              const highestRisk =
                client.uploads.length > 0
                  ? Math.max(
                      0,
                      ...client.uploads.map((upload) => {
                        const data = upload.parsedData as any;
                        return Number(data?.leakage_score || 0);
                      })
                    )
                  : 0;

              return (
                <div
                  key={client.id}
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
                    <div style={{ fontWeight: "bold", fontSize: "18px" }}>
                      {client.name}
                    </div>

                    {client.notes && (
                      <div className="gray" style={{ marginTop: "8px" }}>
                        {client.notes}
                      </div>
                    )}

                    <div className="gray" style={{ marginTop: "8px", fontSize: "13px" }}>
                      Audits: {client.uploads.length} | Savings: €{totalSavings.toLocaleString()} | Highest Risk: {highestRisk}/100
                    </div>

                    <div className="gray" style={{ marginTop: "8px", fontSize: "13px" }}>
                      Created: {new Date(client.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <Link href={`/dashboard/reports?clientId=${client.id}`}>
                      <button className="primary-button" style={{ padding: "9px 14px" }}>
                        View Audits
                      </button>
                    </Link>

                    <DeleteClientButton clientId={client.id} />
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
