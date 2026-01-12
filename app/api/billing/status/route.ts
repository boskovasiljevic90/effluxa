import { NextResponse } from "next/server";
import { verifyToken } from "@clerk/backend";
import { hasActiveSubscription } from "@/lib/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

export async function POST(req: Request) {
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json({ active: false }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
      authorizedParties: ["http://localhost:3000"],
    });
  } catch {
    return NextResponse.json({ active: false }, { status: 401 });
  }

  const orgId = payload?.org_id || payload?.orgId;
  if (!orgId) {
    return NextResponse.json({ active: false }, { status: 400 });
  }

  const active = await hasActiveSubscription(orgId);
  return NextResponse.json({ active });
}
