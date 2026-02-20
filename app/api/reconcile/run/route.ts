import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndIncrementUsage } from "@/lib/limits";

export async function POST(req: Request) {
  try {
    const { orgId } = await req.json();

    if (!orgId) {
      return NextResponse.json(
        { error: "Missing orgId" },
        { status: 400 }
      );
    }

    // 🔒 RECONCILE LIMIT CHECK
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    if (org.plan === "free") {
      const now = new Date();
      const resetAt = new Date(org.usageResetAt);
      const oneWeek = 7 * 24 * 60 * 60 * 1000;

      if (now.getTime() - resetAt.getTime() > oneWeek) {
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            weeklyReconcileCount: 0,
            usageResetAt: now,
          },
        });
      }

      const updated = await prisma.organization.findUnique({
        where: { id: orgId },
      });

      if (updated!.weeklyReconcileCount >= 1) {
        return NextResponse.json(
          { error: "Weekly reconciliation limit reached (Free plan)" },
          { status: 403 }
        );
      }

      await prisma.organization.update({
        where: { id: orgId },
        data: {
          weeklyReconcileCount: { increment: 1 },
        },
      });
    }

    // ⚙ Existing reconciliation logic
    const run = await prisma.reconcileRun.create({
      data: {
        orgId,
        summary: { started: true },
      },
    });

    return NextResponse.json({
      success: true,
      runId: run.id,
    });

  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Internal error" },
      { status: 500 }
    );
  }
}
