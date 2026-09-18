export function buildPilotFollowUpDraft({
  name,
  signupUrl = "https://www.effluxa.com/signup?utm_source=partner_pilot&utm_medium=owned&utm_campaign=pilot_intake&utm_content=manual_follow_up",
}: {
  name?: string | null;
  signupUrl?: string;
}) {
  const greeting = name?.trim() ? name.trim() : "there";

  return `Hi ${greeting},

Thanks for requesting an Effluxa partner pilot. The next step is to create a free account and run one audit using a client-approved, redacted PDF, CSV or Excel export.

Start here: ${signupUrl}

Once the first audit is ready, review the evidence-backed findings and reply with the one client problem you want to validate first. Please do not send unredacted financial documents by email.

Best,
Effluxa`;
}
