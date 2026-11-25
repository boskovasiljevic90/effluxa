import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { validateUploadFile } from "@/lib/uploadValidation";
import { processAuditFile } from "@/lib/auditProcessing";
import { buildInstantTeaser, INSTANT_AUDIT_MAX_BYTES } from "@/lib/instantAudit";
import { trackEvent } from "@/lib/events";
import { trackError } from "@/lib/errorTracking";
import { createHash } from "crypto";
import { compactReport, newInstantToken, saveInstantAudit, hashIp } from "@/lib/instantStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Anonymous, no-account audit.
 *
 * This is the acquisition engine: a visitor uploads one file and receives a
 * real, evidence-backed teaser built from their own document, with no email
 * required. The full report is delivered after signup + payment.
 *
 * Cost guard: extraction costs roughly EUR 0.02-0.28 per run, so the endpoint
 * is rate limited per IP and against a per-instance hourly ceiling. Both are
 * intentionally conservative; a real launch should move this counter to Redis
 * or the database.
 */

const GLOBAL_WINDOW_MS = 60 * 60 * 1000;
let globalCounter = { count: 0, resetAt: 0 };

function globalBudgetExceeded() {
  const now = Date.now();
  if (globalCounter.resetAt < now) {
    globalCounter = { count: 0, resetAt: now + GLOBAL_WINDOW_MS };
  }
  globalCounter.count += 1;
  return globalCounter.count > 60;
}

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit({
      req,
      key: "instant_audit",
      limit: 3,
      windowMs: GLOBAL_WINDOW_MS,
    });
    if (limited) return limited;

    if (globalBudgetExceeded()) {
      return NextResponse.json(
        { error: "Free checks are busy right now. Please try again in a few minutes." },
        { status: 503 },
      );
    }

    const formData = await req.formData();
    const uploaded = formData.get("file");
    const file =
      uploaded && typeof uploaded !== "string" && typeof uploaded.arrayBuffer === "function"
        ? (uploaded as File)
        : null;

    if (!file) {
      return NextResponse.json({ error: "Choose a PDF, CSV, XLSX or XLS file to check." }, { status: 400 });
    }

    if (file.size > INSTANT_AUDIT_MAX_BYTES) {
      return NextResponse.json(
        { error: "Free checks accept files up to 4 MB. Sign up to analyse larger files." },
        { status: 413 },
      );
    }

    const validation = await validateUploadFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const result = await processAuditFile({
      file,
      fileName: file.name,
      language: "English",
    });

    const teaser = buildInstantTeaser({
      parsedData: result.parsedData,
      fileName: file.name,
      fileType: file.type || file.name.split(".").pop() || "file",
      auditEngine: result.auditEngine,
      fallbackUsed: result.fallbackUsed,
      analysisDurationMs: result.analysisDurationMs,
    });

    // Keep the report so the visitor can reopen it and so a signup can carry it
    // into the dashboard without a second upload. Storage failure must never
    // break the result that is already computed.
    let instantToken: string | null = null;
    try {
      const fileHash = createHash("sha256")
        .update(Buffer.from(await file.arrayBuffer()))
        .digest("hex");
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const saved = await saveInstantAudit({
        token: newInstantToken(),
        fileHash,
        fileName: file.name,
        report: compactReport(result.parsedData),
        teaser: teaser as unknown as Record<string, unknown>,
        ipHash: hashIp(ip),
      });
      instantToken = saved.token;
    } catch (storageError) {
      console.error("INSTANT AUDIT STORAGE ERROR:", storageError);
    }

    // No file contents, no file name, no IP are stored on this event.
    await trackEvent({
      type: "instant_audit_completed",
      metadata: {
        totalFindings: teaser.totalFindings,
        engine: teaser.auditEngine,
        limitedData: teaser.limitedData,
        processingMs: teaser.processingMs,
        hasRecoverableSignal: teaser.recoverableAmount > 0,
      },
    });

    const wantsDebug = req.headers.get("x-effluxa-debug") === "1";
    const debug = wantsDebug
      ? (result.parsedData as Record<string, unknown>)?.deterministicScan ?? null
      : undefined;

    return NextResponse.json({ teaser, token: instantToken, ...(debug ? { debug } : {}) }, { status: 200 });
  } catch (error) {
    console.error("INSTANT AUDIT ERROR:", error);
    await trackError({ type: "instant_audit_error", error });

    return NextResponse.json(
      {
        error:
          "We could not finish this free check. Try a CSV or XLSX export of the same data, or create a free account to run the full audit.",
      },
      { status: 500 },
    );
  }
}
