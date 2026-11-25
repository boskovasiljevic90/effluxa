export type Nullable<T> = T | null;

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type FindingCategory =
  | "DUPLICATE_PAYMENT"
  | "CONTROL_EXCEPTION"
  | "COST_LEAKAGE"
  | "WORKING_CAPITAL"
  | "FRAUD_INDICATOR"
  | "ACCOUNTING_ANOMALY"
  | "LIQUIDITY_RISK"
  | "COMPLIANCE";

export type QuantificationType =
  | "EXPOSURE"
  | "POTENTIAL_DUPLICATE"
  | "AVOIDABLE_COST"
  | "WORKING_CAPITAL"
  | "UNQUANTIFIED";

export type Evidence = {
  source: string;
  page: Nullable<number>;
  row: Nullable<number>;
  sheet: Nullable<string>;
  date: Nullable<string>;
  vendor: Nullable<string>;
  invoice: Nullable<string>;
  amount: Nullable<number>;
  detail: string;
};

export type FinancialTransaction = {
  id: string;
  vendor: string;
  invoiceNumber: string;
  date: Nullable<string>;
  paymentDate: Nullable<string>;
  amount: number;
  currency: string;
  description: string;
  category: string;
  status: string;
  source: string;
  page: Nullable<number>;
  row: Nullable<number>;
  sheet: Nullable<string>;
};

export type Payment = {
  id: string;
  vendor: string;
  invoiceNumber: string;
  paymentDate: Nullable<string>;
  amount: number;
  currency: string;
  bankAccount: string;
  source: string;
  page: Nullable<number>;
  row: Nullable<number>;
  sheet: Nullable<string>;
};

export type VendorMasterChange = {
  id: string;
  vendor: string;
  changeDate: Nullable<string>;
  changeType: string;
  oldBankAccount: string;
  newBankAccount: string;
  changedBy: string;
  source: string;
  page: Nullable<number>;
  row: Nullable<number>;
  sheet: Nullable<string>;
};

export type PriceRecord = {
  id: string;
  vendor: string;
  item: string;
  category: string;
  date: Nullable<string>;
  amount: number;
  unitPrice: Nullable<number>;
  quantity: Nullable<number>;
  currency: string;
  source: string;
  page: Nullable<number>;
  row: Nullable<number>;
  sheet: Nullable<string>;
};

export type Receivable = {
  id: string;
  customer: string;
  invoiceNumber: string;
  dueDate: Nullable<string>;
  amount: number;
  currency: string;
  daysOverdue: Nullable<number>;
  creditLimit: Nullable<number>;
  currentAmount: Nullable<number>;
  overdue1To30: Nullable<number>;
  overdue31To60: Nullable<number>;
  overdue61To90: Nullable<number>;
  overdueOver90: Nullable<number>;
  specificAllowance: Nullable<number>;
  source: string;
  page: Nullable<number>;
  row: Nullable<number>;
  sheet: Nullable<string>;
};

export type SoftwareLicense = {
  id: string;
  vendor: string;
  product: string;
  annualCost: number;
  currency: string;
  seats: Nullable<number>;
  unusedSeats: Nullable<number>;
  activeUsers: Nullable<number>;
  monthlyCost: Nullable<number>;
  lastUsedDate: Nullable<string>;
  status: string;
  source: string;
  page: Nullable<number>;
  row: Nullable<number>;
  sheet: Nullable<string>;
};

export type OvertimeEntry = {
  id: string;
  employeeOrTeam: string;
  period: Nullable<string>;
  overtimeHours: number;
  overtimeCost: number;
  currency: string;
  approved: Nullable<boolean>;
  approvalStatus: string;
  source: string;
  page: Nullable<number>;
  row: Nullable<number>;
  sheet: Nullable<string>;
};

export type InventoryItem = {
  id: string;
  sku: string;
  item: string;
  quantity: number;
  unitCost: number;
  currency: string;
  daysOnHand: Nullable<number>;
  bookValue: Nullable<number>;
  provision: Nullable<number>;
  lastMovementDate: Nullable<string>;
  source: string;
  page: Nullable<number>;
  row: Nullable<number>;
  sheet: Nullable<string>;
};

export type DebtFacility = {
  id: string;
  lender: string;
  facility: string;
  principal: number;
  currency: string;
  interestRate: Nullable<number>;
  covenant: string;
  covenantStatus: string;
  fees: number;
  penalties: number;
  source: string;
  page: Nullable<number>;
  row: Nullable<number>;
  sheet: Nullable<string>;
};

export type ExpenseClaim = {
  id: string;
  date: Nullable<string>;
  employeeId: string;
  city: string;
  merchant: string;
  item: string;
  category: string;
  amount: number;
  currency: string;
  nights: Nullable<number>;
  receipt: Nullable<boolean>;
  businessPurpose: string;
  approved: Nullable<boolean>;
  approvalStatus: string;
  folioReference: string;
  source: string;
  page: Nullable<number>;
  row: Nullable<number>;
  sheet: Nullable<string>;
};

export type UnappliedItem = {
  id: string;
  date: Nullable<string>;
  customer: string;
  reference: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  applied: Nullable<boolean>;
  source: string;
  page: Nullable<number>;
  row: Nullable<number>;
  sheet: Nullable<string>;
};

