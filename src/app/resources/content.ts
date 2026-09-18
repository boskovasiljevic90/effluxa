export type ResourceContent = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  intro: string;
  whyItMatters: string;
  signals: string[];
  workflow: string[];
  questions: string[];
  caveat: string;
};

export const RESOURCE_CONTENT: Record<string, ResourceContent> = {
  "duplicate-invoice-audit": {
    slug: "duplicate-invoice-audit",
    eyebrow: "Financial control guide",
    title: "How to run a duplicate-invoice audit from the files you already have",
    description:
      "A practical, evidence-first checklist for reviewing possible duplicate invoices in PDF, CSV and Excel exports.",
    intro:
      "Duplicate invoices are easy to suspect and easy to misclassify. A reliable review starts with the source rows, then checks vendor, invoice number, date, amount, currency and payment status before anyone calls a payment a loss.",
    whyItMatters:
      "A duplicate-invoice review is valuable because it turns a vague concern into a small, reviewable queue. The purpose is not to label every matching row as fraud; it is to surface the combinations that deserve a human check before payment or reconciliation is closed.",
    signals: [
      "The same vendor and invoice number appear more than once.",
      "Two rows share a vendor, amount and nearby invoice date but use different references.",
      "Credit notes, reversals or payments are missing from an otherwise matching pair.",
      "The same invoice appears in more than one file, period or payment run.",
      "Currency, tax, rounding or split-payment differences explain part of the apparent match.",
    ],
    workflow: [
      "Start with a payment or accounts-payable export that contains vendor, reference, date and amount fields.",
      "Group possible matches conservatively instead of deleting or netting rows automatically.",
      "Open the source evidence for each candidate and check payment status, credit notes and approval context.",
      "Assign a control owner and record whether the candidate is supported, not supported or unclear.",
      "Repeat the review on the next period to see whether the same control weakness is recurring.",
    ],
    questions: [
      "Do the matching rows refer to the same legal entity and currency?",
      "Was one row a credit note, reversal, split payment or correction?",
      "Is there a payment reference or approval trail for each row?",
      "Can the vendor confirm which invoice is valid?",
    ],
    caveat:
      "A matching row is a review signal, not proof of a duplicate payment. Confirm the underlying documents and payment records before changing a ledger or claiming recovered cash.",
  },
  "vendor-price-creep-audit": {
    slug: "vendor-price-creep-audit",
    eyebrow: "Spend control guide",
    title: "How to find vendor price creep across two reporting periods",
    description:
      "A practical way to compare vendor prices, quantities and recurring charges without starting with a procurement integration.",
    intro:
      "Price creep is usually gradual: the same supplier, product or service becomes more expensive across renewals, purchase orders or recurring invoices. Comparing two periods makes the discussion specific, but the comparison still needs contract, quantity and scope context.",
    whyItMatters:
      "A useful price-creep review separates a real unit-price change from a change in volume, tax, currency, service scope or timing. That distinction gives a finance lead a defensible question to take to the vendor instead of an unsupported savings claim.",
    signals: [
      "The same vendor and item have a higher unit price in the newer period.",
      "A recurring charge increased while the quantity or service scope stayed similar.",
      "A renewal or indexation clause is not visible in the supporting data.",
      "Several categories from the same vendor rise together, suggesting a contract-level change.",
      "The total amount rose because of volume rather than price, which should not be labelled price creep.",
    ],
    workflow: [
      "Collect at least two comparable periods with vendor, item, quantity, unit price and currency where possible.",
      "Normalise units, tax treatment and currency before comparing prices.",
      "Separate unit-price movement from volume and mix movement.",
      "Check the contract, renewal notice, purchase order and approval context.",
      "Assign the supplier conversation or internal review as a control action and verify the outcome later.",
    ],
    questions: [
      "Did the unit price change, or did only the quantity change?",
      "Was the service or product scope different between periods?",
      "Is there an agreed indexation or renewal clause?",
      "Would a volume commitment, consolidation or renegotiation change the decision?",
    ],
    caveat:
      "A higher amount is not automatically supplier overcharging. Validate scope, currency, tax and contract terms before presenting a vendor as the cause of a loss.",
  },
  "recurring-software-spend-audit": {
    slug: "recurring-software-spend-audit",
    eyebrow: "Subscription control guide",
    title: "How to audit recurring software spend before it becomes permanent overhead",
    description:
      "A file-first checklist for finding overlapping, ownerless or unused software subscriptions in expense and card exports.",
    intro:
      "Software spend often grows one renewal at a time. An audit should identify recurring merchants, overlapping tools and unclear ownership, then ask the people using the tools to confirm business need before any cancellation decision.",
    whyItMatters:
      "The most useful output is not a list of subscriptions. It is a decision queue: which charge is recurring, who owns it, what business purpose it serves, when it renews and what evidence would support keeping, changing or cancelling it.",
    signals: [
      "The same merchant or tool appears on multiple cards or cost centres.",
      "Several tools appear to serve the same workflow or team need.",
      "A recurring charge has no clear owner, cost centre or renewal context.",
      "The plan tier or seat count changed without a matching usage or headcount explanation.",
      "A subscription continues after a team, project or vendor relationship changed.",
    ],
    workflow: [
      "Start with a card, expense or accounts-payable export covering enough periods to reveal recurring charges.",
      "Group merchants and normalise naming so renewals are not hidden by invoice variations.",
      "Ask the owner to confirm purpose, seats, renewal date and alternatives.",
      "Record the decision and owner as a control action instead of assuming an unused charge.",
      "Compare the next period to verify whether the recurring pattern changed.",
    ],
    questions: [
      "Who owns this subscription and can confirm its business purpose?",
      "How many seats or licences are actually needed?",
      "Is there another tool covering the same workflow?",
      "What is the renewal date and cancellation notice period?",
    ],
    caveat:
      "A recurring charge is not waste simply because it repeats. Confirm usage, contractual obligations and business continuity before cancelling or reducing a subscription.",
  },
  "cash-flow-working-capital-audit": {
    slug: "cash-flow-working-capital-audit",
    eyebrow: "Cash-flow control guide",
    title: "How to review cash-flow pressure and working-capital leakage from a finance export",
    description:
      "An evidence-first checklist for reviewing receivables, payables, inventory, payment terms and financing pressure without an integration project.",
    intro:
      "Cash-flow pressure is often visible before a business misses a payment, but the signal is spread across receivables aging, payables timing, inventory, customer credits and short-term financing. A useful review connects those records without turning a timing issue into a loss claim.",
    whyItMatters:
      "Working capital affects the room a business has to operate, invest and negotiate. The goal of a first-pass review is to identify the specific balances, terms or process gaps that deserve an owner and a decision, not to produce a false-precision cash forecast.",
    signals: [
      "Receivables are aging while payment terms or collection ownership are unclear.",
      "Customer credits, unapplied cash or disputed balances remain open across periods.",
      "Inventory is slow-moving, overstocked or exposed to write-off without a documented review.",
      "Supplier terms are shorter than customer collection cycles, creating avoidable timing pressure.",
      "Interest, fees or short-term financing costs rise without a clear operational explanation.",
    ],
    workflow: [
      "Start with a dated receivables, payables, inventory or cash export that identifies the period and currency.",
      "Separate confirmed balances from aging, timing and policy signals that need context.",
      "Compare customer terms, supplier terms, collection actions and inventory movement together where the file supports it.",
      "Assign one owner to each material review item and record the evidence needed to close it.",
      "Repeat the review in the next period and compare the open control queue, not only the headline cash balance.",
    ],
    questions: [
      "Which overdue balances have a named owner and a next collection action?",
      "Are customer credits or unapplied receipts hiding the true collection picture?",
      "Does inventory aging reflect a real demand issue, a data cut-off or a provisioning policy?",
      "What changed in payment terms, financing cost or cash conversion since the last period?",
    ],
    caveat:
      "Aged or open balances are not automatically bad debt or realised loss. Confirm cut-off, disputes, terms and accounting treatment with the responsible finance professional before acting.",
  },
  "accounting-firm-client-leakage-review": {
    slug: "accounting-firm-client-leakage-review",
    eyebrow: "Advisor workflow guide",
    title: "A repeatable financial-leakage review for accounting and fractional-CFO client portfolios",
    description:
      "A practical operating model for standardising first-pass leakage reviews across client files while keeping evidence, ownership and limitations visible.",
    intro:
      "An accounting or fractional-CFO firm does not need a new integration for every client to start a useful leakage conversation. It needs a safe intake, a consistent review scope, traceable evidence and a follow-up workflow that can be repeated in the next period.",
    whyItMatters:
      "A standardised first pass lets an advisor spend more time on judgement and client decisions instead of rebuilding the same spreadsheet review. The operating advantage comes from repeatability and trust: each finding should show what was observed, how strong the evidence is and who owns the next check.",
    signals: [
      "Different client files use inconsistent vendor, category, period or payment fields.",
      "A possible finding cannot be traced back to a source row, page, period or calculation basis.",
      "Client recommendations are delivered without an owner, due date or verification note.",
      "One-off audits are not compared with the next period, so recurring control weaknesses stay invisible.",
      "Estimated opportunities are presented as recovered savings before the client confirms an outcome.",
    ],
    workflow: [
      "Agree with the client on a redacted, supported file and one initial review question.",
      "Use the same intake fields across clients: period, currency, file type, scope and known limitations.",
      "Review evidence-backed findings and separate potential exposure from confirmed outcomes.",
      "Share a client-safe summary, assign the next control action and record the responsible owner.",
      "Return to the next reporting period and compare recurring, new and no-longer-detected control signals.",
    ],
    questions: [
      "Can the client approve a redacted file and identify the reporting period before upload?",
      "Which first review question is valuable enough to discuss with the decision-maker?",
      "What evidence and owner are required before a finding can be marked actioned?",
      "How will the firm distinguish a potential opportunity from verified recovered value?",
    ],
    caveat:
      "A repeatable screening workflow supports professional judgement; it does not replace bookkeeping, reconciliation, tax work, procurement approval or the advisor's responsibility to validate the source data.",
  },
};

export const RESOURCE_SLUGS = Object.keys(RESOURCE_CONTENT);

export function getResource(slug: string) {
  return RESOURCE_CONTENT[slug];
}
