# EFFLUXA — STRATEGIJA 2026
### Pozicija, cena, pristup. Bez izgovora.

Datum: 25.11.2026. Ovaj dokument zamenjuje sve prethodne strateške pretpostavke.

---

## 1. GDE EFFLUXA STVARNO STOJI (provereno u kodu i bazi)

| Pokazatelj | Stvarno stanje |
|---|---|
| Registrovanih korisnika ikada | **8** — svi su tvoji test nalozi (bos***, dro***, fra***, nin***, nov***, sup***@effluxa.com) |
| Uploada ikada | **18** (test fajlovi) |
| Plaćenih kupaca | **0** |
| Prihoda | **0 €** |
| Paddle pretplata | **0** |
| Aktivnih organskih poseta | praktično **0** (14 stranica, 5 tankih vodiča, bez backlinkova) |
| Upload → plaćanje | nijedno nikad |

**Zaključak koji moraš prihvatiti:** Effluxa nije proizvod sa problemom konverzije. To je proizvod sa **nula distribucije i nula dokaza vrednosti**. Pet meseci je građeno, a nijedan strani čovek nikad nije platio. Sve dalje polazi od toga.

---

## 2. ŠTA KOD ZAPRAVO UME (ovo je prava imovina)

Effluxa nije ChatGPT omotač. U kodu postoji stvarna mašina:

1. **Ekstrakcija u 5 prolaza** — PDF/CSV/XLSX → strogo strukturirani JSON (AP fakture, plaćanja, AR aging, plate/overtime, inventar, dugovi, T&E, FX, povezana lica, politike). Model: `gpt-4.1-mini`, schema-enforced.
2. **32 deterministička pravila** u 9 kategorija: dupli plaćenici, split fakture, promena bankovnog računa dobavljača pre plaćanja, price creep, softverski višak, overtime anomalije, inventar, AR/AP aging, kovenante, FX izloženost, povezana lica.
3. **Verifikator + deduplikacija + confidence** po nalazu.
4. **Dokazi po nalazu** — stranica/red, dobavljač, faktura, datum, iznos, osnovica izračuna.
5. **Recurring poređenje perioda** — šta je novo, šta se ponavlja, šta više nije detektovano.
6. **Client workspace, tim, PDF/CSV export, control actions, AI Advisor (chat + voice + company intelligence).**
7. **Paddle billing** (merchant of record → PDV rešen globalno), auth, admin, cron.

**Ekonomija:** jedan audit košta **0,02–0,28 €** u OpenAI trošku. Bruto marža na bilo kojoj ceni je **>90%**. Trošak nije ograničenje. Distribucija jeste.

**Šta kod ne ume dobro (i to je ključno):**
- Vraća **91 nalaz** na kompletan finansijski paket. Čovek to ne može da iskoristi. Zato je prioritizacija sada ugrađena (`findingsPriority.ts`): top 3 akcije, sledećih 7, ostatak sakriven.
- Pravila traže **kompletan finansijski paket** (AP ledger + plaćanja + P&L + bilans + AR aging + plate + inventar + dugovi). Na jednoj izdvojenoj fakturi nema šta da nađe. **To određuje kome prodajemo.**
- „Fast text" put je u praksi mrtav — kvalifikuje se samo sintetički test fajl. Svaki realan audit plaća 5 AI prolaza.
- Job se izvršava iz **browsera korisnika**, ne iz pozadinskog workera; recovery cron nije bio zakazan.

---

## 3. TRŽIŠTE: GDE JE RUPA (proverene cene, novembar 2026)

