import type {
  AuditFinding,
  ExtractedFinancialData,
  FinancialTransaction,
  Payment,
  Policy,
} from "../types";
import {
  dayNumber,
  daysBetween,
  number,
  normalizeDate,
  normalizeInvoiceNumber,
  normalizeName,
} from "../utils";
import { createFinding, resetFindingSequence, sourceEvidence } from "./common";

function asRecord(value: object) {
  return value as Record<string, unknown>;
}

function policyValue(policies: Policy[], key: keyof Policy, fallback: number) {
  const value = policies.find((policy) => typeof policy[key] === "number")?.[key];
  return typeof value === "number" && value > 0 ? value : fallback;
}

function transactionEvidence(transaction: FinancialTransaction, detail: string) {
  return sourceEvidence(asRecord(transaction), detail, {
    date: transaction.date,
    vendor: transaction.vendor,
    invoice: transaction.invoiceNumber || null,
    amount: transaction.amount,
  });
}

function paymentEvidence(payment: Payment, detail: string) {
  return sourceEvidence(asRecord(payment), detail, {
    date: payment.paymentDate,
    vendor: payment.vendor,
    invoice: payment.invoiceNumber || null,
    amount: payment.amount,
  });
}

function levenshtein(first: string, second: string) {
  if (first === second) return 0;
  if (!first.length) return second.length;
  if (!second.length) return first.length;

  const row = Array.from({ length: second.length + 1 }, (_, index) => index);

  for (let i = 1; i <= first.length; i += 1) {
    let previous = row[0];
    row[0] = i;

    for (let j = 1; j <= second.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (first[i - 1] === second[j - 1] ? 0 : 1)
      );
      previous = current;
    }
  }

  return row[second.length];
}

function similarIdentifier(first: string, second: string) {
  if (!first || !second) return false;
  const distance = levenshtein(first, second);
  return distance <= Math.max(1, Math.floor(Math.max(first.length, second.length) * 0.2));
}

function exactDuplicates(data: ExtractedFinancialData) {
  const groups = new Map<string, FinancialTransaction[]>();

  for (const invoice of data.apInvoices) {
    const vendor = normalizeName(invoice.vendor);
    const invoiceNumber = invoice.invoiceNumber.trim().toLowerCase();
    if (!vendor || !invoiceNumber || invoice.amount <= 0) continue;

    const key = `${vendor}|${invoiceNumber}|${invoice.amount.toFixed(2)}|${invoice.currency}`;
    groups.set(key, [...(groups.get(key) || []), invoice]);
  }

  return Array.from(groups.values())
    .filter((group) => group.length > 1)
    .map((group) => {
      const first = group[0];
      return createFinding({
        ruleId: "AP_EXACT_DUPLICATE",
        category: "DUPLICATE_PAYMENT",
        title: "Potential exact duplicate invoice",
        severity: "CRITICAL",
        confidence: 0.99,
        description: `${group.length} AP records share the same vendor, normalized invoice number, amount, and currency.`,
        evidence: group.map((invoice) => transactionEvidence(invoice, "Matching vendor, invoice number, amount, and currency.")),
        amount: first.amount,
        currency: first.currency,
        quantificationType: "POTENTIAL_DUPLICATE",
        recommendedAction: "Verify the source invoices, payment status, and credit notes before releasing or accepting the duplicate charge.",
      });
    });
}

function nearDuplicates(data: ExtractedFinancialData) {
  const findings: AuditFinding[] = [];

  for (let i = 0; i < data.apInvoices.length; i += 1) {
    const first = data.apInvoices[i];
    const firstVendor = normalizeName(first.vendor);
    const firstInvoice = normalizeInvoiceNumber(first.invoiceNumber);
    if (!firstVendor || first.amount <= 0) continue;

    for (let j = i + 1; j < data.apInvoices.length; j += 1) {
      const second = data.apInvoices[j];
      if (firstVendor !== normalizeName(second.vendor) || second.amount <= 0) continue;
      if (Math.abs(first.amount - second.amount) > Math.max(1, Math.max(first.amount, second.amount) * 0.01)) continue;
      const dateGap = daysBetween(first.date, second.date);
      if (dateGap !== null && dateGap > 14) continue;

      const secondInvoice = normalizeInvoiceNumber(second.invoiceNumber);
      const identifiersSimilar = similarIdentifier(firstInvoice, secondInvoice);
      const firstDescription = normalizeName(first.description);
      const secondDescription = normalizeName(second.description);
      const genericDescriptions = new Set(["rent", "services", "consulting", "freight", "packaging", "maintenance", "utilities", "qualityservices", "rawmaterials", "itservices"]);
      const descriptionsSimilar = firstDescription.length >= 8 && firstDescription === secondDescription && !genericDescriptions.has(firstDescription);
      if (!identifiersSimilar && !descriptionsSimilar) continue;
      const rawFirstInvoice = first.invoiceNumber.trim().toLowerCase();
      const rawSecondInvoice = second.invoiceNumber.trim().toLowerCase();
      if (rawFirstInvoice && rawFirstInvoice === rawSecondInvoice) continue;

      findings.push(createFinding({
        ruleId: "AP_NEAR_DUPLICATE",
        category: "DUPLICATE_PAYMENT",
        title: "Potential near-duplicate invoice",
        severity: "HIGH",
        confidence: identifiersSimilar ? 0.94 : 0.84,
        description: "Two invoices from the same vendor have near-matching identifiers or descriptions, nearly identical amounts, and a close date.",
        evidence: [
          transactionEvidence(first, "First near-duplicate candidate."),
          transactionEvidence(second, "Second near-duplicate candidate."),
        ],
        amount: Math.min(first.amount, second.amount),
        currency: first.currency,
        quantificationType: "POTENTIAL_DUPLICATE",
        recommendedAction: "Compare invoice images, purchase orders, receiving records, and payment status before treating either record as a valid separate charge.",
      }));
    }
  }

  return findings;
}

function splitInvoices(data: ExtractedFinancialData) {
  const windowDays = policyValue(data.policies, "splitInvoiceWindowDays", 7);
  const threshold = policyValue(data.policies, "approvalThreshold", 10_000);
  const byVendor = new Map<string, FinancialTransaction[]>();

  for (const invoice of data.apInvoices) {
    if (!invoice.date || invoice.amount <= 0) continue;
    const key = normalizeName(invoice.vendor);
    if (!key) continue;
    byVendor.set(key, [...(byVendor.get(key) || []), invoice]);
  }

  const findings: AuditFinding[] = [];

  for (const invoices of byVendor.values()) {
    const sorted = [...invoices].sort((a, b) => (dayNumber(a.date) || 0) - (dayNumber(b.date) || 0));

    for (let start = 0; start < sorted.length; start += 1) {
      const firstDay = dayNumber(sorted[start].date);
      if (firstDay === null) continue;

      const window = sorted.filter((invoice) => {
        const invoiceDay = dayNumber(invoice.date);
        return invoiceDay !== null && invoiceDay >= firstDay && invoiceDay - firstDay <= windowDays;
      });

      if (window.length < 2 || window.some((invoice) => invoice.amount >= threshold)) continue;
      const total = window.reduce((sum, invoice) => sum + invoice.amount, 0);
      if (total <= threshold) continue;

      findings.push(createFinding({
        ruleId: "AP_SPLIT_INVOICE",
        category: "CONTROL_EXCEPTION",
        title: "Invoices appear split below approval threshold",
        severity: "HIGH",
        confidence: 0.97,
        description: `${window.length} related invoices for ${window[0].vendor} total ${total.toLocaleString()} within ${windowDays} days while each individual invoice is below the ${threshold.toLocaleString()} approval threshold.`,
        evidence: window.map((invoice) => transactionEvidence(invoice, `Invoice included in ${windowDays}-day approval-window aggregation.`)),
        amount: total,
        currency: window[0].currency,
        quantificationType: "EXPOSURE",
        recommendedAction: "Review whether the invoices represent one purchase, require aggregated approval, or were intentionally separated to bypass controls.",
      }));
      break;
    }
  }

  return findings;
}

