type UnknownRecord = Record<string, unknown>;

type AdvisorReport = {
  id: string;
  fileUrl: string;
  createdAt: Date;
  parsedData: unknown;
  clientName?: string | null;
};

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function number(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function shortText(value: unknown, maxLength = 900) {
  const output = text(value);
  return output.length > maxLength ? `${output.slice(0, maxLength - 1)}…` : output;
}

function textList(value: unknown, maxItems = 10, maxLength = 700) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") return shortText(item, maxLength);
      if (!isRecord(item)) return "";

      return shortText(
        item.title ||
          item.finding ||
          item.recommendation ||
          item.observation ||
          item.description ||
          item.reason ||
          item.name,
        maxLength
      );
    })
    .filter(Boolean)
    .slice(0, maxItems);
}

function evidenceList(value: unknown, maxItems = 5) {
  if (!Array.isArray(value)) return [];

  return value.slice(0, maxItems).map((item) => {
    if (typeof item === "string") return shortText(item, 500);
    if (!isRecord(item)) return item;

    const selected: UnknownRecord = {};

    for (const key of [
      "type",
      "source",
      "page",
      "date",
      "vendor",
      "invoiceNumber",
      "amount",
      "description",
      "reason",
      "value",
    ]) {
      if (item[key] !== undefined && item[key] !== null) {
        selected[key] =
          typeof item[key] === "string" ? shortText(item[key], 500) : item[key];
      }
    }

    return Object.keys(selected).length > 0 ? selected : { summary: shortText(item, 500) };
  });
}

function findingContext(value: unknown, maxItems = 36) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .slice(0, maxItems)
    .map((finding) => {
      const quantification = isRecord(finding.quantification)
        ? finding.quantification
        : {};

      return {
        id: text(finding.id, "unknown-finding"),
        title: shortText(finding.title || "Untitled finding", 300),
        severity: text(finding.severity, "MEDIUM"),
        category: text(finding.category, "CONTROL_EXCEPTION"),
        ruleId: text(finding.ruleId, ""),
        description: shortText(finding.description, 900),
        confidence: number(finding.confidence, 0),
        quantifiedAmount: number(quantification.amount, 0),
        currency: text(quantification.currency, "EUR"),
        recommendedAction: shortText(finding.recommendedAction, 900),
        evidence: evidenceList(finding.evidence),
      };
    });
}

function reportFileName(fileUrl: string) {
  const lastSegment = fileUrl.split("/").pop() || fileUrl;
  return decodeURIComponent(lastSegment).slice(0, 240);
}

export function getAdvisorPageLabel(pathname: string) {
  if (pathname.includes("/reports/")) return "Report detail";
  if (pathname === "/dashboard/reports") return "Reports";
  if (pathname === "/dashboard/upload") return "Upload Audit";
  if (pathname.includes("/clients/")) return "Client detail";
  if (pathname === "/dashboard/clients") return "Clients";
  if (pathname === "/dashboard/portfolio") return "Portfolio";
  if (pathname === "/dashboard/controls") return "Controls";
  if (pathname === "/dashboard/settings") return "Settings";
  if (pathname === "/dashboard/team") return "Team";
  if (pathname === "/dashboard/notifications") return "Notifications";
  if (pathname === "/dashboard/partner") return "Partner Launchpad";
  return "Dashboard";
}

export function buildAdvisorReportContext(
  report: AdvisorReport | null,
  canSeeFullReport: boolean
) {
  if (!report) return null;

  const data = isRecord(report.parsedData) ? report.parsedData : {};
  const base = {
    id: report.id,
    fileName: reportFileName(report.fileUrl),
    createdAt: report.createdAt.toISOString(),
    clientName: report.clientName || null,
    access: canSeeFullReport ? "full" : "preview",
    analysisVersion: text(data.analysisVersion, "legacy"),
    executiveSummary: shortText(data.executive_summary || data.summary, 1500),
    leakageScore: number(data.leakage_score, 0),
  };

  if (!canSeeFullReport) {
    return {
      ...base,
      lockedFields: [
        "estimated_savings",
        "risk_level",
        "confidence_level",
        "findings",
        "evidence",
        "control exposures",
      ],
      previewInstruction:
        "This user has preview access. Do not infer or reveal locked fields. Explain that the full audit must be unlocked for detailed findings.",
    };
  }

  const metrics = isRecord(data.metrics) ? data.metrics : {};

  return {
    ...base,
    estimatedSavings: number(data.estimated_savings, 0),
    riskLevel: text(data.risk_level, "Insufficient data"),
    confidenceLevel: text(data.confidence_level, "Insufficient data"),
    cfoSummary: shortText(data.cfo_summary, 1500),
    keyFindings: textList(data.key_findings, 14),
    quickWins: textList(data.quick_wins, 12),
    recommendations: textList(data.recommendations, 14),
    cashflowObservations: textList(data.cashflow_observations, 10),
    duplicatePaymentRisks: textList(data.duplicate_payment_risks, 10),
    topVendors: Array.isArray(data.top_vendors)
      ? data.top_vendors.slice(0, 12).map((item) => {
          const vendor = isRecord(item) ? item : {};
          return {
            vendor: shortText(vendor.vendor || vendor.name, 200),
            amount: number(vendor.amount, 0),
            reason: shortText(vendor.reason || vendor.description, 600),
          };
        })
      : [],
    highCostCategories: Array.isArray(data.high_cost_categories)
      ? data.high_cost_categories.slice(0, 12).map((item) => {
          const category = isRecord(item) ? item : {};
          return {
            category: shortText(category.category || category.name, 200),
            amount: number(category.amount, 0),
            reason: shortText(category.reason || category.description, 600),
          };
        })
      : [],
    quantifiedMetrics: {
      potentialDuplicateExposure: number(metrics.potentialDuplicateExposure, 0),
      avoidableCostRunRate: number(metrics.avoidableCostRunRate, 0),
      workingCapitalExposure: number(metrics.workingCapitalExposure, 0),
      controlRiskExposure: number(metrics.controlRiskExposure, 0),
    },
    findings: findingContext(data.findings),
  };
}

export function buildAdvisorContext({
  pathname,
  preferredLanguage,
  browserLanguage,
  report,
  canSeeFullReport,
}: {
  pathname: string;
  preferredLanguage?: string | null;
  browserLanguage?: string | null;
  report: AdvisorReport | null;
  canSeeFullReport: boolean;
}) {
  return {
    currentPage: getAdvisorPageLabel(pathname),
    currentPath: pathname,
    responseLanguageHint: preferredLanguage || browserLanguage || "en",
    report: buildAdvisorReportContext(report, canSeeFullReport),
  };
}

export function normalizeAdvisorHistory(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .map((item) => {
      const role = item.role === "assistant" ? "assistant" : "user";
      const content = text(item.content).slice(0, 3500);
      return content ? { role, content } : null;
    })
    .filter((item): item is { role: "user" | "assistant"; content: string } => Boolean(item))
    .slice(-12);
}
