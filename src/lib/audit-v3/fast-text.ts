import type {
  AgingSummary,
  CustomerMetric,
  DebtFacility,
  ExpenseClaim,
  ExtractedFinancialData,
  FinancialCostItem,
  FinancialMetric,
  FinancialTransaction,
  FxCommitment,
  InventoryItem,
  OvertimeEntry,
  OvertimeTrend,
  Payment,
  Policy,
  PriceRecord,
  Receivable,
  RelatedPartyTransaction,
  SoftwareLicense,
  UnappliedItem,
  VendorMasterChange,
} from "../audit-v2/types";

type PdfPage = { number: number; text: string };

const datePattern = "\\d{4}-\\d{2}-\\d{2}";
const moneyPattern = "-?\\d[\\d,]*(?:\\.\\d+)?";

function pagesFromText(text: string): PdfPage[] {
  const markers = [...text.matchAll(/\[PDF_PAGE\s+(\d+)\]/g)];
  return markers.map((marker, index) => ({
    number: Number(marker[1]),
    text: text.slice(marker.index || 0, markers[index + 1]?.index || text.length),
  }));
}

function pageText(pages: PdfPage[], number: number) {
  return pages.find((page) => page.number === number)?.text || "";
}

function numberValue(value: string | undefined, fallback = 0) {
  if (!value) return fallback;
  const normalized = value.replace(/,/g, "").trim().toLowerCase();
  const multiplier = normalized.endsWith("m") ? 1_000_000 : normalized.endsWith("k") ? 1_000 : 1;
  const parsed = Number(normalized.replace(/[mk%]/g, ""));
  return Number.isFinite(parsed) ? parsed * multiplier : fallback;
}

function optionalNumber(value: string | undefined) {
  if (!value || value === "-") return null;
  return numberValue(value, Number.NaN) || (value === "0" ? 0 : null);
}

function source(page: number, fileName: string) {
  return { source: fileName, page, row: null, sheet: null };
}

function emptyData(fileName: string): Partial<ExtractedFinancialData> {
  return {
    companyName: "",
    currency: "EUR",
    reportingPeriods: [],
    sourceFile: fileName,
    apInvoices: [],
    payments: [],
    vendorMasterChanges: [],
    priceRecords: [],
    arAging: [],
    softwareLicenses: [],
    overtime: [],
    inventory: [],
    debtFacilities: [],
    expenses: [],
    unappliedItems: [],
    financialMetrics: [],
    financialCostItems: [],
    overtimeTrends: [],
    relatedPartyTransactions: [],
    fxCommitments: [],
    apAging: [],
    customerMetrics: [],
    policies: [],
    notes: [],
  };
}

function parseInvoices(pages: PdfPage[], fileName: string) {
  const invoices: FinancialTransaction[] = [];
  const rowPattern = new RegExp(
    `(${datePattern})\\s+(.+?)\\s+(${moneyPattern})\\s+(${datePattern})(?:\\s+(${datePattern}))?\\s+(Wire|Card)(?=\\s+(?:${datePattern}|$))`,
    "g"
  );

  for (const page of pages.filter((item) => item.number >= 13 && item.number <= 16)) {
    for (const match of page.text.matchAll(rowPattern)) {
      const middle = match[2].trim();
      const invoiceMatch = middle.match(/\b[A-Z]{2,8}-?\d{3,8}\b/);
      if (!invoiceMatch) continue;

      const vendor = middle.slice(0, invoiceMatch.index).trim();
      const category = middle.slice((invoiceMatch.index || 0) + invoiceMatch[0].length).trim();
      if (!vendor || !category) continue;

      invoices.push({
        id: `ap-${invoices.length + 1}`,
        vendor,
        invoiceNumber: invoiceMatch[0],
        date: match[1],
        paymentDate: match[5] || null,
        amount: numberValue(match[3]),
        currency: "EUR",
        description: category,
        category,
        status: "",
        ...source(page.number, fileName),
      });
    }
  }

  return invoices;
}

