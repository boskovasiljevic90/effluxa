# Effluxa: 14-day acquisition sprint

## Objective

Validate one repeatable route to the first paid partner clients without paid advertising or a new product build.

The initial segment is:

> Small and mid-sized accounting, bookkeeping and fractional-CFO firms that serve a portfolio of SME clients.

The reason for this segment is practical: one partner can introduce multiple client audits, already has access to finance files, and can use Effluxa as an additional review layer without replacing its accounting system.

## The offer

**One-client partner pilot**

Bring one client-approved, redacted PDF, CSV or spreadsheet. Effluxa provides a first-pass financial-leakage screening with source evidence, confidence and practical follow-up context. The partner reviews the findings before presenting anything to the client.

The offer must be described as a review signal, not as guaranteed savings or financial advice. Use “potential exposure”, “review opportunity” and “verified outcome”; do not use “guaranteed savings”, “fraud detection” or “we found money” unless the evidence and a human review support that statement.

## What is ready now

- Public homepage and pricing.
- `/for-accounting-firms` partner positioning page.
- Resources hub and problem-specific guides.
- File-first audit flow and V3 fast path.
- Agency client workflow.
- Contact form with partner-pilot intake.
- Signup, checkout-intent and acquisition attribution events.
- Sample audit for a low-friction first touch.

## 14-day execution plan

### Days 1–2: build the list and prepare the proof

- Choose one geography and language for the first batch; do not mix five markets in the same experiment.
- Build a list of 50–100 firms that visibly serve SMEs and have a named owner, partner or CFO lead.
- Record only public business information and a reason the firm is a fit.
- Prepare one short demo path: homepage → accounting-firms page → sample audit → partner pilot form.
- Select one redacted sample file that can be shown safely in a call.

### Days 3–7: start founder-led outreach

- Send 10–15 genuinely personalised messages per day.
- Ask for a short workflow conversation, not a generic product demo.
- Offer one pilot on one client-approved file.
- Log every outcome in `docs/LEAD_TRACKER_TEMPLATE.csv` or an equivalent CRM.
- Follow up once after 3–4 business days; do not spam non-responders.

### Days 8–10: run pilots and collect objections

- Run the first pilots with the partner present.
- Ask where the evidence was useful, unclear or insufficient.
- Record the exact language the partner uses to describe the value.
- Separate product defects from positioning objections.
- Do not turn a single anecdote into a savings claim.

### Days 11–14: convert and publish proof

- Ask each successful pilot partner for a paid next step: recurring client review, Agency plan or a defined paid audit batch.
- Ask permission for an anonymised quote or case study.
- Update the landing page only with verified objections and verified proof.
- Decide whether the segment has enough signal to repeat or whether the offer needs to change.

## Success gates

The first sprint is successful if it produces at least:

- 50 qualified target firms in the list;
- 30 personalised first contacts;
- 5 meaningful replies or conversations;
- 3 pilot files or scheduled pilots;
- 1 paid next step;
- 1 repeat audit or written statement of intended use.

If the list and outreach are executed but there are no meaningful conversations, the next change should be the offer or segment—not another internal feature.

## Metrics that matter

Track these by source and by segment:

1. Qualified firms contacted.
2. Positive response rate.
3. Pilot request rate.
4. Pilot file received.
5. Time from file receipt to reviewable report.
6. Partner-rated usefulness.
7. Paid conversion.
8. Repeat audit within 30 days.
9. Referred firm or client.

The current production checkout metric measures a Paddle checkout transaction being created. It does not prove a completed payment or an active subscription. Paid conversion must be verified against the billing state.

## Product freeze rule

During this sprint, only ship changes that:

- unblock a real pilot;
- reduce a measured failure;
- improve evidence clarity;
- improve onboarding or conversion;
- protect privacy, access control or billing correctness.

Do not add a new feature because it feels commercially useful until a prospect or pilot partner has described the problem.
