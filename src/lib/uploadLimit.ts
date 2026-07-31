type UploadLimitUser = {
  role?: string | null;
  weeklyUploadCount?: number | null;
};

export function hasUnlimitedUploadAccess(user?: UploadLimitUser | null) {
  return user?.role === "PRO" || user?.role === "BUSINESS";
}

export function canUpload(user?: UploadLimitUser | null) {
  if (!user) {
    return {
      allowed: false,
      reason: "User not found",
    };
  }

  if (hasUnlimitedUploadAccess(user)) {
    return {
      allowed: true,
    };
  }

  const weeklyUploadCount = user.weeklyUploadCount ?? 0;

  if (weeklyUploadCount >= 3) {
    return {
      allowed: false,
      reason:
        "You have reached your free audit limit. Upgrade to Effluxa Pro or Agency for unlimited audits.",
    };
  }

  return {
    allowed: true,
  };
}

export function getRemainingFreeUploads(user?: UploadLimitUser | null) {
  if (!user) {
    return 0;
  }

  if (hasUnlimitedUploadAccess(user)) {
    return Infinity;
  }

  return Math.max(0, 3 - (user.weeklyUploadCount ?? 0));
}
