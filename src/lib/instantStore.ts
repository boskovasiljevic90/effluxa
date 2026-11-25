import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/** How long an anonymous free-check result stays claimable. */
export const INSTANT_TTL_DAYS = 14;

export function newInstantToken() {
  return randomBytes(24).toString("base64url");
}

export function hashIp(ip: string) {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

/**
 * The anonymous report is stored so a visitor can reopen it and so a signup can
 * carry it into the dashboard without a second upload. The raw extracted rows
 * are deliberately not stored: findings already carry the evidence they need.
 */
export function compactReport(parsedData: unknown) {
  const report =
    parsedData && typeof parsedData === "object" && !Array.isArray(parsedData)
      ? { ...(parsedData as Record<string, unknown>) }
      : {};

  delete report.extractedData;
  delete report.sourceBytes;

  return report;
}

export async function saveInstantAudit({
  token,
  fileHash,
  fileName,
  report,
  teaser,
  ipHash,
}: {
  token: string;
  fileHash: string;
  fileName: string;
  report: Record<string, unknown>;
  teaser: Record<string, unknown>;
  ipHash?: string | null;
}) {
  const expiresAt = new Date(Date.now() + INSTANT_TTL_DAYS * 24 * 60 * 60 * 1000);

  return prisma.instantAudit.create({
    data: {
      token,
      fileHash,
      fileName: fileName.slice(0, 300),
      report: report as Prisma.InputJsonValue,
      teaser: teaser as Prisma.InputJsonValue,
      ipHash: ipHash || null,
      expiresAt,
    },
    select: { id: true, token: true, expiresAt: true },
  });
}

export async function getInstantAudit(token: string) {
  if (!token || token.length < 10 || token.length > 200) return null;

  const audit = await prisma.instantAudit.findUnique({ where: { token } });
  if (!audit) return null;
  if (audit.expiresAt.getTime() < Date.now()) return null;

  return audit;
}

/**
 * Turns a stored anonymous report into a normal dashboard report for the
 * signed-in user, so the existing unlock and payment flow keeps working.
 */
export async function claimInstantAudit({
  token,
  userId,
}: {
  token: string;
  userId: string;
}): Promise<{ reportId: string } | { error: string }> {
  const audit = await getInstantAudit(token);
  if (!audit) return { error: "This free check has expired. Run a new check." };

  if (audit.status === "CLAIMED" && audit.reportId) {
    const existing = await prisma.upload.findFirst({
      where: { id: audit.reportId, userId },
      select: { id: true },
    });
    if (existing) return { reportId: existing.id };
    return { error: "This free check was already moved to another account." };
  }

  const report = (audit.report || {}) as Record<string, unknown>;

  const created = await prisma.upload.create({
    data: {
      userId,
      fileUrl: `instant:${audit.id}`,
      parsedData: report as Prisma.InputJsonValue,
      summary: "AI financial leak audit generated",
      unlocked: false,
    },
    select: { id: true },
  });

  await prisma.instantAudit.updateMany({
    where: { id: audit.id, status: "NEW" },
    data: { status: "CLAIMED", reportId: created.id, userId },
  });

  return { reportId: created.id };
}
