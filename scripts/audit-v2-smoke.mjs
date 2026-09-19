import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const outputDir = mkdtempSync(join(tmpdir(), "effluxa-audit-v2-"));
const sourceFiles = [
  "src/lib/audit-v2/types.ts",
  "src/lib/audit-v2/utils.ts",
  "src/lib/audit-v2/rules/common.ts",
  "src/lib/audit-v2/rules/index.ts",
];

function source(sourceName, row) {
  return { source: "seeded-smoke-fixture", page: null, row, sheet: sourceName };
}

function invoice(id, vendor, invoiceNumber, date, amount, row, description = "service", category = "Services") {
  return {
    id, vendor, invoiceNumber, date, paymentDate: null, amount, currency: "EUR",
    description, category, status: "", ...source("AP", row),
  };
}

const data = {
  companyName: "Seeded Smoke Company",
  currency: "EUR",
  reportingPeriods: ["2026"],
  sourceFile: "seeded-smoke-fixture",
  apInvoices: [
    invoice("n1", "Nova Freight GmbH", "NF-10477", "2026-03-12", 18740, 1, "freight", "Logistics"),
    invoice("n2", "Nova Freight GmbH", "NF-10477", "2026-03-14", 18740, 2, "freight", "Logistics"),
    invoice("a1", "Atlas Packaging", "RF-8821", "2026-03-10", 7960, 3, "packaging", "Packaging"),
    invoice("a2", "Atlas Packaging", "RF-8822", "2026-03-11", 7960, 4, "packaging", "Packaging"),
    invoice("d1", "Danube Consulting", "DC-1", "2026-03-01", 9900, 5, "consulting"),
    invoice("d2", "Danube Consulting", "DC-2", "2026-03-02", 9900, 6, "consulting"),
    invoice("d3", "Danube Consulting", "DC-3", "2026-03-03", 9900, 7, "consulting"),
  ],
  payments: [
    { id: "p1", vendor: "BluePeak", invoiceNumber: "BP-1", paymentDate: "2026-03-12", amount: 26500, currency: "EUR", bankAccount: "new", ...source("Payments", 10) },
    { id: "p2", vendor: "Weekend Co", invoiceNumber: "W-1", paymentDate: "2026-03-14", amount: 100, currency: "EUR", bankAccount: "", ...source("Payments", 11) },
  ],
  vendorMasterChanges: [
    { id: "vc1", vendor: "BluePeak", changeDate: "2026-03-08", changeType: "bank account change", oldBankAccount: "old", newBankAccount: "new", changedBy: "admin", ...source("Vendor Master", 9) },
  ],
  priceRecords: [
    { id: "pr1", vendor: "PriceCo", item: "Steel", category: "Raw", date: "2026-01-01", amount: 100, currency: "EUR", ...source("Prices", 1) },
    { id: "pr2", vendor: "PriceCo", item: "Steel", category: "Raw", date: "2026-02-01", amount: 130, currency: "EUR", ...source("Prices", 2) },
  ],
  arAging: [
    { id: "ar1", customer: "Customer A", invoiceNumber: "AR-1", dueDate: "2025-10-01", amount: 120000, currency: "EUR", daysOverdue: 120, creditLimit: 50000, ...source("AR", 1) },
  ],
  softwareLicenses: [
    { id: "sw1", vendor: "ToolCo", product: "ERP", annualCost: 12000, currency: "EUR", seats: 10, unusedSeats: 5, lastUsedDate: "2025-01-01", status: "active", ...source("Licenses", 1) },
  ],
  overtime: [
    { id: "ot1", employeeOrTeam: "WH-999 Warehouse", period: "2026-02", overtimeHours: 30, overtimeCost: 3000, currency: "EUR", approved: false, ...source("Payroll", 1) },
  ],
  inventory: [
    { id: "iv1", sku: "SKU1", item: "Old stock", quantity: 10, unitCost: 100, currency: "EUR", daysOnHand: 120, lastMovementDate: "2025-10-01", ...source("Inventory", 1) },
    { id: "iv2", sku: "SKU2", item: "Negative stock", quantity: -1, unitCost: 100, currency: "EUR", daysOnHand: null, lastMovementDate: null, ...source("Inventory", 2) },
  ],
  debtFacilities: [
    { id: "db1", lender: "Bank", facility: "Term Loan", principal: 500000, currency: "EUR", interestRate: 5, covenant: "DSCR", covenantStatus: "breach", fees: 0, penalties: 0, ...source("Debt", 1) },
  ],
  expenses: [],
  unappliedItems: [],
  financialMetrics: [],
  financialCostItems: [],
  overtimeTrends: [],
  relatedPartyTransactions: [],
  fxCommitments: [],
  apAging: [],
  customerMetrics: [],
  policies: [
    { id: "pol1", name: "AP policy", approvalThreshold: 10000, splitInvoiceWindowDays: 7, overtimeThresholdHours: 20, slowMovingInventoryDays: 90, creditLimit: null, currency: "EUR", ...source("Policies", 1) },
  ],
  notes: [],
};

const expectedRules = [
  "AP_EXACT_DUPLICATE",
  "AP_NEAR_DUPLICATE",
  "AP_SPLIT_INVOICE",
  "VENDOR_BANK_CHANGE_BEFORE_PAYMENT",
  "VENDOR_PRICE_INCREASE",
  "AR_AGING_OR_CREDIT_LIMIT",
  "SOFTWARE_LICENSE_WASTE",
  "OVERTIME_EXCEPTION",
  "INVENTORY_SLOW_MOVING",
  "INVENTORY_NEGATIVE_BALANCE",
  "DEBT_COVENANT_BREACH",
  "WEEKEND_PAYMENT_REVIEW",
];

try {
  execFileSync("npx", [
    "tsc",
    ...sourceFiles,
    "--module", "commonjs",
    "--target", "es2022",
    "--esModuleInterop",
    "--skipLibCheck",
    "--outDir", outputDir,
    "--incremental", "false",
  ], { cwd: root, stdio: "inherit" });

  const require = createRequire(import.meta.url);
  const { runDeterministicRules } = require(join(outputDir, "rules", "index.js"));
  const findings = runDeterministicRules(data);
  const rules = [...new Set(findings.map((finding) => finding.ruleId))];
  const missing = expectedRules.filter((rule) => !rules.includes(rule));

  if (missing.length > 0) {
    throw new Error("Missing rule coverage: " + missing.join(", "));
  }

  console.log(JSON.stringify({
    status: "passed",
    findingCount: findings.length,
    ruleCount: rules.length,
    criticalFindings: findings.filter((finding) => finding.severity === "CRITICAL").length,
    rules,
  }, null, 2));
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