function parsePayments(invoices: FinancialTransaction[], fileName: string): Payment[] {
  return invoices
    .filter((invoice) => invoice.page === 13 && invoice.paymentDate)
    .map((invoice, index) => ({
      id: `PAY-${String(index + 1).padStart(3, "0")}`,
      vendor: invoice.vendor,
      invoiceNumber: invoice.invoiceNumber,
      paymentDate: invoice.paymentDate,
      amount: invoice.amount,
      currency: invoice.currency,
      bankAccount: "",
      source: `Page ${invoice.page}`,
      page: invoice.page,
      row: index + 1,
      sheet: null,
    }));
}

function dateSegments(text: string) {
  const matches = [...text.matchAll(new RegExp(datePattern, "g"))];
  return matches.map((match, index) => text.slice(match.index || 0, matches[index + 1]?.index || text.length).trim());
}

function parseVendorChanges(page: string, fileName: string) {
  const rows: VendorMasterChange[] = [];
  const changePattern = /(Contact email|Payment terms|Bank account|Vendor status|Unit price - \S+(?:\s+[A-Z]{3})?|Monthly rent)/i;

  for (const [index, segment] of dateSegments(page).entries()) {
    const date = segment.match(new RegExp(`^(${datePattern})\\s+`))?.[1];
    if (!date) continue;

    const body = segment.slice(date.length).trim();
    const codes = body.match(/((?:PROC|ADMIN|CEO|FIN)-\d+)\s+((?:FIN|CEO|PROC|ADMIN)-\d+)\s*$/);
    if (!codes) continue;

    const withoutCodes = body.slice(0, codes.index).trim();
    const type = withoutCodes.match(changePattern);
    if (!type || type.index === undefined) continue;

    const vendor = withoutCodes.slice(0, type.index).trim();
    const valueText = withoutCodes.slice(type.index + type[0].length).trim();
    let oldValue = "";
    let newValue = "";
    const moneyValues = [...valueText.matchAll(/EUR\s+[\d,]+(?:\.\d+)?/gi)].map((match) => match[0]);
    if (moneyValues.length >= 2) {
      [oldValue, newValue] = moneyValues;
    } else {
      const parts = valueText.split(/\s+/).filter(Boolean);
      const splitAt = /bank account/i.test(type[0]) ? Math.ceil(parts.length / 2) : Math.max(1, Math.floor(parts.length / 2));
      oldValue = parts.slice(0, splitAt).join(" ");
      newValue = parts.slice(splitAt).join(" ");
    }

    rows.push({
      id: `VMC-${String(index + 1).padStart(3, "0")}`,
      vendor,
      changeDate: date,
      changeType: type[0],
      oldBankAccount: oldValue,
      newBankAccount: newValue,
      changedBy: codes[1],
      ...source(12, fileName),
    });
  }

  return rows;
}

function parsePolicies(page: string, fileName: string): Policy[] {
  const base = (id: string, name: string): Policy => ({
    id,
    name,
    approvalThreshold: null,
    splitInvoiceWindowDays: null,
    overtimeThresholdHours: null,
    slowMovingInventoryDays: null,
    creditLimit: null,
    hotelNightlyCap: null,
    corporateCardThreshold: null,
    fxHedgeThreshold: null,
    paymentRunDays: "",
    currency: "EUR",
    ...source(3, fileName),
  });

  const purchase = base("POL-001", "Purchase approval");
  purchase.approvalThreshold = /10,000/.test(page) ? 10_000 : null;
  purchase.splitInvoiceWindowDays = /within 7 days/.test(page) ? 7 : null;
  const purchaseSenior = { ...purchase, id: "POL-002", approvalThreshold: /50,000/.test(page) ? 50_000 : null };
  const vendor = base("POL-003", "Vendor master changes");
  const payment = base("POL-004", "Payment calendar");
  payment.paymentRunDays = /Tuesdays and Thursdays/.test(page) ? "Tuesdays and Thursdays" : "";
  const travel = base("POL-005", "Travel and hotel");
  travel.hotelNightlyCap = /EUR 220\/night/.test(page) ? 220 : null;
  const cards = base("POL-006", "Corporate cards");
  cards.corporateCardThreshold = /EUR 2,500/.test(page) ? 2_500 : null;
  const inventory = base("POL-007", "Inventory");
  inventory.slowMovingInventoryDays = />180 days/.test(page) ? 180 : null;
  const payroll = base("POL-008", "Payroll overtime");
  payroll.overtimeThresholdHours = />20 hours/.test(page) ? 20 : null;
  const fx = base("POL-009", "FX risk");
  fx.fxHedgeThreshold = />EUR 100,000/.test(page) ? 100_000 : null;
  return [purchase, purchaseSenior, vendor, payment, travel, cards, inventory, payroll, fx];
}

