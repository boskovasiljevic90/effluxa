# Effluxa growth metrics

Status: live instrumentation, September 2026

The Admin dashboard is intended to answer whether Effluxa is becoming a product that finance professionals return to and recommend. It should not turn estimates, synthetic data, or page views into claims of revenue or recovered cash.

## Definitions

- **Signup** — a row in `User`, created by the signup flow and accompanied by a `signup` event.
- **Completed audit** — an `Upload` row created after an `AuditJob` finishes. A queued or failed job is not an audit.
- **Activation** — the account completes at least one audit within seven days of signup.
- **28-day return** — the account completes a second audit within 28 days of signup. The denominator only includes accounts old enough to have reached day 28.
- **Paid account** — an account with an active/trialing Paddle subscription within its end date, or active complimentary Agency access. Complimentary access is shown as access, not revenue.
- **Partner activation** — a referred account completes an audit within seven days of signup.
- **Report share** — an authenticated workspace successfully creates or reuses a client-safe report share link.
- **Report export** — an authenticated workspace successfully generates a report PDF, workspace PDF, or workspace CSV.

## Why these metrics

The first business question is not how many people visited the site. It is whether an invited finance professional reaches value quickly and returns with the next reporting period.

The sequence is:

`signup → completed audit → activation → share/export/action → second audit → paid expansion`

If activation is low, fix upload, file support, or report clarity. If activation is healthy but 28-day return is low, improve recurring comparison, reminders, and control follow-up. If return is healthy but paid conversion is low, fix packaging and proof before adding more engine features.

## Data boundaries

- No raw source-file contents are recorded in analytics events.
- Estimated savings are not treated as recovered cash.
- Verified recovered amount only comes from an explicit control-action outcome entered by a user.
- A partner referral is not counted as a customer until the referred account completes the relevant product step.
- Empty cohorts are displayed as empty evidence, not as a zero-percent claim about product quality.
