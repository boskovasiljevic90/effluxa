export function getOrgIdFromRequest(req: Request): string {
  const url = new URL(req.url);

  // Optional: allow passing orgId via query or header later
  const q = url.searchParams.get("orgId");
  if (q && q.trim()) return q.trim();

  const h = req.headers.get("x-org-id");
  if (h && h.trim()) return h.trim();

  // Default demo org (single-tenant for now)
  return "demo";
}
