import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Short outreach links: effluxa.com/i/<code> -> /instant with campaign tracking.
 *
 * Keeps cold-email links short and on the brand domain while preserving which
 * firm clicked (the code becomes utm_content). No open redirect: the target is
 * fixed and the code is strictly validated.
 */
export async function GET(_req: NextRequest, { params }: { params: { code: string } }) {
  const code = (params.code || "").toLowerCase();

  if (!/^[a-z0-9-]{2,40}$/.test(code)) {
    return NextResponse.redirect(new URL("/instant", "https://www.effluxa.com"), 307);
  }

  const target = new URL("/instant", "https://www.effluxa.com");
  target.searchParams.set("utm_source", "outreach");
  target.searchParams.set("utm_medium", "email");
  target.searchParams.set("utm_campaign", "leads_50_nov2026");
  target.searchParams.set("utm_content", code);

  return NextResponse.redirect(target, 307);
}
