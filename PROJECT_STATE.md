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
- Production deployment and smoke test passed

Not ready:
- Controlled end-to-end paid transaction/webhook validation (not run to avoid charging a live card)
- Background processing
- Rate limiting
- Error handling hardening
- Proper report UI
- Legal pages
- File validation
- User dashboard polish

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

Next milestone: Run a controlled Paddle sandbox payment/webhook cycle or a deliberately approved first live transaction, then remove the legacy Stripe rollback variables and continue the remaining launch hardening.