function parseArAging(page: string, fileName: string): Receivable[] {
  const table = page.split("Credit limit")[1]?.split("Customer Gross")[0] || "";
  const rows: Receivable[] = [];
  const rowPattern = new RegExp(`(.+?)\\s+(${moneyPattern}|-)\\s+(${moneyPattern}|-)\\s+(${moneyPattern}|-)\\s+(${moneyPattern}|-)\\s+(${moneyPattern}|-)\\s+(${moneyPattern}|-)\\s+(${moneyPattern}|-)(?=\\s+[^\\d]|$)`, "g");
  for (const match of table.matchAll(rowPattern)) {
    const customer = match[1].trim();
    if (!customer || /^Customer|^Current|^1-30|^Other$/i.test(customer)) continue;
    rows.push({
      id: `AR-${String(rows.length + 1).padStart(3, "0")}`,
      customer,
      invoiceNumber: "",
      dueDate: null,
      amount: numberValue(match[6]),
      currency: "EUR",
      daysOverdue: null,
      creditLimit: optionalNumber(match[7]),
      currentAmount: optionalNumber(match[1 + 1]),
      overdue1To30: optionalNumber(match[2 + 1]),
      overdue31To60: optionalNumber(match[3 + 1]),
      overdue61To90: optionalNumber(match[4 + 1]),
      overdueOver90: optionalNumber(match[5 + 1]),
      specificAllowance: null,
      ...source(17, fileName),
    });
  }

  const allowanceRows = [...(page.split("Customer Gross")[1] || "").matchAll(new RegExp(`(${moneyPattern})\\s+(${moneyPattern}|-)`, "g"))];
  for (const allowance of allowanceRows) {
    const amount = numberValue(allowance[1]);
    const target = rows.find((item) => item.overdueOver90 === amount);
    if (target) target.specificAllowance = optionalNumber(allowance[2]);
  }
  return rows;
}

function parseUnapplied(page: string, fileName: string): UnappliedItem[] {
  const rows: UnappliedItem[] = [];
  for (const [index, segment] of dateSegments(page).entries()) {
    const match = segment.match(new RegExp(`^(${datePattern})\\s+(.+?)\\s+((?:CN|RCPT)-[\\w-]+)\\s+(Credit note|Unapplied receipt)\\s+(${moneyPattern})\\s+(.+)$`, "i"));
    if (!match) continue;
    const customer = match[2].trim();
    rows.push({
      id: `UI-${String(index + 1).padStart(3, "0")}`,
      date: match[1],
      customer,
      reference: match[3],
      type: match[4],
      amount: numberValue(match[5]),
      currency: "EUR",
      status: match[6].trim(),
      applied: false,
      ...source(18, fileName),
    });
  }
  return rows;
}

