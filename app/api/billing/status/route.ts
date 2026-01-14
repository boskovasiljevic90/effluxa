import { NextResponse } from "next/server";
import { verifyToken } from "@clerk/backend";
import { hasActiveSubscription } from "../../../../lib/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

export async function POST(req: Request) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ active: false, reason: "no_token" }, { status: 200 });
    }

    let payload: any;
    try {
      payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
        authorizedParties: ["http://localhost:3000"],
      });
    } catch {
      return NextResponse.json({ active: false, reason: "invalid_token" }, { status: 200 });
    }

    const orgId = payload?.org_id || payload?.orgId;
    if (!orgId) {
      return NextResponse.json({ active: false, reason: "missing_org" }, { status: 200 });
    }

    const active = await hasActiveSubscription(orgId);
    return NextResponse.json({ active, reason: active ? "active" : "inactive" }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { active: false, reason: "server_error", message: String(e?.message || e) },
      { status: 200 }
    );
  }
}
