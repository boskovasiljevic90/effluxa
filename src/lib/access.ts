type AccessUser = {
  role?: string | null;
};

type AccessWorkspace = {
  hasBusinessAccess?: boolean | null;
};

type AccessReport = {
  unlocked?: boolean | null;
};

export function isProUser(user?: AccessUser | null) {
  return user?.role === "PRO";
}

export function hasAgencyWorkspaceAccess(workspace?: AccessWorkspace | null) {
  return Boolean(workspace?.hasBusinessAccess);
}

export function canUseUnlimitedUploads({
  user,
  workspace,
}: {
  user?: AccessUser | null;
  workspace?: AccessWorkspace | null;
}) {
  return isProUser(user) || hasAgencyWorkspaceAccess(workspace);
}

export function canAccessFullReport({
  report,
  user,
  workspace,
}: {
  report?: AccessReport | null;
  user?: AccessUser | null;
  workspace?: AccessWorkspace | null;
}) {
  return Boolean(
    report?.unlocked ||
      isProUser(user) ||
      hasAgencyWorkspaceAccess(workspace)
  );
}