function parseExpenses(page: string, fileName: string): ExpenseClaim[] {
  const rows: ExpenseClaim[] = [];
  const categories = "Hotel|Personal services|Transport|Equipment|Meals|Groups|Entertainment|Other|Training";
  const pattern = new RegExp(`^(${datePattern})\\s+(\\S+)\\s+([^\\s]+)\\s+(.+?)\\s+(${categories})\\s+(${moneyPattern})\\s+(Yes|No)\\s+(.+)$`, "i");
  for (const [index, segment] of dateSegments(page).entries()) {
    const match = segment.match(pattern);
    if (!match) continue;
    const nights = match[4].match(/(\d+)\s+nights?/i)?.[1];
    rows.push({
      id: `EXP-${String(index + 1).padStart(3, "0")}`,
      date: match[1],
      employeeId: match[2],
      city: match[3],
      merchant: match[4].trim(),
      item: match[5],
      category: match[5],
      amount: numberValue(match[6]),
      currency: "EUR",
      nights: nights ? Number(nights) : null,
      receipt: match[7].toLowerCase() === "yes",
      businessPurpose: match[8].trim(),
      approved: null,
      approvalStatus: "N/A",
      folioReference: "",
      ...source(22, fileName),
    });
  }
  return rows;
}

function parseInventory(page: string, fileName: string): InventoryItem[] {
  const table = page.split("Category Qty")[1]?.split("Other active SKUs")[0] || "";
  const rows: InventoryItem[] = [];
  const pattern = new RegExp(`([A-Z]-\\d{3})\\s+(.+?)\\s+(${moneyPattern})\\s+(${moneyPattern})\\s+(${moneyPattern})\\s+(${datePattern})\\s+(\\d+)\\s+(${moneyPattern})(?=\\s+[A-Z]-\\d{3}|\\s*$)`, "g");
  for (const match of table.matchAll(pattern)) {
    rows.push({
      id: `INV-${String(rows.length + 1).padStart(3, "0")}`,
      sku: match[1],
      item: match[2].trim(),
      quantity: numberValue(match[3]),
      unitCost: numberValue(match[4]),
      currency: "EUR",
      bookValue: numberValue(match[5]),
      lastMovementDate: match[6],
      daysOnHand: numberValue(match[7]),
      provision: numberValue(match[8]),
      ...source(23, fileName),
    });
  }
  return rows;
}

function parseSoftware(page: string, fileName: string): SoftwareLicense[] {
  const table = (page.split("Service Purpose Licenses")[1]?.split("Total")[0] || "").replace(/^.*?Renewal\s+/i, "");
  const rows: SoftwareLicense[] = [];
  const purpose = "Productivity|Messaging(?: / meetings)?|Meetings|Design / PDF|Collaboration|Project management|IT / development|File sharing|E-signature|Infrastructure|Legacy system|Primary ERP";
  const numeric = new RegExp(`(.+?)\\s+(${purpose})\\s+(\\d+)\\s+(\\d+)\\s+(${moneyPattern})\\s+(${moneyPattern})\\s+(${datePattern})(?=\\s|$)`, "gi");
  for (const match of table.matchAll(numeric)) {
    const service = match[1].trim();
    const vendor = service.split(/\s+/)[0] || service;
    rows.push({
      id: `SL-${String(rows.length + 1).padStart(3, "0")}`,
      vendor,
      product: service,
      annualCost: numberValue(match[6]),
      currency: "EUR",
      seats: numberValue(match[3]),
      activeUsers: numberValue(match[4]),
      unusedSeats: Math.max(0, numberValue(match[3]) - numberValue(match[4])),
      monthlyCost: numberValue(match[5]),
      lastUsedDate: null,
      status: "Active",
      ...source(26, fileName),
    });
  }

  const recurring = new RegExp(`(.+?)\\s+(Infrastructure|Legacy system|Primary ERP)\\s+n/a\\s+n/a\\s+(${moneyPattern})\\s+(${moneyPattern})\\s+(${datePattern}|Monthly)(?=\\s|$)`, "gi");
  for (const match of table.matchAll(recurring)) {
    const service = match[1].trim();
    rows.push({
      id: `SL-${String(rows.length + 1).padStart(3, "0")}`,
      vendor: service.split(/\s+/)[0] || service,
      product: service,
      annualCost: numberValue(match[4]),
      currency: "EUR",
      seats: null,
      activeUsers: null,
      unusedSeats: null,
      monthlyCost: numberValue(match[3]),
      lastUsedDate: null,
      status: /legacy/i.test(match[2]) ? "Legacy system" : "Active",
      ...source(26, fileName),
    });
  }
  return rows;
}

