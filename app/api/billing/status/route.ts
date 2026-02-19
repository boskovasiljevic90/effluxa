import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId, orgId } = auth();

  if (!userId || !orgId) {
    return NextResponse.json({ active: false });
  }

  const org = await prisma.organization.findUnique({
    where: { clerkOrgId: orgId }
  });

  if (!org) {
    await prisma.organization.create({
      data: {
        clerkOrgId: orgId,
        subscription: "FREE"
      }
    });

    return NextResponse.json({ active: true, plan: "FREE" });
  }

  return NextResponse.json({
    active: org.subscription === "PRO" || org.subscription === "FREE",
    plan: org.subscription
  });
}
