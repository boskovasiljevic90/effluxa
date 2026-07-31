export function displayPlanLabel(role?: string | null) {
  if (role === "BUSINESS") {
    return "AGENCY";
  }

  if (role === "PRO") {
    return "PRO";
  }

  return "FREE";
}

export function displayPlanName(role?: string | null) {
  if (role === "BUSINESS") {
    return "Agency";
  }

  if (role === "PRO") {
    return "Pro";
  }

  return "Free";
}