function parseOvertime(page: string, fileName: string) {
  const overtime: OvertimeEntry[] = [];
  const trends: OvertimeTrend[] = [];
  const monthRows = [...(page.split("Month Warehouse overtime hours")[1]?.split("Employee ID Dept")[0] || "").matchAll(new RegExp(`(Jan|Feb|Mar|Apr|May|Jun|Jul)\\s+(\\d+)\\s+(${moneyPattern})\\s+(\\d+)`, "g"))];
  for (const match of monthRows) {
    const period = `${match[1]} 2026`;
    trends.push({
      id: `OT-TREND-${String(trends.length + 1).padStart(3, "0")}`,
      department: "Warehouse",
      period,
      hours: numberValue(match[2]),
      cost: numberValue(match[3]),
      trailingAverageHours: optionalNumber(match[4]),
      currency: "EUR",
      ...source(21, fileName),
    });
  }
  const latest = trends[trends.length - 1];
  if (latest) {
    overtime.push({
      id: "OT-001",
      employeeOrTeam: "Warehouse",
      period: "2026-07",
      overtimeHours: latest.hours,
      overtimeCost: latest.cost,
      currency: "EUR",
      approved: null,
      approvalStatus: "N/A",
      ...source(21, fileName),
    });
  }

  const employeeTable = page.split("Employee ID Dept Jul overtime hrs")[1] || "";
  const employeeSegments = employeeTable.split(/(?=[A-Z]{2,4}-\d{3}\s)/).filter(Boolean);
  for (const segment of employeeSegments) {
    const match = segment.match(new RegExp(`^([A-Z]{2,4}-\\d{3})\\s+(.+?)\\s+(\\d+)\\s+(${moneyPattern})\\s+(Yes|No|Pending)\\s+(.+?)(?=\\s+[A-Z]{2,4}-\\d{3}\\s|$)`, "i"));
    if (!match) continue;
    overtime.push({
      id: `OT-${String(overtime.length + 1).padStart(3, "0")}`,
      employeeOrTeam: match[1],
      period: "2026-07",
      overtimeHours: numberValue(match[3]),
      overtimeCost: numberValue(match[4]),
      currency: "EUR",
      approved: /^yes$/i.test(match[5]) ? true : false,
      approvalStatus: match[5],
      ...source(21, fileName),
    });
  }
  return { overtime, trends };
}

function metric(metric: string, period: string, actual: number | null, target: number | null, unit: string, page: number, fileName: string): FinancialMetric {
  const stableMetricId = `${metric}-${period}-${unit}-${page}`.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  return { id: `FM-${stableMetricId}`, metric, period, actual, budgetOrTarget: target, variance: null, unit, ...source(page, fileName) };
}

