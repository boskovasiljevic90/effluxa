# EFFLUXA – PROJECT STATE

## GOAL
Effluxa must be commercially live within 10 calendar days.

Commercially live means:
- Users can register
- Users can upload invoice
- AI analysis works
- Reports are viewable
- Paddle billing integration is implemented
- Paid users are differentiated
- App is deployed to production

---

## CURRENT STATUS (PADDLE CUTOVER)

Working:
- Auth (login)
- JWT sessions
- PDF upload
- AI invoice analysis (Responses API)
- JSON parsing
- DB storage (Prisma)
- Report detail page
- Paddle production billing integration
- Paddle catalog and EUR prices for Full Audit, Pro, and Agency
- Paddle production API key, client token, and webhook destination configured
- Paddle production variables configured in Vercel
- Paddle live default payment link configured as `https://www.effluxa.com/checkout`
- Legacy Stripe environment variables removed from Vercel and local environment files
- Production deployment and smoke test passed
- Paddle sandbox API key and client token created for validation
- Sandbox catalog configured with five active EUR prices
- Sandbox default payment link configured
- Sandbox pricing validator passed against all five prices
- Sandbox checkout opened successfully from an HTTPS Effluxa preview
- Paddle sandbox test-card payment completed successfully
- Authenticated sandbox subscription provisioning completed end-to-end
- Sandbox test account upgraded to PRO after successful payment
- Paddle customer/subscription IDs and activation event verified in the database
- Sandbox customer portal session creation verified with the required portal permission
- Paddle production database billing migration applied
- Existing-user login verified after the billing migration
- Paddle webhook provisioning is protected against repeated activation events
- Sandbox PRO users can open the Paddle billing portal with the required API permission
- Billing success preserves the transaction through a re-login

Not ready:
- Background processing
- Distributed rate limiting
- Proper report UI
- User dashboard polish

Launch hardening completed:
- Server-side upload validation now checks file signatures for PDF, XLSX, and XLS files
- Empty, oversized, unsupported, and binary-looking CSV uploads are rejected before AI processing
- Upload requests have an additional per-user rate limit
- Weekly free-audit usage resets automatically after seven days
- Admin usage reset also refreshes the weekly usage window
- Invalid or expired auth tokens return a clean unauthorized response
- Login, signup, and Paddle request bodies are validated before processing
- Paddle checkout and billing portal actions have request throttling and error tracking
- PDF generation errors no longer expose internal exception messages
- Billing portal UI handles network failures and missing portal links safely

---

## RULES (NO SCOPE DRIFT)

Until launch:
- No enterprise features
- No advanced analytics
- No multi-invoice aggregation
- No AI optimizations beyond stability
- No redesign discussions
- No refactors unless critical

We build only what is required to launch and charge.

---

## 10-DAY EXECUTION PLAN

DAY 1-2
- Stabilize upload flow
- Improve report UI (show actual data cleanly)
- Add basic file validation
- Add basic error handling

DAY 3-4
- Implement Paddle subscriptions
- Add PRO vs FREE logic
- Limit FREE users (e.g. 3 invoices)

DAY 5
- Add usage limits enforcement
- Add rate limiting
- Add max file size protection

DAY 6
- Production deployment (Vercel)
- Production DB
- Environment security

DAY 7
- Billing test
- End-to-end paid user test

DAY 8
- Legal pages (ToS, Privacy)
- Landing page polish
- Pricing page

DAY 9
- Bug fixing
- Performance test

DAY 10
- Launch

---

## CURRENT PHASE
Phase: PRODUCTION BILLING CUTOVER COMPLETE

Completed:
- Paddle live credentials created
- Paddle catalog created with five EUR price IDs
- Production webhook created at `https://www.effluxa.com/api/paddle/webhook`
- Paddle environment variables added to Vercel Production
- Production build passed
- Production deploy passed
- Production smoke test passed, including webhook signature rejection without a signature

Paddle status: Technical payment processor migration complete. Production checkout configuration, client integration, catalog, webhook endpoint, database schema, login compatibility, Pro billing portal flow, sandbox subscription provisioning, and repeated-event protection are verified. No live production charge was used during testing. The production Paddle key’s portal permission should be rechecked in the live Paddle dashboard before the first paid customer uses Manage Billing.

Latest deployed hardening: error-handling commit `3320b82` is live on `https://www.effluxa.com`. Production smoke passed for public routes, protected dashboard redirects, malformed auth input, invalid tokens, unauthenticated Paddle/upload actions, unsigned Paddle webhook rejection, and explicit Paddle CSP hosts.

Next milestone: Continue with remaining error handling and report/dashboard polish.