export type FinancialMetric = {
  id: string;
  metric: string;
  period: string;
  actual: Nullable<number>;
  budgetOrTarget: Nullable<number>;
  variance: Nullable<number>;
  unit: string;
  source: string;
  page: Nullable<number>;
  row: Nullable<number>;
  sheet: Nullable<string>;
};

export type FinancialCostItem = {
  id: string;
  date: Nullable<string>;
  item: string;
  category: string;
  amount: number;
  currency: string;
  status: string;
  source: string;
  page: Nullable<number>;
  row: Nullable<number>;
  sheet: Nullable<string>;
};

export type OvertimeTrend = {
  id: string;
  department: string;
  period: string;
  hours: number;
  cost: number;
  trailingAverageHours: Nullable<number>;
  currency: string;
  source: string;
  page: Nullable<number>;
  row: Nullable<number>;
  sheet: Nullable<string>;
};

export type RelatedPartyTransaction = {
  id: string;
  counterparty: string;
  relationship: string;
  transactionType: string;
  priorAmount: Nullable<number>;
  currentAmount: Nullable<number>;
  openBalance: Nullable<number>;
  currency: string;
  commercialTerms: string;
  approvalStatus: string;
  source: string;
  page: Nullable<number>;
  row: Nullable<number>;
  sheet: Nullable<string>;
};

export type FxCommitment = {
  id: string;
  currency: string;
  amount: Nullable<number>;
  eurEquivalent: Nullable<number>;
  dueDate: Nullable<string>;
  hedged: Nullable<boolean>;
  hedgeStatus: string;
  source: string;
  page: Nullable<number>;
  row: Nullable<number>;
  sheet: Nullable<string>;
};

export type AgingSummary = {
  id: string;
  period: string;
  bucket: string;
  amount: number;
  totalAmount: Nullable<number>;
  percentage: Nullable<number>;
  currency: string;
  source: string;
  page: Nullable<number>;
  row: Nullable<number>;
  sheet: Nullable<string>;
};

export type CustomerMetric = {
  id: string;
  customer: string;
  revenue: Nullable<number>;
  revenueShare: Nullable<number>;
  margin: Nullable<number>;
  overdueAmount: Nullable<number>;
  source: string;
  page: Nullable<number>;
  row: Nullable<number>;
  sheet: Nullable<string>;
};

export type Policy = {
  id: string;
  name: string;
  approvalThreshold: Nullable<number>;
  splitInvoiceWindowDays: Nullable<number>;
  overtimeThresholdHours: Nullable<number>;
  slowMovingInventoryDays: Nullable<number>;
  creditLimit: Nullable<number>;
  hotelNightlyCap: Nullable<number>;
  corporateCardThreshold: Nullable<number>;
  fxHedgeThreshold: Nullable<number>;
  paymentRunDays: string;
  currency: string;
  source: string;
  page: Nullable<number>;
  row: Nullable<number>;
  sheet: Nullable<string>;
};

export type ExtractedFinancialData = {
  companyName: string;
  currency: string;
  reportingPeriods: string[];
  sourceFile: string;
  apInvoices: FinancialTransaction[];
  payments: Payment[];
  vendorMasterChanges: VendorMasterChange[];
  priceRecords: PriceRecord[];
  arAging: Receivable[];
  softwareLicenses: SoftwareLicense[];
  overtime: OvertimeEntry[];
  inventory: InventoryItem[];
  debtFacilities: DebtFacility[];
  expenses: ExpenseClaim[];
  unappliedItems: UnappliedItem[];
  financialMetrics: FinancialMetric[];
  financialCostItems: FinancialCostItem[];
  overtimeTrends: OvertimeTrend[];
  relatedPartyTransactions: RelatedPartyTransaction[];
  fxCommitments: FxCommitment[];
  apAging: AgingSummary[];
  customerMetrics: CustomerMetric[];
  policies: Policy[];
  notes: string[];
};

export type AuditFinding = {
  id: string;
  ruleId: string;
  category: FindingCategory;
  title: string;
  severity: Severity;
  confidence: number;
  description: string;
  evidence: Evidence[];
  quantification: {
    type: QuantificationType;
    amount: Nullable<number>;
    currency: string;
  };
  recommendedAction: string;
};

export type AuditMetrics = {
  findingCount: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  potentialDuplicateExposure: number;
  nearDuplicateExposure: number;
  splitInvoiceExposure: number;
  workingCapitalExposure: number;
  controlRiskExposure: number;
  avoidableCostRunRate: number;
  unquantifiedFindings: number;
  quantifiedOpportunity: number;
};

export type AuditV2Result = {
  deterministicScan?: {
    scanFound: number;
    mergedIn: number;
    engineFound: number;
    finalCount: number;
  };
  analysisVersion: "2.0" | "3.0";
  analysisPath?: "fast_text" | "routed_ai" | "legacy_ai";
  extractedData: ExtractedFinancialData;
  findings: AuditFinding[];
  metrics: AuditMetrics;
  executiveSummary: string;
  cfoSummary: string;
  reasoningThemes: string[];
  recommendedActions: string[];
};