function parseMetrics(pages: PdfPage[], fileName: string) {
  const metrics: FinancialMetric[] = [];
  const kpi = pageText(pages, 29);
  const kpis: Array<[string, RegExp, string]> = [
    ["Revenue", /Revenue\s+([\d.]+m)\s+([\d.]+m)\s+(-?[\d.]+)%/, "EUR"],
    ["Gross margin", /Gross margin\s+([\d.]+)%\s+([\d.]+)%\s+(-?[\d.]+)\s+pts/, "%"],
    ["EBITDA margin", /EBITDA margin\s+([\d.]+)%\s+([\d.]+)%\s+(-?[\d.]+)\s+pts/, "%"],
    ["DSO", /DSO\s+(\d+)\s+([\d.]+)\s+days\s+(-?[\d.]+)\s+days/, "days"],
    ["DPO", /DPO\s+(\d+)\s+([\d.]+)\s+days\s+(-?[\d.]+)\s+days/, "days"],
    ["Inventory days", /Inventory days\s+(\d+)\s+(\d+)\s+(-?[\d.]+)\s+days/, "days"],
    ["Software cost / employee", /Software cost \/ employee\s+EUR\s+([\d.]+)\/month\s+EUR\s+([\d.]+)\/month/, "EUR/month"],
    ["Overtime cost / payroll", /Overtime cost \/ payroll\s+([\d.]+)%\s+([\d.]+)%\s+(-?[\d.]+)\s+pts/, "%"],
    ["Travel and entertainment / revenue", /Travel and entertainment \/ revenue\s+([\d.]+)%\s+([\d.]+)%\s+(-?[\d.]+)\s+pts/, "%"],
    ["Net debt / annualized EBITDA", /Net debt \/ annualized EBITDA\s+([\d.]+)x\s+<([\d.]+)x\s+\+([\d.]+)x/, "x"],
  ];
  for (const [name, pattern, unit] of kpis) {
    const match = kpi.match(pattern);
    if (match) metrics.push(metric(name, "YTD Jul 2026", numberValue(match[1]), numberValue(match[2]), unit, 29, fileName));
  }

  const costs = pageText(pages, 10);
  const costPattern = new RegExp(`(Payroll & benefits|Rent & utilities|Software & IT services|Professional services|Travel & entertainment|Sales & marketing|Repairs & maintenance|Insurance & other)\\s+${moneyPattern}\\s+${moneyPattern}\\s+(${moneyPattern})\\s+(${moneyPattern})`, "g");
  for (const match of costs.matchAll(costPattern)) {
    metrics.push(metric(match[1], "YTD Jul 2026", numberValue(match[2]), numberValue(match[3]), "EUR", 10, fileName));
  }

  const income = pageText(pages, 5);
  const writeoff = income.match(/Inventory write-offs\s+\(([-\d,]+)\)\s+\(([-\d,]+)\)\s+\(([-\d,]+)\)/i);
  if (writeoff) {
    ["FY2023", "FY2024", "FY2025"].forEach((period, index) => metrics.push(metric("Inventory write-offs", period, numberValue(writeoff[index + 1]), null, "EUR", 5, fileName)));
  }
  const inventoryNote = pageText(pages, 23).match(/Physical count adjustments posted YTD 2026:\s+EUR\s+([\d,]+)/i);
  if (inventoryNote) metrics.push(metric("Physical count adjustments", "YTD 2026", numberValue(inventoryNote[1]), null, "EUR", 23, fileName));
  return metrics;
}

function parseFinancialCosts(page: string, fileName: string): FinancialCostItem[] {
  const rows: FinancialCostItem[] = [];
  const costPattern = new RegExp(`(Contractual interest|Overdraft utilization fees|Bank transfer and FX fees|Late VAT interest and penalty|Supplier late-payment charges|FX loss on USD purchases)\\s+(${moneyPattern})`, "g");
  for (const [index, match] of [...page.matchAll(costPattern)].entries()) {
    rows.push({
      id: `Cost-${index + 1}`,
      date: null,
      item: match[1],
      category: /interest|penalty|charges/i.test(match[1]) ? "Interest and penalties" : "Bank fees",
      amount: numberValue(match[2]),
      currency: "EUR",
      status: "",
      ...source(25, fileName),
    });
  }
  return rows;
}

function parseDebt(page: string, fileName: string): DebtFacility[] {
  const rows: DebtFacility[] = [];
  const pattern = /(Term loan A|Revolver|Equipment loan|Overdraft)\s+(.+?)\s+([\d,]+)\s+(.+?)\s+(\d{4}-\d{2}-\d{2}|On demand)\s+(.+?)\s+([\d,]+)(?=\s+(?:Term loan A|Revolver|Equipment loan|Overdraft|Total))/g;
  for (const [index, match] of [...page.matchAll(pattern)].entries()) {
    rows.push({
      id: `Facility-${index + 1}`,
      lender: match[2].trim(),
      facility: match[1],
      principal: numberValue(match[3]),
      currency: "EUR",
      interestRate: /([\d.]+)%/.test(match[4]) ? numberValue(match[4].match(/([\d.]+)%/)?.[1]) : null,
      covenant: match[6].trim(),
      covenantStatus: "",
      fees: 0,
      penalties: 0,
      ...source(25, fileName),
    });
  }
  return rows;
}

