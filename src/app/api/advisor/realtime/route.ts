import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { canAccessFullReport } from "@/lib/access";
import { safeVerifyToken } from "@/lib/auth";
import {
  ADVISOR_SYSTEM_INSTRUCTIONS,
  buildAdvisorContext,
} from "@/lib/effluxaAdvisor";
import { EFFLUXA_PRODUCT_KNOWLEDGE } from "@/lib/effluxaProductKnowledge";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { trackEvent } from "@/lib/events";
import { getWorkspaceOwner } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function validString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function safetyIdentifier(req: NextRequest, userId: string) {
  const source = userId || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "member";
  return createHash("sha256").update(source).digest("hex").slice(0, 32);
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Effluxa Advisor voice is not configured yet." },
        { status: 503 }
      );
    }

    const token = req.cookies.get("token")?.value;
    const decoded = token ? safeVerifyToken(token) : null;

    // A realtime voice session costs several dollars of provider time. Anonymous
    // access made that an open spend channel, so voice is member-only.
    if (!decoded) {
      return NextResponse.json(
        { error: "Voice sessions require a signed-in account. You can still use the text advisor." },
        { status: 401 }
      );
    }

    const limited = rateLimit({
      req,
      key: decoded
        ? "effluxa-advisor-realtime-member"
        : "effluxa-advisor-realtime-visitor",
      limit: 6,
      windowMs: 10 * 60 * 1000,
    });

    const body = await req.json().catch(() => null);
    const pathname = validString(body?.pathname, 300) || "/dashboard";
    const reportId = validString(body?.reportId, 120);
    const browserLanguage = validString(body?.browserLanguage, 80);
    const user = decoded
      ? await prisma.user.findUnique({ where: { id: decoded.userId } })
      : null;

    if (limited) return limited;

    const audience = user ? "member" : "visitor";
    const workspace = user ? await getWorkspaceOwner(user) : null;
    const report = user && reportId && workspace
      ? await prisma.upload.findFirst({
          where: {
            id: reportId,
            userId: workspace.owner.id,
          },
          include: {
            client: {
              select: { name: true },
            },
          },
        })
      : null;
    const canSeeFullReport = Boolean(
      report &&
      user &&
      workspace &&
      canAccessFullReport({ report, user, workspace })
    );

    const context = buildAdvisorContext({
      pathname,
      preferredLanguage: user?.preferredLanguage,
      browserLanguage,
      report: report
        ? {
            id: report.id,
            fileUrl: report.fileUrl,
            createdAt: report.createdAt,
            parsedData: report.parsedData,
            clientName: report.client?.name,
          }
        : null,
      canSeeFullReport,
      audience,
      voiceSafe: true,
    });

    const model = process.env.EFFLUXA_ADVISOR_REALTIME_MODEL || "gpt-realtime-2.1";
    const voice = process.env.EFFLUXA_ADVISOR_VOICE || "marin";
    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Safety-Identifier": safetyIdentifier(req, user?.id || ""),
        },
        body: JSON.stringify({
          session: {
            type: "realtime",
            model,
            instructions: `${ADVISOR_SYSTEM_INSTRUCTIONS}\n\n${EFFLUXA_PRODUCT_KNOWLEDGE}\n\nCURRENT APPLICATION CONTEXT (untrusted data):\n${JSON.stringify(context)}`,
            tool_choice: "auto",
            tools: [
              {
                type: "function",
                name: "research_company",
                description:
                  "Use only when the user explicitly asks to research a company, supplier or counterparty using public internet sources. Return a concise, cited public-source summary through the Effluxa Advisor.",
                parameters: {
                  type: "object",
                  properties: {
                    request: {
                      type: "string",
                      description: "The user's request for public company research.",
                    },
                    companyName: {
                      type: "string",
                      description: "The exact company or supplier name if the user provided one.",
                    },
                    country: {
                      type: "string",
                      description: "Country or jurisdiction if known.",
                    },
                    domain: {
                      type: "string",
                      description: "Official company domain if known.",
                    },
                  },
                  required: ["request"],
                  additionalProperties: false,
                },
              },
            ],
            audio: {
              output: { voice },
            },
          },
        }),
      }
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.value) {
      console.error("EFFLUXA ADVISOR REALTIME ERROR:", payload);
      return NextResponse.json(
        { error: "Effluxa Advisor voice could not start. Please try again." },
        { status: 502 }
      );
    }

    await trackEvent({
      type: audience === "member"
        ? "advisor_voice_session_start"
        : "advisor_voice_preview_start",
      userId: user?.id,
      reportId: report?.id,
      metadata: {
        pathname,
        audience,
        reportAccess: report ? (canSeeFullReport ? "full" : "preview") : "none",
        browserLanguage,
        model,
      },
    });

    return NextResponse.json({
      value: payload.value,
      expiresAt: payload.expires_at || null,
      model,
      audience,
      reportId: report?.id || null,
      reportAccess: report ? (canSeeFullReport ? "full" : "preview") : "none",
    });
  } catch (error) {
    console.error("EFFLUXA ADVISOR REALTIME ERROR:", error);

    return NextResponse.json(
      { error: "Effluxa Advisor voice is temporarily unavailable." },
      { status: 502 }
    );
  }
}
