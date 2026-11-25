# EFFLUXA — LISTA OPTIMIZACIJE
### Da ostane konkurentna na AI tržištu i da je ne pregazi model

Podeljeno u 4 bloka: **P0 = prihod sada**, **P1 = pouzdanost**, **P2 = odbrana (moat)**, **P3 = skaliranje**.
Svaka stavka ima konkretan fajl/mesto i procenu.

---

## P0 — PRIHOD SADA (nedelja 1–2)

| # | Stavka | Zašto | Gde |
|---|---|---|---|
| 1 | **Paddle katalog na nove cene** (149 / 99 / 399 + godišnji) | Kod prikazuje nove cene; Paddle mora da ih naplati isto | Paddle dashboard + Vercel env |
| 2 | **Deploy novih stranica** (`/instant`, `/tools/*`, `/security`) | Akvizicioni motor trenutno postoji samo lokalno | `vercel --prod` |
| 3 | **Founding 50 kuponi** u Paddle | Lansirna ponuda 50% / 3 meseca | Paddle |
| 4 | **G2 + Capterra + AlternativeTo profili** | AI citati i poverenje; besplatno | spolja |
| 5 | **Email sekvenca** (7 + 4 mejla) | Konverzija bez tebe | Resend + cron |
| 6 | **Self-serve partner stranica** (25% rev-share, wholesale 199/399) | Najveći LTV kanal | `/partners` |
| 7 | **Automatski odgovor na kontakt formu** | Uklanja tvoje vreme | `api/contact` |

---

## P1 — POUZDANOST (nedelja 2–4)

| # | Stavka | Problem danas | Gde |
|---|---|---|---|
| 8 | **Durable worker** | Job se izvršava iz browsera; zatvaranje taba = zaglavljen job | `UploadClient`, `process/route.ts` → queue + cron |
| 9 | **Recovery cron** | ✅ zakazan u `vercel.json` (`*/2 min`) | `vercel.json` |
| 10 | **Retry budžet** | ✅ ručni retry ima 3/dan po nalogu | `process/route.ts` |
| 11 | **maxDuration / timeout** | 300 s nije dovoljno za 5 prolaza na skeniranom PDF-u | `routing.ts` (konkurencija), chunking |
| 12 | **Chunked extraction** | 40k znakova se tiho seče; 500+ redova AP ledgera se gubi | `extractor.ts:219` |
| 13 | **Rate limit u Redis/DB** | In-memory Map ne radi na multi-instance serverless | `rateLimit.ts` |
| 14 | **weeklyUploadCount na uspeh** | Neuspeo audit troši besplatnu kvotu | `upload/route.ts` |
| 15 | **4 MB limit** (✅ usklađeno) | Vercel body cap ~4,5 MB | `uploadValidation.ts` |
| 16 | **Voice/chat auth + cap** | Neautentifikovan realtime voice = ~$3/sesija | `advisor/realtime` |
| 17 | **Dunning** | `past_due` ne šalje mejl, Agency odmah gubi pristup | `paddle/webhook`, `email.ts` |
| 18 | **Auth middleware** | Nema deny-by-default; svaki route ručno proverava | novi `middleware.ts` |
| 19 | **Share token expiry/revoke** | Share linkovi nikad ne ističu | `reports/[id]/share` |
| 20 | **xlsx upgrade** | Prototype-pollution advisory na `xlsx@0.18.5` | `package.json` |

---

## P2 — ODBRANA OD KOMODITIZACIJE (mesec 2–6)

Ovo je jedini deo koji sprečava da ChatGPT/Claude pojede proizvod.

| # | Stavka | Zašto je moat |
|---|---|---|
| 21 | **Benchmark korpus** — anonimizovane statistike po industriji/zemlji/tipu fajla („prosečno X duplikata na 1.000 AP redova") | LLM nema tvoje podatke. Ovo je istovremeno SEO, PR i email sadržaj. |
| 22 | **Rule library kao proizvod** — 32 → 80+ pravila, svako sa dokumentacijom i testovima | Deterministička pravila + dokazi = poverenje koje chat ne daje |
| 23 | **Recurring monitoring** — mesečni auto-audit, alert na novi nalaz | Workflow lock-in, churn dole |
| 24 | **Evidence quality** — svaki nalaz: stranica/red, osnovica izračuna, confidence, „true/false/unclear" od korisnika | Feedback loop koji poboljšava pravila |
| 25 | **Vertical depth** — 2–3 niše do kraja (npr. logistics, SaaS, klinike) sa pravilima specifičnim za njih | Generic alati ne mogu da prate |
| 26 | **API + white-label** za firme | Distribucija kroz tuđe proizvode |
| 27 | **Integracije tek posle dokazane potražnje** (Xero/QB/CSV drop folder) | Integracija je trošak; ne radi pre prihoda |

---

## P3 — SKALIRANJE (mesec 6–12)

| # | Stavka |
|---|---|
| 28 | Godišnji planovi kao default (cash-flow + retention) |
| 29 | Multi-entity i multi-currency izveštaji |
| 30 | Partner portal: co-branded landing `/partners/[firm]`, automatska isplata provizije |
| 31 | SOC2-lite / pen-test izveštaj i DPA šablon (enterprise vrata) |
| 32 | Pricing eksperiment: per-client (€4–8/klijent/mo) za firme 100+ klijenata |
| 33 | Lokalizacija checkouta i izveštaja (EN/DE/FR/ES/AR) — UAE i EU |
| 34 | „Recovery audit" premium tier sa ljudskom verifikacijom — tek kad imaš 100+ kupaca |

---

## ŠTA SE NE RADI (i zašto)

- **Ne juri feature parity** sa Glean/Ramp/BILL — oni su AP automatizacija, ti si audit.
- **Ne dodavaj bookkeeping, plaćanja, ERP.** To je drugi proizvod i druga firma.
- **Ne kupuj reklame** dok organski kanal ne konvertuje ≥5%.
- **Ne gradi enterprise prodaju.** Nemaš tim.
- **Ne veruj DAU/MAU.** Jedini brojevi: plaćeni nalozi, MRR, drugi audit u 30 dana.

---

## NEDELJNI DASHBOARD (5 brojeva)

1. Besplatne provere
2. Free check → nalog (%)
3. Nalog → plaćeno (%)
4. MRR
5. % kupaca sa drugim auditom u 30 dana

Ako bilo koji padne dve nedelje zaredom — menjaj taj korak, ne ceo proizvod.
