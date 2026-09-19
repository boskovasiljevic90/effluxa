import OpenAI from "openai";
import type { AuditFinding, AuditMetrics, ExtractedFinancialData } from "./types";

type ReasoningOutput = {
  summary: string;
  cfoSummary: string;
  themes: string[];
  actions: string[];
};

const reasoningSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    cfoSummary: { type: "string" },
    themes: { type: "array", items: { type: "string" } },
    actions: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "cfoSummary", "themes", "actions"],
};

function deterministicReasoning(metrics: AuditMetrics, findings: AuditFinding[]): ReasoningOutput {
  const critical = metrics.criticalFindings > 0
    ? `${metrics.criticalFindings} critical control exception${metrics.criticalFindings === 1 ? "" : "s"} require immediate review.`
    : "No critical deterministic exception was identified in the extracted data.";
  const duplicate = metrics.potentialDuplicateExposure + metrics.nearDuplicateExposure;
  const duplicateText = duplicate > 0
    ? `Potential duplicate-payment exposure totals approximately EUR ${duplicate.toLocaleString()}.`
    : "No duplicate-payment exposure was quantified by the deterministic rules.";
  const workingCapital = metrics.workingCapitalExposure > 0
    ? `Working-capital items requiring review total approximately EUR ${metrics.workingCapitalExposure.toLocaleString()}.`
    : "No working-capital exposure was quantified by the deterministic rules.";
  const savings = metrics.avoidableCostRunRate > 0
    ? `The conservative avoidable-cost run-rate is approximately EUR ${metrics.avoidableCostRunRate.toLocaleString()}; this is not the same as confirmed savings.`
    : "No avoidable-cost run-rate was quantified from the available records.";

  const actions = findings
    .sort((a, b) => {
      const rank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return rank[b.severity] - rank[a.severity];
    })
    .map((finding) => finding.recommendedAction)
    .filter((action, index, list) => list.indexOf(action) === index)
    .slice(0, 6);

  return {
    summary: `Effluxa extracted ${metrics.findingCount} review item${metrics.findingCount === 1 ? "" : "s"} from the uploaded financial data. ${critical} ${duplicateText} ${workingCapital} ${savings}`,
    cfoSummary: `${critical} Prioritise evidence validation and control remediation before treating any quantified amount as realised savings or confirmed loss.`,
    themes: [duplicateText, workingCapital, savings].filter(Boolean),
    actions,
  };
}

function parseReasoning(text: string): ReasoningOutput {
  const parsed = JSON.parse(text) as Partial<ReasoningOutput>;
  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    cfoSummary: typeof parsed.cfoSummary === "string" ? parsed.cfoSummary : "",
    themes: Array.isArray(parsed.themes) ? parsed.themes.filter((item): item is string => typeof item === "string") : [],
    actions: Array.isArray(parsed.actions) ? parsed.actions.filter((item): item is string => typeof item === "string") : [],
  };
}

function extractResponseText(response: unknown) {
  const candidate = response as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ text?: unknown }> }>;
  };
  if (typeof candidate.output_text === "string" && candidate.output_text.trim()) return candidate.output_text;

  return (candidate.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => (typeof content.text === "string" ? content.text : ""))
    .filter(Boolean)
    .join("\n");
}

export async function runReasoningCrossCheck({
  data,
  findings,
  metrics,
  useAi = true,
}: {
  data: ExtractedFinancialData;
  findings: AuditFinding[];
  metrics: AuditMetrics;
  useAi?: boolean;
}) {
  const fallback = deterministicReasoning(metrics, findings);
  if (!useAi || process.env.EFFLUXA_AUDIT_V2_REASONING !== "true" || findings.length === 0) return fallback;

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const response = await openai.responses.create({
      model: process.env.EFFLUXA_AUDIT_V2_REASONING_MODEL || process.env.EFFLUXA_AUDIT_V2_MODEL || "gpt-4.1",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
You are the reasoning and executive-summary layer of Effluxa Audit Engine V2.
Use only the verified findings and metrics below. Explain relationships between findings where the evidence supports them, but do not invent facts, vendors, dates, amounts, or causal certainty.
Do not call anything confirmed fraud. Use potential fraud indicator or control risk.
Do not describe exposure, possible duplicate amount, working-capital exposure, or avoidable-cost run-rate as confirmed savings.
Return only the requested JSON.

Company: ${data.companyName}
Currency: ${data.currency}
Metrics: ${JSON.stringify(metrics)}
Verified findings: ${JSON.stringify(findings.slice(0, 60))}
`,
            },
          ],
        },
      ],
      temperature: 0,
      text: {
        format: {
          type: "json_schema",
          name: "effluxa_audit_reasoning",
          strict: true,
          schema: reasoningSchema,
        },
      },
    } as unknown as Parameters<typeof openai.responses.create>[0]) as unknown;

    const outputText = extractResponseText(response);
    const result = parseReasoning(outputText);
    if (!result.summary || !result.cfoSummary) return fallback;
    return {
      summary: result.summary,
      cfoSummary: result.cfoSummary,
      themes: result.themes.length ? result.themes : fallback.themes,
      actions: result.actions.length ? result.actions : fallback.actions,
    };
  } catch (error) {
    console.warn("AUDIT V2 REASONING FALLBACK:", error);
    return fallback;
  }
}