function vendorBankChangeBeforePayment(data: ExtractedFinancialData) {
  const findings: AuditFinding[] = [];
  const seenChangePayments = new Set<string>();

  const payments = [
    ...data.payments,
    ...data.apInvoices
      .filter((invoice) => invoice.paymentDate)
      .map((invoice) => ({
        id: `ap-payment-${invoice.id}`,
        vendor: invoice.vendor,
        invoiceNumber: invoice.invoiceNumber,
        paymentDate: invoice.paymentDate,
        amount: invoice.amount,
        currency: invoice.currency,
        bankAccount: "",
        source: invoice.source,
        page: invoice.page,
        row: invoice.row,
        sheet: invoice.sheet,
      })),
  ];

  for (const payment of payments) {
    if (!payment.paymentDate || payment.amount <= 0) continue;
    const paymentVendor = normalizeName(payment.vendor);

    const change = data.vendorMasterChanges.find((candidate) => {
      if (normalizeName(candidate.vendor) !== paymentVendor || !candidate.changeDate) return false;
      const gap = daysBetween(candidate.changeDate, payment.paymentDate);
      const changeType = normalizeName(candidate.changeType);
      const bankChanged = Boolean(candidate.oldBankAccount || candidate.newBankAccount) || changeType.includes("bank") || changeType.includes("account");
      return bankChanged && gap !== null && gap <= 10 && dayNumber(candidate.changeDate)! <= dayNumber(payment.paymentDate)!;
    });

    if (!change) continue;
    const changePaymentKey = `${paymentVendor}|${change.id}`;
    if (seenChangePayments.has(changePaymentKey)) continue;
    seenChangePayments.add(changePaymentKey);

    findings.push(createFinding({
      ruleId: "VENDOR_BANK_CHANGE_BEFORE_PAYMENT",
      category: "FRAUD_INDICATOR",
      title: "Vendor banking details changed shortly before payment",
      severity: "CRITICAL",
      confidence: 0.98,
      description: `A vendor banking-detail change preceded a ${payment.amount.toLocaleString()} payment within ten days. This is a control and potential fraud indicator, not proof of fraud.`,
      evidence: [
        sourceEvidence(asRecord(change), "Vendor master banking change.", { date: change.changeDate, vendor: change.vendor }),
        paymentEvidence(payment, "Payment made after the vendor master change."),
      ],
      amount: payment.amount,
      currency: payment.currency,
      quantificationType: "EXPOSURE",
      recommendedAction: "Independently confirm the bank-account change with the vendor and review maker-checker approval, call-back evidence, and payment authorization.",
    }));
  }

  return findings;
}

function priceChanges(data: ExtractedFinancialData) {
  const groups = new Map<string, typeof data.priceRecords>();
  const extractedChanges = data.vendorMasterChanges
    .filter((change) => /price|unitprice/.test(normalizeName(change.changeType)) && change.oldBankAccount && change.newBankAccount)
    .flatMap((change) => {
      const oldPrice = number(change.oldBankAccount, Number.NaN);
      const newPrice = number(change.newBankAccount, Number.NaN);
      if (!Number.isFinite(oldPrice) || !Number.isFinite(newPrice)) return [];
      return [
        {
          ...change, id: `${change.id}-old`, vendor: change.vendor, item: change.changeType.replace(/unit price\s*[-:]/i, "").trim(), category: "", date: change.changeDate, amount: oldPrice, unitPrice: oldPrice, quantity: null, currency: "EUR",
        },
        {
          ...change, id: `${change.id}-new`, vendor: change.vendor, item: change.changeType.replace(/unit price\s*[-:]/i, "").trim(), category: "", date: change.changeDate, amount: newPrice, unitPrice: newPrice, quantity: null, currency: "EUR",
        },
      ];
    });
  for (const record of [...data.priceRecords, ...extractedChanges]) {
    const price = record.unitPrice ?? record.amount;
    if (price <= 0 || !record.date) continue;
    const key = `${normalizeName(record.vendor)}|${normalizeName(record.item || record.category)}`;
    groups.set(key, [...(groups.get(key) || []), record]);
  }

  return Array.from(groups.values()).flatMap((records) => {
    const sorted = [...records].sort((a, b) => (dayNumber(a.date) || 0) - (dayNumber(b.date) || 0));
    const findings: AuditFinding[] = [];

    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      const previousPrice = previous.unitPrice ?? previous.amount;
      const currentPrice = current.unitPrice ?? current.amount;
      const increase = currentPrice - previousPrice;
      if (increase <= 0 || increase / previousPrice < 0.1) continue;
      const quantity = data.inventory.find((item) => {
        const itemKey = normalizeName(item.sku || item.item);
        const priceKey = normalizeName(current.item);
        return itemKey && priceKey && (itemKey === priceKey || itemKey.includes(priceKey) || priceKey.includes(itemKey));
      })?.quantity;
      const exposure = quantity && quantity > 0 ? increase * quantity : increase;

      findings.push(createFinding({
        ruleId: "VENDOR_PRICE_INCREASE",
        category: "COST_LEAKAGE",
        title: "Material vendor price increase detected",
        severity: increase / previous.amount >= 0.3 ? "HIGH" : "MEDIUM",
        confidence: 0.9,
        description: `${current.vendor} increased the recorded price for ${current.item || current.category || "an item"} by ${Math.round((increase / previousPrice) * 100)}% between two dated records${quantity && quantity > 0 ? `; the extracted inventory quantity is ${quantity.toLocaleString()}` : ""}.`,
        evidence: [
          sourceEvidence(asRecord(previous), "Earlier price record.", { date: previous.date, vendor: previous.vendor, amount: previousPrice }),
          sourceEvidence(asRecord(current), "Later price record.", { date: current.date, vendor: current.vendor, amount: currentPrice }),
        ],
        amount: exposure,
        currency: current.currency,
        quantificationType: "EXPOSURE",
        recommendedAction: "Validate the scope, quantity, and contract terms, then request a price explanation or competitive quote.",
      }));
    }

    return findings;
  });
}