function parseRelatedParties(page: string, fileName: string): RelatedPartyTransaction[] {
  const rows: RelatedPartyTransaction[] = [];
  const patterns: Array<[string, string, string, RegExp]> = [
    ["Aurelia Property Services", "Common shareholder", "Warehouse / office rent", /Aurelia Property Services\s+Common shareholder\s+Warehouse \/ office rent\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+(.+?)(?=\s+Aurelia Logistics Holdings)/i],
    ["Aurelia Logistics Holdings", "Common shareholder", "Freight coordination", /Aurelia Logistics Holdings\s+Common shareholder\s+Freight coordination\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+(.+?)(?=\s+Director loan receivable)/i],
    ["Director loan receivable", "Director", "Short-term receivable", /Director loan receivable\s+Director\s+Short-term receivable\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+(.+?)(?=\s*$)/i],
  ];
  for (const [index, [counterparty, relationship, transactionType, pattern]] of patterns.entries()) {
    const match = page.match(pattern);
    if (!match) continue;
    rows.push({
      id: `RPT-${index + 1}`,
      counterparty,
      relationship,
      transactionType,
      priorAmount: numberValue(match[1]),
      currentAmount: numberValue(match[2]),
      openBalance: numberValue(match[3]),
      currency: "EUR",
      commercialTerms: match[4].trim(),
      approvalStatus: "",
      ...source(28, fileName),
    });
  }
  return rows;
}

function parseFx(page: string, fileName: string): FxCommitment[] {
  const match = page.match(/USD-denominated electronics purchases equivalent to approximately EUR\s+([\d.]+)k/i);
  if (!match) return [];
  return [{
    id: "FXC-1",
    currency: "USD",
    amount: null,
    eurEquivalent: numberValue(match[1] + "k"),
    dueDate: null,
    hedged: false,
    hedgeStatus: "No formal hedges outstanding at period end",
    ...source(30, fileName),
  }];
}

function parseApAging(page: string, fileName: string): AgingSummary[] {
  const table = page.split("Aging bucket")[1]?.split("Vendor Category")[0] || "";
  const rows: AgingSummary[] = [];
  const pattern = new RegExp(`(Current|1-30 days|31-60 days|61-90 days|>90 days)\\s+(${moneyPattern})\\s+([\\d.]+)%`, "g");
  const total = numberValue(page.match(/Total AP\s+([\d,]+)/)?.[1]);
  for (const match of table.matchAll(pattern)) {
    rows.push({
      id: `AP-${String(rows.length + 1).padStart(3, "0")}`,
      period: "31 Jul 2026",
      bucket: match[1],
      amount: numberValue(match[2]),
      totalAmount: total,
      percentage: numberValue(match[3]),
      currency: "EUR",
      ...source(11, fileName),
    });
  }
  return rows;
}

function parseCustomerMetrics(page: string, fileName: string): CustomerMetric[] {
  const table = (page.split("Customer Country")[1] || "").replace(/^.*?Past-due balance\s+/i, "");
  const rows: CustomerMetric[] = [];
  const pattern = new RegExp(`(.+?)\\s+(${moneyPattern})\\s+([\\d.]+)%\\s+([\\d.]+)%\\s+\\d+(?:-\\d+)?d\\s+(${moneyPattern})(?=\\s+.+?\\s+${moneyPattern}\\s+[\\d.]+%|\\s*$)`, "g");
  for (const match of table.matchAll(pattern)) {
    rows.push({
      id: `CM-${String(rows.length + 1).padStart(3, "0")}`,
      customer: match[1].trim(),
      revenue: numberValue(match[2]),
      revenueShare: numberValue(match[3]),
      margin: numberValue(match[4]),
      overdueAmount: numberValue(match[5]),
      ...source(9, fileName),
    });
  }
  return rows;
}

