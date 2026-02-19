import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ results: [] });
  }

  const run = await prisma.reconcileRun.findFirst({
    where: { orgId },
    orderBy: { createdAt: "desc" },
  });

  if (!run) {
    return NextResponse.json({ results: [] });
  }

  const results = await prisma.reconcileResult.findMany({
    where: { runId: run.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ results });
}
