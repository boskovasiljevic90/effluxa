import type {
  AuditExtractionOptions,
  AuditExtractionPassName,
} from "../audit-v2/extractor";

type PdfPage = {
  number: number;
  text: string;
};

const sectionHeadings: Array<[number, RegExp]> = [
  [1, /company profile and finance-control policies/i],
  [2, /executive financial summary/i],
  [3, /income statement/i],
  [4, /balance sheet/i],
  [5, /cash flow statement/i],
  [6, /monthly management p[&amp;\s]*l/i],
  [7, /revenue and gross-margin analysis/i],
  [8, /operating expense analysis/i],
  [9, /accounts payable aging and vendor concentration/i],
  [10, /vendor master changes/i],
  [11, /detailed ap invoice and payment ledger/i],
  [12, /accounts receivable aging/i],
  [13, /customer credits and unapplied cash/i],
  [14, /cash and bank activity/i],
  [15, /payroll, headcount and overtime/i],
  [16, /travel and employee expense claims/i],
  [17, /inventory and slow-moving stock/i],
  [18, /fixed assets and capital expenditure/i],
  [19, /debt, interest and financing costs/i],
  [20, /software subscriptions and recurring services/i],
  [21, /tax and statutory payment schedule/i],
  [22, /related-party balances and transactions/i],
  [23, /budget vs actual and kpi dashboard/i],
  [24, /management notes, commitments and open items/i],
];

const passSections: Record<AuditExtractionPassName, number[]> = {
  "invoice-ledger": [11],
  "payments-and-controls": [9, 10, 11, 14],
  "working-capital-and-kpis": [2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 23],
  "opex-people-and-assets": [8, 15, 16, 17, 18, 20, 24],
  "financing-and-related-parties": [3, 5, 19, 21, 22, 24],
};

function splitPdfPages(text: string): PdfPage[] {
  const markers = [...text.matchAll(/\[PDF_PAGE\s+(\d+)\]/g)];
  if (markers.length < 3) return [];

  return markers.map((marker, index) => ({
    number: Number(marker[1]),
    text: text.slice(marker.index || 0, markers[index + 1]?.index || text.length),
  }));
}

function detectSectionStarts(pages: PdfPage[]) {
  return pages
    .map((page, pageIndex) => {
      const match = sectionHeadings.find(([, pattern]) => pattern.test(page.text));
      return match ? { section: match[0], pageIndex } : null;
    })
    .filter((item): item is { section: number; pageIndex: number } => Boolean(item));
}

function selectedPagesForPass(passName: AuditExtractionPassName, pages: PdfPage[]) {
  const starts = detectSectionStarts(pages);
  if (starts.length < 5) return pages;

  const selectedSections = new Set(passSections[passName]);
  const selectedPageIndexes = new Set<number>([0]);

  for (const start of starts) {
    if (!selectedSections.has(start.section)) continue;
    const nextStart = starts.find((candidate) => candidate.pageIndex > start.pageIndex);
    const endIndex = nextStart ? nextStart.pageIndex : pages.length;
    for (let index = start.pageIndex; index < endIndex; index += 1) {
      selectedPageIndexes.add(index);
    }
  }

  // Policies are shared context for every pass and materially affect rule
  // interpretation, so keep the policy page even when the pass is routed.
  const policyStart = starts.find((start) => start.section === 1);
  if (policyStart) selectedPageIndexes.add(policyStart.pageIndex);

  return pages.filter((_, index) => selectedPageIndexes.has(index));
}

export function routeFinancialTextV3(
  passName: AuditExtractionPassName,
  fullText: string
) {
  const pages = splitPdfPages(fullText);
  if (pages.length === 0) return fullText;

  return selectedPagesForPass(passName, pages)
    .map((page) => page.text)
    .join("\n");
}

export function createV3ExtractionOptions(financialText: string): AuditExtractionOptions {
  const isPageIndexed = splitPdfPages(financialText).length >= 3;

  return {
    // V3 removes the three-wave bottleneck. The production rate-limit budget
    // is intentionally configured for five short, routed requests.
    concurrency: isPageIndexed ? 5 : 3,
    model: process.env.EFFLUXA_AUDIT_V3_MODEL || undefined,
    serviceTier: process.env.EFFLUXA_AUDIT_V3_SERVICE_TIER || undefined,
    maxInputChars: 40000,
    routeText: isPageIndexed ? routeFinancialTextV3 : undefined,
  };
}

export function getV3RoutingStats(financialText: string) {
  const pages = splitPdfPages(financialText);
  if (pages.length === 0) {
    return { pageCount: 0, fullTextChars: financialText.length, routedChars: financialText.length };
  }

  const routedChars = (Object.keys(passSections) as AuditExtractionPassName[])
    .map((passName) => routeFinancialTextV3(passName, financialText).length)
    .reduce((total, count) => total + count, 0);

  return {
    pageCount: pages.length,
    fullTextChars: financialText.length,
    routedChars,
  };
}
