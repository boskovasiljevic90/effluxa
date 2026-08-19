# Effluxa Live Launch Runbook

This runbook is designed for a direct-to-market launch with continuous live improvement. It does not require a separate beta cohort.

## Before announcing

- [ ] `https://www.effluxa.com` loads.
- [ ] Signup, login and password reset work.
- [ ] A safe PDF/CSV/XLSX test file produces a report.
- [ ] Report detail, download and share routes load.
- [ ] Free usage limit is visible and enforced.
- [ ] Paddle checkout opens with the intended product and price.
- [ ] Production webhook rejects unsigned/invalid requests and is configured in Paddle.
- [ ] Manage Billing is available for a Paddle-linked paid account.
- [ ] NeedAIHelp attribution is visible in Effluxa legal/footer copy.
- [ ] Privacy, Terms, Contact and account deletion are reachable.
- [ ] `support@effluxa.com` is monitored.

## First live customers

For every new customer issue, record:

- account email
- date/time and browser/device if relevant
- route or feature
- exact customer-visible message
- Paddle transaction/subscription ID if billing-related
- whether data was sensitive
- workaround and final resolution

Do not request card numbers, passwords or unnecessary financial files.

## Live update rule

Every production change must pass:

1. local production build;
2. public route smoke check;
3. safe authenticated upload/report check when upload/report code changed;
4. Paddle webhook signature check when billing code changed;
5. mobile check when layout code changed;
6. commit with a clear change description and a short entry in the project state.

## Go/no-go rule

Marketing can continue while minor issues are fixed live. Pause acquisition only when signup, upload, report generation, checkout, paid access, data deletion or support communication is materially unavailable.