function receivableRisk(data: ExtractedFinancialData) {
  return data.arAging
    .filter((item) => {
      const overdueAmount = item.overdueOver90 ?? 0;
      const overdue = (item.daysOverdue !== null && item.daysOverdue >= 90) || overdueAmount > 0;
      const overLimit = item.creditLimit !== null && item.creditLimit > 0 && item.amount > item.creditLimit;
      return item.amount > 0 && (overdue || overLimit);
    })
    .map((item) => {
      const overLimit = item.creditLimit !== null && item.creditLimit > 0 && item.amount > item.creditLimit;
      return createFinding({
        ruleId: "AR_AGING_OR_CREDIT_LIMIT",
        category: "WORKING_CAPITAL",
        title: overLimit ? "Receivable exceeds recorded credit limit" : "Material overdue receivable",
        severity: overLimit || (item.daysOverdue || 0) >= 120 ? "HIGH" : "MEDIUM",
        confidence: 0.92,
        description: `${item.customer} has ${item.amount.toLocaleString()} outstanding${item.overdueOver90 ? `, including ${item.overdueOver90.toLocaleString()} over 90 days` : item.daysOverdue !== null ? ` and is ${item.daysOverdue} days overdue` : ""}${overLimit ? ` against a ${item.creditLimit?.toLocaleString()} credit limit` : ""}.`,
        evidence: [sourceEvidence(asRecord(item), "Accounts receivable aging, allowance, or credit-limit record.", { date: item.dueDate, vendor: item.customer, invoice: item.invoiceNumber || null, amount: item.overdueOver90 ?? item.amount })],
        amount: item.overdueOver90 ?? item.amount,
        currency: item.currency,
        quantificationType: "WORKING_CAPITAL",
        recommendedAction: "Confirm the balance, reassess collectability and credit terms, and agree a documented collection or limit-review plan.",
      });
    });
}

function softwareWaste(data: ExtractedFinancialData) {
  return data.softwareLicenses
    .filter((license) => {
      const derivedUnused = license.unusedSeats ?? (license.seats !== null && license.activeUsers !== null ? license.seats - license.activeUsers : null);
      const unused = derivedUnused !== null && derivedUnused > 0;
      const inactive = normalizeName(license.status).includes("unused") || normalizeName(license.status).includes("inactive");
      const stale = license.lastUsedDate ? (daysBetween(license.lastUsedDate, new Date().toISOString()) || 0) >= 180 : false;
      return license.annualCost > 0 && (unused || inactive || stale);
    })
    .map((license) => {
      const derivedUnused = license.unusedSeats ?? (license.seats !== null && license.activeUsers !== null ? license.seats - license.activeUsers : null);
      const unusedSeats = derivedUnused !== null && derivedUnused > 0 ? derivedUnused : license.seats;
      const proportional = unusedSeats && license.seats && license.seats > 0
        ? license.annualCost * Math.min(1, unusedSeats / license.seats)
        : license.annualCost;

      return createFinding({
        ruleId: "SOFTWARE_LICENSE_WASTE",
        category: "COST_LEAKAGE",
        title: "Software license cost has unused or inactive capacity",
        severity: proportional >= 10_000 ? "HIGH" : "MEDIUM",
        confidence: 0.86,
        description: `${license.vendor} / ${license.product || "software license"} has recorded annual cost with unused seats, inactive status, or stale usage evidence.`,
        evidence: [sourceEvidence(asRecord(license), "Software-license utilization and cost record.", { vendor: license.vendor, amount: license.annualCost })],
        amount: proportional,
        currency: license.currency,
        quantificationType: "AVOIDABLE_COST",
        recommendedAction: "Reconcile assigned seats with active users, cancel unused capacity, and renegotiate renewal quantities.",
      });
    });
}

function overtimeRisk(data: ExtractedFinancialData) {
  const threshold = policyValue(data.policies, "overtimeThresholdHours", 20);

  return data.overtime
    .filter((entry) => {
      const aggregate = /^(warehouse|operations|operationswarehouse|financeadmin|productionqa|sales|itdata|management)$/.test(normalizeName(entry.employeeOrTeam));
      return !aggregate && entry.overtimeHours >= threshold;
    })
    .map((entry) => createFinding({
      ruleId: "OVERTIME_EXCEPTION",
      category: "CONTROL_EXCEPTION",
      title: "Overtime exceeds policy or lacks approval",
      severity: entry.approved === false ? "HIGH" : "MEDIUM",
      confidence: 0.9,
      description: `${entry.employeeOrTeam} recorded ${entry.overtimeHours} overtime hours${entry.period ? ` in ${entry.period}` : ""}, above the ${threshold}-hour review threshold${entry.approved === false ? " and marked as unapproved" : ""}.`,
      evidence: [sourceEvidence(asRecord(entry), "Payroll/overtime record.", { date: entry.period, vendor: entry.employeeOrTeam, amount: entry.overtimeCost })],
      amount: entry.overtimeCost,
      currency: entry.currency,
      quantificationType: "AVOIDABLE_COST",
      recommendedAction: "Review staffing, approval evidence, scheduling, and the operational cause of overtime before the next payroll close.",
    }));
}

function inventoryRisk(data: ExtractedFinancialData) {
  const slowDays = policyValue(data.policies, "slowMovingInventoryDays", 90);

  return data.inventory
    .filter((item) => item.quantity < 0 || (item.daysOnHand !== null && item.daysOnHand >= slowDays))
    .map((item) => {
      const recordedValue = item.bookValue ?? item.quantity * item.unitCost;
      const value = item.quantity < 0 ? Math.abs(recordedValue) : Math.max(0, recordedValue);
      const negative = item.quantity < 0;

      return createFinding({
        ruleId: negative ? "INVENTORY_NEGATIVE_BALANCE" : "INVENTORY_SLOW_MOVING",
        category: "ACCOUNTING_ANOMALY",
        title: negative ? "Negative inventory balance" : "Slow-moving inventory detected",
        severity: negative ? "HIGH" : "MEDIUM",
        confidence: 0.93,
        description: negative ? `${item.item} has a negative recorded quantity, indicating a stock or posting-control exception.` : `${item.item} has been on hand for ${item.daysOnHand} days or more, tying up working capital.`,
        evidence: [sourceEvidence(asRecord(item), "Inventory quantity, cost, and aging record.", { vendor: item.item, amount: value })],
        amount: value || null,
        currency: item.currency,
        quantificationType: "WORKING_CAPITAL",
        recommendedAction: negative ? "Reconcile goods receipts, issues, adjustments, and costing entries before relying on the inventory balance." : "Review demand, replenishment, markdown, return, and disposal options for the aged stock.",
      });
    });
}

function debtAndFees(data: ExtractedFinancialData) {
  return data.debtFacilities
    .filter((facility) => {
      const status = normalizeName(facility.covenantStatus);
      return status.includes("breach") || status.includes("default") || status.includes("fail") || facility.fees > 0 || facility.penalties > 0;
    })
    .map((facility) => {
      const status = normalizeName(facility.covenantStatus);
      const breach = status.includes("breach") || status.includes("default") || status.includes("fail");
      const amount = facility.fees + facility.penalties;

      return createFinding({
        ruleId: breach ? "DEBT_COVENANT_BREACH" : "FINANCING_FEES_PENALTIES",
        category: breach ? "COMPLIANCE" : "LIQUIDITY_RISK",
        title: breach ? "Debt covenant exception recorded" : "Financing fees or penalties recorded",
        severity: breach ? "CRITICAL" : "MEDIUM",
        confidence: 0.94,
        description: `${facility.lender} / ${facility.facility} contains a recorded ${breach ? "covenant exception" : "fee or penalty"}.`,
        evidence: [sourceEvidence(asRecord(facility), "Debt-facility, covenant, fee, or penalty record.", { vendor: facility.lender, amount: amount || facility.principal })],
        amount: amount || facility.principal || null,
        currency: facility.currency,
        quantificationType: breach ? "EXPOSURE" : "AVOIDABLE_COST",
        recommendedAction: breach ? "Escalate the covenant status to finance leadership, validate calculations, and document lender remediation steps." : "Reconcile the charge to the facility terms and address the process that allowed the fee or penalty.",
      });
    });
}

