import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const org = await prisma.organization.findUnique({
    where: { id: "demo-org" },
  });

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  return NextResponse.json({
    plan: org.plan,
    subscriptionStatus: org.subscriptionStatus,
  });
}
