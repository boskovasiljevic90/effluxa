const nullableString = { anyOf: [{ type: "string" }, { type: "null" }] };
const nullableNumber = { anyOf: [{ type: "number" }, { type: "null" }] };
const nullableBoolean = { anyOf: [{ type: "boolean" }, { type: "null" }] };

function objectSchema(properties: Record<string, unknown>) {
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
  };
}

const sourceFields = {
  source: { type: "string" },
  page: nullableNumber,
  row: nullableNumber,
  sheet: nullableString,
};

const transactionSchema = objectSchema({
  id: { type: "string" },
  vendor: { type: "string" },
  invoiceNumber: { type: "string" },
  date: nullableString,
  paymentDate: nullableString,
  amount: { type: "number" },
  currency: { type: "string" },
  description: { type: "string" },
  category: { type: "string" },
  status: { type: "string" },
  ...sourceFields,
});

// Keep the largest ledger payload focused on fields used by the rules and
// evidence layer. The normalizer supplies the stable id and source file name.
export const invoiceLedgerTransactionSchema = objectSchema({
  vendor: { type: "string" },
  invoiceNumber: { type: "string" },
  date: nullableString,
  paymentDate: nullableString,
  amount: { type: "number" },
  currency: { type: "string" },
  description: { type: "string" },
  category: { type: "string" },
  page: nullableNumber,
});

const paymentSchema = objectSchema({
  id: { type: "string" },
  vendor: { type: "string" },
  invoiceNumber: { type: "string" },
  paymentDate: nullableString,
  amount: { type: "number" },
  currency: { type: "string" },
  bankAccount: { type: "string" },
  ...sourceFields,
});

const vendorChangeSchema = objectSchema({
  id: { type: "string" },
  vendor: { type: "string" },
  changeDate: nullableString,
  changeType: { type: "string" },
  oldBankAccount: { type: "string" },
  newBankAccount: { type: "string" },
  changedBy: { type: "string" },
  ...sourceFields,
});

const priceRecordSchema = objectSchema({
  id: { type: "string" },
  vendor: { type: "string" },
  item: { type: "string" },
  category: { type: "string" },
  date: nullableString,
  amount: { type: "number" },
  unitPrice: nullableNumber,
  quantity: nullableNumber,
  currency: { type: "string" },
  ...sourceFields,
});

const receivableSchema = objectSchema({
  id: { type: "string" },
  customer: { type: "string" },
  invoiceNumber: { type: "string" },
  dueDate: nullableString,
  amount: { type: "number" },
  currency: { type: "string" },
  daysOverdue: nullableNumber,
  creditLimit: nullableNumber,
  currentAmount: nullableNumber,
  overdue1To30: nullableNumber,
  overdue31To60: nullableNumber,
  overdue61To90: nullableNumber,
  overdueOver90: nullableNumber,
  specificAllowance: nullableNumber,
  ...sourceFields,
});

const softwareLicenseSchema = objectSchema({
  id: { type: "string" },
  vendor: { type: "string" },
  product: { type: "string" },
  annualCost: { type: "number" },
  currency: { type: "string" },
  seats: nullableNumber,
  unusedSeats: nullableNumber,
  activeUsers: nullableNumber,
  monthlyCost: nullableNumber,
  lastUsedDate: nullableString,
  status: { type: "string" },
  ...sourceFields,
});

const overtimeSchema = objectSchema({
  id: { type: "string" },
  employeeOrTeam: { type: "string" },
  period: nullableString,
  overtimeHours: { type: "number" },
  overtimeCost: { type: "number" },
  currency: { type: "string" },
  approved: nullableBoolean,
  approvalStatus: { type: "string" },
  ...sourceFields,
});

const inventorySchema = objectSchema({
  id: { type: "string" },
  sku: { type: "string" },
  item: { type: "string" },
  quantity: { type: "number" },
  unitCost: { type: "number" },
  currency: { type: "string" },
  daysOnHand: nullableNumber,
  bookValue: nullableNumber,
  provision: nullableNumber,
  lastMovementDate: nullableString,
  ...sourceFields,
});

const debtFacilitySchema = objectSchema({
  id: { type: "string" },
  lender: { type: "string" },
  facility: { type: "string" },
  principal: { type: "number" },
  currency: { type: "string" },
  interestRate: nullableNumber,
  covenant: { type: "string" },
  covenantStatus: { type: "string" },
  fees: { type: "number" },
  penalties: { type: "number" },
  ...sourceFields,
});

const expenseSchema = objectSchema({
  id: { type: "string" },
  date: nullableString,
  employeeId: { type: "string" },
  city: { type: "string" },
  merchant: { type: "string" },
  item: { type: "string" },
  category: { type: "string" },
  amount: { type: "number" },
  currency: { type: "string" },
  nights: nullableNumber,
  receipt: nullableBoolean,
  businessPurpose: { type: "string" },
  approved: nullableBoolean,
  approvalStatus: { type: "string" },
  folioReference: { type: "string" },
  ...sourceFields,
});