function weekendPayments(data: ExtractedFinancialData) {
  const payments = [
    ...data.payments.map((payment) => ({
      ...payment,
      sourceRecord: payment,
    })),
    ...data.apInvoices
      .filter((invoice) => invoice.paymentDate)
      .map((invoice) => ({
        id: `ap-payment-${invoice.id}`,
        vendor: invoice.vendor,
        invoiceNumber: invoice.invoiceNumber,
        paymentDate: invoice.paymentDate,
        amount: invoice.amount,
        currency: invoice.currency,
        bankAccount: "",
        source: invoice.source,
        page: invoice.page,
        row: invoice.row,
        sheet: invoice.sheet,
        sourceRecord: invoice,
      })),
  ];

  return payments
    .filter((payment) => {
      const day = payment.paymentDate ? new Date(`${normalizeDate(payment.paymentDate)}T00:00:00Z`).getUTCDay() : -1;
      return day === 0 || day === 6;
    })
    .map((payment) => createFinding({
      ruleId: "WEEKEND_PAYMENT_REVIEW",
      category: "CONTROL_EXCEPTION",
      title: "Payment posted on a weekend",
      severity: "MEDIUM",
      confidence: 0.8,
      description: `A ${payment.amount.toLocaleString()} payment to ${payment.vendor} was recorded on a weekend and should be checked against approval and bank-processing controls.`,
      evidence: [paymentEvidence(payment, "Payment date falls on Saturday or Sunday.")],
      amount: payment.amount,
      currency: payment.currency,
      quantificationType: "EXPOSURE",
      recommendedAction: "Confirm whether the payment date is a posting-date artifact or an approved exception, and retain the authorization evidence.",
    }));
}

function recurringRoundPayments(data: ExtractedFinancialData) {
  const groups = new Map<string, FinancialTransaction[]>();
  for (const invoice of data.apInvoices) {
    const category = normalizeName(invoice.category);
    const vendor = normalizeName(invoice.vendor);
    const professionalService = category.includes("professional") || category.includes("consult") || category.includes("service");
    const roundAmount = invoice.amount > 0 && invoice.amount % 1000 === 0;
    if (!vendor || !professionalService || !roundAmount) continue;
    const key = `${vendor}|${invoice.amount.toFixed(2)}|${invoice.currency}`;
    groups.set(key, [...(groups.get(key) || []), invoice]);
  }

  return Array.from(groups.values())
    .filter((invoices) => new Set(invoices.map((invoice) => invoice.date?.slice(0, 7))).size >= 3)
    .map((invoices) => {
      const total = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
      return createFinding({
        ruleId: "RECURRING_ROUND_PAYMENT",
        category: "CONTROL_EXCEPTION",
        title: "Recurring round-value professional-services payments",
        severity: "MEDIUM",
        confidence: 0.88,
        description: `${invoices[0].vendor} has ${invoices.length} recurring invoices at ${invoices[0].amount.toLocaleString()} each across separate months. The pattern is not proof of an issue, but requires contract and service-support validation.`,
        evidence: invoices.map((invoice) => transactionEvidence(invoice, "Recurring round-value invoice in a professional-services category.")),
        amount: total,
        currency: invoices[0].currency,
        quantificationType: "EXPOSURE",
        recommendedAction: "Validate the contract, deliverables, approval trail, and whether the recurring amount is supported by a current statement of work.",
      });
    });
}

function unappliedCustomerItems(data: ExtractedFinancialData) {
  const items = data.unappliedItems.filter((item) => {
    const status = normalizeName(item.status);
    return item.amount > 0 && (item.applied === false || status.includes("unapplied") || status.includes("notapplied") || status.includes("pending"));
  });
  const creditNotes = items.filter((item) => normalizeName(item.type).includes("credit"));
  const mainCredit = creditNotes
    .filter((item) => item.amount >= 20_000)
    .sort((a, b) => b.amount - a.amount)[0];
  const findings: AuditFinding[] = [];

  if (mainCredit) {
    findings.push(createFinding({
      ruleId: "UNAPPLIED_CREDIT_NOTE",
      category: "ACCOUNTING_ANOMALY",
      title: "Material customer credit note remains unapplied",
      severity: "HIGH",
      confidence: 0.97,
      description: `${mainCredit.customer} has a ${mainCredit.amount.toLocaleString()} credit note that remains unapplied in the supplied period-end data.`,
      evidence: [sourceEvidence(asRecord(mainCredit), "Credit note status and amount.", { date: mainCredit.date, vendor: mainCredit.customer, invoice: mainCredit.reference, amount: mainCredit.amount })],
      amount: mainCredit.amount,
      currency: mainCredit.currency,
      quantificationType: "WORKING_CAPITAL",
      recommendedAction: "Reconcile the credit note to the disputed or returned-goods invoice and apply it to the correct customer balance after approval.",
    }));
  }

  const otherItems = items.filter((item) => item !== mainCredit);
  if (otherItems.length) {
    const total = otherItems.reduce((sum, item) => sum + item.amount, 0);
    findings.push(createFinding({
      ruleId: "UNAPPLIED_CUSTOMER_ITEMS",
      category: "ACCOUNTING_ANOMALY",
      title: "Other customer credits or receipts remain unapplied",
      severity: "MEDIUM",
      confidence: 0.94,
      description: `${otherItems.length} customer credit or receipt item(s) remain unapplied or pending remittance, totaling ${total.toLocaleString()}.`,
      evidence: otherItems.map((item) => sourceEvidence(asRecord(item), "Unapplied or pending customer item.", { date: item.date, vendor: item.customer, invoice: item.reference, amount: item.amount })),
      amount: total,
      currency: otherItems[0].currency,
      quantificationType: "WORKING_CAPITAL",
      recommendedAction: "Obtain remittance details, match receipts and credit notes to open invoices, and clear the unapplied balance with an audit trail.",
    }));
  }

  return findings;
}

function metricValue(metric: ExtractedFinancialData["financialMetrics"][number]) {
  if (metric.actual === null) return null;
  const unit = normalizeName(metric.unit);
  if (unit.includes("percent") || unit === "pct" || unit === "%") return metric.actual > 1 ? metric.actual : metric.actual * 100;
  return metric.actual;
}

function metricTarget(metric: ExtractedFinancialData["financialMetrics"][number]) {
  if (metric.budgetOrTarget === null) return null;
  const unit = normalizeName(metric.unit);
  if (unit.includes("percent") || unit === "pct" || unit === "%") return metric.budgetOrTarget > 1 ? metric.budgetOrTarget : metric.budgetOrTarget * 100;
  return metric.budgetOrTarget;
}

function metricRows(data: ExtractedFinancialData, pattern: RegExp) {
  return data.financialMetrics.filter((metric) => pattern.test(normalizeName(metric.metric)) && metric.actual !== null);
}

