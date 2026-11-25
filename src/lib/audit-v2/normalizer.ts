import type {
  ExtractedFinancialData,
  FinancialTransaction,
  Payment,
  VendorMasterChange,
  PriceRecord,
  Receivable,
  SoftwareLicense,
  OvertimeEntry,
  InventoryItem,
  DebtFacility,
  ExpenseClaim,
  UnappliedItem,
  FinancialMetric,
  FinancialCostItem,
  OvertimeTrend,
  RelatedPartyTransaction,
  FxCommitment,
  AgingSummary,
  CustomerMetric,
  Policy,
} from "./types";
import { isRecord, normalizeDate, number, text } from "./utils";

type UnknownRecord = Record<string, unknown>;

function pick(record: UnknownRecord, ...keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function sourceFields(record: UnknownRecord, fileName: string) {
  return {
    source: text(pick(record, "source", "sourceFile"), fileName),
    page: numberOrNull(pick(record, "page", "pageNumber")),
    row: numberOrNull(pick(record, "row", "rowNumber")),
    sheet: nullableText(pick(record, "sheet", "sheetName")),
  };
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = number(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function nullableText(value: unknown) {
  const parsed = text(value);
  return parsed || null;
}

function records(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function normalizeTransactions(value: unknown, fileName: string): FinancialTransaction[] {
  return records(value).map((record, index) => ({
    id: text(pick(record, "id", "transactionId"), `ap-${index + 1}`),
    vendor: text(pick(record, "vendor", "supplier", "payee"), "Unknown vendor"),
    invoiceNumber: text(pick(record, "invoiceNumber", "invoice_number", "invoice", "reference")),
    date: normalizeDate(pick(record, "date", "invoiceDate", "invoice_date")),
    paymentDate: normalizeDate(pick(record, "paymentDate", "payment_date", "paidDate")),
    amount: Math.max(0, number(pick(record, "amount", "total", "netAmount"), 0)),
    currency: text(pick(record, "currency", "ccy"), "EUR").toUpperCase(),
    description: text(pick(record, "description", "item", "memo")),
    category: text(pick(record, "category", "costCenter", "expenseCategory")),
    status: text(pick(record, "status", "approvalStatus")),
    ...sourceFields(record, fileName),
  }));
}

function normalizePayments(value: unknown, fileName: string): Payment[] {
  return records(value).map((record, index) => ({
    id: text(pick(record, "id", "paymentId"), `payment-${index + 1}`),
    vendor: text(pick(record, "vendor", "supplier", "payee"), "Unknown vendor"),
    invoiceNumber: text(pick(record, "invoiceNumber", "invoice_number", "invoice", "reference")),
    paymentDate: normalizeDate(pick(record, "paymentDate", "payment_date", "date")),
    amount: Math.max(0, number(pick(record, "amount", "total"), 0)),
    currency: text(pick(record, "currency", "ccy"), "EUR").toUpperCase(),
    bankAccount: text(pick(record, "bankAccount", "bank_account", "account", "iban")),
    ...sourceFields(record, fileName),
  }));
}

function normalizeVendorChanges(value: unknown, fileName: string): VendorMasterChange[] {
  return records(value).map((record, index) => ({
    id: text(pick(record, "id", "changeId"), `vendor-change-${index + 1}`),
    vendor: text(pick(record, "vendor", "supplier"), "Unknown vendor"),
    changeDate: normalizeDate(pick(record, "changeDate", "change_date", "date")),
    changeType: text(pick(record, "changeType", "change_type", "type")),
    oldBankAccount: text(pick(record, "oldBankAccount", "old_bank_account", "previousAccount")),
    newBankAccount: text(pick(record, "newBankAccount", "new_bank_account", "bankAccount", "account")),
    changedBy: text(pick(record, "changedBy", "changed_by", "user")),
    ...sourceFields(record, fileName),
  }));
}

function normalizePriceRecords(value: unknown, fileName: string): PriceRecord[] {
  return records(value).map((record, index) => ({
    id: text(pick(record, "id", "priceId"), `price-${index + 1}`),
    vendor: text(pick(record, "vendor", "supplier"), "Unknown vendor"),
    item: text(pick(record, "item", "description", "product")),
    category: text(pick(record, "category", "costCenter")),
    date: normalizeDate(pick(record, "date", "invoiceDate")),
    amount: Math.max(0, number(pick(record, "amount", "unitPrice", "price", "total"), 0)),
    unitPrice: numberOrNull(pick(record, "unitPrice", "unit_price", "price")),
    quantity: numberOrNull(pick(record, "quantity", "qty", "volume")),
    currency: text(pick(record, "currency", "ccy"), "EUR").toUpperCase(),
    ...sourceFields(record, fileName),
  }));
}

function normalizeReceivables(value: unknown, fileName: string): Receivable[] {
  return records(value).map((record, index) => ({
    id: text(pick(record, "id", "receivableId"), `ar-${index + 1}`),
    customer: text(pick(record, "customer", "client", "debtor"), "Unknown customer"),
    invoiceNumber: text(pick(record, "invoiceNumber", "invoice_number", "invoice", "reference")),
    dueDate: normalizeDate(pick(record, "dueDate", "due_date")),
    amount: Math.max(0, number(pick(record, "amount", "balance", "outstanding"), 0)),
    currency: text(pick(record, "currency", "ccy"), "EUR").toUpperCase(),
    daysOverdue: numberOrNull(pick(record, "daysOverdue", "days_overdue", "overdueDays")),
    creditLimit: numberOrNull(pick(record, "creditLimit", "credit_limit")),
    currentAmount: numberOrNull(pick(record, "currentAmount", "current", "currentBalance")),
    overdue1To30: numberOrNull(pick(record, "overdue1To30", "days1To30", "oneToThirty")),
    overdue31To60: numberOrNull(pick(record, "overdue31To60", "days31To60", "thirtyOneToSixty")),
    overdue61To90: numberOrNull(pick(record, "overdue61To90", "days61To90", "sixtyOneToNinety")),
    overdueOver90: numberOrNull(pick(record, "overdueOver90", "over90", "over90Days")),
    specificAllowance: numberOrNull(pick(record, "specificAllowance", "allowance", "provision")),
    ...sourceFields(record, fileName),
  }));
}

function normalizeLicenses(value: unknown, fileName: string): SoftwareLicense[] {
  return records(value).map((record, index) => ({
    id: text(pick(record, "id", "licenseId"), `license-${index + 1}`),
    vendor: text(pick(record, "vendor", "supplier"), "Unknown vendor"),
    product: text(pick(record, "product", "name", "description")),
    annualCost: Math.max(0, number(pick(record, "annualCost", "annual_cost", "cost", "amount"), 0)),
    currency: text(pick(record, "currency", "ccy"), "EUR").toUpperCase(),
    seats: numberOrNull(pick(record, "seats", "licensedSeats")),
    unusedSeats: numberOrNull(pick(record, "unusedSeats", "unused_seats")),
    activeUsers: numberOrNull(pick(record, "activeUsers", "active_users", "active")),
    monthlyCost: numberOrNull(pick(record, "monthlyCost", "monthly_cost")),
    lastUsedDate: normalizeDate(pick(record, "lastUsedDate", "last_used_date", "lastUsed")),
    status: text(pick(record, "status", "licenseStatus")),
    ...sourceFields(record, fileName),
  }));
}

function normalizeOvertime(value: unknown, fileName: string): OvertimeEntry[] {
  return records(value).map((record, index) => ({
    id: text(pick(record, "id", "overtimeId"), `overtime-${index + 1}`),
    employeeOrTeam: text(pick(record, "employeeOrTeam", "employee", "team", "department"), "Unknown team"),
    period: nullableText(pick(record, "period", "month", "date")),
    overtimeHours: Math.max(0, number(pick(record, "overtimeHours", "overtime_hours", "hours"), 0)),
    overtimeCost: Math.max(0, number(pick(record, "overtimeCost", "overtime_cost", "cost", "amount"), 0)),
    currency: text(pick(record, "currency", "ccy"), "EUR").toUpperCase(),
    approved: typeof pick(record, "approved", "isApproved") === "boolean" ? Boolean(pick(record, "approved", "isApproved")) : null,
    approvalStatus: text(pick(record, "approvalStatus", "approval_status", "approval")),
    ...sourceFields(record, fileName),
  }));
}

function normalizeInventory(value: unknown, fileName: string): InventoryItem[] {
  return records(value).map((record, index) => ({
    id: text(pick(record, "id", "inventoryId"), `inventory-${index + 1}`),
    sku: text(pick(record, "sku", "itemCode", "code")),
    item: text(pick(record, "item", "description", "product"), "Unknown item"),
    quantity: number(pick(record, "quantity", "qty", "stock"), 0),
    unitCost: Math.max(0, number(pick(record, "unitCost", "unit_cost", "cost"), 0)),
    currency: text(pick(record, "currency", "ccy"), "EUR").toUpperCase(),
    daysOnHand: numberOrNull(pick(record, "daysOnHand", "days_on_hand", "ageDays")),
    bookValue: numberOrNull(pick(record, "bookValue", "book_value", "inventoryValue")),
    provision: numberOrNull(pick(record, "provision", "allowance", "reserve")),
    lastMovementDate: normalizeDate(pick(record, "lastMovementDate", "last_movement_date", "lastMovement")),
    ...sourceFields(record, fileName),
  }));
}

function normalizeDebt(value: unknown, fileName: string): DebtFacility[] {
  return records(value).map((record, index) => ({
    id: text(pick(record, "id", "facilityId"), `debt-${index + 1}`),
    lender: text(pick(record, "lender", "bank", "creditor"), "Unknown lender"),
    facility: text(pick(record, "facility", "name", "instrument"), "Debt facility"),
    principal: Math.max(0, number(pick(record, "principal", "balance", "amount"), 0)),
    currency: text(pick(record, "currency", "ccy"), "EUR").toUpperCase(),
    interestRate: numberOrNull(pick(record, "interestRate", "interest_rate", "rate")),
    covenant: text(pick(record, "covenant", "covenants")),
    covenantStatus: text(pick(record, "covenantStatus", "covenant_status", "status")),
    fees: Math.max(0, number(pick(record, "fees", "fee"), 0)),
    penalties: Math.max(0, number(pick(record, "penalties", "penalty"), 0)),
    ...sourceFields(record, fileName),
  }));
}

function normalizePolicies(value: unknown, fileName: string): Policy[] {
  return records(value).map((record, index) => ({
    id: text(pick(record, "id", "policyId"), `policy-${index + 1}`),
    name: text(pick(record, "name", "policy", "title"), "Unnamed policy"),
    approvalThreshold: numberOrNull(pick(record, "approvalThreshold", "approval_threshold", "threshold")),
    splitInvoiceWindowDays: numberOrNull(pick(record, "splitInvoiceWindowDays", "split_invoice_window_days", "windowDays")),
    overtimeThresholdHours: numberOrNull(pick(record, "overtimeThresholdHours", "overtime_threshold_hours", "overtimeThreshold")),
    slowMovingInventoryDays: numberOrNull(pick(record, "slowMovingInventoryDays", "slow_moving_inventory_days", "slowMovingDays")),
    creditLimit: numberOrNull(pick(record, "creditLimit", "credit_limit")),
    hotelNightlyCap: numberOrNull(pick(record, "hotelNightlyCap", "hotel_cap", "hotelCap")),
    corporateCardThreshold: numberOrNull(pick(record, "corporateCardThreshold", "cardThreshold", "corporate_card_threshold")),
    fxHedgeThreshold: numberOrNull(pick(record, "fxHedgeThreshold", "fx_hedge_threshold", "hedgeThreshold")),
    paymentRunDays: text(pick(record, "paymentRunDays", "payment_run_days", "paymentSchedule")),
    currency: text(pick(record, "currency", "ccy"), "EUR").toUpperCase(),
    ...sourceFields(record, fileName),
  }));
}

function normalizeExpenses(value: unknown, fileName: string): ExpenseClaim[] {
  return records(value).map((record, index) => ({
    id: text(pick(record, "id", "expenseId", "claimId"), `expense-${index + 1}`),
    date: normalizeDate(pick(record, "date", "expenseDate")),
    employeeId: text(pick(record, "employeeId", "employee", "claimant")),
    city: text(pick(record, "city", "location")),
    merchant: text(pick(record, "merchant", "vendor", "payee")),
    item: text(pick(record, "item", "description", "merchantItem")),
    category: text(pick(record, "category", "expenseCategory")),
    amount: Math.max(0, number(pick(record, "amount", "total"), 0)),
    currency: text(pick(record, "currency", "ccy"), "EUR").toUpperCase(),
    nights: numberOrNull(pick(record, "nights", "numberOfNights")),
    receipt: typeof pick(record, "receipt", "hasReceipt") === "boolean" ? Boolean(pick(record, "receipt", "hasReceipt")) : null,
    businessPurpose: text(pick(record, "businessPurpose", "business_purpose", "purpose")),
    approved: typeof pick(record, "approved", "isApproved") === "boolean" ? Boolean(pick(record, "approved", "isApproved")) : null,
    approvalStatus: text(pick(record, "approvalStatus", "approval_status", "approval")),
    folioReference: text(pick(record, "folioReference", "folio", "receiptNumber", "reference")),
    ...sourceFields(record, fileName),
  }));
}

function normalizeUnappliedItems(value: unknown, fileName: string): UnappliedItem[] {
  return records(value).map((record, index) => ({
    id: text(pick(record, "id", "itemId", "creditId"), `unapplied-${index + 1}`),
    date: normalizeDate(pick(record, "date", "approvedDate", "transactionDate")),
    customer: text(pick(record, "customer", "client", "debtor")),
    reference: text(pick(record, "reference", "invoice", "creditNote", "receipt")),
    type: text(pick(record, "type", "itemType")),
    amount: Math.max(0, number(pick(record, "amount", "value"), 0)),
    currency: text(pick(record, "currency", "ccy"), "EUR").toUpperCase(),
    status: text(pick(record, "status", "note", "statusNote")),
    applied: typeof pick(record, "applied", "isApplied") === "boolean" ? Boolean(pick(record, "applied", "isApplied")) : null,
    ...sourceFields(record, fileName),
  }));
}

function normalizeFinancialMetrics(value: unknown, fileName: string): FinancialMetric[] {
  return records(value).map((record, index) => ({
    id: text(pick(record, "id", "metricId"), `metric-${index + 1}`),
    metric: text(pick(record, "metric", "name", "kpi")),
    period: text(pick(record, "period", "date", "year")),
    actual: numberOrNull(pick(record, "actual", "value", "current")),
    budgetOrTarget: numberOrNull(pick(record, "budgetOrTarget", "budget", "target", "plan")),
    variance: numberOrNull(pick(record, "variance", "delta")),
    unit: text(pick(record, "unit", "measure")),
    ...sourceFields(record, fileName),
  }));
}

function normalizeFinancialCostItems(value: unknown, fileName: string): FinancialCostItem[] {
  return records(value).map((record, index) => ({
    id: text(pick(record, "id", "costId", "itemId"), `financial-cost-${index + 1}`),
    date: normalizeDate(pick(record, "date", "paymentDate")),
    item: text(pick(record, "item", "name", "description")),
    category: text(pick(record, "category", "type")),
    amount: Math.max(0, number(pick(record, "amount", "value", "cost"), 0)),
    currency: text(pick(record, "currency", "ccy"), "EUR").toUpperCase(),
    status: text(pick(record, "status", "note")),
    ...sourceFields(record, fileName),
  }));
}

function normalizeOvertimeTrends(value: unknown, fileName: string): OvertimeTrend[] {
  return records(value).map((record, index) => ({
    id: text(pick(record, "id", "trendId"), `overtime-trend-${index + 1}`),
    department: text(pick(record, "department", "team")),
    period: text(pick(record, "period", "month", "date")),
    hours: Math.max(0, number(pick(record, "hours", "overtimeHours"), 0)),
    cost: Math.max(0, number(pick(record, "cost", "overtimeCost", "amount"), 0)),
    trailingAverageHours: numberOrNull(pick(record, "trailingAverageHours", "trailing3mAverage", "averageHours")),
    currency: text(pick(record, "currency", "ccy"), "EUR").toUpperCase(),
    ...sourceFields(record, fileName),
  }));
}

function normalizeRelatedParties(value: unknown, fileName: string): RelatedPartyTransaction[] {
  return records(value).map((record, index) => ({
    id: text(pick(record, "id", "transactionId"), `related-party-${index + 1}`),
    counterparty: text(pick(record, "counterparty", "vendor", "customer", "party")),
    relationship: text(pick(record, "relationship", "relation")),
    transactionType: text(pick(record, "transactionType", "type", "description")),
    priorAmount: numberOrNull(pick(record, "priorAmount", "fy2025", "previousAmount", "prior")),
    currentAmount: numberOrNull(pick(record, "currentAmount", "ytdAmount", "current")),
    openBalance: numberOrNull(pick(record, "openBalance", "balance", "receivable")),
    currency: text(pick(record, "currency", "ccy"), "EUR").toUpperCase(),
    commercialTerms: text(pick(record, "commercialTerms", "terms", "note")),
    approvalStatus: text(pick(record, "approvalStatus", "approval", "approvedBy")),
    ...sourceFields(record, fileName),
  }));
}

function normalizeFxCommitments(value: unknown, fileName: string): FxCommitment[] {
  return records(value).map((record, index) => ({
    id: text(pick(record, "id", "commitmentId"), `fx-${index + 1}`),
    currency: text(pick(record, "currency", "ccy"), "USD").toUpperCase(),
    amount: numberOrNull(pick(record, "amount", "foreignAmount")),
    eurEquivalent: numberOrNull(pick(record, "eurEquivalent", "eur_equivalent", "baseAmount")),
    dueDate: normalizeDate(pick(record, "dueDate", "expectedDate")),
    hedged: typeof pick(record, "hedged", "isHedged") === "boolean" ? Boolean(pick(record, "hedged", "isHedged")) : null,
    hedgeStatus: text(pick(record, "hedgeStatus", "hedge", "status")),
    ...sourceFields(record, fileName),
  }));
}

function normalizeAgingSummary(value: unknown, fileName: string): AgingSummary[] {
  return records(value).map((record, index) => ({
    id: text(pick(record, "id", "agingId"), `aging-${index + 1}`),
    period: text(pick(record, "period", "date")),
    bucket: text(pick(record, "bucket", "agingBucket", "label")),
    amount: Math.max(0, number(pick(record, "amount", "value"), 0)),
    totalAmount: numberOrNull(pick(record, "totalAmount", "total", "totalAp")),
    percentage: numberOrNull(pick(record, "percentage", "percent", "share")),
    currency: text(pick(record, "currency", "ccy"), "EUR").toUpperCase(),
    ...sourceFields(record, fileName),
  }));
}

function normalizeCustomerMetrics(value: unknown, fileName: string): CustomerMetric[] {
  return records(value).map((record, index) => ({
    id: text(pick(record, "id", "customerId"), `customer-${index + 1}`),
    customer: text(pick(record, "customer", "client")),
    revenue: numberOrNull(pick(record, "revenue", "sales")),
    revenueShare: numberOrNull(pick(record, "revenueShare", "revenue_share", "share")),
    margin: numberOrNull(pick(record, "margin", "grossMargin")),
    overdueAmount: numberOrNull(pick(record, "overdueAmount", "overdue", "over90")),
    ...sourceFields(record, fileName),
  }));
}


// ---------------------------------------------------------------- vocabulary normalisation
// Source documents describe the same control with different words. Rules should
// not depend on the exact label a customer used, so map synonyms here.

const EXPENSE_CATEGORY_SYNONYMS: Array<[RegExp, string]> = [
  [/hotel|accommodat|lodging|overnight|guest\s*house|stay/i, "Hotel"],
  [/taxi|uber|bolt|ride|rail|train|flight|airfare|mileage|fuel|parking|transport|toll/i, "Transport"],
  [/restaurant|dinner|lunch|meal|food|catering|breakfast|coffee/i, "Meals"],
  [/software|saas|subscription|licen[cs]e|hosting|cloud/i, "Software"],
  [/laptop|hardware|device|equipment|phone/i, "Equipment"],
];

function canonicalExpenseCategory(value: string) {
  if (!value) return value;
  for (const [pattern, label] of EXPENSE_CATEGORY_SYNONYMS) {
    if (pattern.test(value)) return label;
  }
  return value;
}

function normalizeExpenseClaim(claim: ExpenseClaim): ExpenseClaim {
  return { ...claim, category: canonicalExpenseCategory(claim.category) };
}

const COVENANT_FLAG = /breach|default|fail|exception|non[\s-]?complian|covenant.{0,24}(exceed|over|above)/i;

function normalizeDebtFacility(facility: DebtFacility): DebtFacility {
  const existingStatus = facility.covenantStatus || "";
  const combined = `${existingStatus} ${facility.covenant || ""}`.trim();
  if (!combined) return facility;

  // Free text such as "3.60x versus 3.25x covenant" is already a breach even
  // without the word "breach" in the cell.
  const ratios = Array.from(combined.matchAll(/(\d+(?:\.\d+)?)\s*x/gi)).map((match) => Number(match[1]));
  const ratioBreach = ratios.length >= 2 && ratios[0] > ratios[1];

  if (COVENANT_FLAG.test(combined) || ratioBreach) {
    if (/breach|default|fail/i.test(existingStatus)) return facility;
    return { ...facility, covenantStatus: `Breach: ${combined}` };
  }

  return facility;
}

function inferPolicyCaps(policy: Policy): Policy {
  const name = (policy.name || "").toLowerCase();
  const next = { ...policy };

  if (!next.hotelNightlyCap && /hotel|accommodat/.test(name) && next.approvalThreshold) {
    next.hotelNightlyCap = next.approvalThreshold;
  }
  if (!next.fxHedgeThreshold && /(fx|currency|hedg)/.test(name) && next.approvalThreshold) {
    next.fxHedgeThreshold = next.approvalThreshold;
  }
  if (!next.overtimeThresholdHours && /overtime/.test(name) && next.approvalThreshold) {
    next.overtimeThresholdHours = next.approvalThreshold;
  }
  if (!next.slowMovingInventoryDays && /(inventory|slow.?moving|stock)/.test(name) && next.approvalThreshold) {
    next.slowMovingInventoryDays = next.approvalThreshold;
  }
  if (!next.creditLimit && /credit/.test(name) && next.approvalThreshold) {
    next.creditLimit = next.approvalThreshold;
  }

  return next;
}

export function normalizeExtractedData(input: unknown, fileName: string): ExtractedFinancialData {
  const record = isRecord(input) ? input : {};

  return {
    companyName: text(pick(record, "companyName", "company", "entity"), "Unknown company"),
    currency: text(pick(record, "currency", "defaultCurrency"), "EUR").toUpperCase(),
    reportingPeriods: Array.isArray(pick(record, "reportingPeriods", "periods"))
      ? (pick(record, "reportingPeriods", "periods") as unknown[])
          .map((period) => (isRecord(period) ? text(pick(period, "period", "name", "label")) : text(period)))
          .filter(Boolean)
      : [],
    sourceFile: fileName,
    apInvoices: normalizeTransactions(pick(record, "apInvoices", "invoices", "transactions"), fileName),
    payments: normalizePayments(pick(record, "payments", "bankPayments"), fileName),
    vendorMasterChanges: normalizeVendorChanges(pick(record, "vendorMasterChanges", "vendorChanges"), fileName),
    priceRecords: normalizePriceRecords(pick(record, "priceRecords", "prices", "vendorPrices"), fileName),
    arAging: normalizeReceivables(pick(record, "arAging", "receivables", "accountsReceivable"), fileName),
    softwareLicenses: normalizeLicenses(pick(record, "softwareLicenses", "licenses", "software"), fileName),
    overtime: normalizeOvertime(pick(record, "overtime", "overtimeEntries"), fileName),
    inventory: normalizeInventory(pick(record, "inventory", "inventoryItems", "stock"), fileName),
    debtFacilities: normalizeDebt(pick(record, "debtFacilities", "debt", "financing"), fileName).map(normalizeDebtFacility),
    expenses: normalizeExpenses(pick(record, "expenses", "expenseClaims", "travelExpenses", "tAndE"), fileName).map(normalizeExpenseClaim),
    unappliedItems: normalizeUnappliedItems(pick(record, "unappliedItems", "customerCredits", "unappliedCash", "credits"), fileName),
    financialMetrics: normalizeFinancialMetrics(pick(record, "financialMetrics", "metrics", "kpis", "financialKpis"), fileName),
    financialCostItems: normalizeFinancialCostItems(pick(record, "financialCostItems", "financingCosts", "costItems", "leakageCosts"), fileName),
    overtimeTrends: normalizeOvertimeTrends(pick(record, "overtimeTrends", "overtimeHistory", "overtimeByMonth"), fileName),
    relatedPartyTransactions: normalizeRelatedParties(pick(record, "relatedPartyTransactions", "relatedParties", "relatedPartyBalances"), fileName),
    fxCommitments: normalizeFxCommitments(pick(record, "fxCommitments", "foreignCurrencyCommitments", "hedging"), fileName),
    apAging: normalizeAgingSummary(pick(record, "apAging", "accountsPayableAging", "payablesAging"), fileName),
    customerMetrics: normalizeCustomerMetrics(pick(record, "customerMetrics", "customerConcentration", "customers"), fileName),
    policies: normalizePolicies(pick(record, "policies", "controls"), fileName).map(inferPolicyCaps),
    notes: Array.isArray(pick(record, "notes", "observations"))
      ? (pick(record, "notes", "observations") as unknown[]).map((item) => text(item)).filter(Boolean)
      : [],
  };
}
