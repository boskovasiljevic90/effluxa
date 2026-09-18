type UnknownRecord = Record<string, unknown>;

type RuleFamily = {
  ruleId: string;
  title: string;
  currentCount: number;
  previousCount: number;
};

function findingsFrom(data: unknown) {
  if (!data || typeof data !== "object") return [];
  const findings = (data as UnknownRecord).findings;
  return Array.isArray(findings)
    ? findings.filter((finding): finding is UnknownRecord => Boolean(finding && typeof finding === "object"))
    : [];
}

function isStructuredReport(data: unknown) {
  if (!data || typeof data !== "object") return false;
  const version = (data as UnknownRecord).analysisVersion;
  return version === "2.0" || version === "3.0";
}

function ruleIdFrom(finding: UnknownRecord) {
  const ruleId = typeof finding.ruleId === "string" ? finding.ruleId.trim() : "";
  return ruleId || "UNSPECIFIED_RULE";
}

function titleFrom(finding: UnknownRecord) {
  return typeof finding.title === "string" && finding.title.trim()
    ? finding.title.trim()
    : "Untitled finding";
}

function countByRule(findings: UnknownRecord[]) {
  const counts = new Map<string, { count: number; title: string }>();

  for (const finding of findings) {
    const ruleId = ruleIdFrom(finding);
    const current = counts.get(ruleId);
    counts.set(ruleId, {
      count: (current?.count || 0) + 1,
      title: current?.title || titleFrom(finding),
    });
  }

  return counts;
}

export function formatRuleFamily(ruleId: string) {
  return ruleId
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function buildFindingTrend(currentData: unknown, previousData: unknown) {
  const currentFindings = findingsFrom(currentData);
  const previousFindings = findingsFrom(previousData);
  const currentByRule = countByRule(currentFindings);
  const previousByRule = countByRule(previousFindings);
  const ruleIds = new Set([...currentByRule.keys(), ...previousByRule.keys()]);

  const recurring: RuleFamily[] = [];
  const newRuleFamilies: RuleFamily[] = [];
  const noLongerDetected: RuleFamily[] = [];

  for (const ruleId of ruleIds) {
    const current = currentByRule.get(ruleId);
    const previous = previousByRule.get(ruleId);
    const family = {
      ruleId,
      title: current?.title || previous?.title || "Untitled finding",
      currentCount: current?.count || 0,
      previousCount: previous?.count || 0,
    };

    if (current && previous) recurring.push(family);
    else if (current) newRuleFamilies.push(family);
    else if (previous) noLongerDetected.push(family);
  }

  const byCurrentCount = (left: RuleFamily, right: RuleFamily) =>
    right.currentCount - left.currentCount || left.ruleId.localeCompare(right.ruleId);
  const byPreviousCount = (left: RuleFamily, right: RuleFamily) =>
    right.previousCount - left.previousCount || left.ruleId.localeCompare(right.ruleId);

  return {
    hasStructuredHistory: currentFindings.length > 0 || previousFindings.length > 0,
    hasComparableHistory: isStructuredReport(currentData) && isStructuredReport(previousData),
    currentCount: currentFindings.length,
    previousCount: previousFindings.length,
    recurring: recurring.sort(byCurrentCount),
    newRuleFamilies: newRuleFamilies.sort(byCurrentCount),
    noLongerDetected: noLongerDetected.sort(byPreviousCount),
  };
}