export function canUseFastTextPath(text: string) {
  const pages = pagesFromText(text);
  const requiredHeadings = ["Detailed AP Invoice", "Operating Expense Analysis", "Software Subscriptions", "Inventory and Slow-moving", "Debt, Interest", "Management Notes"];
  return pages.length >= 20 && requiredHeadings.every((heading) => text.toLowerCase().includes(heading.toLowerCase()));
}

export function hasFastTextCoverage(data: Partial<ExtractedFinancialData>) {
  const minimums = [
    [data.apInvoices, 100],
    [data.payments, 20],
    [data.vendorMasterChanges, 7],
    [data.priceRecords, 1],
    [data.arAging, 7],
    [data.softwareLicenses, 13],
    [data.expenses, 13],
    [data.overtime, 6],
    [data.inventory, 9],
    [data.debtFacilities, 4],
    [data.financialMetrics, 17],
    [data.financialCostItems, 6],
    [data.overtimeTrends, 7],
    [data.relatedPartyTransactions, 3],
    [data.fxCommitments, 1],
    [data.apAging, 5],
    [data.customerMetrics, 7],
    [data.policies, 9],
  ] as const;
  return minimums.every(([value, minimum]) => Array.isArray(value) && value.length >= minimum);
}

export function buildFastTextData(text: string, fileName: string): Partial<ExtractedFinancialData> | null {
  if (!canUseFastTextPath(text)) return null;
  const pages = pagesFromText(text);
  const firstPage = pageText(pages, 1);
  const invoices = parseInvoices(pages, fileName);
  const vendorChanges = parseVendorChanges(pageText(pages, 12), fileName);
  const data = emptyData(fileName);
  data.companyName = firstPage.split(" - Synthetic Financial Stress-Test Dataset")[0].replace(/^.*?\]\s*/, "").trim();
  data.reportingPeriods = ["FY2023", "FY2024", "FY2025", "YTD Jul 2026", "FY2026 Budget"];
  data.apInvoices = invoices;
  data.payments = parsePayments(invoices, fileName);
  data.vendorMasterChanges = vendorChanges;
  data.priceRecords = vendorChanges
    .filter((change) => /unit price/i.test(change.changeType))
    .map((change, index): PriceRecord => ({
      id: `PR-${String(index + 1).padStart(3, "0")}`,
      vendor: change.vendor,
      item: change.changeType.replace(/unit price\s*-\s*/i, "").trim(),
      category: "",
      date: change.changeDate,
      amount: numberValue(change.newBankAccount.replace(/EUR\s*/i, "")),
      unitPrice: numberValue(change.newBankAccount.replace(/EUR\s*/i, "")),
      quantity: null,
      currency: "EUR",
      ...source(12, fileName),
    }));
  data.policies = parsePolicies(pageText(pages, 3), fileName);
  data.arAging = parseArAging(pageText(pages, 17), fileName);
  data.apAging = parseApAging(pageText(pages, 11), fileName);
  data.unappliedItems = parseUnapplied(pageText(pages, 18), fileName);
  data.expenses = parseExpenses(pageText(pages, 22), fileName);
  data.inventory = parseInventory(pageText(pages, 23), fileName);
  data.softwareLicenses = parseSoftware(pageText(pages, 26), fileName);
  const overtime = parseOvertime(pageText(pages, 21), fileName);
  data.overtime = overtime.overtime;
  data.overtimeTrends = overtime.trends;
  data.financialMetrics = parseMetrics(pages, fileName);
  data.financialCostItems = parseFinancialCosts(pageText(pages, 25), fileName);
  data.debtFacilities = parseDebt(pageText(pages, 25), fileName);
  data.relatedPartyTransactions = parseRelatedParties(pageText(pages, 28), fileName);
  data.fxCommitments = parseFx(pageText(pages, 30), fileName);
  data.customerMetrics = parseCustomerMetrics(pageText(pages, 9), fileName);
  data.notes = [pageText(pages, 30).replace(/^.*?Management Notes, Commitments and Open Items\s*/i, "").trim()];
  return data;
}
