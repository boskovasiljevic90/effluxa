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

## CURRENT STATUS (DAY 0)

Working:
- Auth (login)
- JWT sessions
- PDF upload
- AI invoice analysis (Responses API)
- JSON parsing
- DB storage (Prisma)
- Report detail page

Not ready:
- Paddle sandbox credentials and end-to-end payment validation
- Production deployment
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
Phase: LAUNCH PREPARATION
Next milestone: Configure Paddle sandbox, run a real test payment/webhook cycle, then cut over to production.
