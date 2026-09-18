export type GrowthAccount = {
  id: string;
  createdAt: Date | string;
  isPaid: boolean;
  isPartner: boolean;
};

export type GrowthAudit = {
  userId: string;
  createdAt: Date | string;
};

export type GrowthCohort = {
  label: string;
  signups: number;
  activatedWithin7Days: number;
  activationRate: number | null;
  matureFor28DayRetention: number;
  returnedWithin28Days: number;
  retentionRate: number | null;
  paidAccounts: number;
  paidRate: number | null;
  partnerSignups: number;
  partnerActivationRate: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function timestamp(value: Date | string) {
  const result = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(result) ? result : 0;
}

function percentage(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : null;
}

function buildCohort(
  label: string,
  accounts: GrowthAccount[],
  auditsByUser: Map<string, number[]>,
  startAt: number,
  endAt: number,
  now: number
): GrowthCohort {
  const cohortAccounts = accounts.filter((account) => {
    const createdAt = timestamp(account.createdAt);
    return createdAt >= startAt && createdAt < endAt;
  });

  let activatedWithin7Days = 0;
  let matureFor28DayRetention = 0;
  let returnedWithin28Days = 0;
  let paidAccounts = 0;
  let partnerSignups = 0;
  let partnerActivated = 0;

  for (const account of cohortAccounts) {
    const signupAt = timestamp(account.createdAt);
    const auditTimes = (auditsByUser.get(account.id) || [])
      .filter((auditAt) => auditAt >= signupAt)
      .sort((a, b) => a - b);
    const firstAuditAt = auditTimes[0];
    const activated = firstAuditAt !== undefined && firstAuditAt <= signupAt + 7 * DAY_MS;

    if (activated) {
      activatedWithin7Days += 1;
    }

    if (account.isPartner) {
      partnerSignups += 1;
      if (activated) partnerActivated += 1;
    }

    if (account.isPaid) {
      paidAccounts += 1;
    }

    if (now >= signupAt + 28 * DAY_MS) {
      matureFor28DayRetention += 1;
      const secondAuditAt = auditTimes[1];
      if (secondAuditAt !== undefined && secondAuditAt <= signupAt + 28 * DAY_MS) {
        returnedWithin28Days += 1;
      }
    }
  }

  return {
    label,
    signups: cohortAccounts.length,
    activatedWithin7Days,
    activationRate: percentage(activatedWithin7Days, cohortAccounts.length),
    matureFor28DayRetention,
    returnedWithin28Days,
    retentionRate: percentage(returnedWithin28Days, matureFor28DayRetention),
    paidAccounts,
    paidRate: percentage(paidAccounts, cohortAccounts.length),
    partnerSignups,
    partnerActivationRate: percentage(partnerActivated, partnerSignups),
  };
}

export function buildGrowthCohorts(
  accounts: GrowthAccount[],
  audits: GrowthAudit[],
  now = new Date()
): GrowthCohort[] {
  const nowAt = timestamp(now);
  const auditsByUser = new Map<string, number[]>();

  for (const audit of audits) {
    const auditAt = timestamp(audit.createdAt);
    if (!auditAt) continue;
    const existing = auditsByUser.get(audit.userId) || [];
    existing.push(auditAt);
    auditsByUser.set(audit.userId, existing);
  }

  const current30Start = nowAt - 30 * DAY_MS;
  const previous30Start = nowAt - 60 * DAY_MS;
  const current7Start = nowAt - 7 * DAY_MS;

  return [
    buildCohort("Last 7 days", accounts, auditsByUser, current7Start, nowAt + 1, nowAt),
    buildCohort("Last 30 days", accounts, auditsByUser, current30Start, nowAt + 1, nowAt),
    buildCohort("Previous 30 days", accounts, auditsByUser, previous30Start, current30Start, nowAt),
  ];
}
