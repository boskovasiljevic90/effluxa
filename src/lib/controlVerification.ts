export type ControlVerificationRecord = {
  status: string;
  resolvedAmount: number | null;
  outcomeNote: string | null;
};

export function isVerifiedControlAction(action: ControlVerificationRecord) {
  return (
    action.status === "ACTIONED" &&
    action.resolvedAmount !== null &&
    Number.isFinite(Number(action.resolvedAmount)) &&
    Boolean(action.outcomeNote?.trim())
  );
}

export function verifiedRecoveredAmount(action: ControlVerificationRecord) {
  return isVerifiedControlAction(action) ? Number(action.resolvedAmount) : 0;
}
