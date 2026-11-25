export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyLeadToken } from "@/lib/leadToken";
import { trackEvent } from "@/lib/events";

function confirmationPage(message: string) {
  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Unsubscribed | Effluxa</title><style>
      body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b1020;color:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
      .card{max-width:520px;margin:24px;padding:32px;border-radius:18px;background:rgba(255,255,255,.05);border:1px solid rgba(148,163,184,.2);text-align:center}
      h1{font-size:22px;margin:0 0 10px}p{color:#94a3b8;line-height:1.65;margin:0}
      a{display:inline-block;margin-top:20px;color:#93c5fd;font-weight:700;text-decoration:none}
    </style></head><body><div class="card"><h1>You are unsubscribed</h1><p>${message}</p><a href="https://www.effluxa.com">Back to Effluxa</a></div></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } }
  );
}

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("e") || "").trim().toLowerCase();
  const token = req.nextUrl.searchParams.get("t") || "";

  if (!email || !email.includes("@") || !verifyLeadToken(email, token)) {
    return confirmationPage("This unsubscribe link is invalid. Reply to the email and we will remove you manually.");
  }

  try {
    // One row per address, reused as the suppression record for outreach.
    const existing = await prisma.contactMessage.findFirst({
      where: { email, source: "cold_outreach" },
      select: { id: true },
    });

    if (existing) {
      await prisma.contactMessage.update({
        where: { id: existing.id },
        data: { status: "UNSUBSCRIBED" },
      });
    } else {
      await prisma.contactMessage.create({
        data: {
          email,
          subject: "Unsubscribe request",
          message: "Unsubscribed from cold outreach.",
          source: "cold_outreach",
          status: "UNSUBSCRIBED",
        },
      });
    }

    await trackEvent({ type: "lead_unsubscribed", metadata: { source: "cold_outreach" } });
  } catch (error) {
    console.error("LEAD UNSUBSCRIBE ERROR:", error);
    return confirmationPage("We could not save the request. Reply to the email and we will remove you manually.");
  }

  return confirmationPage("You will not receive any further outreach from Effluxa. Your address is on our suppression list.");
}
