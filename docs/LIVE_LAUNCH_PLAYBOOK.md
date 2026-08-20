# Effluxa Live Launch Playbook

Status: ready for direct-to-market launch
Owner: NeedAIHelp / Effluxa
Support: support@effluxa.com

This playbook is for launching Effluxa with real customers and improving it through live usage. It does not require a separate beta cohort or a pre-launch paid transaction.

## 1. Launch message

Use one clear message everywhere:

> Effluxa helps SMEs, CFOs, accountants and consultants find financial leakage in the files they already have — before it becomes profit loss.

Short explanation:

> Upload an invoice, statement, CSV export or Excel file. Effluxa identifies possible overspending, duplicate-payment risk, vendor concentration, cash-flow pressure and practical savings opportunities.

Always describe Effluxa as:

> Effluxa, an AI financial intelligence product by NeedAIHelp.

Do not describe it as accounting software, a bookkeeping replacement, an investment product or guaranteed savings.

## 2. Daily operating routine

Run this once each business day during the first weeks after launch:

1. Check `support@effluxa.com` for new customer, billing, privacy and deletion requests.
2. Check the Effluxa Admin dashboard for new signups, uploads, errors and contact messages.
3. Check Paddle for completed, failed, past-due, cancelled and refunded activity.
4. Check Vercel runtime logs for repeated login, upload, AI, database or webhook errors.
5. Record every customer-impacting issue in the incident log before closing the day.
6. Pick one highest-impact improvement for the next safe live update.

Do not ask customers for passwords, card numbers or full financial files by email.

## 3. Lead and customer handling

Use these stages in a simple spreadsheet or notes file:

| Stage | Meaning | Next action |
| --- | --- | --- |
| New | Person showed interest or sent a message | Reply within one business day |
| Qualified | They have a supported financial file and a real leakage question | Offer a free audit |
| Activated | They created an account and uploaded a document | Help them interpret the report |
| Expansion | They need recurring audits, client workspaces or exports | Explain Pro or Agency |
| Customer | Paddle payment and access are confirmed | Send onboarding and support contact |
| At risk | Checkout, report quality or access issue exists | Resolve before further selling |

Qualification questions:

- What kind of financial file do you already have: PDF, CSV, XLSX or XLS?
- What do you want to investigate: recurring spend, vendors, duplicate payments or cash flow?
- Is the file for your own business or for a client portfolio?
- Do you need one audit, ongoing individual use or an Agency workspace?

## 4. Five-minute product demonstration

1. Start with the sample audit and show the leakage score, risk level and savings visibility.
2. Explain that the user can begin with an existing invoice, statement or export.
3. Upload a safe demo file and show the report generation flow.
4. Point out the limited-data label when the file does not support a broad conclusion.
5. Show findings, vendors, high-cost categories, quick wins and recommendations.
6. Show report download/share options where available.
7. Explain the difference between the free preview, Full Audit, Pro and Agency.
8. Close with: “Start with the data you already have; the first audit tells us where to look next.”

## 5. Outreach templates

### Cold email

Subject: A faster way to spot financial leakage

Hi [Name],

Most leakage does not arrive as one dramatic mistake. It accumulates through recurring spend, duplicate-payment risk, vendor concentration and weak visibility.

Effluxa is an AI financial intelligence product by NeedAIHelp. It turns invoices, statements, CSV exports and Excel files into a first-pass leakage audit with practical next actions.

If you have a recent financial file, you can start with a free audit here: https://www.effluxa.com

Best,
Boško

### Consultant or accountant outreach

Hi [Name],

Effluxa may be useful as a repeatable first-pass audit layer for your clients. It accepts common financial files and produces a review of possible overspending, vendor concentration, duplicate-payment risk and savings opportunities.

The Agency plan is designed for client workspaces and recurring reporting. You can see the workflow with a free audit first: https://www.effluxa.com

Best,
Boško

### Follow-up

Hi [Name],

Just following up in case financial leakage review is relevant this quarter. Effluxa starts with the files you already have, so there is no accounting integration required for the first audit.

You can try the free preview here: https://www.effluxa.com

Best,
Boško

### Short LinkedIn message

I’m building Effluxa, an AI financial intelligence product by NeedAIHelp. It reviews invoices, statements and spreadsheet exports for possible leakage, duplicate-payment risk, vendor concentration and practical savings opportunities. The first audit is free: https://www.effluxa.com

## 6. Objection handling

**“We already have accounting software.”**
That is useful source data. Effluxa is an additional leakage and decision-support layer, not a replacement for accounting, bookkeeping or tax software.

**“Will the AI guarantee savings?”**
No. Effluxa identifies signals and opportunities for review. Important decisions should be verified by the customer’s accountant or qualified financial professional.

**“Do we need an integration?”**
No. The first audit can start with a supported PDF, CSV, XLSX or XLS file.

**“Our report is limited.”**
The report is conservative because the uploaded file contains limited context. A broader export or a wider date range can support a stronger analysis.

**“Why did payment complete but access not change?”**
Verify the Paddle transaction and webhook state first. Ask the customer to sign out and back in once. Never grant access based only on a screenshot or an unverified claim.

## 7. Metrics to review weekly

Track counts, not assumptions:

- new accounts;
- accounts with a first upload;
- reports successfully generated;
- limited-data reports;
- Full Audit checkouts;
- Pro and Agency checkout attempts;
- completed Paddle transactions;
- activated paid accounts;
- checkout failures;
- support messages by category;
- account/data deletion requests;
- customers who return for another audit.

Useful conversion questions:

- Where do users stop: signup, upload, report review or checkout?
- Are customers confused by the report or by the plan choice?
- Which file types produce the most useful reports?
- Which support issues repeat more than once?

Do not present estimated savings as realised customer savings. Use “identified opportunity” or “potential savings” until the customer verifies and acts on it.

## 8. Live issue severity

### Severity 1 — stop acquisition temporarily

Use when signup, upload, report generation, checkout, paid access, account deletion or customer data protection is materially unavailable.

Actions:

1. Record the first observed time and affected route.
2. Check Vercel, Paddle, database and email provider status.
3. Stop paid promotion if customers cannot complete the core workflow.
4. Protect the affected surface and rotate secrets if exposure is suspected.
5. Communicate a short factual update to affected customers.
6. Verify signup → upload → report → checkout → access before resuming acquisition.

### Severity 2 — individual customer issue

Use for one upload, report-quality, billing-access or support issue.

Actions:

1. Acknowledge the customer within one business day.
2. Reproduce with a safe non-sensitive file when possible.
3. Offer a workaround.
4. Patch only the smallest confirmed cause.
5. Confirm the result with the customer and record the lesson.

## 9. Safe live update checklist

Before each production change:

- [ ] Change is tied to a confirmed customer or operational problem.
- [ ] No secrets, passwords or financial files are included in the change.
- [ ] Type check passes.
- [ ] Production build passes on Vercel.
- [ ] Public routes return expected status codes.
- [ ] Safe authenticated flow is checked when auth/upload/report code changes.
- [ ] Paddle webhook or checkout is checked when billing code changes.
- [ ] Mobile is checked when layout code changes.
- [ ] Commit message states the customer-facing result.
- [ ] Project state records the new production commit.

## 10. Boundaries for the first launch

Do not promise:

- guaranteed savings;
- complete fraud detection;
- accounting, tax, legal or investment advice;
- permanent storage of original uploaded files;
- instant human review of every report;
- features that are not currently available in the customer’s plan.

The first launch objective is simple: get real users from an existing financial file to a useful, honest next action, then improve the product from repeated evidence.