| Ko | Šta radi | Cena | Za koga |
|---|---|---|---|
| Xelix (UK) | AP kontrola, 500+ tačaka po fakturi | **£40.000–120.000/god** | enterprise |
| FISCAL (UK) | AP forenzika, dupli plaćenici | **£108.000–123.000/god** | javni sektor |
| MindBridge | AI audit | **~$10.000+/god** | audit firme |
| Glean.ai | uštede na fakturama | **$295/mo** (35 faktura), traži QuickBooks/Xero | US SMB |
| DataSnipper | Excel add-in za audit | **€49–129/user/mo** | revizori |
| Qwantify | AI audit za SME revizore | **£1.999–5.999/mo** | audit firme |
| PILAS.AI | AI analiza faktura | **$15–40/mo** | komoditet |
| Recovery audit firme | naplata iz nađene uštede | **20–40% kontingencija** ili €15k–75k fiksno | mid-market |

**Rupa je jedna i ogromna:**

> Ne postoji self-serve proizvod gde čovek **uploduje finansijske fajlove koje već ima** i dobije **rangiran, dokazima potkrepljen izveštaj o curenju** — po ceni koju SME ili računovodstvena firma može da plati bez odobrenja.

Sve ostalo je jedno od tri: (a) enterprise sa implementacijom, (b) per-seat alat koji kažnjava kupca, (c) komoditet koji ne kvantifikuje ništa. Nijedan ozbiljan igrač ne nudi **portfolio režim** za firme po cenи po klijentu.

**Dodatna rupa — poverenje:** računovođe odbijaju AI audit koji „halucinira". Nijedan proizvod u SME cenovnom rangu ne daje **dokaz po nalazu**. Effluxa to već ima u kodu.

---

## 4. POZICIJA: ŠTA EFFLUXA JESTE

**Kategorija koju osvajaš: File-first Financial Leakage Audit.**

> **Effluxa pretvara finansijske fajlove koje firma već ima u rangiran, dokazima potkrepljen izveštaj o curenju — za minute, bez integracije, bez poziva, bez konsultanta.**

Tri rečenice koje definišu pristup:
1. **File-first** — ne traži integraciju, karticu, banku ni pristup ERP-u. Počinje od PDF-a, CSV-a ili Excela.
2. **Evidence-linked** — svaki nalaz nosi izvor, confidence i osnovicu izračuna. To je razlika između alata i igračke.
3. **Ranked, ne iscrpan** — top 3 akcije, ne 91 nalaz. Kupac plaća odluku, ne listu.

**Šta Effluxa nikad ne tvrdi:** da je to revizorsko mišljenje, da je nalaz dokazana prevara, ni da je iznos garantovana ušteda. Nalaz je **signal za proveru**. To je i pravna zaštita i prodajna prednost kod finansijskih profesionalaca.

---

## 5. ZAŠTO ĆE TU USPETI (i gde je granica tvrdnje)

Ne postoji mesto sa „100% uspeha" — svako ko ti to kaže laže. Postoji mesto sa **najboljim odnosom (veličina rupe × tvoja sposobnost × tvoja ograničenja)**. To je ovo:

1. **Rupa je dokazana** — nijedan igrač ne pokriva taj segment po toj ceni (tabela gore).
2. **Tvoja ograničenja se poklapaju sa rupom** — nemaš prodaju, ne želiš pozive, nemaš budžet. File-first self-serve je jedini model koji funkcioniše bez ljudske prodaje.
3. **Ekonomija dozvoljava agresiju** — audit košta 0,02–0,28 €. Možeš dati besplatnu proveru gde konkurent sa enterprise cenom ne sme.
4. **Barijera nije model, nego dokazi i pravila** — 32 deterministička pravila + verifikator + benchmark korpus se ne mogu „pojestí" jednim promptom. To je odbrana od komoditizacije.
5. **Globalno od prvog dana** — Paddle rešava PDV, proizvod je jezički agnostičan (Advisor govori 20+ jezika), cena je u EUR.

**Granica:** ako u 90 dana ne bude **≥20 plaćenih** uz ovaj plan, problem nije kanal — problem je ponuda ili kvalitet nalaza. Tada se menja ponuda, ne dodaje još koda.

---

## 6. KOME PRODAJEMO (dva ICP-a, tim redom)

