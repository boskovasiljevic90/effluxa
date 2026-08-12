export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeVerifyToken } from "@/lib/auth";
import OpenAI from "openai";
import * as XLSX from "xlsx";
import { trackEvent } from "@/lib/events";
import { trackError } from "@/lib/errorTracking";
import { getWorkspaceOwner } from "@/lib/workspace";
import { sendAdminNotificationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rateLimit";
import { canUseUnlimitedUploads } from "@/lib/access";
import { buildFallbackAuditReport, normalizeAuditReport, shouldUseFallbackReport } from "@/lib/reportQuality";
import { validateUploadFile } from "@/lib/uploadValidation";

export const runtime = "nodejs";

function extractJSON(text: string) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;

  return match[0]
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]");
}

function safeParseAIJson(raw: string) {
  const jsonString = extractJSON(raw);

  if (!jsonString) {
    throw new Error("AI did not return JSON.");
  }

  try {
    return JSON.parse(jsonString);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }
}

async function analyzeWithAI(file: File, financialText?: string) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  const content: any[] = [];

  if (isPdf) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64File = `data:application/pdf;base64,${buffer.toString("base64")}`;

    content.push({
      type: "input_file",
      file_data: base64File,
      filename: file.name,
    });
  }

  content.push({
    type: "input_text",
    text: `
You are Effluxa, a senior AI financial leakage auditor for small and mid-sized businesses.

Your job is to analyze uploaded financial documents and identify:
- unnecessary cost leakage
- overspending patterns
- vendor concentration risks
- duplicate or suspicious payments
- cash flow pressure
- operational inefficiencies
- practical savings opportunities

Return ONLY valid JSON.
Do not use markdown.
Do not add comments.
Do not add trailing commas.
If the document does not contain enough information for a field, use an empty array or "Insufficient data".

Return exactly this JSON structure:

{
  "executive_summary": "clear executive summary in 3-5 sentences",
  "leakage_score": 0,
  "risk_level": "Low | Medium | High | Critical",
  "estimated_savings": 0,
  "confidence_level": "Low | Medium | High",
  "key_findings": ["finding 1", "finding 2", "finding 3"],
  "top_vendors": [
    { "vendor": "Vendor name", "amount": 0, "reason": "why this vendor matters" }
  ],
  "high_cost_categories": [
    { "category": "Category name", "amount": 0, "observation": "cost observation" }
  ],
  "anomalies": [
    { "item": "Anomaly", "reason": "why it may require review" }
  ],
  "duplicate_payment_risks": [
    { "item": "Possible duplicate", "reason": "why it may be duplicate" }
  ],
  "cashflow_observations": ["observation 1", "observation 2"],
  "quick_wins": ["quick win 1", "quick win 2", "quick win 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "cfo_summary": "short CFO-style conclusion"
}

Rules:
- leakage_score must be 0-100.
- estimated_savings must be numeric EUR estimate.
- Do not invent vendor names if not visible.
- If amounts are unclear, be conservative.
- Focus on practical business action, not generic advice.
- For weak or incomplete documents, explicitly say data is limited.

Financial data:
${financialText ? financialText.slice(0, 30000) : ""}
`
  });

  const response = await openai.responses.create({
    model: "gpt-4.1",
    input: [
      {
        role: "user",
        content,
      },
    ],
  });

  return safeParseAIJson(response.output_text || "");
}

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit({
      req,
      key: "upload",
      limit: 6,
      windowMs: 60000,
    });

    if (limited) return limited;

    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = safeVerifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userLimited = rateLimit({
      req,
      key: `upload_user:${user.id}`,
      limit: 3,
      windowMs: 60000,
    });

    if (userLimited) return userLimited;

    const now = new Date();
    const weeklyWindowMs = 7 * 24 * 60 * 60 * 1000;
    const resetAt = user.weeklyResetDate?.getTime() || 0;
    const weeklyWindowExpired = now.getTime() - resetAt >= weeklyWindowMs;

    if (weeklyWindowExpired) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          weeklyUploadCount: 0,
          weeklyResetDate: now,
        },
      });

      user.weeklyUploadCount = 0;
      user.weeklyResetDate = now;
    }

    const workspace = await getWorkspaceOwner(user);
    const hasUnlimitedUploads = canUseUnlimitedUploads({ user, workspace });

    if (!hasUnlimitedUploads && user.weeklyUploadCount >= 3) {
      return NextResponse.json(
        {
          error: "You have reached your free audit limit. Upgrade to Effluxa Pro or Agency for unlimited audits.",
        },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const uploadedValue = formData.get("file");
    const file =
      uploadedValue &&
      typeof uploadedValue !== "string" &&
      typeof uploadedValue.arrayBuffer === "function"
        ? (uploadedValue as File)
        : null;
    const rawClientId = formData.get("clientId") as string | null;
    const clientId = rawClientId?.trim() || null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const client = clientId
      ? await prisma.client.findFirst({
          where: {
            id: clientId,
            ownerId: workspace.owner.id,
          },
        })
      : null;

    if (clientId && !client) {
      return NextResponse.json(
        { error: "Selected client was not found in this workspace." },
        { status: 400 }
      );
    }

    const fileValidation = await validateUploadFile(file);

    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      );
    }

    const lowerName = file.name.toLowerCase();

    let financialText = "";

    if (lowerName.endsWith(".csv")) {
      financialText = await file.text();
    }

    if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
      const buffer = Buffer.from(await file.arrayBuffer());

      const workbook = XLSX.read(buffer, {
        type: "buffer",
      });

      financialText = workbook.SheetNames.map((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        return `Sheet: ${sheetName}\n${XLSX.utils.sheet_to_csv(sheet)}`;
      }).join("\n\n");
    }

    let parsedData;

    try {
      parsedData = normalizeAuditReport(
        await analyzeWithAI(file, financialText),
        {
          fileName: file.name,
          financialText,
        }
      );
    } catch (analysisError) {
      if (!shouldUseFallbackReport(analysisError)) {
        throw analysisError;
      }

      console.warn("UPLOAD FALLBACK REPORT USED:", analysisError);

      parsedData = buildFallbackAuditReport({
        fileName: file.name,
        financialText,
        reason:
          analysisError instanceof Error
            ? analysisError.message
            : "AI output could not be converted into the required audit schema.",
      });
    }

    const upload = await prisma.upload.create({
      data: {
        userId: workspace.owner.id,
        fileUrl: file.name,
        parsedData,
        summary: "AI financial leak audit generated",
        clientId: client?.id || null,
      },
    });

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        weeklyUploadCount: {
          increment: 1,
        },
      },
    });

    await trackEvent({
      type: "upload_created",
      userId: user.id,
      reportId: upload.id,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        workspaceOwnerId: workspace.owner.id,
        uploadedBy: user.email,
        clientId: client?.id || null,
        clientName: client?.name || null,
      },
    });

    return NextResponse.json({
      success: true,
      upload,
    });
  } catch (error: any) {
    console.error("UPLOAD ERROR:", error);

    await trackError({
      type: "ai_service_unavailable",
      error,
    });

    const message = String(error?.message || "");

    const isQuotaError =
      message.includes("429") ||
      message.toLowerCase().includes("quota") ||
      message.toLowerCase().includes("billing") ||
      message.toLowerCase().includes("insufficient_quota") ||
      message.toLowerCase().includes("rate_limit");

    if (isQuotaError) {
      await trackEvent({
        type: "ai_quota_exceeded",
        userId: undefined,
        metadata: {
          provider: "OpenAI",
          message,
          time: new Date().toISOString(),
        },
      });

      try {
        await sendAdminNotificationEmail({
          subject: "🚨 Effluxa AI processing unavailable",
          body: `AI processing is currently unavailable.

Reason:
${message}

Recommended action:
Check AI provider billing/quota and recharge credits if needed.

Time:
${new Date().toISOString()}`,
        });
      } catch (emailError) {
        console.error("ADMIN AI ALERT EMAIL ERROR:", emailError);
      }

      return NextResponse.json(
        {
          error:
            "AI analysis is temporarily unavailable. Our team has already been notified. Please try again in a few minutes.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error:
          "We couldn't complete your audit right now. Please try again in a few minutes.",
      },
      { status: 500 }
    );
  }
}
