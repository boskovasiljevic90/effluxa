export type PilotLead = {
  email: string;
  createdAt: Date | string;
};

export type PilotLeadAccount = {
  email: string;
  createdAt: Date | string;
  isPaid: boolean;
};

export type PilotLeadAudit = {
  email: string;
  createdAt: Date | string;
};

export type PilotLeadFunnel = {
  totalLeads: number;
  leadsWithoutSignup: number;
  leadsWithSignup: number;
  activatedWithin7Days: number;
  paidAccounts: number;
  signupRate: number | null;
  activationRate: number | null;
  paidRate: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function timestamp(value: Date | string) {
  const result = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(result) ? result : 0;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function percentage(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : null;
}

/**
 * Builds an internal, same-email attribution proxy for partner-pilot leads.
 * It deliberately does not claim causation: a lead can use another email,
 * and an account may have come from another channel as well.
 */
export function buildPilotLeadFunnel(
  leads: PilotLead[],
  accounts: PilotLeadAccount[],
  audits: PilotLeadAudit[]
): PilotLeadFunnel {
  const firstLeadByEmail = new Map<string, PilotLead>();

  for (const lead of leads) {
    const email = normalizeEmail(lead.email);
    if (!email) continue;

    const existing = firstLeadByEmail.get(email);
    if (!existing || timestamp(lead.createdAt) < timestamp(existing.createdAt)) {
      firstLeadByEmail.set(email, { ...lead, email });
    }
  }

  const accountsByEmail = new Map<string, PilotLeadAccount[]>();
  for (const account of accounts) {
    const email = normalizeEmail(account.email);
    if (!email) continue;

    const existing = accountsByEmail.get(email) || [];
    existing.push({ ...account, email });
    accountsByEmail.set(email, existing);
  }

  for (const emailAccounts of accountsByEmail.values()) {
    emailAccounts.sort((a, b) => timestamp(a.createdAt) - timestamp(b.createdAt));
  }

  const auditsByEmail = new Map<string, number[]>();
  for (const audit of audits) {
    const email = normalizeEmail(audit.email);
    const auditAt = timestamp(audit.createdAt);
    if (!email || !auditAt) continue;

    const existing = auditsByEmail.get(email) || [];
    existing.push(auditAt);
    auditsByEmail.set(email, existing);
  }

  for (const emailAudits of auditsByEmail.values()) {
    emailAudits.sort((a, b) => a - b);
  }

  let leadsWithSignup = 0;
  let activatedWithin7Days = 0;
  let paidAccounts = 0;

  for (const [email, lead] of firstLeadByEmail) {
    const leadAt = timestamp(lead.createdAt);
    const account = (accountsByEmail.get(email) || []).find(
      (candidate) => timestamp(candidate.createdAt) >= leadAt
    );

    if (!account) continue;

    leadsWithSignup += 1;
    const signupAt = timestamp(account.createdAt);
    const firstAuditAt = (auditsByEmail.get(email) || []).find(
      (auditAt) => auditAt >= signupAt
    );

    if (firstAuditAt !== undefined && firstAuditAt <= signupAt + 7 * DAY_MS) {
      activatedWithin7Days += 1;
    }

    if (account.isPaid) {
      paidAccounts += 1;
    }
  }

  return {
    totalLeads: firstLeadByEmail.size,
    leadsWithoutSignup: firstLeadByEmail.size - leadsWithSignup,
    leadsWithSignup,
    activatedWithin7Days,
    paidAccounts,
    signupRate: percentage(leadsWithSignup, firstLeadByEmail.size),
    activationRate: percentage(activatedWithin7Days, leadsWithSignup),
    paidRate: percentage(paidAccounts, leadsWithSignup),
  };
}