**ICP 1 — Računovodstvene, knjigovodstvene i fractional-CFO firme (5–50 ljudi).**
- Imaju kompletan finansijski paket po klijentu — tačno ono što motor traži.
- Jedan klijent = više auditа = portfolio = recurring.
- Motiv: novi prihod od postojećih klijenata („leakage review" kao dodatna usluga), brži first-pass, bolji razgovor sa klijentom.
- Prodaja: **bez poziva** — self-serve Agency + rev-share 25% + white-label izveštaj.

**ICP 2 — SME vlasnik/finansijski lead u događaju.**
- Događaj: kredit/refinansiranje, due diligence, sumnja na curenje, troškovna kriza, priprema za investitora ili bord.
- Motiv: konkretan broj i lista za akciju pre razgovora sa bankom/partnerom.
- Prodaja: **€149 jedan audit**, plaća karticom, dobija PDF za 15 minuta.

**Geografija (redom):** UK/Irska → Australija/NZ → Kanada → Singapur → UAE/GCC → US. Razlog: engleski, plaćaju software cene, manje konkurencije u ovom rangu; UAE ima najveću spremnost na plaćanje i najslabiju lokalnu ponudu.

---

## 7. CENOVNA POLITIKA (realna, odbranjiva)

Cena se **ne veže za software**, veže se za **uslugu koju zamenjuje**: forenzički pregled 2.500–50.000 €, recovery audit 20–40% kontingencije, Qwantify 1.999 £/mo.

| Paket | Cena | Šta uključuje | Zašto ta cena |
|---|---|---|---|
| **Free File Check** | **0 €** | Prava analiza tvog fajla: leakage score, rizik, **top 3 nalaza**, broj preostalih. Bez naloga, bez emaila. | Trošak 0,02–0,28 €. Ovo je akvizicioni motor; konkurencija to ne sme. |
| **Full AI Audit** | **149 €** jednokratno | Svi nalazi, dokazi, osnovica, prioritetna lista akcija, executive PDF. | Ispod tržišnog poda za productized audit ($299–1500), iznad komoditeta ($15–40). Impulsna odluka bez odobrenja. |
| **Pro** | **99 €/mo** ili **990 €/godišnje** | Neograničeni sopstveni auditi, pun pristup, poređenje perioda, export/share. | Sweet spot za SME ($99–249). Ispod Glean $295. |
| **Agency** | **399 €/mo** ili **3.990 €/god** | Neograničeni klijentski fajlovi (do 100/mo), white-label, tim, portfolio, mesečni summary. | $3–10/klijent je tržišni standard za firme; 100 klijenata = 4 €/klijent. Per-firma, NE per-seat. |
| **Founding 50** (lansirna ponuda) | **50% na prva 3 meseca** za prvih 50 Agency firmi | Zadržavaju cenu trajno | Stvara hitnost bez lažne oskudice. |

**Pravila koja se ne krše:**
- Nikad per-seat. Per-seat kažnjava tačno onog kupca kome prodajemo.
- Nikad kontingencija (% od nađenog). Traži ljudsku verifikaciju — ubija automatizaciju.
- Nikad „enterprise custom". Nemaš prodaju.
- Godišnja opcija uvek vidljiva (2 meseca gratis) — podiže cash i zadržavanje.
- Free check ostaje besplatan zauvek. To je ulaz, ne promocija.

**Matematika do prvih 10.000 €/mo:**
- 25 Agency × 399 € = 9.975 €, ili
- 100 Pro × 99 € = 9.900 €, ili
- realno: **8 Agency (3.192 €) + 40 Pro (3.960 €) + 25 Full Audit (3.725 €) = 10.877 €/mo ekvivalent**.

---

## 8. AUTOMATIZOVANI MODEL (tvoja uloga: nadzor + podizanje prihoda)

| Funkcija | Ko radi | Kako |
|---|---|---|
| Akvizicija | Mašina | SEO stranice + besplatni alati + besplatan check + automatizovan cold email + affiliate |
| Prodaja | Mašina | Free check → paywall → checkout. **Bez poziva, bez demo-a.** |
| Onboarding | Mašina | Instant vrednost pre naloga → nalog → email sekvenca |
| Dostava | Mašina | Audit engine (5 prolaza + 32 pravila) |
| Podrška | Mašina + Advisor | AI Advisor (chat/voice), dokumentacija, auto-odgovor + šabloni |
| Naplata | Paddle | Merchant of record, PDV, dunning |
| Izveštavanje | Dashboard | Signup → audit → paid, MRR, churn |
| **Ti** | **Nadzor** | 30–60 min nedeljno: prihod, churn, greške, jedna odluka |

**Ono što se NE može 100% automatizovati i zato se ne radi:** 1:1 pozivi, demo-i, LinkedIn DM automatizacija (rizik banovanja), ručna prodaja. Ako neki kanal traži tvog vremena — ne radi se.

---

## 9. PLAN 90 DANA (jedini koji se broji)

| Nedelja | Šta se pušta | Cilj |
|---|---|---|
| 1 | Free check na sajtu, nova cena, besplatan Duplicate Invoice Finder, Paddle katalog | Prvih 10 besplatnih provera |
| 2 | 12 SEO/use-case stranica + 6 comparison stranica, sitemap, G2/Capterra/AlternativeTo profili | Indeksiranje |
| 3 | Automatizovan cold email (sopstveni domen), 300/dan, sekvenca 4 mejla | 3–6% odgovora |
| 4 | Email sekvence za trial → paid, referral/affiliate 25% | Prvi plaćeni |
| 5–8 | Novi sadržaj 3×/nedeljno, Reddit odgovori, LinkedIn teardown 1/dan | 20–35 plaćenih kumulativno |
| 9–12 | Benchmark izveštaj (anonimizovani korpus), partner landing po firmi, godišnji planovi | 5.000–10.000 €/mo run-rate |

**Realno očekivanje za 90 dana pri 0 € budžeta: 20–35 plaćenih kupaca, 2.500–5.000 € prihoda.** Svako obećanje 100+ je laž. Ono što se gradi u tih 90 dana je mašina koja posle radi bez tebe.

---

## 10. KPI I KILL KRITERIJUMI

**Nedeljno gledaj samo ovo:**
1. Besplatne provere (broj) → 2. Free check → nalog (%) → 3. Nalog → plaćeno (%) → 4. MRR → 5. Churn.

**Kill kriterijumi (menjaj ponudu, ne dodaj kod):**
- <100 besplatnih provera u 30 dana → problem je saobraćaj, ne proizvod.
- Free check → nalog <15% → ponuda/paywall ne radi.
- Nalog → plaćeno <5% → cena ili dokaz vrednosti.
- Prvi plaćeni ne urade drugi audit u 30 dana → proizvod nije recurring, već jednokratni alat → tada se menja model, ne dodaje feature.

---

## 11. ŠTA JE VEĆ URAĐENO U KODU (ovo nije plan, ovo je pušteno)

- `/instant` — besplatna provera bez naloga (prava analiza tvog fajla, top 3 nalaza + paywall).
- `findingsPriority.ts` — rangiranje nalaza: top 3 akcije umesto zida od 91 nalaza.
- `/tools/duplicate-invoice-finder` — besplatan alat koji radi u browseru (bez uploada, bez AI troška) — SEO + akvizicija.
- Nova cena u kodu: 149 € / 99 € / 399 € + godišnji planovi.
- Homepage preusmeren sa „financial leak detection" na ono što ljudi traže (dupli plaćenici, precenjivanje dobavljača, rasipanje).
- Uklonjen „Request a partner pilot" obrazac → self-serve.
- `/security` — DPA i sub-procesori (konverziona prepreka za računovođe).
- Recovery cron za audit jobove zakazan (jobovi više ne vise zauvek).
- Ograničenje uploada 4 MB (usklađeno sa Vercel limitom), dnevni budžet za ručne retry-je.

Detalji za puštanje u produkciju: `EFFLUXA_PADDLE_I_DEPLOY.md`.