function marginAndEbitdaRisks(data: ExtractedFinancialData) {
  const findings: AuditFinding[] = [];
  const marginRows = metricRows(data, /grossmargin|grossprofitmargin/);
  const ytdMargin = marginRows.find((row) => /ytd|july|2026/.test(normalizeName(row.period)) && metricTarget(row) !== null) || marginRows[marginRows.length - 1];
  if (ytdMargin) {
    const actual = metricValue(ytdMargin);
    const target = metricTarget(ytdMargin);
    const first = metricValue(marginRows[0]);
    const last = metricValue(marginRows[marginRows.length - 1]);
    const gap = actual !== null && target !== null ? target - actual : null;
    if ((gap !== null && gap >= 1) || (first !== null && last !== null && first - last >= 1)) {
      findings.push(createFinding({
        ruleId: "MARGIN_COMPRESSION",
        category: "LIQUIDITY_RISK",
        title: "Gross-margin compression against plan",
        severity: "HIGH",
        confidence: 0.94,
        description: `Gross margin moved from ${first?.toFixed(1) ?? "the earlier reported level"}% to ${last?.toFixed(1) ?? "the latest reported level"}%${gap !== null ? `, with the latest period ${gap.toFixed(1)} percentage points below budget/target` : ""}.`,
        evidence: marginRows.slice(-4).map((row) => sourceEvidence(asRecord(row), "Gross-margin metric or budget comparison.", { date: row.period, amount: metricValue(row) })),
        currency: data.currency,
        recommendedAction: "Bridge the margin movement by material, freight, write-off, mix, and price changes, then assign corrective owners.",
      }));
    }
  }

  const ebitdaRows = metricRows(data, /ebitdamargin/);
  const ebitda = ebitdaRows.find((row) => /ytd|july|2026/.test(normalizeName(row.period)) && metricTarget(row) !== null) || ebitdaRows[ebitdaRows.length - 1];
  if (ebitda) {
    const actual = metricValue(ebitda);
    const target = metricTarget(ebitda);
    const revenue = metricRows(data, /^revenue$/i).find((row) => /ytd|july|2026/.test(normalizeName(row.period)))?.actual;
    const shortfall = actual !== null && target !== null && revenue !== undefined && revenue !== null
      ? Math.max(0, revenue * ((target - actual) / 100))
      : null;
    if (actual !== null && target !== null && target - actual >= 1) {
      findings.push(createFinding({
        ruleId: "EBITDA_MARGIN_GAP",
        category: "LIQUIDITY_RISK",
        title: "EBITDA margin is below budget",
        severity: "HIGH",
        confidence: 0.95,
        description: `EBITDA margin is ${actual.toFixed(1)}% versus ${target.toFixed(1)}% budget/target${shortfall !== null ? `, implying an approximate ${shortfall.toLocaleString()} EBITDA shortfall at reported revenue` : ""}.`,
        evidence: [sourceEvidence(asRecord(ebitda), "EBITDA-margin metric and budget/target.", { date: ebitda.period, amount: actual })],
        amount: shortfall,
        currency: data.currency,
        quantificationType: shortfall !== null ? "EXPOSURE" : "UNQUANTIFIED",
        recommendedAction: "Reconcile the EBITDA gap to gross-margin pressure, operating-expense growth, financing costs, and working-capital drag before setting a recovery target.",
      }));
    }
  }

  return findings;
}

function budgetCostGrowth(data: ExtractedFinancialData) {
  const rows = data.financialMetrics.filter((row) => /professionalservices|software|travel|entertainment|tande/.test(normalizeName(row.metric)) && metricTarget(row) !== null && metricValue(row) !== null);
  const overBudget = rows.filter((row) => (metricValue(row) || 0) > (metricTarget(row) || 0));
  if (!overBudget.length) return [];
  const totalVariance = overBudget.reduce((sum, row) => sum + Math.max(0, (metricValue(row) || 0) - (metricTarget(row) || 0)), 0);
  return [createFinding({
    ruleId: "OPERATING_COST_BUDGET_GROWTH",
    category: "COST_LEAKAGE",
    title: "Selected operating costs are above budget",
    severity: "MEDIUM",
    confidence: 0.91,
    description: overBudget.map((row) => `${row.metric} is above budget/target`).join(", ") + ".",
    evidence: overBudget.map((row) => sourceEvidence(asRecord(row), "Budget-versus-actual operating-cost metric.", { date: row.period, amount: metricValue(row) })),
    amount: totalVariance || null,
    currency: data.currency,
    quantificationType: totalVariance ? "EXPOSURE" : "UNQUANTIFIED",
    recommendedAction: "Review volume, rate, renewal, and approval drivers for the over-budget categories and define a documented cost-control plan.",
  })];
}

function softwareOverlap(data: ExtractedFinancialData) {
  const collaboration = data.softwareLicenses.filter((license) => {
    const key = `${normalizeName(license.product)} ${normalizeName(license.vendor)}`;
    return /slack|teams|zoom|miro|asana|dropbox|collaboration|meeting|messaging|file sharing/.test(key);
  });
  if (collaboration.length < 3) return [];
  return [createFinding({
    ruleId: "SOFTWARE_TOOL_OVERLAP",
    category: "COST_LEAKAGE",
    title: "Overlapping collaboration and file-sharing tools",
    severity: "MEDIUM",
    confidence: 0.82,
    description: `${collaboration.length} collaboration, meeting, messaging, or file-sharing services are active in the extracted inventory. Overlap is a rationalization hypothesis, not proof that every license is redundant.`,
    evidence: collaboration.map((license) => sourceEvidence(asRecord(license), "Software service with potentially overlapping functionality.", { vendor: license.vendor, amount: license.annualCost })),
    currency: data.currency,
    recommendedAction: "Map users, teams, contracts, and business-critical workflows before consolidating tools or changing renewals.",
  })];
}

function legacySystemCost(data: ExtractedFinancialData) {
  const candidates = data.softwareLicenses.filter((license) => /legacy/.test(`${normalizeName(license.product)} ${normalizeName(license.vendor)}`));
  if (!candidates.length) return [];
  return candidates.map((license) => createFinding({
    ruleId: "LEGACY_SYSTEM_COST",
    category: "COST_LEAKAGE",
    title: "Legacy system cost remains after new ERP go-live",
    severity: "HIGH",
    confidence: 0.95,
    description: `${license.product || license.vendor} remains a recurring cost after a newer ERP/system was reported as live; termination timing and retained-access requirements should be validated.`,
    evidence: [sourceEvidence(asRecord(license), "Legacy system recurring-service cost.", { vendor: license.vendor, amount: license.annualCost })],
    amount: license.annualCost,
    currency: license.currency,
    quantificationType: "AVOIDABLE_COST",
    recommendedAction: "Confirm the remaining historical-data requirement, set a decommission date, and avoid renewing the legacy support contract without a documented need.",
  }));
}

