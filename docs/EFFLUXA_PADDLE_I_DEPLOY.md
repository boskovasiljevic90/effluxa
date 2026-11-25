# EFFLUXA — PUŠTANJE U PRODUKCIJU
### Paddle katalog + deploy. Redosled je obavezan.

Kod je izmenjen i **build prolazi**. Da bi se izmene videle na `www.effluxa.com`, uradi ovo po redu. Ukupno ~20 minuta.

---

## KORAK 1 — Paddle katalog (10 min)

U Paddle dashboard → Catalog → Products, napravi **nove cene** (ne menjaj postojeće — Paddle ne dozvoljava izmenu iznosa postojeće cene):

| Proizvod | Tip | Iznos | Valuta |
|---|---|---|---|
| Full AI Audit | one-time | **149** | EUR |
| Effluxa Pro Monthly | subscription, monthly | **99** | EUR |
| Effluxa Pro Annual | subscription, yearly | **990** | EUR |
| Effluxa Agency Monthly | subscription, monthly | **399** | EUR |
| Effluxa Agency Annual | subscription, yearly | **3.990** | EUR |

Napravi i popust:
- **Founding 50** — 50% popusta, trajanje 3 meseca, recurring, limit 50 iskorišćenja.

---

## KORAK 2 — Vercel environment varijable

Vercel → Project `effluxa` → Settings → Environment Variables → **Production**. Zameni vrednosti novim Price ID-jevima iz Paddle:

```
PADDLE_FULL_AUDIT_PRICE_ID        = pri_xxx   (149 EUR one-time)
PADDLE_PRO_MONTHLY_PRICE_ID       = pri_xxx   (99 EUR/mo)
PADDLE_PRO_ANNUAL_PRICE_ID        = pri_xxx   (990 EUR/yr)
PADDLE_AGENCY_MONTHLY_PRICE_ID    = pri_xxx   (399 EUR/mo)
PADDLE_AGENCY_ANNUAL_PRICE_ID     = pri_xxx   (3.990 EUR/yr)
```

Ostale Paddle varijable (API key, client token, webhook secret, environment) **ne diraj**.

> **Redosled je važan:** ako prvo deployuješ kod, sajt će prikazivati 149 €, a Paddle će naplaćivati 99 €. Uradi Korak 1 i 2 pre deploya.

---

## KORAK 3 — Deploy koda

Iz foldera `~/effluxa`:

```bash
git add -A
git commit -m "Instant free check, finding prioritisation, new pricing, free tools, security page"
git push origin main
```

Vercel automatski deployuje `main`. Ako ne, `vercel --prod`.

> Radna grana u repozitorijumu je `agent/paddle-billing-migration`, a `main` postoji. Proveri da li Vercel prati `main` i da li je lokalna `main` ažurna pre merge-a.

---

## KORAK 4 — Verifikacija posle deploya (5 min)

Otvori redom i proveri:

- [ ] `https://www.effluxa.com/instant` — upload male CSV/XLSX → dobiješ skor + 3 nalaza + paywall. **Bez naloga.**
- [ ] `https://www.effluxa.com/tools/duplicate-invoice-finder` — CSV sa dva ista reda → prikaže duplikat.
- [ ] `https://www.effluxa.com/security` — stranica se otvara, footer link radi.
- [ ] Homepage prikazuje **149 € / 99 € / 399 €**.
- [ ] Checkout za Pro otvara Paddle sa **99 €** (ne 79 €).
- [ ] Full Audit checkout prikazuje **149 €**.
- [ ] `vercel.json` cron `audit-jobs` je aktivan u Vercel → Settings → Cron Jobs (Pro plan).
- [ ] Registracija → upload → izveštaj i dalje radi.

Ako se cena u checkoutu ne poklapa — env varijabla nije zamenjena ili deployment nije uzeo nove vrednosti (redeploy bez cache).

---

## KORAK 5 — Prvih 7 dana posle deploya

1. Svaki dan: pogledaj `/dashboard/admin` (signup, provere, greške).
2. Pošalji **jedan** mejl 20 firmama iz Xero/QuickBooks direktorijuma, sa linkom na `/instant`.
3. Objavi **jedan** LinkedIn teardown dnevno (šablon u `EFFLUXA_MARKETING_0_USD.md`).
4. Napravi G2 i Capterra profil (besplatno).
5. Ne diraj kod dok ne bude prvih 10 besplatnih provera.

---

## ŠTA JE TAČNO IZMENJENO U KODU

| Fajl | Promena |
|---|---|
| `src/app/instant/*` | Nova javna stranica: besplatna provera bez naloga |
| `src/app/api/instant-audit/route.ts` | Anonimni audit endpoint (rate limit 3/sat/IP, globalni cap 60/sat) |
| `src/lib/instantAudit.ts` | Gradi teaser iz stvarnog izveštaja |
| `src/lib/findingsPriority.ts` | Rangiranje nalaza: top 3 / sledećih 7 / ostatak |
| `src/app/tools/*` | Besplatan Duplicate Invoice Finder (radi u browseru) + hub |
| `src/app/security/page.tsx` | DPA, sub-procesori, retencija |
| `src/lib/pricing.ts` | Nove cene + godišnji planovi |
| `src/app/page.tsx` | Nova pozicija, CTA na besplatnu proveru, nove cene, self-serve partner CTA |
| `src/lib/effluxaProductKnowledge.ts` | Advisor odgovara novim cenama |
| `src/components/PublicHeader.tsx` | „Free check" u navigaciji |
| `src/components/PublicFooter.tsx` | Linkovi ka alatima i sigurnosti |
| `src/app/sitemap.ts` | Nove stranice |
| `vercel.json` | Cron za oporavak audit jobova (svaka 2 min) |
| `src/app/api/audit-jobs/[id]/process/route.ts` | Dnevni budžet za ručne retry-je (3/dan) |
| `src/lib/uploadValidation.ts` + upload UI | Limit 4 MB (usklađeno sa Vercel-om) |
| `src/app/globals.css` | Stilovi za nove stranice |

**Nije dirano:** Paddle webhook logika, auth, baza, postojeći dashboard. Nema migracija baze.

---

## Rollback

Ako nešto pukne: `git revert <commit>` i push. Nema promena šeme baze, pa je rollback čist.
Ako Paddle cena ne radi: vrati stare env varijable — kod prikazuje nove cene, ali naplata radi po starom. Bolje vrati i kod (revert) da se ne oglašava pogrešna cena.