const unappliedItemSchema = objectSchema({
  id: { type: "string" },
  date: nullableString,
  customer: { type: "string" },
  reference: { type: "string" },
  type: { type: "string" },
  amount: { type: "number" },
  currency: { type: "string" },
  status: { type: "string" },
  applied: nullableBoolean,
  ...sourceFields,
});

const financialMetricSchema = objectSchema({
  id: { type: "string" },
  metric: { type: "string" },
  period: { type: "string" },
  actual: nullableNumber,
  budgetOrTarget: nullableNumber,
  variance: nullableNumber,
  unit: { type: "string" },
  ...sourceFields,
});

const financialCostItemSchema = objectSchema({
  id: { type: "string" },
  date: nullableString,
  item: { type: "string" },
  category: { type: "string" },
  amount: { type: "number" },
  currency: { type: "string" },
  status: { type: "string" },
  ...sourceFields,
});

const overtimeTrendSchema = objectSchema({
  id: { type: "string" },
  department: { type: "string" },
  period: { type: "string" },
  hours: { type: "number" },
  cost: { type: "number" },
  trailingAverageHours: nullableNumber,
  currency: { type: "string" },
  ...sourceFields,
});

const relatedPartySchema = objectSchema({
  id: { type: "string" },
  counterparty: { type: "string" },
  relationship: { type: "string" },
  transactionType: { type: "string" },
  priorAmount: nullableNumber,
  currentAmount: nullableNumber,
  openBalance: nullableNumber,
  currency: { type: "string" },
  commercialTerms: { type: "string" },
  approvalStatus: { type: "string" },
  ...sourceFields,
});

const fxCommitmentSchema = objectSchema({
  id: { type: "string" },
  currency: { type: "string" },
  amount: nullableNumber,
  eurEquivalent: nullableNumber,
  dueDate: nullableString,
  hedged: nullableBoolean,
  hedgeStatus: { type: "string" },
  ...sourceFields,
});

const agingSummarySchema = objectSchema({
  id: { type: "string" },
  period: { type: "string" },
  bucket: { type: "string" },
  amount: { type: "number" },
  totalAmount: nullableNumber,
  percentage: nullableNumber,
  currency: { type: "string" },
  ...sourceFields,
});

const customerMetricSchema = objectSchema({
  id: { type: "string" },
  customer: { type: "string" },
  revenue: nullableNumber,
  revenueShare: nullableNumber,
  margin: nullableNumber,
  overdueAmount: nullableNumber,
  ...sourceFields,
});

const policySchema = objectSchema({
  id: { type: "string" },
  name: { type: "string" },
  approvalThreshold: nullableNumber,
  splitInvoiceWindowDays: nullableNumber,
  overtimeThresholdHours: nullableNumber,
  slowMovingInventoryDays: nullableNumber,
  creditLimit: nullableNumber,
  hotelNightlyCap: nullableNumber,
  corporateCardThreshold: nullableNumber,
  fxHedgeThreshold: nullableNumber,
  paymentRunDays: { type: "string" },
  currency: { type: "string" },
  ...sourceFields,
});

export const extractedFinancialDataSchema = objectSchema({
  companyName: { type: "string" },
  currency: { type: "string" },
  reportingPeriods: { type: "array", items: { type: "string" } },
  sourceFile: { type: "string" },
  apInvoices: { type: "array", items: transactionSchema },
  payments: { type: "array", items: paymentSchema },
  vendorMasterChanges: { type: "array", items: vendorChangeSchema },
  priceRecords: { type: "array", items: priceRecordSchema },
  arAging: { type: "array", items: receivableSchema },
  softwareLicenses: { type: "array", items: softwareLicenseSchema },
  overtime: { type: "array", items: overtimeSchema },
  inventory: { type: "array", items: inventorySchema },
  debtFacilities: { type: "array", items: debtFacilitySchema },
  expenses: { type: "array", items: expenseSchema },
  unappliedItems: { type: "array", items: unappliedItemSchema },
  financialMetrics: { type: "array", items: financialMetricSchema },
  financialCostItems: { type: "array", items: financialCostItemSchema },
  overtimeTrends: { type: "array", items: overtimeTrendSchema },
  relatedPartyTransactions: { type: "array", items: relatedPartySchema },
  fxCommitments: { type: "array", items: fxCommitmentSchema },
  apAging: { type: "array", items: agingSummarySchema },
  customerMetrics: { type: "array", items: customerMetricSchema },
  policies: { type: "array", items: policySchema },
  notes: { type: "array", items: { type: "string" } },
});