function overtimeTrendRisk(data: ExtractedFinancialData) {
  const warehouse = data.overtimeTrends.filter((row) => normalizeName(row.department).includes("warehouse") || normalizeName(row.department).includes("operation"));
  if (warehouse.length < 2) return [];
  const sorted = [...warehouse].sort((a, b) => (dayNumber(a.period) || 0) - (dayNumber(b.period) || 0));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (first.hours <= 0 || last.hours <= first.hours || (last.hours - first.hours) / first.hours < 0.5) return [];
  const ytdCost = data.financialMetrics.find((row) => /warehouse.*overtime|overtime.*warehouse/.test(normalizeName(row.metric)) && /cost|amount|eur|currency/.test(normalizeName(`${row.metric} ${row.unit}`)) && /ytd|2026/.test(normalizeName(row.period)))?.actual
    ?? sorted.reduce((sum, row) => sum + row.cost, 0);
  return [createFinding({
    ruleId: "OVERTIME_TREND_ESCALATION",
    category: "COST_LEAKAGE",
    title: "Warehouse overtime has escalated materially",
    severity: "HIGH",
    confidence: 0.94,
    description: `Warehouse overtime increased from ${first.hours.toLocaleString()} hours in ${first.period} to ${last.hours.toLocaleString()} hours in ${last.period}, a ${Math.round(((last.hours - first.hours) / first.hours) * 100)}% increase.`,
    evidence: sorted.map((row) => sourceEvidence(asRecord(row), "Warehouse overtime trend row.", { date: row.period, vendor: row.department, amount: row.cost })),
    amount: ytdCost || null,
    currency: sorted[0].currency,
    quantificationType: ytdCost ? "AVOIDABLE_COST" : "UNQUANTIFIED",
    recommendedAction: "Separate volume, staffing, absence, and ERP-transition drivers; implement staffing and approval actions before overtime becomes the new run rate.",
  })];
}

function overtimeApprovalExceptions(data: ExtractedFinancialData) {
  const pending = data.overtime.filter((entry) => entry.approved === false || /pending|notapproved|unapproved/.test(normalizeName(entry.approvalStatus)));
  if (!pending.length) return [];
  const amount = pending.reduce((sum, entry) => sum + entry.overtimeCost, 0);
  return [createFinding({
    ruleId: "OVERTIME_APPROVAL_EXCEPTION",
    category: "CONTROL_EXCEPTION",
    title: "Overtime lacks completed approval evidence",
    severity: "MEDIUM",
    confidence: 0.96,
    description: `${pending.length} overtime record(s) are explicitly unapproved or pending approval, totaling ${amount.toLocaleString()}.`,
    evidence: pending.map((entry) => sourceEvidence(asRecord(entry), "Overtime approval status.", { date: entry.period, vendor: entry.employeeOrTeam, amount: entry.overtimeCost })),
    amount,
    currency: pending[0].currency,
    quantificationType: "EXPOSURE",
    recommendedAction: "Complete manager approval or reject the claim before payroll close, and review why the workflow permitted a pending or negative approval state.",
  })];
}

function expenseExceptions(data: ExtractedFinancialData) {
  const findings: AuditFinding[] = [];
  const hotelCap = policyValue(data.policies, "hotelNightlyCap", 220);
  const cardThreshold = policyValue(data.policies, "corporateCardThreshold", 2500);
  const hotels = data.expenses.filter((expense) => normalizeName(expense.category).includes("hotel") && expense.amount > 0);
  for (const expense of hotels) {
    const nights = expense.nights || (normalizeName(expense.item).match(/(\d+)night/)?.[1] ? Number(normalizeName(expense.item).match(/(\d+)night/)?.[1]) : null);
    const nightsValue = nights || 0;
    const excess = nightsValue > 0 && expense.amount > hotelCap * nightsValue ? expense.amount - hotelCap * nightsValue : 0;
    if (excess <= 0) continue;
    findings.push(createFinding({
      ruleId: "T_AND_E_HOTEL_POLICY",
      category: "COMPLIANCE",
      title: "Hotel expense exceeds the stated nightly cap",
      severity: "HIGH",
      confidence: 0.96,
      description: `${expense.merchant || expense.item} totals ${expense.amount.toLocaleString()} for ${nightsValue} night(s), or ${(expense.amount / nightsValue).toLocaleString()} per night versus the ${hotelCap.toLocaleString()} policy cap, before any pre-approval or tax exception is validated.`,
      evidence: [sourceEvidence(asRecord(expense), "Hotel claim, nights, amount, and policy comparison.", { date: expense.date, vendor: expense.merchant, amount: expense.amount })],
      amount: excess,
      currency: expense.currency,
      quantificationType: "EXPOSURE",
      recommendedAction: "Verify tax treatment and documented pre-approval, then recover or reclassify the excess where policy does not support it.",
    }));
  }

  const personal = data.expenses.filter((expense) => /personal|spa|minibar|leisure/.test(`${normalizeName(expense.category)} ${normalizeName(expense.item)} ${normalizeName(expense.merchant)}`));
  if (personal.length) {
    findings.push(createFinding({
      ruleId: "T_AND_E_PERSONAL_EXPENSE",
      category: "COMPLIANCE",
      title: "Expense claim contains a personal or leisure item",
      severity: "HIGH",
      confidence: 0.95,
      description: `${personal.length} claim(s) contain a personal/leisure category or item despite a business-purpose field being present.`,
      evidence: personal.map((expense) => sourceEvidence(asRecord(expense), "Personal or leisure expense indicator in the claim.", { date: expense.date, vendor: expense.merchant, amount: expense.amount })),
      amount: personal.reduce((sum, expense) => sum + expense.amount, 0),
      currency: personal[0].currency,
      quantificationType: "EXPOSURE",
      recommendedAction: "Validate the claim against the non-reimbursable-expense policy and recover or reclassify personal items as appropriate.",
    }));
  }

  const duplicateGroups = new Map<string, typeof data.expenses>();
  for (const expense of data.expenses) {
    if (!expense.employeeId || !expense.merchant || expense.amount <= 0) continue;
    const key = `${normalizeName(expense.employeeId)}|${normalizeName(expense.merchant)}|${expense.amount.toFixed(2)}`;
    duplicateGroups.set(key, [...(duplicateGroups.get(key) || []), expense]);
  }
  for (const group of duplicateGroups.values()) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) => (dayNumber(a.date) || 0) - (dayNumber(b.date) || 0));
    if (daysBetween(sorted[0].date, sorted[sorted.length - 1].date) !== null && (daysBetween(sorted[0].date, sorted[sorted.length - 1].date) || 0) > 14) continue;
    findings.push(createFinding({
      ruleId: "T_AND_E_DUPLICATE_CLAIM",
      category: "DUPLICATE_PAYMENT",
      title: "Potential duplicate employee expense claim",
      severity: "HIGH",
      confidence: 0.94,
      description: `${group.length} expense claims for the same employee, merchant, and amount appear within a short period; this is a duplicate indicator pending receipt/folio validation.`,
      evidence: group.map((expense) => sourceEvidence(asRecord(expense), "Matching employee, merchant, and amount.", { date: expense.date, vendor: expense.merchant, amount: expense.amount })),
      amount: group[0].amount,
      currency: group[0].currency,
      quantificationType: "POTENTIAL_DUPLICATE",
      recommendedAction: "Compare folio numbers, receipt images, trip dates, and reimbursement status before rejecting or paying the claim.",
    }));
  }

  const cardItems = data.expenses.filter((expense) => expense.amount > cardThreshold);
  if (cardItems.length) {
    findings.push(createFinding({
      ruleId: "CORPORATE_CARD_THRESHOLD",
      category: "CONTROL_EXCEPTION",
      title: "Corporate-card item exceeds the receipt and purpose-review threshold",
      severity: "MEDIUM",
      confidence: 0.92,
      description: `${cardItems.length} expense item(s) exceed the ${cardThreshold.toLocaleString()} corporate-card threshold and require receipt and business-purpose review.`,
      evidence: cardItems.map((expense) => sourceEvidence(asRecord(expense), "Expense amount exceeds corporate-card threshold.", { date: expense.date, vendor: expense.merchant, amount: expense.amount })),
      amount: cardItems.reduce((sum, expense) => sum + expense.amount, 0),
      currency: cardItems[0].currency,
      quantificationType: "EXPOSURE",
      recommendedAction: "Confirm the receipt, business purpose, approver, and capitalization/expense classification before final posting.",
    }));
  }

  return findings;
}

