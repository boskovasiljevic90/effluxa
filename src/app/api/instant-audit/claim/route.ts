import { NextRequest, NextResponse } from "next/server";
import { safeVerifyToken } from "@/lib/auth";
import { claimInstantAudit } from "@/lib/instantStore";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const limited = rateLimit({ req, key: "instant_claim", limit: 10, windowMs: 60 * 60 * 1000 });
  if (limited) return limited;

  const token = req.cookies.get("token")?.value;
  const decoded = token ? safeVerifyToken(token) : null;

  if (!decoded) {
    return NextResponse.json({ error: "Sign in to keep this report." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const instantToken = typeof body?.token === "string" ? body.token.trim() : "";

  if (!instantToken) {
    return NextResponse.json({ error: "Missing check token." }, { status: 400 });
  }

  const result = await claimInstantAudit({ token: instantToken, userId: decoded.userId });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ reportId: result.reportId });
}
