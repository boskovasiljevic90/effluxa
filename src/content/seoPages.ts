export type SeoPage = {
  slug: string;
  type: "comparison" | "use-case";
  title: string;
  description: string;
  h1: string;
  intro: string[];
  sections: { heading: string; body: string[]; bullets?: string[] }[];
  faq: { q: string; a: string }[];
};

export const SEO_PAGES: SeoPage[] = [
  {
    slug: "effluxa-vs-datasnipper",
    type: "comparison",
    title: "Effluxa vs DataSnipper: Audit Scope and Pricing | Effluxa",
    description:
      "DataSnipper speeds up workpaper sampling inside Excel. Effluxa audits uploaded finance files for leakage across 32 rules. Compare scope and pricing.",
    h1: "Effluxa vs DataSnipper: different jobs, different pricing models",
    intro: [
      "DataSnipper and Effluxa both sit close to the audit workflow, but they do different jobs. DataSnipper is an Excel and audit add-in that helps audit teams sample workpapers and document evidence faster. Effluxa is file-first: you upload PDF, CSV, XLSX or XLS files, and 32 deterministic financial-control rules run against them, with the top 3 actions ranked first.",
      "The comparison that matters is scope and pricing model. DataSnipper is priced per seat at €49 to €129 per user per month and is built around workpaper sampling. Effluxa is priced per firm, from a free file check to €399 per month for agencies handling client files, with no integration or onboarding project.",
    ],
    sections: [
      {
        heading: "What DataSnipper is built for",
        body: [
          "DataSnipper is an Excel add-in used by audit teams for workpaper sampling, tick marks, cross-references and evidence extraction. Its value shows up when the deliverable is an audit file built in Excel and the team needs to document sample selections quickly.",
          "That is a workpaper and documentation layer. It is designed around sampling inside existing spreadsheets rather than running a full file set against a library of financial-control rules and returning ranked leakage findings.",
          "If the bottleneck in your team is documenting sample work inside Excel, DataSnipper addresses that bottleneck directly and is a fair choice for that job.",
        ],
      },
      {
        heading: "What Effluxa is built for",
        body: [
          "Effluxa starts from files, not systems. Upload the AP ledger as CSV, the vendor master as XLSX, expense exports, trial balances or invoice PDFs, and the audit runs without a bank connection, an integration or a project plan.",
          "The 32 rules sit in 9 categories, including duplicate payments, split invoices, vendor bank-detail changes before payment, vendor price increases, software licence waste and tool overlap, and travel and expense policy exceptions.",
          "Output is a short ranked list with the top 3 actions first. Each finding carries source evidence on the page or row, confidence and calculation basis. Treat each as a review signal rather than confirmed fraud, and not as an audit opinion.",
        ],
      },
      {
        heading: "Pricing models compared",
        body: [
          "DataSnipper is charged per user, at €49 to €129 per user per month depending on the tier. Cost scales with the number of seats, so a larger audit team pays proportionally more.",
          "Effluxa is priced per firm, not per seat. The free check is €0, the Full AI Audit is €149 one-off, Pro is €99 per month or €990 per year, and Agency is €399 per month or €3,990 per year for unlimited client files up to 100 per month.",
          "Published prices are as seen in November 2026 and should be verified with the vendor.",
        ],
      },
      {
        heading: "When a different tool is the better choice",
        body: [
          "If your team needs to document tick marks, sampling and cross-references inside existing Excel workpapers for a formal audit, DataSnipper is the more direct fit. It is purpose-built for that workpaper layer.",
          "If you need receipt capture, bookkeeping data or management reporting, those are separate categories and better served by tools built for them.",
          "Effluxa is the better fit when the question is what in a set of finance files looks like leakage, and you want an answer from uploaded files without a systems project or a per-seat commitment.",
        ],
      },
    ],
    faq: [
      {
        q: "Does Effluxa replace DataSnipper?",
        a: "No. They solve different problems. DataSnipper supports workpaper sampling inside Excel. Effluxa screens uploaded finance files for leakage patterns and returns ranked findings with evidence. Some teams use both at different stages of the work.",
      },
      {
        q: "Can I upload the same Excel files I use for workpapers?",
        a: "Effluxa accepts XLSX, XLS, CSV and PDF. A formatted sampling workpaper is not the same as a ledger export, so the cleanest input is the underlying transaction and master data rather than the presentation sheet.",
      },
      {
        q: "How does pricing compare for a small audit team?",
        a: "DataSnipper is charged per user, from €49 to €129 per user per month, so a small team pays for each seat. Effluxa Pro is €99 per month for unlimited own audits and is priced per firm. Better value depends on whether you need per-seat workpaper tooling or firm-wide file screening.",
      },
      {
        q: "Do I need an integration to use Effluxa?",
        a: "No. There is no integration, no bank connection and no onboarding project. Upload files and the audit runs. A free file check at /instant returns a score, risk level and top 3 findings without an account.",
      },
    ],
  },
  {
    slug: "effluxa-vs-glean-ai",
    type: "comparison",
    title: "Effluxa vs Glean.ai: File Audit vs Spend Monitoring | Effluxa",
    description:
      "Glean.ai is a US spend-intelligence tool that connects to your accounting system. Effluxa audits uploaded files instead. Compare scope, inputs and pricing.",
    h1: "Effluxa vs Glean.ai: file audit or connected spend intelligence",
    intro: [
      "Glean.ai and Effluxa both look for spend problems, but they start from different places. Glean.ai is a US spend-intelligence product that requires a connection to QuickBooks, Xero or NetSuite. Effluxa is file-first: upload PDF, CSV, XLSX or XLS files and 32 deterministic financial-control rules run, with no integration at any point.",
      "The pricing models diverge too. Glean.ai's basic tier is $295 per month for roughly 35 invoices per month. Effluxa offers a free file check, a €149 one-off audit and per-firm plans at €99 per month for Pro or €399 per month for Agency. The right comparison is your input situation and how many files you need to review.",
    ],
    sections: [
      {
        heading: "How Glean.ai works",
        body: [
          "Glean.ai is aimed at US businesses with cloud accounting. It connects to QuickBooks, Xero or NetSuite and monitors invoice and spend data flowing through that system.",
          "That model depends on the connection being available and on the data sitting in a supported ledger. The $295 basic tier covers roughly 35 invoices per month, so volume and tier choice matter as usage grows.",
          "It suits teams that want continuous spend monitoring inside an integrated stack rather than periodic review of exported files.",
        ],
      },
      {
        heading: "How Effluxa works",
        body: [
          "Effluxa takes uploaded files: vendor invoices as PDF, AP ledgers as CSV, master data and trial balances as XLSX or XLS. Nothing is connected, no bank access is requested and no onboarding project is required.",
          "The 32 rules sit in 9 categories, including duplicate payments, split invoices, vendor bank-detail changes before payment, vendor price increases, and software licence waste and tool overlap.",
          "Output is ranked with the top 3 actions first, and each finding carries source evidence on the page or row, confidence and calculation basis. Each is a prompt to look closer, not a finding of fraud, and Effluxa does not promise savings.",
        ],
      },
      {
        heading: "Scope and pricing compared",
        body: [
          "Glean.ai monitors a connected ledger and its basic tier is $295 per month for roughly 35 invoices per month. Effluxa screens any file set you upload, with a free check, a €149 one-off audit and per-firm monthly plans. Both are decision-support tools rather than audit opinions.",
          "Effluxa pricing is per firm, not per seat: Pro is €99 per month or €990 per year, and Agency is €399 per month or €3,990 per year for unlimited client files up to 100 per month.",
          "Published prices are as seen in November 2026 and should be verified with the vendor.",
        ],
      },
      {
        heading: "When a different tool is the better choice",
        body: [
          "If you run a US business on QuickBooks, Xero or NetSuite and want always-on invoice monitoring inside those systems, Glean.ai is built for that and the connection is the point of the product.",
          "If you want receipt capture, bookkeeping data or statutory audit documentation, other categories of tool fit better than either product.",
          "Effluxa is the better fit when files are the practical input, for example a one-off review, a target company's finance pack, or data that lives in exports rather than a connected ledger.",
        ],
      },
    ],
    faq: [
      {
        q: "Do I need QuickBooks, Xero or NetSuite to use Effluxa?",
        a: "No. Effluxa is file-first. You upload PDF, CSV, XLSX or XLS exports and the audit runs without an integration or bank connection. That makes it usable on data from any accounting system, including systems that Glean.ai does not support.",
      },
      {
        q: "Is Effluxa cheaper than Glean.ai?",
        a: "It depends on volume and fit. Glean.ai's basic tier is $295 per month for roughly 35 invoices per month. Effluxa has a free check, a €149 one-off audit and per-firm plans from €99 per month. Compare the input method and file volume, not just the headline price.",
      },
      {
        q: "Can I compare one period against another with Effluxa?",
        a: "Yes. Pro and Agency plans include recurring comparison, which separates what is new, what is recurring and what is no longer detected versus the prior period. That is different from always-on monitoring inside a connected ledger.",
      },
      {
        q: "What do I get from the free file check?",
        a: "The free check at /instant returns a score, a risk level and the top 3 findings with no account needed. It is a fast way to see whether a file set is worth a fuller audit.",
      },
    ],
  },
  {
    slug: "effluxa-vs-dext",
    type: "comparison",
    title: "Effluxa vs Dext: Leakage Audit vs Receipt Capture | Effluxa",
    description:
      "Dext captures receipts and expense data for bookkeepers. Effluxa audits uploaded finance files for leakage. Compare what each does, pricing model and fit.",
    h1: "Effluxa vs Dext: leakage audit or receipt capture",
    intro: [
      "Dext and Effluxa are often mentioned in the same conversation by bookkeeping teams, but they do different jobs. Dext captures receipts and expenses and pushes bookkeeping data into accounting systems. Effluxa uploads finance files and screens them for leakage such as duplicates, split invoices, bank-detail changes and vendor price creep.",
      "Dext is priced in the region of $7 to $19 per client per month on partner tiers and is a data-capture product. Effluxa is a screening and decision-support tool priced per firm, from a free check to €399 per month for agencies. Here is how the two compare on inputs, output and price.",
    ],
    sections: [
      {
        heading: "What Dext does",
        body: [
          "Dext captures receipts and expenses, extracts the data and passes bookkeeping-ready information to accountants and bookkeepers. Partner pricing sits in the region of $7 to $19 per client per month.",
          "That is a capture and coding layer. The output is cleaner bookkeeping data, not a ranked leakage finding with evidence, confidence and calculation basis.",
          "For practices whose bottleneck is receipt chasing and data entry, Dext is aimed squarely at that problem and does it well.",
        ],
      },
      {
        heading: "What Effluxa adds",
        body: [
          "Effluxa takes the files a practice already has: AP and AR ledgers as CSV, vendor master as XLSX, invoices as PDF, bank transactions as CSV or XLSX. It runs 32 deterministic financial-control rules across 9 categories with no integration.",
          "Every finding shows source evidence on the page or row, confidence and calculation basis, and the report puts the top 3 actions first. Treat each as a prompt for review rather than a confirmed error, and no recovery is guaranteed.",
          "The output suits a client review conversation: here is what looks unusual, here is the evidence, and here is what to check next.",
        ],
      },
      {
        heading: "Inputs, output and pricing",
        body: [
          "Dext handles receipt and expense capture at roughly $7 to $19 per client per month on partner tiers, priced per client. Effluxa handles file upload and ranked findings: free check €0, Full AI Audit €149 one-off, Pro €99 per month or €990 per year, Agency €399 per month or €3,990 per year for up to 100 client files per month.",
          "Effluxa is priced per firm, not per seat, so adding a reviewer does not add a licence. That matters for a practice where several people look at the same client file.",
          "Published prices are as seen in November 2026 and should be verified with the vendor.",
        ],
      },
      {
        heading: "When a different tool is the better choice",
        body: [
          "If your main need is to capture receipts and get clean data into bookkeeping software, Dext is built for exactly that and is the sensible choice.",
          "If you need an audit opinion or formal statutory audit support, use an audit product designed for that work.",
          "Effluxa fits when you want to screen client finance files for leakage patterns without a data-capture project and without integration, for example before a year-end review or as a periodic check on larger clients.",
        ],
      },
    ],
    faq: [
      {
        q: "Does Effluxa capture receipts?",
        a: "No. Effluxa does not capture or code receipts. It audits files you upload for financial-control leakage, returns ranked findings with source evidence, and is a screening and decision-support tool rather than bookkeeping software.",
      },
      {
        q: "Can I use Dext and Effluxa together?",
        a: "Yes. Many practices would use Dext to capture and clean bookkeeping data, then export the resulting ledgers and run a leakage review in Effluxa. The two sit at different stages and do not overlap in output.",
      },
      {
        q: "How does per-client pricing compare?",
        a: "Dext partner tiers are around $7 to $19 per client per month. Effluxa Agency is €399 per month for unlimited client files up to 100 per month, priced per firm. The fixed Effluxa fee spreads across the portfolio as file volume rises.",
      },
      {
        q: "What file formats does Effluxa accept?",
        a: "PDF, CSV, XLSX and XLS. That covers invoice PDFs, ledger exports, vendor master files and trial balances.",
      },
    ],
  },
  {
    slug: "effluxa-vs-syft",
    type: "comparison",
    title: "Effluxa vs Syft: File Findings vs Firm Dashboards | Effluxa",
    description:
      "Syft builds dashboards and consolidated reports for accounting firms. Effluxa screens uploaded finance files for leakage findings. Compare scope and pricing.",
    h1: "Effluxa vs Syft: leakage findings or firm-wide dashboards",
    intro: [
      "Syft and Effluxa serve accounting firms from different angles. Syft provides analytics and reporting: dashboards and consolidated reporting that give a firm a portfolio-wide view. Effluxa is a file-first leakage audit that returns ranked findings with evidence from uploaded finance files.",
      "One product is about seeing the numbers clearly across many clients. The other is about interrogating a specific file set for patterns that usually cost money. Neither replaces the other, and the choice depends on whether the question in front of you is reporting or review.",
    ],
    sections: [
      {
        heading: "What Syft provides",
        body: [
          "Syft is analytics and reporting for accounting firms. It consolidates client data into dashboards and management reporting so partners and managers can see performance and compare entities across the book.",
          "The value is visibility and presentation across a client portfolio. It is a reporting layer, not a file-upload leakage review that returns findings with page or row evidence and a calculation basis.",
          "Firms reach for reporting tools when the deliverable is a clear management pack or a view across many clients.",
        ],
      },
      {
        heading: "What Effluxa provides",
        body: [
          "Effluxa is the review layer. Upload AP and AR ledgers, the vendor master, expense or payroll exports, or trial balances, and 32 deterministic rules across 9 categories run against the data.",
          "Examples include duplicate payments, split invoices, vendor bank-detail changes before payment, vendor price increases, and software licence waste and tool overlap.",
          "Output is a ranked action list with the top 3 findings first. Every finding shows where it came from, how confident the rule is, and how the figure was calculated. Findings are prompts for a reviewer, not accusations of fraud or a guarantee of savings.",
        ],
      },
      {
        heading: "Pricing and delivery models",
        body: [
          "Syft is a reporting platform for accounting firms, with commercial terms arranged directly with the vendor and no published per-file rate to compare here. The meaningful difference is what the output is for: portfolio reporting versus file-level findings.",
          "Effluxa is priced per firm, not per seat: free check €0, Full AI Audit €149 one-off, Pro €99 per month or €990 per year, and Agency €399 per month or €3,990 per year for unlimited client files up to 100 per month, with white-label PDF, team access, portfolio views and monthly summaries.",
          "Published prices are as seen in November 2026 and should be verified with the vendor.",
        ],
      },
      {
        heading: "When a different tool is the better choice",
        body: [
          "If you need dashboards, consolidated reporting and a portfolio view across clients, Syft is built for that. Effluxa does not replace those reports and does not try to.",
          "If you need formal audit documentation, use an audit workpaper product rather than either of these.",
          "Effluxa fits when you want a review of a specific client file set and a short list of actions, rather than another dashboard to interpret.",
        ],
      },
    ],
    faq: [
      {
        q: "Can Effluxa replace my firm's reporting dashboard?",
        a: "No. Effluxa produces leakage findings from uploaded files, not management reporting dashboards. It does include portfolio views and monthly summaries on the Agency plan, but those are summaries of review activity, not a replacement for consolidated reporting software.",
      },
      {
        q: "Does Effluxa work across a client portfolio?",
        a: "Yes, on the Agency plan. It covers unlimited client files up to 100 per month, white-label PDF output, team access, portfolio views and monthly summaries, and it is priced per firm rather than per seat.",
      },
      {
        q: "What evidence comes with a finding?",
        a: "Each finding carries source evidence on the page or row, a confidence level and the calculation basis, so a reviewer can trace the signal back to the underlying file before acting on it.",
      },
      {
        q: "Is Effluxa an audit opinion?",
        a: "No. Effluxa is a screening and decision-support tool. It is not an audit opinion, not accounting or bookkeeping software, and it does not provide financial, legal or tax advice.",
      },
    ],
  },
  {
    slug: "effluxa-vs-fathom",
    type: "comparison",
    title: "Effluxa vs Fathom: Leakage Findings vs KPI Reports | Effluxa",
    description:
      "Fathom turns accounting data into management reports and KPI analysis. Effluxa audits uploaded files for leakage. Compare scope, output and pricing.",
    h1: "Effluxa vs Fathom: leakage review or management reporting",
    intro: [
      "Fathom and Effluxa both work from finance data, but they answer different questions. Fathom is management reporting and KPI analysis for accountants: reports, trends and commentary that explain how a business is performing. Effluxa asks whether the transaction files contain leakage, and returns ranked findings with evidence.",
      "The distinction is straightforward. Reporting explains the numbers. A leakage review tests the transactions against financial-control rules and points to specific rows worth checking. Many firms need both, which is why the two are complementary rather than competing.",
    ],
    sections: [
      {
        heading: "What Fathom does",
        body: [
          "Fathom is management reporting and KPI analysis for accountants. It turns accounting data into reports, dashboards and commentary for clients, with trend and comparative analysis.",
          "Output is presentation and interpretation: how the business performed, what changed against budget or prior periods, and what the numbers mean for the client conversation.",
          "That is a reporting layer. It does not test individual transactions and master data against a rule set and return ranked leakage findings with evidence.",
        ],
      },
      {
        heading: "What Effluxa does",
        body: [
          "Effluxa reads uploaded files: AP and AR ledgers, vendor master, payroll exports, trial balances, expense reports and PDFs such as invoices and contracts.",
          "It runs 32 deterministic rules across 9 categories, including duplicate payments, split invoices, vendor bank-detail changes before payment, vendor price increases, AR/AP aging and concentration, and travel and expense policy exceptions.",
          "The result is a short ranked list. Every finding carries source evidence, confidence and calculation basis. These are signs to investigate, not proof of fraud and not a promise of savings, and an Effluxa review is not an audit opinion.",
        ],
      },
      {
        heading: "Scope and pricing model",
        body: [
          "Fathom is reporting and KPI software with terms set by the vendor, so the comparison here is scope rather than a quoted rate. Its output is a management report; Effluxa's output is a prioritised list of leakage signals to investigate.",
          "Effluxa is per firm, not per seat: free check €0, Full AI Audit €149 one-off, Pro €99 per month or €990 per year, and Agency €399 per month or €3,990 per year for unlimited client files up to 100 per month.",
          "Published prices are as seen in November 2026 and should be verified with the vendor.",
        ],
      },
      {
        heading: "When a different tool is the better choice",
        body: [
          "If you want KPI reporting, trend commentary and client-facing management packs, Fathom is built for that and does it without overlap with Effluxa's review work.",
          "If you need dashboards across a portfolio of clients, a reporting and analytics product is the right category.",
          "Effluxa fits when the question is whether the transactions and files contain leakage patterns and you want evidence rather than commentary.",
        ],
      },
    ],
    faq: [
      {
        q: "Does Effluxa produce management reports?",
        a: "No. It produces ranked leakage findings with evidence. Exports are available on Pro, and the Agency plan adds white-label PDF output and monthly summaries, but the content is review findings rather than management reporting.",
      },
      {
        q: "Can I use Fathom and Effluxa together?",
        a: "Yes, and many firms would. Run the leakage review on the transaction files, then use the findings to inform the reporting conversation with the client. The two outputs serve different purposes and do not duplicate each other.",
      },
      {
        q: "How does Effluxa pricing work?",
        a: "Per firm, not per seat. The free check costs nothing, the Full AI Audit is €149 one-off, Pro is €99 per month or €990 per year with unlimited own audits, period comparison and exports, and Agency is €399 per month or €3,990 per year for client files.",
      },
      {
        q: "What if a finding is a false positive?",
        a: "Findings are review signals rather than conclusions. Each one shows its evidence, confidence and calculation basis so a reviewer can accept it, dismiss it or investigate further. That is why Effluxa is described as decision support, not an audit opinion.",
      },
    ],
  },
  {
    slug: "effluxa-vs-qwantify",
    type: "comparison",
    title: "Effluxa vs Qwantify: SME File Audit vs Formal Audit | Effluxa",
    description:
      "Qwantify is an AI audit co-pilot for SME audit firms, priced per firm from £1,999 to £5,999 a month. Effluxa screens uploaded files for leakage. Compare fit.",
    h1: "Effluxa vs Qwantify: file screening or formal audit co-pilot",
    intro: [
      "Qwantify and Effluxa are both AI products aimed at accounting and audit work, but they sit at different points in the process. Qwantify is an AI audit co-pilot for SME audit firms, priced per firm at £1,999 to £5,999 per month and built around formal audit work. Effluxa screens uploaded finance files for leakage patterns and returns ranked findings.",
      "The practical question is whether you need support for a statutory audit file or a fast review of transaction data. The pricing models reflect that difference: Qwantify is priced per firm for audit work, while Effluxa starts at a free file check and scales to €399 per month for client-file volume.",
    ],
    sections: [
      {
        heading: "What Qwantify is built for",
        body: [
          "Qwantify is an AI audit co-pilot for SME audit firms. It supports work on formal audit engagements and is priced per firm at £1,999 to £5,999 per month.",
          "That positioning means it is bought where audit planning, workflow and evidence support are the priority. The scope is formal audit work rather than a standalone leakage screening of arbitrary uploaded files.",
          "Firms that live in statutory audit engagements will recognise the value of a co-pilot built around that process.",
        ],
      },
      {
        heading: "What Effluxa does with a file set",
        body: [
          "Effluxa is a screening tool. Upload PDF, CSV, XLSX or XLS files and 32 deterministic rules across 9 categories run over the data, with no integration, no bank connection and no onboarding project.",
          "The categories include duplicate payments, split invoices, vendor bank-detail changes before payment, vendor price increases, software licence waste and tool overlap, and inventory provision or write-off.",
          "Findings carry page or row evidence, confidence and calculation basis, and the top 3 actions come first. They are review signals, not an audit opinion and not confirmed fraud.",
        ],
      },
      {
        heading: "Pricing model comparison",
        body: [
          "Qwantify is £1,999 to £5,999 per month per firm, priced for formal audit work. Effluxa is free for a file check, €149 for a one-off audit, and €99 per month for Pro or €399 per month for Agency, both available annually at a lower monthly equivalent.",
          "Both are priced per firm rather than per seat. The difference is what the fee is buying: audit engagement support versus repeatable file screening across a client base.",
          "Published prices are as seen in November 2026 and should be verified with the vendor.",
        ],
      },
      {
        heading: "When a different tool is the better choice",
        body: [
          "If you run formal audit engagements and want an AI co-pilot inside that workflow, Qwantify is built for it and the price reflects that scope.",
          "If you need practice management, bookkeeping or reporting software, dedicated products in those categories will serve you better than either tool.",
          "Effluxa fits when a firm or finance team needs a quick, evidence-backed leakage review of client files without buying an audit platform.",
        ],
      },
    ],
    faq: [
      {
        q: "Is Effluxa a formal audit tool?",
        a: "No. Effluxa is built for screening and decision support, not for issuing audit opinions or performing statutory audit work. It flags leakage signals in uploaded files and shows the evidence behind each one.",
      },
      {
        q: "Can an audit firm use Effluxa alongside Qwantify?",
        a: "Yes. A firm could use Effluxa for pre-engagement screening or for advisory clients that sit outside formal audit, and keep Qwantify for the audit engagements themselves. The scopes do not conflict.",
      },
      {
        q: "How does the pricing differ?",
        a: "Qwantify is £1,999 to £5,999 per month per firm for an audit co-pilot. Effluxa ranges from a free check to €399 per month for client-file work. Different scopes, so compare what each fee buys rather than the headline number alone.",
      },
      {
        q: "What files can I upload to Effluxa?",
        a: "PDF, CSV, XLSX and XLS, including invoices, ledgers, vendor master files, trial balances, payroll exports and expense reports. No integration or bank connection is needed.",
      },
    ],
  },
  {
    slug: "duplicate-payment-audit-for-logistics-companies",
    type: "use-case",
    title: "Duplicate Payment Audit for Logistics Companies | Effluxa",
    description:
      "Freight and haulage teams overpay when carrier invoices repeat across depots. Pull the AP ledger, vendor master and invoices, then run this audit.",
    h1: "Duplicate payment audit for logistics companies",
    intro: [
      "Logistics finance teams work from a messy file set: carrier invoices, freight statements, fuel surcharge schedules, demurrage notices and a purchase ledger that spans depots. Duplicate and overcharged freight payments are common because the same shipment can be billed by a carrier, a broker and a subcontractor, in different formats.",
      "A duplicate payment audit does not need a systems project. It needs the right files, a repeatable check and a way to prioritise what to investigate. This page covers the file types, the freight-specific leakage patterns and a manual process you can run this month.",
    ],
    sections: [
      {
        heading: "The files a logistics finance team already holds",
        body: [
          "Start with 12 months of the purchase ledger as CSV or XLSX, then add carrier and subcontractor invoices as PDF, vendor statements, and the vendor master with bank details and payment terms. POD or delivery confirmations help prove whether the same job was billed twice.",
          "Fuel surcharge schedules, demurrage notices and contract rate cards matter too, because rate creep hides there. None of these documents is unusual. The problem is format and volume, not availability.",
        ],
        bullets: [
          "Accounts payable ledger for 12 months as CSV or XLSX",
          "Carrier, broker and subcontractor invoices as PDF",
          "Vendor master with bank details and payment terms",
          "Freight statements, fuel surcharge schedules and demurrage notices",
          "POD or delivery confirmations where they exist",
        ],
      },
      {
        heading: "Leakage patterns specific to freight spend",
        body: [
          "Duplicate carrier invoices are the classic case: the same invoice reference, or the same amount and date range, appears twice, often across depots or through a broker and the carrier itself. Split invoices are the second pattern, where a charge is broken into amounts below an approval threshold.",
          "Bank-detail changes shortly before a large payment run are the higher-risk signal. So are contracted rate increases that do not match the agreed schedule, fuel surcharge applied at the wrong band, and demurrage billed twice for the same container.",
        ],
      },
      {
        heading: "A manual duplicate check you can run this month",
        body: [
          "Export 12 months of AP to CSV and normalise vendor names: strip Ltd, Freight, Logistics and punctuation, then group by supplier. Sort by amount and date, and flag any pair within 30 days where the amount and the invoice reference or PO also match.",
          "Then pull the supplier bank-detail change log and compare it with payments in the following 30 days. Check fuel surcharge lines against the contract band, and confirm that each demurrage charge has a container reference that has not already been billed. Sample first, then widen.",
        ],
      },
      {
        heading: "Where Effluxa fits for logistics teams",
        body: [
          "Effluxa runs 32 deterministic rules across 9 categories on the files you upload, with no integration and no bank connection. The AP ledger, vendor master and invoice PDFs go in, and a ranked list comes out with the top 3 actions first.",
          "Each finding shows source evidence on the page or row, confidence and calculation basis, so the finance lead can check the invoice before raising it. Recurring comparison shows what is new, recurring or no longer detected against the prior period.",
          "Begin with the free check at /instant for a score, risk level and top 3 findings. The Full AI Audit is €149 one-off, and Pro at €99 per month adds unlimited own audits, period comparison and exports. Effluxa is screening and decision support, not an audit opinion.",
        ],
      },
    ],
    faq: [
      {
        q: "How far back should the accounts payable file go?",
        a: "Twelve months is a sensible baseline because invoice patterns repeat across quarters. If you want the recurring comparison on Pro, upload two periods so Effluxa can separate what is new, what is recurring and what is no longer detected.",
      },
      {
        q: "Can Effluxa spot duplicates across depots?",
        a: "Yes. The rules work on the uploaded files, not on a single ledger, so duplicate payments can be matched across vendor names, invoice references, amounts and dates even when the entries sit under different cost centres.",
      },
      {
        q: "What if the duplicate is a legitimate re-billing?",
        a: "Effluxa treats it as a review signal, not a confirmed error. The finding shows the evidence and calculation basis so a reviewer can match it to a credit note, a POD or a re-billing agreement before acting.",
      },
      {
        q: "Do we need to connect our TMS or accounting system?",
        a: "No. Effluxa is file-first: upload PDF, CSV, XLSX or XLS. There is no integration, bank connection or onboarding project, which also means the audit can run on a depot or a newly acquired entity without IT work.",
      },
    ],
  },
  {
    slug: "vendor-price-creep-audit-for-saas-companies",
    type: "use-case",
    title: "Vendor Price Creep Audit for SaaS Companies | Effluxa",
    description:
      "SaaS vendors drift above contract pricing at renewal. Compare contract rates with 24 months of invoices, check seats and overlaps, then act on the top 3.",
    h1: "Vendor price creep audit for SaaS companies",
    intro: [
      "SaaS companies buy from dozens of vendors, and the invoice often drifts away from the contract. A licence tier changes, seats grow past the plan, a renewal uplift lands quietly, and nobody compares the new price with the agreed rate. The result is price creep that compounds year after year.",
      "Catching it needs contract terms next to invoice history, not a sales conversation. This page sets out the files a SaaS finance team already has, the patterns that matter, a manual review process, and where Effluxa fits.",
    ],
    sections: [
      {
        heading: "The files that hold the evidence",
        body: [
          "You need the vendor contracts as PDF, 12 to 24 months of subscription invoices as CSV or PDF, and a subscription tracker in XLSX listing tool, owner, tier, seats, cost and renewal date. A user or SSO export shows how many seats are actually used.",
          "Purchase orders, approval emails and annual renewal notices close the loop. Contracts are where uplift caps and notice periods live, and invoice history is where the charged price actually shows up.",
        ],
      },
      {
        heading: "Where SaaS price creep appears",
        body: [
          "The first pattern is a mid-contract increase above the agreed cap, or an uplift applied at renewal without the notice period in the contract. The second is licence waste: seats paid for but not used, or a tier higher than the usage justifies.",
          "Tool overlap is the third: two products covering the same job, bought by different teams. Annual plans renewed automatically, duplicate subscriptions after a team change, and FX exposure on USD invoices billed to a EUR entity round out the list.",
        ],
      },
      {
        heading: "A manual review a finance lead can run",
        body: [
          "Build a one-page contract register: vendor, start and end date, uplift clause, notice period, unit price and currency. Compare each invoice line against the contract unit price, and put every difference on a list with the invoice reference.",
          "Reconcile seats billed with the number of people who logged in during the last 60 days, using the admin console export. List tools by function to spot overlap. Then sort subscriptions by annual value and renewal date so the next 90 days of renewals gets a second look before it auto-renews.",
        ],
      },
      {
        heading: "Where Effluxa fits for SaaS finance teams",
        body: [
          "Effluxa's rules cover vendor price increases, software licence waste and tool overlap, alongside duplicate payments and split invoices. Upload the invoice history, contract PDFs, vendor master and subscription tracker and the findings come back ranked.",
          "Every finding carries the page or row, confidence and calculation basis. Findings are review signals, not confirmed overbilling or guaranteed savings. Effluxa does not provide financial, legal or tax advice, so whether a price rise breaches a clause is a decision for your commercial or legal team.",
          "The free check at /instant gives a score, risk level and top 3 findings. A full audit is €149 one-off, and Pro at €99 per month adds unlimited own audits and period comparison, so the next renewal round is checked against the prices you paid last time.",
        ],
      },
    ],
    faq: [
      {
        q: "How often should a SaaS company run this audit?",
        a: "Quarterly, plus a review before any renewal above a material threshold for your business. The Pro plan's recurring comparison is useful here because it labels what is new, what is recurring and what is no longer detected versus the prior period.",
      },
      {
        q: "Can Effluxa tell whether an increase breaches the contract?",
        a: "It flags the price change and shows the supporting invoice and contract evidence. Interpreting the clause is a commercial or legal judgement, which is why Effluxa is a screening and decision-support tool rather than legal or financial advice.",
      },
      {
        q: "What about vendors that invoice in US dollars?",
        a: "Upload the invoices as they are. The rule set includes FX exposure, and findings show the evidence so you can see where currency movement or inconsistent conversion is affecting the cost base.",
      },
      {
        q: "Do we need to connect our billing or ERP system?",
        a: "No. Upload CSV, XLSX, XLS or PDF files. There is no integration, no bank connection and no onboarding project, so the review can start with exports you already have.",
      },
    ],
  },
  {
    slug: "software-spend-audit-for-agencies",
    type: "use-case",
    title: "Software Spend Audit for Agencies | Effluxa",
    description:
      "Agencies accumulate overlapping tools, unused seats and renewals nobody owns. Pull card spend and invoices, reconcile seats, then run this audit.",
    h1: "Software spend audit for agencies",
    intro: [
      "Agencies buy software per team, per client and sometimes per campaign, and the estate grows faster than anyone tracks. Design suites, project management, stock libraries, analytics, AI tools and hosting all arrive on cards and annual plans, often with owners who left last year.",
      "The files to audit are already in the business: card statements, software invoices, subscription lists and project codes. This page covers what to pull, what typically leaks, a manual process that works without a tool, and where Effluxa fits.",
    ],
    sections: [
      {
        heading: "Files an agency already has",
        body: [
          "Export 12 months of company card and direct debit spend as CSV, gather software invoices and receipts as PDF, and pull the subscription tracker or the spreadsheet finance keeps of tools. Project codes and client lists show which costs should be recharged.",
          "An HR or contractor list gives headcount per team, and an SSO or workspace admin export gives active users. That is enough to test seats against people and tools against functions.",
        ],
      },
      {
        heading: "Where software spend leaks in agencies",
        body: [
          "The common pattern is overlap: two design tools, two project management platforms, two AI assistants bought by different producers. The second is seats for people who have left, or contractor seats that continued after the engagement ended.",
          "Client-billable software that never appears on a client invoice is pure margin loss. Duplicate subscriptions after a rebrand or team split, annual plans auto-renewed at a higher tier, and one team buying a tool the other team already pays for all appear regularly.",
        ],
      },
      {
        heading: "A manual software spend review",
        body: [
          "Group 12 months of card spend by merchant, normalise the names, and list every tool with its monthly and annual cost. Mark which team owns it and which client, if any, it serves.",
          "For each tool, compare the invoice quantity with the number of people who signed in during the last 60 days. Then list tools by job to spot overlap, and check every annual renewal in the next quarter against actual usage. Anything with no owner or no active users goes to the finance lead.",
        ],
      },
      {
        heading: "Where Effluxa fits for agencies",
        body: [
          "Upload card exports, software invoices, the vendor master and subscription lists. Effluxa's 32 rules across 9 categories include software licence waste and tool overlap, duplicate payments, split invoices and vendor price increases, so the review covers the estate rather than one line at a time.",
          "Findings are ranked with the top 3 actions first and carry source evidence, confidence and calculation basis. The Agency plan at €399 per month or €3,990 per year is priced per firm, not per seat, and covers unlimited client files up to 100 per month, so agencies can also review client cost files.",
          "Start at /instant with a free check for a score, risk level and top 3 findings. Effluxa is a screening and decision-support tool, not accounting software, an audit opinion or financial advice.",
        ],
      },
    ],
    faq: [
      {
        q: "What if some software sits on personal cards?",
        a: "Ask for those card exports separately and upload them with the company spend. The audit works from files, so any export in CSV, XLSX or PDF format can be included as long as it carries merchant, date and amount.",
      },
      {
        q: "Can Effluxa tell which tools are billable to clients?",
        a: "No. It flags leakage signals in the spend data. Mapping tools to clients and deciding what to recharge is a commercial decision for the agency, using the evidence the findings provide.",
      },
      {
        q: "How is agency pricing different from per-seat tools?",
        a: "Effluxa is priced per firm. The Agency plan at €399 per month or €3,990 per year covers the whole team and up to 100 client files per month, so adding producers does not add a licence.",
      },
      {
        q: "How often should an agency review software spend?",
        a: "A quarterly review catches most drift, and a review before annual renewals prevents automatic uplifts. The Pro plan's period comparison helps by showing what changed since the last audit.",
      },
    ],
  },
  {
    slug: "accounts-payable-audit-for-manufacturing-smes",
    type: "use-case",
    title: "Accounts Payable Audit for Manufacturing SMEs | Effluxa",
    description:
      "Manufacturing SMEs get duplicate, split and mispriced invoices past sampled checks. Pull the AP ledger, GRNs and vendor master, then run this audit.",
    h1: "Accounts payable audit for manufacturing SMEs",
    intro: [
      "A manufacturing SME pays for raw materials, components, tooling, maintenance and services through a purchase ledger that mixes purchase orders, goods received notes and supplier statements. When volumes rise, three-way matching gets sampled rather than completed, and duplicate or mispriced invoices slip through.",
      "The audit materials are ordinary: the purchase ledger, supplier statements, goods received notes, standard cost sheets and inventory write-off schedules. This page sets out what to pull, where accounts payable leaks in manufacturing, a manual review process and where Effluxa fits.",
    ],
    sections: [
      {
        heading: "The files a manufacturing finance team holds",
        body: [
          "Start with 12 months of the purchase ledger as CSV or XLSX, supplier statements as PDF, goods received notes, and the vendor master with bank details. Add standard cost sheets and the inventory provision and write-off schedules if the business carries stock.",
          "Supplier statements are useful because they show the supplier's view of the balance, which exposes invoices booked twice and credits never applied. Goods received notes prove whether a booked invoice matches a receipt, which is the core of any three-way match.",
        ],
      },
      {
        heading: "Leakage patterns in manufacturing payables",
        body: [
          "Duplicate supplier invoices are the first pattern, especially where the same delivery is invoiced against two POs or by a trading name and a parent company. Split purchase orders keep spend under approval limits but fragment visibility.",
          "Bank-detail changes shortly before a payment run deserve a check every time. Price increases above the agreed contract or tooling amortisation, inventory provisions repeated without justification, and production overtime paid outside the approved pattern are the other regular offenders.",
        ],
      },
      {
        heading: "A manual three-way match review",
        body: [
          "Export the ledger and match invoice to purchase order and goods received note for the top 50 invoices by value, plus every invoice just under the approval threshold. Flag quantity and price differences and any duplicate invoice number across supplier records.",
          "Then review bank-detail changes in the last 60 days before payment, compare inventory provisions with the prior period, and check overtime against the approved roster. Record each exception with the document reference and a proposed owner, or the list will never close.",
        ],
      },
      {
        heading: "Where Effluxa fits for manufacturing SMEs",
        body: [
          "Effluxa runs 32 deterministic rules across 9 categories on uploaded files, including inventory provision or write-off, overtime exceptions, duplicate payments, split invoices and vendor bank-detail changes before payment. No integration is required.",
          "Findings are ranked with the top 3 actions first and carry source evidence on the page or row, confidence and calculation basis. Read them as prompts for review, not as proven fraud or guaranteed savings. Effluxa does not issue audit opinions.",
          "The free check at /instant returns a score, risk level and top 3 findings. A Full AI Audit is €149 one-off, and Pro at €99 per month covers unlimited own audits and period comparison for the next month-end.",
        ],
      },
    ],
    faq: [
      {
        q: "Do we need our ERP to run the audit?",
        a: "No. Export the purchase ledger, supplier statements, goods received notes and vendor master as CSV, XLSX or PDF and upload them. There is no integration, bank connection or onboarding project, so no IT change is required.",
      },
      {
        q: "Can Effluxa review inventory provisions?",
        a: "Yes. The rule set includes inventory provision and write-off, and each finding shows the evidence and calculation basis so the finance lead can compare it with the prior period and with the underlying stock records.",
      },
      {
        q: "What if a supplier statement disagrees with our ledger?",
        a: "That is exactly the kind of signal worth reviewing. The finding points to the page or row so the team can reconcile the difference, check for a duplicate or missing credit, and decide whether to pay, query or accrue.",
      },
      {
        q: "How is this different from our statutory audit?",
        a: "Effluxa is a screening and decision-support tool, not an audit opinion. It flags review signals with evidence so management can act earlier. Your statutory auditor remains responsible for the formal audit opinion.",
      },
    ],
  },
  {
    slug: "financial-leakage-review-for-fractional-cfos",
    type: "use-case",
    title: "Financial Leakage Review for Fractional CFOs | Effluxa",
    description:
      "Fractional CFOs need a fast, evidence-backed leak review across payables, receivables and payroll. Use these files and this two-week plan for clients.",
    h1: "Financial leakage review for fractional CFOs",
    intro: [
      "A fractional CFO walks into a business with limited visibility: a management pack, an aged debtors report and a finance lead who is doing their best. Leakage is rarely one large item. It is a set of small, repeating patterns spread across payables, receivables and payroll.",
      "The review has to be fast enough to fit between board meetings and specific enough to act on. This page covers the files a fractional CFO can request in week one, the patterns to test first, a manual process, and where Effluxa fits.",
    ],
    sections: [
      {
        heading: "Files to request in week one",
        body: [
          "Request raw exports rather than formatted packs: 12 months of trial balance in XLSX, AP and AR ledgers in CSV, the vendor master, payroll summaries and expense exports. Add supplier and customer contracts as PDF, and bank statements where reconciliation is in scope.",
          "A formatted management pack is fine for the board, but it hides the row-level detail a leakage review needs. If the client's finance lead can only produce PDFs of reports, ask for the CSV behind them.",
        ],
      },
      {
        heading: "Patterns to test before anything else",
        body: [
          "Receivables come first: AR aging buckets and customer concentration. A single customer above a quarter of revenue with balances slipping past 60 days is a cash risk worth quantifying before the next board meeting.",
          "On the payables side, test duplicate payments, split invoices and vendor bank-detail changes before payment. Then look at FX exposure on foreign suppliers, related-party pricing changes and debt covenant headroom. Covenant rules are worth running before the lender does.",
        ],
      },
      {
        heading: "A two-week manual review plan",
        body: [
          "Days 1 and 2 are for requesting and normalising the files. Days 3 and 4 run the duplicate and split invoice checks. Day 5 covers bank-detail changes and top vendor price movements.",
          "The second week covers AR aging and concentration, a 13-week cash flow view and the covenant calculation. Close with three prioritised actions, each with evidence, an owner and a date. Three actions that stick beat thirty observations that nobody owns.",
        ],
      },
      {
        heading: "Where Effluxa fits for a fractional CFO",
        body: [
          "Effluxa compresses the mechanical part of that plan into one upload. It runs 32 deterministic rules across 9 categories, returns the top 3 actions first, and shows the source page or row, confidence and calculation basis behind each finding.",
          "For a CFO with several clients, pricing is per firm, not per seat. Pro at €99 per month covers unlimited own audits, period comparison and exports. Agency at €399 per month or €3,990 per year covers up to 100 client files per month with white-label PDF for client deliverables.",
          "Start with the free check at /instant for a score, risk level and top 3 findings. Effluxa is a screening and decision-support tool, not an audit opinion and not financial, legal or tax advice.",
        ],
      },
    ],
    faq: [
      {
        q: "How many files do I need before I can start?",
        a: "One AP ledger plus a vendor master is enough to produce useful findings. An AR aging file and trial balance add receivables and covenant checks. Upload PDF, CSV, XLSX or XLS, in any combination, with no integration needed.",
      },
      {
        q: "Can I use Effluxa across several client businesses?",
        a: "Yes. The Agency plan is built for that: €399 per month or €3,990 per year, unlimited client files up to 100 per month, white-label PDF, team access, portfolio views and monthly summaries, priced per firm rather than per seat.",
      },
      {
        q: "Does this replace my own analysis?",
        a: "No. It replaces the mechanical scanning so your time goes on judgement and client conversations. Every finding shows its evidence and confidence, so you can accept, dismiss or investigate before it reaches the board pack.",
      },
      {
        q: "What output can I share with a client?",
        a: "Findings are ranked with the top 3 actions first. Exports are available on Pro, and the Agency plan adds white-label PDF output and monthly summaries, which suits a client-facing deliverable. The findings are review signals, not an audit opinion.",
      },
    ],
  },
  {
    slug: "pre-funding-financial-file-audit-for-startups",
    type: "use-case",
    title: "Pre-Funding Financial File Audit for Startups | Effluxa",
    description:
      "Startups heading into diligence need a clean, defensible finance file. Audit subscriptions, expenses and duplicate payments before investors ask.",
    h1: "Pre-funding financial file audit for startups",
    intro: [
      "Before a funding round, investors ask for a financial file: bank statements, revenue contracts, payroll, a trial balance, a spend breakdown. Founders often discover during that process that the numbers are directionally right but the supporting file is not clean.",
      "A pre-funding file audit is not a statutory audit. It is a screening of the finance files for leakage and inconsistency that a diligence team will notice. This page covers what to prepare, the patterns to fix first, a manual process and where Effluxa fits.",
    ],
    sections: [
      {
        heading: "What belongs in the data room",
        body: [
          "Prepare 12 months of bank statements as CSV, the trial balance as XLSX, payroll and contractor schedules, an AP ledger, expense exports and the list of recurring third-party tools. Add revenue and supplier contracts as PDF.",
          "Investors will ask for spend by vendor and category. Building that from raw exports is faster and more defensible than reconstructing it from bank statements later, and it is exactly the data a leakage review needs.",
        ],
      },
      {
        heading: "Leakage patterns that show up in pre-funding reviews",
        body: [
          "Recurring software subscriptions bought by different teams are the most common finding, followed by seats paid for people who have left. Payments to former contractors, tools on auto-renewal at a higher tier and expenses outside policy show up next.",
          "FX exposure on USD-priced tools and duplicate payments complete the usual list. Individually these are small. Together they suggest weak financial control, which is precisely what diligence teams probe, so it is better to have an answer ready.",
        ],
      },
      {
        heading: "A manual pre-funding file check",
        body: [
          "Normalise the bank and ledger data by vendor, then list every recurring payment by amount and frequency. For each tool, find the contract or renewal notice and check the current price against it.",
          "Sample expenses against policy, and reconcile payroll with the headcount and contractor list. For each exception choose one of three outcomes: recover, cancel or explain in writing. The written explanation is what turns a messy file into a clean one.",
        ],
      },
      {
        heading: "Where Effluxa fits before a raise",
        body: [
          "Effluxa runs 32 deterministic rules across 9 categories on uploaded files, including software licence waste and tool overlap, travel and expense policy exceptions, duplicate payments, vendor price increases and FX exposure. No integration is needed.",
          "Findings are ranked with the top 3 first and carry source evidence, confidence and calculation basis. Findings are review signals, not confirmed fraud or guaranteed savings, and Effluxa is not an audit opinion or financial, legal or tax advice.",
          "Run the free check at /instant for a score, risk level and top 3 findings. For a single raise, the €149 one-off Full AI Audit is often enough. Pro at €99 per month adds recurring comparison if you want the file checked before each reporting cycle.",
        ],
      },
    ],
    faq: [
      {
        q: "Is this the same as investor due diligence?",
        a: "No. It is preparation. Effluxa screens your own files for leakage signals so you can fix or explain them before a diligence team asks. It is not an audit opinion, not accounting software and not financial advice.",
      },
      {
        q: "What if we do not have a proper AP ledger?",
        a: "Upload 12 months of bank statements as CSV plus your subscription list. The rules can work from transaction data. A trial balance and payroll schedule improve coverage for receivables and payroll patterns.",
      },
      {
        q: "Will investors see the findings?",
        a: "Only if you choose to share them. You upload files and receive findings and exports. Use them to prepare answers and to clean up the file, then present the corrected position in your own materials.",
      },
      {
        q: "How long does the review take?",
        a: "The free check returns a score, risk level and top 3 findings shortly after upload. A full audit ranks all findings with evidence, confidence and calculation basis. There is no onboarding project, so time goes on reviewing findings rather than configuring a system.",
      },
    ],
  },
  {
    slug: "due-diligence-file-review-for-accounting-firms",
    type: "use-case",
    title: "Due Diligence File Review for Accounting Firms | Effluxa",
    description:
      "Accounting firms reviewing a target's finance files need fast, evidence-backed questions. Pull the ledgers and contracts, then run this review.",
    h1: "Due diligence file review for accounting firms",
    intro: [
      "A financial due diligence review has a fixed timeline and a long data request list. The target sends ledgers, trial balances, contracts and statements, and the deal team needs to know where the numbers might move: recurring leakage, related-party pricing, receivables that may not collect.",
      "Effluxa does not replace diligence judgement. It shortens the file review by flagging rows worth asking about, with evidence attached. This page covers the files, the patterns and a manual process a deal team can run before reaching for a tool.",
    ],
    sections: [
      {
        heading: "The data request list that matters",
        body: [
          "Ask for two to three years of AP and AR ledgers, trial balances, the vendor master, customer lists, contracts, expense reports, bank statements and inventory or provision schedules. A complete ledger is more useful than a top-20 spend summary.",
          "The vendor master matters because related-party pricing hides in plain sight: similar names, shared addresses or bank accounts that look like an ordinary supplier. Customer concentration needs the full ledger, not a sample.",
        ],
      },
      {
        heading: "Patterns a file review should surface",
        body: [
          "Duplicate payments and split invoices suggest weak controls, which matters for the earnings quality case as much as for recovery. Related-party price changes, AR aging and concentration, and debt covenant calculations are the next areas to probe.",
          "Inventory write-off patterns and one-off payments to directors or connected parties belong on the questions log. A duplicate that repeats every quarter is a control finding, not an accident, and diligence teams should treat it that way.",
        ],
      },
      {
        heading: "A manual file review a deal team can follow",
        body: [
          "Time-box it: two days to normalise the files, two days for pattern tests, one day to write the questions log. Normalise vendor and customer names first, then compare the current period with the prior year.",
          "Run the duplicate scan, match related-party names and bank details against the vendor master, build the aging analysis and recalculate the covenant. Every exception becomes a question with a document reference, ready for management.",
        ],
      },
      {
        heading: "Where Effluxa fits in a deal timetable",
        body: [
          "Effluxa runs 32 deterministic rules across 9 categories on uploaded files and returns the top 3 actions first. The file-first model matters in a deal: the target does not need to grant system access for the review to start.",
          "Every finding points to the page or row it came from, with a confidence level and the calculation basis attached. Findings are review signals, not confirmed fraud or guaranteed savings, and Effluxa does not issue audit opinions, so the deal team keeps its judgement.",
          "The Agency plan at €399 per month or €3,990 per year includes white-label PDF for client deliverables, team access and up to 100 client files per month. A free check at /instant and a €149 one-off audit cover smaller engagements.",
        ],
      },
    ],
    faq: [
      {
        q: "Does Effluxa replace financial due diligence?",
        a: "No. It is a screening tool that shortens the file review and supplies evidence-backed questions. The diligence conclusion, the quality of earnings analysis and any opinion remain with the engagement team.",
      },
      {
        q: "Can we use it without target system access?",
        a: "Yes. Effluxa works from uploaded PDF, CSV, XLSX and XLS files, so no system connection or bank feed is needed. That suits a deal where the target will only release exports.",
      },
      {
        q: "Can we brand the output for clients?",
        a: "The Agency plan includes white-label PDF output, team access, portfolio views and monthly summaries, so the review can be delivered under the firm's own brand.",
      },
      {
        q: "What if the findings are noisy?",
        a: "Each finding shows its confidence and calculation basis, and only the top 3 actions are presented first. Reviewers can dismiss weak signals quickly and focus on the rows with clear evidence.",
      },
    ],
  },
  {
    slug: "invoice-duplicate-check-for-construction-companies",
    type: "use-case",
    title: "Invoice Duplicate Check for Construction Companies | Effluxa",
    description:
      "Construction firms pay subcontractors, plant hire and materials suppliers. Duplicate and split invoices hide across projects. Here is how to check.",
    h1: "Invoice duplicate check for construction companies",
    intro: [
      "Construction finance is project finance: subcontractor invoices, plant hire, materials, applications for payment and retention. The same group can appear on several projects, and duplicate or split invoices hide between cost codes rather than inside one ledger line.",
      "A duplicate check has to work across projects and documents, not one line at a time. This page covers the files a contractor already has, the leakage patterns specific to construction, a manual review and where Effluxa fits.",
    ],
    sections: [
      {
        heading: "Files a construction finance team holds",
        body: [
          "Pull subcontractor invoices as PDF, supplier statements, purchase orders, applications for payment and retention schedules. Add the project cost report in XLSX, the vendor master with bank details, and plant hire timesheets or delivery tickets.",
          "Cost-code structure is the key. Without it, the same invoice across two projects looks like two payments to two suppliers, so ask for the project and cost-code mapping before you start.",
        ],
      },
      {
        heading: "Leakage patterns specific to construction",
        body: [
          "Duplicate subcontractor invoices across projects are common when the same trades are used on multiple sites. Split invoices under approval limits, and bank-detail changes before a payment run, are the higher-risk patterns.",
          "Plant hire billed twice for the same period, materials price creep against the agreed schedule, and retention released before the defects period ends are construction-specific leaks that a general ledger review will miss.",
          "Payment timing matters as well: invoices dated immediately before a payment run, and approvals granted by the same person who raised the order, are worth sampling even when the paperwork looks complete.",
        ],
      },
      {
        heading: "A manual invoice duplicate check",
        body: [
          "Match each subcontractor invoice to its application for payment and purchase order. Then search the full ledger for the same invoice number, or the same amount within 30 days, across projects, normalising trading names first.",
          "Check bank-detail changes against payments in the following month, sample plant hire against timesheets, and test retention releases against contract terms. Anomalies go on a project-by-project exceptions list with document references.",
        ],
      },
      {
        heading: "Where Effluxa fits for contractors",
        body: [
          "Effluxa runs 32 deterministic rules across 9 categories on files you upload, including duplicate payments, split invoices, vendor bank-detail changes before payment and vendor price increases. No integration with site or finance systems is needed.",
          "Findings are ranked with the top 3 actions first and carry page or row evidence, confidence and calculation basis. The findings indicate what to check, not confirmed fraud, and no saving is guaranteed. An audit opinion is outside Effluxa's scope.",
          "A free check at /instant returns a score, a risk level and the top 3 findings. A full audit is €149 one-off, and Pro at €99 per month adds period comparison and exports across projects.",
        ],
      },
    ],
    faq: [
      {
        q: "Can Effluxa handle several projects at once?",
        a: "Yes. Upload ledgers that include project or cost-code fields and the rules can compare across projects as well as within them, which is where most construction duplicates hide.",
      },
      {
        q: "What about retention and applications for payment?",
        a: "Upload the retention schedule and application records with the invoices. Effluxa flags patterns worth reviewing with evidence, while the contract interpretation stays with your commercial team.",
      },
      {
        q: "Do we need to connect our accounting software?",
        a: "No. Effluxa is file-first: PDF, CSV, XLSX or XLS. There is no integration, bank connection or onboarding project, so a project or a subsidiary can be reviewed without IT involvement.",
      },
      {
        q: "Is a duplicate across two projects always an error?",
        a: "No. It is a review signal. The same group may invoice legitimately for separate sites, so the reviewer checks the evidence, delivery tickets and contract before deciding.",
      },
    ],
  },
  {
    slug: "cash-flow-leakage-review-for-ecommerce-brands",
    type: "use-case",
    title: "Cash Flow Leakage Review for Ecommerce Brands | Effluxa",
    description:
      "Ecommerce brands leak cash through 3PL charges, refunds, shipping and FX. Reconcile payouts, invoices and ledgers with this step-by-step review process.",
    h1: "Cash flow leakage review for ecommerce brands",
    intro: [
      "An ecommerce brand's cash leaves through many small pipes: payment processing fees, 3PL storage and fulfilment, shipping, advertising, refunds and supplier invoices. Individually each line looks normal. Collectively they are where margin quietly disappears.",
      "The good news is that the evidence is already in exports. This page covers the files, the leakage patterns specific to ecommerce, a manual reconciliation process and where Effluxa fits.",
    ],
    sections: [
      {
        heading: "The exports to pull together",
        body: [
          "Export order, refund and payout data from the store platform as CSV, payment processor statements as PDF, 3PL and shipping invoices as PDF, advertising invoices or exports, supplier invoices, and bank statements in CSV.",
          "A SKU-level margin file helps if it exists, but it is not essential. The core file set is payouts, fees and supplier invoices, because that is where the reconciliation and the duplicate risk sit.",
        ],
      },
      {
        heading: "Where the cash leaks in ecommerce",
        body: [
          "Duplicate 3PL charges for the same inbound shipment, shipping overcharges against the rate card, and fees billed twice after a carrier change are common. Refunds and discounts above policy, or applied repeatedly to the same order, come next.",
          "FX exposure on supplier payments in USD or CNY, software subscriptions bought by different teams, inventory write-offs and duplicate supplier invoices complete the picture. None of it shows in an aggregated profit and loss.",
        ],
      },
      {
        heading: "A manual reconciliation a finance lead can run",
        body: [
          "Reconcile each payout batch to the bank, then review the fee lines against the processor contract. Build a duplicate check on 3PL, shipping and supplier invoices by invoice number, amount and period.",
          "Sample refunds above a threshold and trace them to an order, then check supplier invoices against purchase orders or rate cards. List exceptions by category with the source document, so the fix can be assigned to operations, finance or procurement.",
        ],
      },
      {
        heading: "Where Effluxa fits for ecommerce teams",
        body: [
          "Upload payout exports, invoices, bank statements and ledgers, and Effluxa's 32 rules across 9 categories return ranked findings. The rules cover duplicate payments, vendor price increases, FX exposure, inventory write-off and software licence waste and tool overlap.",
          "Each finding carries source evidence, confidence and calculation basis. Findings are review signals, not confirmed fraud or guaranteed savings, and Effluxa is a screening and decision-support tool rather than an audit opinion.",
          "The free check at /instant gives a score, a risk level and the top 3 findings before you pay anything. A full audit is €149 one-off, and Pro at €99 per month adds unlimited own audits, period comparison and exports, which suits a monthly trading cycle.",
        ],
      },
    ],
    faq: [
      {
        q: "Do I need to connect Shopify or Stripe?",
        a: "No. Export the data as CSV or PDF and upload it. That works across any store platform or processor, and there is no integration, bank connection or onboarding project to set up.",
      },
      {
        q: "Can Effluxa reconcile payouts for me?",
        a: "It does not run a full bank reconciliation. It screens the uploaded payout, invoice and ledger files for duplicate, split and price-change patterns, with evidence for each finding, so reconciliation work is targeted rather than exhaustive.",
      },
      {
        q: "Will it catch refund abuse?",
        a: "The rules include travel and expense policy exceptions and payment patterns, and findings are review signals. Specific refund policy tests depend on the data you upload, so include the refund export if that is a concern.",
      },
      {
        q: "How often should an ecommerce brand review leakage?",
        a: "Monthly suits most trading cycles. Pro includes recurring comparison, which shows what is new, recurring or no longer detected against the prior period, so each month's review starts from the changes rather than from zero.",
      },
    ],
  },
  {
    slug: "client-file-leakage-review-for-bookkeeping-firms",
    type: "use-case",
    title: "Client File Leakage Review for Bookkeeping Firms | Effluxa",
    description:
      "Bookkeeping firms can screen client files for duplicate payments, bank-detail changes and expense exceptions. Here is a repeatable month-end process.",
    h1: "Client file leakage review for bookkeeping firms",
    intro: [
      "A bookkeeping firm sees the same leakage patterns across clients: a duplicate payment run twice, a supplier's bank details changed by email, an expense outside policy. Each client file is small, but across a portfolio the checking adds up quickly.",
      "A repeatable review process, with or without software, turns that checking into a service clients can see. This page covers the files firms already hold, the patterns to look for, a manual month-end process and where Effluxa fits.",
    ],
    sections: [
      {
        heading: "The client files you already hold",
        body: [
          "For each client you already have bank statements in CSV or PDF, sales and purchase ledgers, payroll journals, VAT returns as PDF, expense exports and the vendor master. Add the chart of accounts and prior-period trial balance.",
          "Standardise the request across clients. A single file checklist per client, stored in the same folder structure, makes the review repeatable and makes onboarding a new client faster.",
        ],
      },
      {
        heading: "Patterns worth checking on every client",
        body: [
          "Duplicate payments and split invoices are the most common finds. Vendor bank-detail changes before payment, travel and expense policy exceptions, and AR aging that has stopped moving are the next most useful review areas.",
          "Because the same rules apply to every client, the work scales: the check is identical and only the data changes. That is what makes a portfolio view possible and what makes a monthly summary worth sending.",
        ],
      },
      {
        heading: "A month-end review process that repeats",
        body: [
          "Run the check in the first week after month-end: reconcile the bank, scan for duplicate invoice numbers and amounts, and review supplier bank-detail changes against payments. Keep a one-page exceptions log per client.",
          "Sample expenses against policy, review AR aging movement, and flag anything unusual before the client's management accounts are finalised. Send the client a short list of questions with evidence attached.",
        ],
      },
      {
        heading: "Where Effluxa fits for bookkeeping firms",
        body: [
          "Effluxa's 32 deterministic rules across 9 categories cover the patterns above, including duplicate payments, split invoices, vendor bank-detail changes before payment and travel and expense policy exceptions.",
          "The Agency plan at €399 per month or €3,990 per year covers unlimited client files up to 100 per month, white-label PDF, team access, portfolio views and monthly summaries, and is priced per firm rather than per seat.",
          "Start with the free check at /instant on your own books, then move client files into a monthly rhythm. Findings are review signals, not confirmed fraud or guaranteed savings, and Effluxa is not an audit opinion or accounting software.",
        ],
      },
    ],
    faq: [
      {
        q: "Can we white-label the reports for clients?",
        a: "Yes, on the Agency plan, which includes white-label PDF output, team access, portfolio views and monthly summaries. The findings stay evidence-backed, with the source page or row, confidence and calculation basis.",
      },
      {
        q: "How many client files can we review each month?",
        a: "Agency covers unlimited client files up to 100 per month for €399 per month or €3,990 per year, priced per firm. That fits a practice reviewing a monthly subset of the client base.",
      },
      {
        q: "Does Effluxa replace our bookkeeping software?",
        a: "No. It is not accounting or bookkeeping software. It screens uploaded files for leakage signals and is a decision-support tool, so it sits alongside your existing ledger and practice tools.",
      },
      {
        q: "What if a client asks for the evidence?",
        a: "Every finding carries the source evidence on the page or row, confidence and calculation basis, so the client conversation starts from a specific invoice or ledger line rather than a general concern.",
      },
    ],
  },
];