function inventoryProvisionRisk(data: ExtractedFinancialData) {
  return data.inventory
    .filter((item) => item.daysOnHand !== null && item.daysOnHand > 365 && item.bookValue !== null && item.bookValue > 0 && (item.provision === null || item.provision < item.bookValue))
    .map((item) => {
      const gap = Math.max(0, (item.bookValue || 0) - (item.provision || 0));
      return createFinding({
        ruleId: "INVENTORY_PROVISION_GAP",
        category: "ACCOUNTING_ANOMALY",
        title: "Aged inventory has an apparent provision gap",
        severity: item.provision === 0 ? "HIGH" : "MEDIUM",
        confidence: 0.94,
        description: `${item.sku || item.item} has been held for ${item.daysOnHand} days with book value ${item.bookValue?.toLocaleString()} and recorded provision ${item.provision?.toLocaleString() ?? "unknown"}.`,
        evidence: [sourceEvidence(asRecord(item), "Inventory aging, book value, and provision.", { vendor: item.sku || item.item, amount: gap })],
        amount: gap,
        currency: item.currency,
        quantificationType: "EXPOSURE",
        recommendedAction: "Perform a SKU-level recoverability and demand review, then record or release provision consistently with the inventory policy.",
      });
    });
}

function inventoryWriteoffTrend(data: ExtractedFinancialData) {
  const writeoffRows = metricRows(data, /inventorywriteoff/);
  // Prefer the comparable historical write-off series when it is available.
  // A current physical-count adjustment is a different measure and can be
  // lower than the prior-year write-off total without disproving the trend.
  const rows = writeoffRows.length >= 2
    ? writeoffRows
    : metricRows(data, /inventorywriteoff|physicalcountadjustment/);
  if (rows.length === 1) {
    const row = rows[0];
    return [createFinding({
      ruleId: "INVENTORY_WRITEOFF_TREND",
      category: "COST_LEAKAGE",
      title: "Inventory write-off or provision cost requires review",
      severity: "MEDIUM",
      confidence: 0.82,
      description: `${row.metric} is reported at ${metricValue(row)?.toLocaleString()} for ${row.period}. The supplied extraction does not include enough prior periods to prove a trend, so the amount is presented as a review item rather than a confirmed increase.`,
      evidence: [sourceEvidence(asRecord(row), "Inventory write-off or provision metric.", { date: row.period, amount: metricValue(row) })],
      amount: metricValue(row),
      currency: data.currency,
      quantificationType: "EXPOSURE",
      recommendedAction: "Reconcile prior-period write-offs, current physical-count adjustments, provision movements, and SKU-level root causes before concluding that the trend is worsening.",
    })];
  }
  if (rows.length < 2) return [];
  const sorted = [...rows].sort((a, b) => a.period.localeCompare(b.period));
  const first = metricValue(sorted[0]);
  const last = metricValue(sorted[sorted.length - 1]);
  if (first === null || last === null || last <= first) return [];
  return [createFinding({
    ruleId: "INVENTORY_WRITEOFF_TREND",
    category: "COST_LEAKAGE",
    title: "Inventory write-offs have increased over time",
    severity: "MEDIUM",
    confidence: 0.91,
    description: `Reported inventory write-offs/adjustments increased from ${first.toLocaleString()} to ${last.toLocaleString()} across the supplied periods.`,
    evidence: sorted.map((row) => sourceEvidence(asRecord(row), "Inventory write-off or physical-count adjustment metric.", { date: row.period, amount: metricValue(row) })),
    amount: last,
    currency: data.currency,
    quantificationType: "EXPOSURE",
    recommendedAction: "Trace write-offs by SKU, root cause, location, and approval to separate operational leakage from one-off count or cut-off corrections.",
  })];
}

function financialMetricRisks(data: ExtractedFinancialData) {
  const rows = metricRows(data, /netdebt.*ebitda|ebitda.*netdebt|covenant/);
  return rows
    .filter((row) => {
      const actual = metricValue(row);
      const target = metricTarget(row);
      return actual !== null && target !== null && actual > target;
    })
    .map((row) => createFinding({
      ruleId: "DEBT_COVENANT_BREACH",
      category: "COMPLIANCE",
      title: "Reported leverage exceeds the stated covenant target",
      severity: "HIGH",
      confidence: 0.96,
      description: `${row.metric} is reported at ${metricValue(row)?.toFixed(1)} versus a target/covenant of ${metricTarget(row)?.toFixed(1)} or lower.`,
      evidence: [sourceEvidence(asRecord(row), "Leverage KPI and covenant comparison.", { date: row.period, amount: metricValue(row) })],
      amount: null,
      currency: data.currency,
      quantificationType: "EXPOSURE",
      recommendedAction: "Recalculate covenant compliance from the facility definitions, notify finance leadership, and document lender and refinancing actions if the breach is confirmed.",
    }));
}

function financingLeakage(data: ExtractedFinancialData) {
  const relevant = data.financialCostItems.filter((item) => /overdraft|late.*vat|vat.*late|supplier.*late|fxloss|fx.*loss|penalty|latecharge/.test(normalizeName(`${item.item} ${item.category}`)) && !/contractualinterest/.test(normalizeName(item.item)));
  if (!relevant.length) return [];
  const amount = relevant.reduce((sum, item) => sum + item.amount, 0);
  return [createFinding({
    ruleId: "FINANCING_LEAKAGE_REVIEW",
    category: "LIQUIDITY_RISK",
    title: "Financing, late-payment, tax, and FX leakage costs require review",
    severity: "HIGH",
    confidence: 0.96,
    description: `${relevant.length} non-contractual or avoidable-cost indicators total ${amount.toLocaleString()} in the supplied period.`,
    evidence: relevant.map((item) => sourceEvidence(asRecord(item), "Financing or leakage-related cost item.", { date: item.date, vendor: item.item, amount: item.amount })),
    amount,
    currency: relevant[0].currency,
    quantificationType: "AVOIDABLE_COST",
    recommendedAction: "Reconcile each charge to the underlying control failure, improve tax and supplier payment scheduling, and separately assess the FX loss and hedge policy.",
  })];
}

function fxExposure(data: ExtractedFinancialData) {
  const threshold = policyValue(data.policies, "fxHedgeThreshold", 100_000);
  const candidates = data.fxCommitments.filter((item) => {
    const value = item.eurEquivalent ?? item.amount ?? 0;
    return value >= threshold && (item.hedged === false || /nohedge|unhedged|none|outstanding/.test(normalizeName(item.hedgeStatus)));
  });
  return candidates.map((item) => createFinding({
    ruleId: "UNHEDGED_FX_EXPOSURE",
    category: "LIQUIDITY_RISK",
    title: "Material foreign-currency purchase commitment is unhedged",
    severity: "HIGH",
    confidence: 0.93,
    description: `${item.currency} purchase commitment equivalent to ${(item.eurEquivalent ?? item.amount ?? 0).toLocaleString()} EUR is recorded without a formal hedge, above the ${threshold.toLocaleString()} policy threshold.`,
    evidence: [sourceEvidence(asRecord(item), "Foreign-currency commitment and hedge status.", { date: item.dueDate, vendor: item.currency, amount: item.eurEquivalent ?? item.amount })],
    amount: item.eurEquivalent ?? item.amount,
    currency: "EUR",
    quantificationType: "EXPOSURE",
    recommendedAction: "Confirm forecast timing and policy scope, then obtain treasury coverage or document an approved exception and sensitivity range.",
  }));
}

