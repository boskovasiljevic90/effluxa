export const ACQUISITION_COOKIE = "effluxa_acquisition";
export const ACQUISITION_COOKIE_MAX_AGE = 90 * 24 * 60 * 60;

export type AcquisitionAttribution = {
  source: string;
  medium: string;
  campaign: string;
  content: string | null;
  landingPath: string;
};

const VALUE_PATTERN = /^[a-z0-9][a-z0-9._-]{0,79}$/i;

function normalizeValue(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return VALUE_PATTERN.test(normalized) ? normalized : null;
}

function resourceContentFromPath(pathname: string) {
  const match = pathname.match(/^\/resources\/([^/]+)/i);
  return match ? normalizeValue(match[1]) : null;
}

export function buildAcquisitionAttribution(search: string, pathname: string): AcquisitionAttribution | null {
  const params = new URLSearchParams(search);
  const explicitSource = normalizeValue(params.get("utm_source"));
  const explicitMedium = normalizeValue(params.get("utm_medium"));
  const explicitCampaign = normalizeValue(params.get("utm_campaign"));
  const explicitContent = normalizeValue(params.get("utm_content"));

  if (explicitSource) {
    return {
      source: explicitSource,
      medium: explicitMedium || "unknown",
      campaign: explicitCampaign || "unknown",
      content: explicitContent,
      landingPath: pathname.slice(0, 180),
    };
  }

  const resourceContent = resourceContentFromPath(pathname);
  if (resourceContent) {
    return {
      source: "resources",
      medium: "organic",
      campaign: "resource_guides",
      content: resourceContent,
      landingPath: pathname.slice(0, 180),
    };
  }

  if (pathname === "/resources") {
    return {
      source: "resources",
      medium: "organic",
      campaign: "resource_hub",
      content: null,
      landingPath: pathname,
    };
  }

  if (pathname === "/for-accounting-firms") {
    return {
      source: "partner_landing",
      medium: "organic",
      campaign: "accounting_firms",
      content: null,
      landingPath: pathname,
    };
  }

  if (pathname === "/sample-audit") {
    return {
      source: "sample_audit",
      medium: "organic",
      campaign: "sample_audit",
      content: null,
      landingPath: pathname,
    };
  }

  return null;
}

export function parseAcquisitionCookie(value: unknown): AcquisitionAttribution | null {
  if (typeof value !== "string" || !value) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    const source = normalizeValue(parsed?.source);
    const medium = normalizeValue(parsed?.medium);
    const campaign = normalizeValue(parsed?.campaign);
    const content = parsed?.content ? normalizeValue(parsed.content) : null;
    const landingPath = typeof parsed?.landingPath === "string"
      ? parsed.landingPath.slice(0, 180)
      : "/";

    if (!source || !medium || !campaign) return null;

    return {
      source,
      medium,
      campaign,
      content,
      landingPath,
    };
  } catch {
    return null;
  }
}
