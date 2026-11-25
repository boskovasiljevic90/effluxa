import type { SeoPage } from "@/content/seoPages";

export const SEO_PAGES_EXTRA: SeoPage[] = [
  {
    slug: "vendor-price-creep-audit-for-manufacturing-companies",
    type: "use-case",
    title: "Vendor Price Creep Audit for Manufacturers | Effluxa",
    description:
      "Manufacturing suppliers drift above contract rates through pack sizes and surcharges. Pull the purchase order list, price schedules and invoices, then audit.",
    h1: "Vendor price creep audit for manufacturing companies",
    intro: [
      "Manufacturing payables are price-sensitive in a way that service businesses rarely are. A single component can carry a contract price, a surcharge line, a tooling charge and a unit-of-measure conversion, and a supplier can raise the payable rate without changing the invoice layout.",
      "Catching that drift needs the purchase order list, the supplier price schedule and the invoice history side by side. This page covers the files a manufacturing finance team already holds, the price patterns that matter, a manual review and where Effluxa fits.",
    ],
    sections: [
      {
        heading: "The files a manufacturing finance team already holds",
        body: [
          "Start with 12 months of the purchase ledger as CSV or XLSX, the purchase order list and the supplier contracts or agreed price schedules as PDF. Add goods received notes, the vendor master with payment terms and bank details, and invoice PDFs for the highest-spend suppliers.",
          "Standard cost sheets and bill of materials files show what the business expected to pay, which is often not what the contract says. A supplier portal export is a better source than retyped rates.",
        ],
        bullets: [
          "Purchase ledger export for 12 months as CSV or XLSX",
          "Purchase order list with part numbers and agreed unit prices",
          "Supplier contracts and price schedules as PDF",
          "Goods received notes and delivery tickets",
          "Vendor master with payment terms and bank details",
        ],
      },
      {
        heading: "Where price creep appears in manufacturing payables",
        body: [
          "The plainest pattern is a unit price above the agreed schedule, applied quietly from a set invoice date. The second is a rise larger than the uplift clause allows, or applied before the contract notice period has run.",
          "Less obvious is a change in unit of measure: a pack size falls from 1,000 to 900 while the price holds, so the rate per part rises without a visible price change. Surcharges are the third pattern, where freight, energy, packaging or tooling lines are added after the quote and never challenged.",
          "Related-party suppliers deserve a separate look, because a price change between connected companies rarely goes through the same approval as an open-market purchase.",
        ],
      },
      {
        heading: "A manual price creep review a finance lead can run",
        body: [
          "Build a price history for the top 50 part numbers by annual spend: one row per invoice date, with unit price, quantity, unit of measure and any surcharge lines. Keep the currency and incoterm in the row, because a move from delivered to ex-works looks like a price change.",
          "Compare each change with the contract schedule and the notice period. Flag rises larger than the clause allows, changes that precede the contract date, and any unit-of-measure change. Then extend the check to every supplier above a spend threshold you choose.",
          "Record each exception with the invoice number, part number and clause reference. Without a clause reference, the supplier conversation becomes an opinion.",
        ],
      },
      {
        heading: "Where Effluxa fits, and where it does not",
        body: [
          "Effluxa runs 32 deterministic rules on uploaded PDF, CSV, XLSX and XLS files, with no integration and no bank connection. The rules include vendor price increases, related-party price changes, duplicate payments, split invoices and vendor bank-detail changes before payment. Findings are ranked with the top 3 actions first, and each carries the source page or row, confidence and calculation basis.",
          "Effluxa cannot judge contract terms it cannot see. If the price schedule or the uplift clause is not in the uploaded files, a finding can only show that the price changed. It does not do bookkeeping, does not replace an audit opinion, does not confirm fraud and does not guarantee savings.",
          "Whether a clause was breached is a commercial or legal judgement. Whether a set of invoices is worth investigating is a question files can answer, so start with the free check at /instant. The Full AI Audit is €149 one-off, Pro is €99 per month and Agency is €399 per month, priced per firm.",
        ],
      },
    ],
    faq: [
      {
        q: "How much invoice history is needed?",
        a: "Twelve months covers a full purchasing cycle and is enough to see a price change repeat. Two years is better where contracts run on annual uplifts, because it shows whether a rise was applied twice.",
      },
      {
        q: "Can Effluxa compare supplier prices with our purchase orders?",
        a: "Yes, when both the invoice data and the purchase order list are uploaded. The finding shows the rows behind the difference, with confidence and calculation basis, so the buyer can check the part number first.",
      },
      {
        q: "What if the contract is not written down?",
        a: "Then the review can show that the price changed and by how much, but not whether the change was permitted. Verbal agreements and side letters need documenting before a price review can conclude anything.",
      },
      {
        q: "Does this replace our standard costing process?",
        a: "No. Effluxa screens uploaded files for leakage signals. Standard costing, variance analysis and stock valuation remain with the finance team, and Effluxa does not produce accounts or an audit opinion.",
      },
    ],
  },
  {
    slug: "duplicate-payment-review-for-professional-services-firms",
    type: "use-case",
    title: "Duplicate Payment Review for Professional Firms | Effluxa",
    description:
      "Firms pay counsel, expert and contractor invoices twice through separate matter codes. Pull the AP ledger, payment runs and matter mapping, then check.",
    h1: "Duplicate payment review for professional services firms",
    intro: [
      "Professional services firms pay for counsel, experts, contractors and disbursements, and often recharge those costs to clients at the same time. The accounts get tangled: an invoice can be paid twice through two matter codes, or a disbursement can be recharged to a client while the supplier invoice also sits unpaid in payables.",
      "Duplicate payment review here is mostly a matter of names and references. This page covers the files a practice already holds, the patterns that matter, a manual procedure and where Effluxa fits.",
    ],
    sections: [
      {
        heading: "The files a professional services firm already holds",
        body: [
          "Pull 12 months of the AP ledger as CSV or XLSX, the payment run or BACS listing, supplier and counsel invoices as PDF, and the vendor master with bank details and payment terms. Add expense claim exports, credit notes and any matter or engagement code mapping.",
          "The mapping is what makes the review possible, because a duplicate can look like two legitimate payments until the matter codes are visible. Where disbursements are recharged, the disbursement ledger or billing system export is essential.",
        ],
        bullets: [
          "AP ledger export for 12 months",
          "Payment run and BACS listing",
          "Counsel, expert and supplier invoices as PDF",
          "Vendor master with bank details",
          "Expense claim export",
          "Matter or engagement code mapping",
          "Disbursement ledger or billing export",
        ],
      },
      {
        heading: "Leakage patterns specific to professional services",
        body: [
          "Duplicate counsel or expert invoices are the first pattern, often where the same chambers invoice is paid through two matter codes. The second is a payment made twice in consecutive runs because the first was never cleared against the invoice.",
          "Disbursement leakage is specific to this sector: a supplier cost is recharged to a client and also paid from the firm's own account with no recovery, or a credit note from counsel arrives and is never applied.",
          "Split invoices that stay under partner approval limits, duplicate expense claims across matters, and bank-detail changes on contractor records complete the list. Third-party costs carry more duplicate risk than time-based fees.",
        ],
      },
      {
        heading: "A manual duplicate payment review a practice can run",
        body: [
          "Normalise supplier names first, stripping LLP, Ltd, Chambers and punctuation. Then match on three keys in order: invoice reference, amount with a date within 30 days, and amount within the same matter code. Record which key matched, because each needs different evidence to resolve.",
          "Reconcile the payment run to the ledger for the top 50 suppliers, and confirm that every credit note has been applied. Review disbursements and check that each supplier cost recharged to a client has a matching payment and no open balance.",
          "Finish with approval thresholds: list every invoice within 10 per cent below the partner limit and look for repeated suppliers.",
        ],
      },
      {
        heading: "Where Effluxa fits, and where it does not",
        body: [
          "Effluxa runs 32 deterministic rules on uploaded PDF, CSV, XLSX and XLS files with no integration. The rules include duplicate payments, split invoices, vendor bank-detail changes before payment, AR/AP aging and concentration, and travel and expense policy exceptions. Findings are ranked with the top 3 actions first, and each carries the source page or row, confidence and calculation basis.",
          "Effluxa does not do bookkeeping and does not reconcile the matter ledger. It cannot tell whether a disbursement is recoverable from a client, because that depends on the engagement letter, so where letters are not uploaded a finding can only flag the pattern and not the entitlement. It does not replace an audit opinion, does not confirm fraud and does not guarantee recovery.",
          "Whether a recharge is permitted is a question for the engagement partner. Whether a set of invoices is worth checking is a question files can answer, so start with the free check at /instant. The Full AI Audit is €149 one-off, Pro is €99 per month and Agency is €399 per month, priced per firm.",
        ],
      },
    ],
    faq: [
      {
        q: "How far back should the payment history go?",
        a: "Twelve months covers a normal billing cycle, and duplicates often repeat at the same point each year, so two years is better where available. Upload monthly files rather than one annual summary so date patterns stay visible.",
      },
      {
        q: "Can Effluxa match disbursements to client recharges?",
        a: "It compares the disbursement and billing files you upload and flags mismatches with evidence. It cannot decide whether a cost is recoverable, because that depends on the engagement terms.",
      },
      {
        q: "What if suppliers invoice under different trading names?",
        a: "Upload the vendor master with the review, because it records the trading names behind each supplier account. Where a group invoices through several entities, the finding shows the evidence so a reviewer can decide.",
      },
      {
        q: "Do we need to connect the practice management system?",
        a: "No. Effluxa is file-first: PDF, CSV, XLSX or XLS. There is no integration, bank connection or onboarding project, so a single matter or a whole office can be reviewed from exports.",
      },
    ],
  },
  {
    slug: "payroll-overtime-anomaly-review-for-hospitality-groups",
    type: "use-case",
    title: "Payroll Overtime Anomaly Review for Hospitality | Effluxa",
    description:
      "Hospitality overtime drifts when rotas, timesheets and payroll are never joined. Pull the payroll export, rota and staff list, then review the exceptions.",
    h1: "Payroll overtime anomaly review for hospitality groups",
    intro: [
      "Hospitality payroll runs on rotas, not standard hours. Kitchens, bars and front-of-house teams work split shifts, cover absences and pick up overtime at short notice, and the payroll export often lands before anyone has reconciled it to the rota. That gap is where overtime anomalies sit.",
      "Reviewing it needs the rota, the timesheets and the payroll export side by side. This page covers the files a hospitality group already holds, the overtime patterns worth checking, a manual procedure and where Effluxa fits.",
    ],
    sections: [
      {
        heading: "The files a hospitality group already holds",
        body: [
          "Export the payroll journal or payroll summary by employee and period, the rota or scheduling export, timesheets or clock-in data, and the staff list from HR with contract type, contracted hours, start date and leave dates. Add tip and service charge distribution records, the bank payment listing and agency staff invoices.",
          "The staff list matters more than it looks. Overtime for a leaver, or for someone whose contracted hours changed, only becomes visible when the contract data sits beside the payroll row.",
        ],
        bullets: [
          "Payroll journal by employee and period",
          "Rota or scheduling export",
          "Timesheet or clock-in data",
          "Staff list with contracted hours and leave dates",
          "Tip and service charge distribution records",
          "Bank payment listing",
          "Agency staff invoices",
        ],
      },
      {
        heading: "Overtime patterns that matter in hospitality",
        body: [
          "Repeated overtime for the same people is the first pattern, particularly where overtime appears every week at a similar level, which usually means the rota is understaffed rather than the work being exceptional. Overtime on days not rostered, or during approved leave, is the second.",
          "Rate anomalies are the third: overtime paid at the wrong multiplier, or premium rates applied to hours already paid at a premium. Duplicate shift entries, overtime for leavers and agency hours billed for shifts the rota already covered follow.",
          "Tip and service charge distributions belong in the same review, because a distribution that does not match the hours or the tronc policy produces the same kind of leak as an overtime error.",
        ],
      },
      {
        heading: "A manual overtime review for a finance lead",
        body: [
          "Start with one pay period, not a year. Join the payroll rows to the rota by employee and date, and calculate the gap between paid hours and rostered hours. List everyone whose overtime exceeds the threshold you set, then compare the last six periods to see whether the pattern is growing or flat.",
          "Sample the top 20 overtime payments and trace each to a timesheet and a supervisor approval. Check the multiplier against the contract and the rate table, and confirm that nobody on leave received overtime.",
          "Compare agency invoices to the rota for the same period. Where an agency shift covers a gap that a rostered employee also worked, that is worth a conversation before the next invoice is paid.",
        ],
      },
      {
        heading: "Where Effluxa fits, and where it does not",
        body: [
          "Effluxa runs 32 deterministic rules on uploaded PDF, CSV, XLSX and XLS files with no integration. The rules include overtime exceptions, duplicate payments, travel and expense policy exceptions and vendor price increases. Findings are ranked with the top 3 actions first, and each carries the source page or row, confidence and calculation basis.",
          "Effluxa does not verify attendance and does not replace payroll software. It cannot judge whether an overtime rate is correct under an employment contract it cannot see, and it does not calculate statutory pay, holiday accrual or national insurance. It is not an audit opinion and does not confirm fraud.",
          "Where a finding depends on a contractual entitlement or a tronc policy, that judgement stays with payroll and HR. Where the question is which periods and people to look at first, start with the free check at /instant. The Full AI Audit is €149 one-off, Pro is €99 per month and Agency is €399 per month, priced per firm.",
        ],
      },
    ],
    faq: [
      {
        q: "Can Effluxa read PDF rotas?",
        a: "Yes. PDF, CSV, XLSX and XLS are all accepted, so a rota exported as PDF or a scheduling system CSV can both be uploaded with the payroll journal.",
      },
      {
        q: "Do we need to upload every site?",
        a: "Upload what covers the question. If the payroll and rota exports carry a site or department field, the findings can be reviewed site by site, which suits a group with different trading patterns.",
      },
      {
        q: "Will it detect overtime fraud?",
        a: "No. It flags anomalies and shows the evidence behind each one. Someone still has to check the timesheet, the approval and the contract before any conclusion is drawn.",
      },
      {
        q: "What about agency staff?",
        a: "Upload the agency invoices alongside the rota. The rules cover duplicate payments and vendor price increases, which is where agency billing errors usually appear.",
      },
    ],
  },
  {
    slug: "accounts-receivable-leakage-review-for-distribution-businesses",
    type: "use-case",
    title: "Accounts Receivable Leakage Review for Distributors | Effluxa",
    description:
      "Distribution cash leaks through unmatched credit notes, over-claimed rebates and unapplied receipts. Pull the sales ledger, aging and customer master.",
    h1: "Accounts receivable leakage review for distribution businesses",
    intro: [
      "A distribution business sells on credit to trade customers, and cash leaks in the gap between what is invoiced, what is credited and what is collected. Credit notes raised without a return, discounts applied past the agreed terms, rebates paid twice and receipts never allocated all reduce the same working capital line.",
      "The review starts from the AR ledger and the customer master. This page covers the files a distributor already holds, the leakage patterns that matter, a manual procedure and where Effluxa fits.",
    ],
    sections: [
      {
        heading: "The files a distribution business already holds",
        body: [
          "Export 12 months of the sales ledger and the AR aging report as CSV or XLSX, the customer master with credit terms and credit limits, and the credit note and returns register. Add the price list or discount matrix, delivery notes, the bank receipt listing and rebate agreements as PDF.",
          "The aging report alone is not enough. Leakage sits in the detail behind the buckets: which credit notes were raised, which receipts were never allocated, and which customers are past terms without a hold on the account.",
        ],
        bullets: [
          "Sales ledger for 12 months as CSV or XLSX",
          "AR aging report",
          "Customer master with terms and credit limits",
          "Credit note and returns register",
          "Price list or discount matrix",
          "Delivery notes",
          "Bank receipt listing",
          "Rebate and discount agreements as PDF",
        ],
      },
      {
        heading: "Where receivables leak in distribution",
        body: [
          "Credit notes without a matching return are the clearest pattern, followed by credit notes raised repeatedly for the same customer and reason. Discounts applied above the agreed rate, or extended beyond the period in the agreement, take margin out quietly.",
          "Unapplied cash is common in distribution, because a receipt covering several invoices is often posted to one and the rest stay open. Rebates are the third area: paid twice, paid on sales later credited, or calculated on the wrong volume band.",
          "Customer concentration and aging beyond terms belong in the same review, not as fraud signals, but because they change how much of the ledger is realistically collectable and how much credit the business should extend.",
        ],
      },
      {
        heading: "A manual receivables review a finance lead can run",
        body: [
          "Age the ledger by customer and invoice, then reconcile receipts to invoices for the top 20 customers. Every open item older than the agreed terms needs a reason, not just a bucket. Match credit notes to returns or delivery notes, and list every credit note above a threshold with no supporting return.",
          "Recompute discounts and rebates for a sample of invoices against the agreement, including the period and the volume band. Then compare the customer master with the ledger: a credit limit below the outstanding balance, or terms that do not match invoice due dates, is a control finding.",
          "Close with the ten largest unallocated receipts and the ten oldest disputes. Those two lists are where the cash is.",
        ],
      },
      {
        heading: "Where Effluxa fits, and where it does not",
        body: [
          "Effluxa runs 32 deterministic rules on uploaded PDF, CSV, XLSX and XLS files with no integration. The rules include AR/AP aging and concentration, duplicate payments, split invoices, vendor price increases and related-party price changes. Findings are ranked with the top 3 actions first, and each carries the source page or row, confidence and calculation basis.",
          "Effluxa does not chase debt, does not run credit control and does not agree payment plans. It cannot confirm that a balance is collectable, because that depends on the customer's circumstances. Where rebate agreements are not uploaded it cannot judge whether a rebate was calculated correctly, so the finding stops at the pattern.",
          "It is not an audit opinion, the findings are review signals and no recovery is guaranteed. Enforcement and legal recovery are for your credit and legal teams. Where the question is which accounts to review first, start with the free check at /instant. The Full AI Audit is €149 one-off, Pro is €99 per month and Agency is €399 per month, priced per firm.",
        ],
      },
    ],
    faq: [
      {
        q: "Can Effluxa age the ledger for us?",
        a: "The aging rule works from the aging file and ledger you upload and flags the accounts and items worth reviewing. It does not replace your ledger or produce statutory reports.",
      },
      {
        q: "Do we need the rebate agreements?",
        a: "Yes, if you want a view on whether a rebate was calculated correctly. Without the agreement in the files, the finding can show the payment pattern but not the entitlement.",
      },
      {
        q: "What if receipts are split across many invoices?",
        a: "That is the unapplied cash pattern. Upload the receipt listing with the ledger so the rule can compare receipts with open invoices and show which ones were never allocated.",
      },
      {
        q: "Can we use it for a credit review of a customer?",
        a: "It flags concentration and aging with evidence, which helps the conversation. The credit decision itself stays with the business.",
      },
    ],
  },
  {
    slug: "supplier-bank-detail-change-review-for-construction-firms",
    type: "use-case",
    title: "Supplier Bank Detail Change Review for Contractors | Effluxa",
    description:
      "One bank-detail change before a subcontractor payment run can move a large sum. Pull the vendor master, change log and payment history, then check each.",
    h1: "Supplier bank detail change review for construction firms",
    intro: [
      "Construction payments move in large lump sums to subcontractors, plant hire firms and materials suppliers. A bank-detail change on one of those accounts, made shortly before a payment run, is among the most expensive control gaps a contractor can have, because the money leaves before anyone notices the account is wrong.",
      "Reviewing it does not need bank access. It needs the vendor master, the change log and the payment history. This page covers the files, the patterns specific to construction, a manual procedure and where Effluxa fits.",
    ],
    sections: [
      {
        heading: "The files a construction firm already holds",
        body: [
          "Pull the vendor master with current bank details and any change log or audit trail, 12 months of the AP ledger as CSV or XLSX, and the payment run or BACS listings. Add supplier statements, remittance advices, subcontractor invoices and the purchase order list.",
          "Where the change was requested by email, the email trail matters. A PDF of the request with the sender, date and account details is often the only evidence of how the change was verified.",
        ],
        bullets: [
          "Vendor master with current bank details",
          "Bank-detail change log or audit trail",
          "AP ledger for 12 months",
          "Payment run or BACS listings",
          "Subcontractor and supplier invoices as PDF",
          "Supplier statements and remittance advices",
          "Email requests for changes saved as PDF",
        ],
      },
      {
        heading: "The patterns that matter before a payment run",
        body: [
          "A change on a high-value subcontractor shortly before a payment is the first pattern. The second is a duplicate vendor record: the same supplier entered twice, one record holding the old account and one the new, so payments split between them.",
          "Changes to an account in a different country or at a different bank are worth checking every time. So are changes with no callback record, changes made by someone other than the usual contact, and payments that continue to the old account after the change.",
          "Retention and final-account payments deserve separate attention, because the sums are large and the timing is predictable.",
        ],
      },
      {
        heading: "A manual bank-detail review a finance lead can run",
        body: [
          "List every bank-detail change in the last 12 months with the date, the user, the before and after details and the evidence of verification. Match each change to payments in the following 30 days and rank by value.",
          "For the top changes, confirm the verification method: a callback to a known number, a bank letter, or a portal confirmation. A change verified only by an email reply is a control exception, even if the payment reached the right place.",
          "Then search the vendor master for duplicates by name, address and tax reference, and compare bank details across records. Finish with a sample of payments to suppliers whose details changed in the same month as their first invoice.",
        ],
      },
      {
        heading: "Where Effluxa fits, and where it does not",
        body: [
          "Effluxa runs 32 deterministic rules on uploaded PDF, CSV, XLSX and XLS files with no integration. The rules include vendor bank-detail changes before payment, duplicate payments, split invoices and vendor price increases. Findings are ranked with the top 3 actions first, and each carries the source page or row, confidence and calculation basis.",
          "Effluxa cannot verify that an account belongs to the supplier. It does not call the bank, does not block a payment and does not replace a payment control. Where the change log is not in the uploaded files, the rule can compare records but cannot establish when a change happened.",
          "It is not an audit opinion and does not confirm fraud. A finding is a reason to pick up the phone, not a conclusion, and if a payment has already left, recovery is a matter for your bank and legal advisers. Where the question is which changes to check first, start with the free check at /instant. The Full AI Audit is €149 one-off, Pro is €99 per month and Agency is €399 per month, priced per firm.",
        ],
      },
    ],
    faq: [
      {
        q: "Do we need the change log?",
        a: "It makes the review far more useful. Without it, Effluxa can compare the current vendor master with the payment history but cannot show when the details changed.",
      },
      {
        q: "Can it spot duplicate supplier records?",
        a: "It compares names, addresses and bank details across the vendor master you upload and flags matches for review. A human decides whether the duplicate is a genuine second entity or a control failure.",
      },
      {
        q: "Is a bank-detail change always a problem?",
        a: "No. Suppliers change banks legitimately. The question is whether the change was verified independently before the next payment, which is why the callback evidence matters.",
      },
      {
        q: "Does Effluxa connect to our bank?",
        a: "No. It is file-first: PDF, CSV, XLSX or XLS. There is no integration, bank connection or onboarding project.",
      },
    ],
  },
  {
    slug: "inventory-write-off-review-for-retail-smes",
    type: "use-case",
    title: "Inventory Write-Off Review for Retail SMEs | Effluxa",
    description:
      "Retail write-offs hide in repeated SKUs, split approvals and provisions without a count. Pull the stock ledger, write-off schedule and count sheets.",
    h1: "Inventory write-off review for retail SMEs",
    intro: [
      "Retail stock is written off for damage, theft, obsolescence and supplier returns, and each write-off looks reasonable on its own. The review question is whether the pattern holds together: the same SKU written off every month, entries held just below an approval limit, or a provision that moves without a stock count behind it.",
      "The evidence sits in the stock ledger, the write-off schedule and the count sheets. This page covers the files a retail finance team holds, the patterns that matter, a manual procedure and where Effluxa fits.",
    ],
    sections: [
      {
        heading: "The files a retail SME already holds",
        body: [
          "Export the stock ledger or inventory report as CSV or XLSX, the write-off and adjustment schedules, stock count sheets and shrinkage reports. Add purchase invoices, supplier credit notes and returns records, the provision schedule, and the sales and returns export.",
          "If the business runs a stock system, export the adjustment journal rather than a summarised shrinkage figure. The summary hides the individual entries that make a review possible.",
        ],
        bullets: [
          "Stock ledger or inventory report as CSV or XLSX",
          "Write-off and stock adjustment schedules",
          "Stock count sheets and shrinkage reports",
          "Purchase invoices and supplier credit notes",
          "Returns records",
          "Provision schedule",
          "Sales and returns export",
        ],
      },
      {
        heading: "Where write-offs leak in retail",
        body: [
          "Repeated write-offs on the same SKU are the first pattern. If a product is written off every month for damage, either the handling or the buying is wrong and the write-off is covering it. Split write-offs below an approval threshold are the second, and they show up as clusters just under the limit.",
          "The third is a write-off with no count reference. Provisions that move without a stock count, provisions reversed and rebooked in the next period, and supplier credits never claimed for damaged deliveries all reduce the same margin.",
          "Seasonal stock needs its own review, because the end of a season produces a legitimate spike that can hide entries made for other reasons.",
        ],
      },
      {
        heading: "A manual write-off review a finance lead can run",
        body: [
          "Start with the write-off schedule for 12 months: date, SKU, quantity, value, reason and approver. Group by SKU and month, and list every SKU written off in four or more periods. Then list entries within 10 per cent of the approval threshold, because clustering there is a control signal.",
          "Tie the largest write-offs to stock count sheets and the adjustment journal. For damaged goods, check whether a supplier credit note was claimed. Compare the provision movement with the count results and the prior year, and ask for the reason behind every reversal.",
          "Close with a stock ageing view: how much inventory has not sold in 90 or 180 days, and how that compares with the provision. That is the number a lender or accountant will ask about.",
        ],
      },
      {
        heading: "Where Effluxa fits, and where it does not",
        body: [
          "Effluxa runs 32 deterministic rules on uploaded PDF, CSV, XLSX and XLS files with no integration. The rules include inventory provision and write-off, duplicate payments, vendor price increases and split invoices. Findings are ranked with the top 3 actions first, and each carries the source page or row, confidence and calculation basis.",
          "Effluxa does not count stock and cannot confirm that inventory exists. It does not value inventory under accounting standards and does not prepare statutory accounts. It cannot tell whether a write-off was commercially justified, only that the pattern matches something worth reviewing.",
          "It is not an audit opinion and does not confirm fraud. Counts, valuation and provisioning judgements stay with the finance team and the auditor. Where the question is which write-offs to review before the year closes, start with the free check at /instant. The Full AI Audit is €149 one-off, Pro is €99 per month and Agency is €399 per month, priced per firm.",
        ],
      },
    ],
    faq: [
      {
        q: "What if write-offs exist only in the stock system?",
        a: "Export the adjustment journal as CSV or XLSX. Without the individual entries, a review can only see summarised totals, which limits what any analysis can show.",
      },
      {
        q: "Can Effluxa value obsolete stock?",
        a: "No. It flags provision and write-off patterns. Valuing stock and setting a provision remain accounting judgements for the finance team.",
      },
      {
        q: "Do we need 12 months of data?",
        a: "Twelve months is the useful baseline, and two seasons are better where the business has strong seasonal peaks, because a single season of write-offs is hard to interpret.",
      },
      {
        q: "Does it replace a stock count?",
        a: "No. A stock count establishes what exists. Effluxa reviews the records after the count to see whether the adjustments follow a pattern worth investigating.",
      },
    ],
  },
  {
    slug: "pre-loan-financial-file-review-for-sme-owners",
    type: "use-case",
    title: "Pre-Loan Financial File Review for SME Owners | Effluxa",
    description:
      "Lenders ask for a financial file that holds together. Pull management accounts, ledgers, bank statements and loan agreements, then review before applying.",
    h1: "Pre-loan financial file review for SME owners",
    intro: [
      "A lender will ask an SME owner for a financial file: management accounts, a trial balance, aged debtors and creditors, bank statements, payroll, existing debt and any loan agreements with covenants. Most owners find the numbers are broadly right but the supporting file does not hold together under questioning.",
      "A pre-loan review is not an audit and does not guarantee a decision. It is a check of the file for inconsistency and leakage before the lender sees it. This page covers what to pull, the patterns lenders probe, a manual procedure and where Effluxa fits.",
    ],
    sections: [
      {
        heading: "The files a lender expects to see",
        body: [
          "Pull the last two years of management accounts and trial balances as XLSX, the AP and AR ledgers and aging reports, 12 months of bank statements in CSV, the payroll summary and the fixed asset register. Add existing loan and facility agreements as PDF, the debt repayment schedule, VAT returns and tax returns.",
          "The loan agreements matter because covenant tests are defined in them. Without the agreement, a covenant review has nothing to test against.",
        ],
        bullets: [
          "Management accounts and trial balances",
          "AP and AR ledgers with aging reports",
          "Bank statements for 12 months",
          "Payroll summary and headcount",
          "Fixed asset register",
          "Loan and facility agreements as PDF",
          "Debt repayment schedule",
          "VAT and tax returns",
        ],
      },
      {
        heading: "What lenders and reviewers probe",
        body: [
          "Covenant headroom is the first calculation, so do it on your own file before the lender does. AR aging and customer concentration affect the lending case directly, because a balance that will not collect is not cash.",
          "On the payables side, duplicate payments and unrecorded liabilities change the numbers: an invoice received but absent from the ledger, or a supplier statement that disagrees with the creditor balance. Related-party payments and director loan movements are asked about in every lending interview.",
          "FX exposure on foreign-currency purchases or debt, and payroll costs that do not reconcile to headcount, round out the file.",
        ],
      },
      {
        heading: "A manual pre-loan review before you apply",
        body: [
          "Reconcile the trial balance to the ledgers and the bank statements. Age the debtors and creditors, and list every balance over 60 days with a reason. Recalculate the covenant metrics from the agreement definitions, using the same period the lender will use.",
          "List payments to related parties and directors for the last 24 months with a one-line explanation each. Compare the management accounts to the source ledgers for the three largest cost lines, because that is where differences usually appear.",
          "Finish with a two-page summary: what the numbers are, what changed, what is unusual and how it is explained. Lenders respond better to a disclosed item than to one they find themselves.",
        ],
      },
      {
        heading: "Where Effluxa fits, and where it does not",
        body: [
          "Effluxa runs 32 deterministic rules on uploaded PDF, CSV, XLSX and XLS files with no integration. The rules include debt covenants, AR/AP aging and concentration, duplicate payments, related-party price changes, FX exposure and travel and expense policy exceptions. Findings are ranked with the top 3 actions first, and each carries the source page or row, confidence and calculation basis.",
          "Effluxa does not prepare accounts, does not provide lending or financial advice and does not guarantee that a facility will be approved. It cannot assess creditworthiness. It cannot judge covenant definitions it cannot see, so the loan agreement has to be uploaded for the covenant check to mean anything.",
          "It is not an audit opinion and does not confirm fraud, and the lender's decision rests on their own assessment. Where the question is whether the file is consistent before it goes out, start with the free check at /instant. The Full AI Audit is €149 one-off, Pro is €99 per month and Agency is €399 per month, priced per firm.",
        ],
      },
    ],
    faq: [
      {
        q: "Will a review improve our chances of approval?",
        a: "It removes surprises, which helps a conversation, but no review can guarantee a credit decision. Lending depends on the lender's own assessment of risk.",
      },
      {
        q: "Do we need audited accounts?",
        a: "No. A pre-loan review works from management files. The accountant prepares the accounts and any audit opinion remains separate from this review.",
      },
      {
        q: "What if we have no formal covenant?",
        a: "Then the review focuses on aging, concentration and payables patterns instead. Where a facility agreement exists, upload it so the covenant rule has something to test.",
      },
      {
        q: "Can the lender see the findings?",
        a: "Only if you share them. The findings are yours to use for preparation and for cleaning the file before submission.",
      },
    ],
  },
  {
    slug: "year-end-control-review-for-bookkeepers",
    type: "use-case",
    title: "Year-End Control Review for Bookkeepers | Effluxa",
    description:
      "Year-end queries usually come from patterns already in the ledger. Pull the trial balance, ledgers, accruals schedule and bank reconciliations, then review.",
    h1: "Year-end control review for bookkeepers",
    intro: [
      "Year-end work for a bookkeeper is a sequence of reconciliations: bank, debtors, creditors, accruals, prepayments, VAT and fixed assets. A control review sits alongside and asks a different question: does the year's transaction data contain patterns that will become a query after the accounts are finalised?",
      "Running that review before the accountant closes the year saves corrections and awkward client conversations. This page covers the files a bookkeeper already holds, the patterns worth finding, a manual procedure and where Effluxa fits.",
    ],
    sections: [
      {
        heading: "The files a bookkeeper already holds",
        body: [
          "Export the trial balance, AP and AR ledgers, bank reconciliations and statements, expense exports and the vendor master. Add payroll journals, accruals and prepayments schedules, the fixed asset register, VAT returns and the prior-year accounts as PDF.",
          "The prior year matters because a pattern that repeats across two years is a control finding rather than a one-off posting error. Where the client's accountant works from a different ledger, ask for the export they use.",
        ],
        bullets: [
          "Trial balance and prior-year accounts",
          "AP and AR ledgers",
          "Bank reconciliations and statements",
          "Expense exports",
          "Vendor master with bank details",
          "Payroll journals",
          "Accruals and prepayments schedules",
          "Fixed asset register and VAT returns",
        ],
      },
      {
        heading: "Patterns to find before the year closes",
        body: [
          "Duplicate payments and split invoices across the year are the most common finds, and they are easiest to deal with before the year closes. Vendor bank-detail changes before payment, particularly in the final quarter, come next.",
          "Accruals and prepayments are where year-end errors cluster: an accrual released without a matching invoice, a prepayment not amortised, or the same cost accrued twice. Expense policy exceptions and supplier statements that disagree with the creditor listing complete the list.",
          "Cut-off is the other classic: invoices dated after the year end but booked into the year, or goods received before it with no invoice recorded.",
        ],
      },
      {
        heading: "A manual year-end control review",
        body: [
          "Reconcile the bank for every month, not just the last one, because an unreconciled item in month four is still sitting there at year end. Then scan the ledger for duplicate invoice numbers and amounts within 30 days.",
          "Review the accruals and prepayments line by line against supporting invoices, and check that each balance was released in the right period. Reconcile the top 20 supplier statements to the creditor listing.",
          "Finish with a cut-off sample around the year-end date and an exceptions log with a document reference for each item. Send the client questions early enough that the answers land before the accountant's deadline.",
        ],
      },
      {
        heading: "Where Effluxa fits, and where it does not",
        body: [
          "Effluxa runs 32 deterministic rules on uploaded PDF, CSV, XLSX and XLS files with no integration. The rules include duplicate payments, split invoices, vendor bank-detail changes before payment, travel and expense policy exceptions and AR/AP aging. Findings are ranked with the top 3 actions first, and each carries the source page or row, confidence and calculation basis.",
          "Effluxa is not bookkeeping or accounting software. It does not post journals, correct mispostings or prepare statutory accounts, and it does not replace the accountant's judgement or an audit opinion. It cannot tell whether an accrual is correct without the supporting invoice in the files.",
          "Findings are review signals, not confirmed errors. Where the question is the treatment of a specific balance, that belongs to the client's accountant. Where the question is which entries to review before the year closes, start with the free check at /instant. The Full AI Audit is €149 one-off, Pro is €99 per month and Agency is €399 per month, priced per firm.",
        ],
      },
    ],
    faq: [
      {
        q: "Can Effluxa check accruals and prepayments?",
        a: "It works from the schedules and invoices you upload and flags movements that look inconsistent. Whether an accrual is correct is an accounting judgement.",
      },
      {
        q: "Does it replace the year-end accounts?",
        a: "No. It screens the files for patterns before the accountant prepares the accounts. It is not accounting software and does not produce statutory accounts.",
      },
      {
        q: "What do we upload for a client with a small ledger?",
        a: "The trial balance, both ledgers, the bank reconciliation and the vendor master are enough to start. The free check at /instant shows a score, a risk level and the top 3 findings from those files.",
      },
      {
        q: "Can we run it for many clients?",
        a: "Yes, and pricing is per firm rather than per seat: the Full AI Audit is €149 one-off, Pro is €99 per month and Agency is €399 per month.",
      },
    ],
  },
];