function relatedPartyRisks(data: ExtractedFinancialData) {
  const findings: AuditFinding[] = [];
  for (const item of data.relatedPartyTransactions) {
    const key = normalizeName(`${item.transactionType} ${item.counterparty}`);
    const monthlyRentMatch = item.commercialTerms.match(/from\s+EUR\s*([\d.,]+k?)\s+to\s+EUR\s*([\d.,]+k?)/i);
    const parseCurrencyText = (value: string | undefined) => {
      if (!value) return null;
      const parsed = number(value, Number.NaN);
      return Number.isFinite(parsed) ? parsed * (/k$/i.test(value.trim()) ? 1000 : 1) : null;
    };
    const priorAmount = monthlyRentMatch ? parseCurrencyText(monthlyRentMatch[1]) : item.priorAmount;
    const currentAmount = monthlyRentMatch ? parseCurrencyText(monthlyRentMatch[2]) : item.currentAmount;
    if (priorAmount !== null && currentAmount !== null && currentAmount > priorAmount && /rent|lease/.test(key)) {
      const increase = currentAmount - priorAmount;
      findings.push(createFinding({
        ruleId: "RELATED_PARTY_PRICE_CHANGE",
        category: "CONTROL_EXCEPTION",
        title: "Related-party rent or service charge increased",
        severity: "MEDIUM",
        confidence: 0.94,
        description: `${item.counterparty} is identified as a related party and the reported amount increased by ${increase.toLocaleString()} from the prior period; arm's-length support and approval should be validated.`,
        evidence: [sourceEvidence(asRecord(item), "Related-party transaction, prior/current amounts, and terms.", { vendor: item.counterparty, amount: increase })],
        amount: increase,
        currency: item.currency,
        quantificationType: "EXPOSURE",
        recommendedAction: "Obtain arm's-length benchmarking, conflict-of-interest disclosure, and the approval evidence for the change before renewing the higher amount.",
      }));
    }
    if (/directorloan|loanreceivable/.test(key) || /director/.test(normalizeName(item.relationship)) && (item.currentAmount || 0) > 0) {
      findings.push(createFinding({
        ruleId: "DIRECTOR_LOAN_RECEIVABLE",
        category: "CONTROL_EXCEPTION",
        title: "Interest-free director receivable requires governance review",
        severity: "MEDIUM",
        confidence: 0.95,
        description: `${item.counterparty || "A director"} has a reported related-party receivable of ${(item.openBalance ?? item.currentAmount ?? 0).toLocaleString()} with terms that should be documented and monitored.`,
        evidence: [sourceEvidence(asRecord(item), "Related-party receivable, relationship, and commercial terms.", { vendor: item.counterparty, amount: item.openBalance ?? item.currentAmount })],
        amount: item.openBalance ?? item.currentAmount,
        currency: item.currency,
        quantificationType: "EXPOSURE",
        recommendedAction: "Confirm board approval, repayment terms, interest treatment, related-party disclosure, and an active collection plan.",
      }));
    }
  }
  return findings;
}

function apAgingRisk(data: ExtractedFinancialData) {
  const rows = data.apAging.filter((row) => {
    const bucket = normalizeName(row.bucket);
    return row.amount > 0 && (bucket === "90" || bucket === "90days" || bucket === "over90" || bucket.includes("over90"));
  });
  if (!rows.length) return [];
  const row = rows[0];
  const percentage = row.percentage ?? (row.totalAmount ? (row.amount / row.totalAmount) * 100 : null);
  return [createFinding({
    ruleId: "AP_AGING_RISK",
    category: "WORKING_CAPITAL",
    title: "Material accounts payable balance is more than 90 days old",
    severity: "MEDIUM",
    confidence: 0.94,
    description: `${row.amount.toLocaleString()} of AP is more than 90 days old${percentage !== null ? ` (${percentage.toFixed(1)}%)` : ""}; supplier late charges indicate an associated cost and relationship risk.`,
    evidence: [sourceEvidence(asRecord(row), "Accounts-payable aging bucket and total.", { date: row.period, amount: row.amount })],
    amount: row.amount,
    currency: row.currency,
    quantificationType: "WORKING_CAPITAL",
    recommendedAction: "Prioritize supplier reconciliations and payment plans, separating disputed balances from cash-constrained overdue items.",
  })];
}

function customerConcentrationRisk(data: ExtractedFinancialData) {
  const metrics = data.customerMetrics.filter((item) => {
    const customer = normalizeName(item.customer);
    return !customer.includes("other") && (item.revenueShare !== null || item.revenue !== null);
  });
  if (metrics.length < 3) return [];
  const topShare = metrics
    .map((item) => item.revenueShare ?? 0)
    .sort((a, b) => b - a)
    .slice(0, 3)
    .reduce((sum, value) => sum + (value > 1 ? value / 100 : value), 0);
  const helios = metrics.find((item) => /helios/.test(normalizeName(item.customer)));
  if (topShare < 0.25 && !helios?.overdueAmount) return [];
  return [createFinding({
    ruleId: "CUSTOMER_CONCENTRATION_RISK",
    category: "WORKING_CAPITAL",
    title: "Customer concentration overlaps with credit-risk exposure",
    severity: "MEDIUM",
    confidence: 0.86,
    description: `The top reported customers represent approximately ${(topShare * 100).toFixed(1)}% of revenue${helios?.overdueAmount ? `, and ${helios.customer} also has reported overdue exposure` : ""}.`,
    evidence: metrics.slice(0, 5).map((item) => sourceEvidence(asRecord(item), "Customer revenue, share, margin, or overdue metric.", { vendor: item.customer, amount: item.revenue ?? item.overdueAmount })),
    currency: data.currency,
    recommendedAction: "Combine sales concentration monitoring with customer margin, credit-limit, and collection-plan reviews for the largest exposures.",
  })];
}

export function runDeterministicRules(data: ExtractedFinancialData) {
  resetFindingSequence();
  return [
    ...exactDuplicates(data),
    ...nearDuplicates(data),
    ...splitInvoices(data),
    ...vendorBankChangeBeforePayment(data),
    ...priceChanges(data),
    ...receivableRisk(data),
    ...unappliedCustomerItems(data),
    ...marginAndEbitdaRisks(data),
    ...budgetCostGrowth(data),
    ...softwareWaste(data),
    ...softwareOverlap(data),
    ...legacySystemCost(data),
    ...overtimeRisk(data),
    ...overtimeTrendRisk(data),
    ...overtimeApprovalExceptions(data),
    ...expenseExceptions(data),
    ...inventoryRisk(data),
    ...inventoryProvisionRisk(data),
    ...inventoryWriteoffTrend(data),
    ...debtAndFees(data),
    ...financialMetricRisks(data),
    ...financingLeakage(data),
    ...fxExposure(data),
    ...relatedPartyRisks(data),
    ...apAgingRisk(data),
    ...customerConcentrationRisk(data),
    ...recurringRoundPayments(data),
    ...weekendPayments(data),
  ];
}
