import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await prisma.reconcileResult.findMany({
    where: { orgId },
  });

  let totalInvoices = results.length;

  const counts: Record<string, number> = {};

  for (const r of results) {
    counts[r.status] = (counts[r.status] || 0) + 1;
  }

  return NextResponse.json({
    totalInvoices,
    counts,
  });
}
