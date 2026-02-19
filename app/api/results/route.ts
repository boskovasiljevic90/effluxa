import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ results: [] });
  }

  const results = await prisma.reconcileResult.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ results });
}
