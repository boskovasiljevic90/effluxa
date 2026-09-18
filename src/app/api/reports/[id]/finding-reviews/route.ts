import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeVerifyToken } from "@/lib/auth";
import { getWorkspaceOwner } from "@/lib/workspace";
import { canAccessFullReport } from "@/lib/access";
import { trackEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

const VERDICTS = new Set(["TRUE", "FALSE", "UNCLEAR"]);

function optionalText(value: unknown, maxLength: number) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get("token")?.value;
    const decoded = token ? safeVerifyToken(token) : null;

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const workspace = await getWorkspaceOwner(user);
    const report = await prisma.upload.findFirst({
      where: {
        id: params.id,
        userId: workspace.owner.id,
      },
      select: {
        id: true,
        unlocked: true,
        parsedData: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (!canAccessFullReport({ report, user, workspace })) {
      return NextResponse.json(
        { error: "Full audit access is required to review findings." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const findingId = optionalText(body?.findingId, 180);
    const verdict = optionalText(body?.verdict, 16)?.toUpperCase() || "";

    if (!findingId) {
      return NextResponse.json({ error: "Finding is required." }, { status: 400 });
    }

    if (!VERDICTS.has(verdict)) {
      return NextResponse.json(
        { error: "Verdict must be TRUE, FALSE, or UNCLEAR." },
        { status: 400 }
      );
    }

    const parsedData = report.parsedData as Record<string, unknown> | null;
    const findings = Array.isArray(parsedData?.findings) ? parsedData.findings : [];
    const findingExists = findings.some(
      (item) =>
        item &&
        typeof item === "object" &&
        String((item as Record<string, unknown>).id || "") === findingId
    );

    if (!findingExists) {
      return NextResponse.json(
        { error: "Finding not found in this report." },
        { status: 404 }
      );
    }

    const note = optionalText(body?.note, 1000);
    const review = await prisma.findingReview.upsert({
      where: {
        reportId_findingId_reviewerUserId: {
          reportId: report.id,
          findingId,
          reviewerUserId: user.id,
        },
      },
      create: {
        reportId: report.id,
        workspaceOwnerId: workspace.owner.id,
        reviewerUserId: user.id,
        findingId,
        verdict,
        note,
      },
      update: {
        verdict,
        note,
      },
      select: {
        id: true,
        findingId: true,
        verdict: true,
        note: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await trackEvent({
      type: "finding_reviewed",
      userId: user.id,
      reportId: report.id,
      metadata: {
        findingId,
        verdict,
        workspaceOwnerId: workspace.owner.id,
      },
    });

    return NextResponse.json({
      success: true,
      review: {
        ...review,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("FINDING REVIEW ERROR:", error);
    return NextResponse.json(
      { error: "Failed to save finding feedback." },
      { status: 500 }
    );
  }
}
