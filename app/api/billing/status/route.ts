import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ active: false });
  }

  let org = await prisma.organization.findUnique({
    where: { clerkOrgId: orgId }
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        clerkOrgId: orgId,
        subscription: "FREE"
      }
    });
  }

  return NextResponse.json({
    active: true,
    plan: org.subscription
  });
}
