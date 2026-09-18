export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getWorkspaceOwner } from "@/lib/workspace";
import { trackEvent } from "@/lib/events";

const CONTROL_STATUSES = new Set([
  "OPEN",
  "IN_REVIEW",
  "ACTIONED",
  "DISMISSED",
]);

function optionalText(value: unknown, maxLength: number) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function parseDueDate(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }

  const date = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseNonNegativeNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function serializeAction(action: {
  id: string;
  findingId: string;
  findingTitle: string;
  findingSeverity: string;
  status: string;
  ownerEmail: string | null;
  dueDate: Date | null;
  outcomeNote: string | null;
  quantifiedAmount: number | null;
  resolvedAmount: number | null;
  currency: string;
  updatedAt: Date;
}) {
  return {
    ...action,
    dueDate: action.dueDate?.toISOString() || null,
    updatedAt: action.updatedAt.toISOString(),
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const workspace = await getWorkspaceOwner(user);
    if (!workspace.hasBusinessAccess) {
      return NextResponse.json({ error: "Agency access required." }, { status: 403 });
    }

    const report = await prisma.upload.findFirst({
      where: {
        id: params.id,
        userId: workspace.owner.id,
      },
      select: {
        id: true,
        parsedData: true,
      },
    });

    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const findingId = optionalText(body?.findingId, 180);
    if (!findingId) {
      return NextResponse.json({ error: "Finding is required." }, { status: 400 });
    }

    const parsedData = report.parsedData as Record<string, unknown> | null;
    const findings = Array.isArray(parsedData?.findings) ? parsedData.findings : [];
    const finding = findings.find(
      (item) =>
        item &&
        typeof item === "object" &&
        (item as Record<string, unknown>).id === findingId
    ) as Record<string, unknown> | undefined;

    if (!finding) {
      return NextResponse.json({ error: "Finding not found in this report." }, { status: 404 });
    }

    const status = optionalText(body?.status, 32) || "OPEN";
    if (!CONTROL_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid control status." }, { status: 400 });
    }

    const ownerEmail = optionalText(body?.ownerEmail, 254);
    if (ownerEmail && (!ownerEmail.includes("@") || ownerEmail.length < 5)) {
      return NextResponse.json({ error: "Enter a valid owner email or leave it blank." }, { status: 400 });
    }

    const dueDate = parseDueDate(body?.dueDate);
    if (dueDate === undefined) {
      return NextResponse.json({ error: "Due date must use YYYY-MM-DD format." }, { status: 400 });
    }

    const resolvedAmount = parseNonNegativeNumber(body?.resolvedAmount);
    if (resolvedAmount === undefined) {
      return NextResponse.json({ error: "Resolved amount must be a non-negative number." }, { status: 400 });
    }

    const quantifiedAmount = parseNonNegativeNumber(
      (finding.quantification as Record<string, unknown> | undefined)?.amount
    );
    const evidence = Array.isArray(finding.evidence) ? finding.evidence : [];
    const existing = await prisma.controlAction.findUnique({
      where: {
        reportId_findingId: {
          reportId: report.id,
          findingId,
        },
      },
      select: { id: true },
    });

    const action = await prisma.controlAction.upsert({
      where: {
        reportId_findingId: {
          reportId: report.id,
          findingId,
        },
      },
      create: {
        reportId: report.id,
        workspaceOwnerId: workspace.owner.id,
        createdByUserId: user.id,
        findingId,
        findingTitle: String(finding.title || "Untitled finding").slice(0, 500),
        ruleId: optionalText(finding.ruleId, 120),
        findingCategory: optionalText(finding.category, 80),
        findingSeverity: String(finding.severity || "MEDIUM").slice(0, 32),
        recommendedAction: String(finding.recommendedAction || "Validate the underlying evidence.").slice(0, 2000),
        evidence: evidence as Prisma.InputJsonValue,
        quantifiedAmount: quantifiedAmount === undefined ? null : quantifiedAmount,
        currency: String(
          (finding.quantification as Record<string, unknown> | undefined)?.currency || "EUR"
        ).slice(0, 12).toUpperCase(),
        status,
        ownerEmail,
        dueDate,
        outcomeNote: optionalText(body?.outcomeNote, 4000),
        resolvedAmount,
      },
      update: {
        status,
        ownerEmail,
        dueDate,
        outcomeNote: optionalText(body?.outcomeNote, 4000),
        resolvedAmount,
        evidence: evidence as Prisma.InputJsonValue,
        quantifiedAmount: quantifiedAmount === undefined ? null : quantifiedAmount,
      },
      select: {
        id: true,
        findingId: true,
        findingTitle: true,
        findingSeverity: true,
        status: true,
        ownerEmail: true,
        dueDate: true,
        outcomeNote: true,
        quantifiedAmount: true,
        resolvedAmount: true,
        currency: true,
        updatedAt: true,
      },
    });

    await trackEvent({
      type: existing ? "control_action_updated" : "control_action_created",
      userId: user.id,
      reportId: report.id,
      metadata: {
        findingId,
        status,
        workspaceOwnerId: workspace.owner.id,
      },
    });

    return NextResponse.json({ success: true, action: serializeAction(action) });
  } catch (error) {
    console.error("CONTROL ACTION ERROR:", error);
    return NextResponse.json({ error: "Failed to save control action." }, { status: 500 });
  }
}
