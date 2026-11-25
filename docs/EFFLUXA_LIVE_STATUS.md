# EFFLUXA — STATUS POSLE PUSH-A U PRODUKCIJU
Datum: 25.11.2026. Ovaj dokument opisuje šta je stvarno živo na `www.effluxa.com`, ne šta je planirano.

## Živo u produkciji

| Šta | URL | Stanje |
|---|---|---|
| Besplatna provera bez naloga | `/instant` | živo, testirano sa pravim CSV-om |
| Free alat za duplikate (u browseru) | `/tools/duplicate-invoice-finder` | živo |
| Hub alata | `/tools` | živo |
| Sigurnost, DPA, sub-procesori | `/security` | živo |
| Partner program | `/partners` | živo |
| 6 comparison stranica | `/compare` | živo |
| 18 use-case stranica | `/use-cases` | živo |
| Free alat: price creep checker | `/tools/vendor-price-creep-checker` | živo |
| Odjava sa mejling liste | `/unsubscribe` | živo |
| Sitemap | `/sitemap.xml` | **46 URL-ova** |

## Cene (žive u Paddle, live mode)

| Proizvod | Paddle Price ID | Iznos | Status |
|---|---|---|---|
| Full AI Audit | `pri_01m89gspvrkg5tgqpmt9bw8nqz` | 149,00 EUR one-time | active |
| Pro Monthly | `pri_01m89gsq46jpy7mf5cfhd3afy6` | 99,00 EUR / month | active |
| Pro Annual | `pri_01m89gsq9ye7bj3588jc3wm7je` | 990,00 EUR / year | active |
| Agency Monthly | `pri_01m89gsqfz7qt8dayxhk36bp00` | 399,00 EUR / month | active |
| Agency Annual | `pri_01m89gsr16nxdtseqzbjqq4zrz` | 3.990,00 EUR / year | active |

Sve vrednosti su upisane u Vercel Production environment. Stare cene su ostale u katalogu kao neaktivne za sajt; mogu se arhivirati u Paddle.

## Ispravke u audit engine-u (nađene pri prvom živom testu)

1. **Skor je bio naduvan**: 2 nalaza na malom fajlu davalo je 100/100 Critical. Sada se skor skalira gustinom nalaza.
2. **AI ekstrakcija je spajala identične redove**, pa je duplikat mogao da bude propušten. Dodat je deterministički `ledgerScan` koji ponovo čita sirove redove CSV/XLSX i hvata tačne i skoro-duplikate bez modela.
3. **1% granica za near-duplicate je padala zbog floating pointa** (860,00 vs 868,60). Sada se poredi u celim centima.

Rezultat na test fajlu: 5 od 5 duplikata detektovano (3 tačna, 2 skoro), skor 27 uz stvarni rizik, bez lažnog 100/100.

## Dodato posle prvog dana (perzistencija i troškovna zaštita)

| Šta | Stanje | Testirano |
|---|---|---|
| Besplatan check se čuva 14 dana pod privatnim tokenom | živo | `GET /instant/{token}` = 200 |
| Rezultat se prenosi u nalog pri registraciji, bez drugog uploada | živo | signup vratio `reportId`, izveštaj u dashboardu, `unlocked=false` |
| Sirovi redovi se ne čuvaju (samo findings + metrics) | živo | `reportHasExtractedData: false` |
| Automatsko brisanje isteklih zapisa | živo | cron `data-retention` |
| Voice/advisor sesija traži prijavu | živo | anonimni poziv = 401 |
| Tekstualni Advisor ostaje dostupan posetiocima | živo | limit 40 / 10 min po IP |

Tok: `free check` → token → `signup?instant=TOKEN` → izveštaj u dashboardu → plaćanje otključava. Cena se ne menja.

## Kvalitet izveštaja: popravljeno posle testa na velikom ledgeru

Test na fajlu od 53 reda (5 stvarnih duplikata) otkrio je da prioritizacija spaja različite duplikate u jedan nalaz, jer je grupisala po `ruleId + naslov`. Posledica: paywall je prikazivao „0 preostalih nalaza", pa kupac nije imao šta da plati.

Popravka: grupisanje sada koristi stvarni subjekt nalaza (dobavljač + faktura + iznos). Rezultat posle popravke na istom fajlu:

| Pre | Posle |
|---|---|
| 3 nalaza, 0 zaključanih | **6 nalaza, 3 zaključana** |
| duplikati 2 od 5 | **5 od 5 duplikata** |
| duplikat izloženost 3.200 € | **4.839 €** |
| paywall bez sadržaja | paywall sa 3 nalaza i 6.819 € kvantifikacije |

## Akvizicioni sadržaj (stanje 25.11.2026)

- 2 besplatna alata koja rade u browseru: duplikati faktura i rast cena dobavljača. Nula AI troška, nula uploada, koriste se kao SEO magnet i dokaz vrednosti.
- 18 use-case stranica + 6 comparison stranica + 5 vodiča.
- 46 URL-ova u sitemapu; sitemap predat u Google Search Console.

## Prvi plaćeni tok verifikovan (25.11.2026)

Vlasnik je prošao ceo tok na živom sajtu sa Paddle 100% kuponom: besplatan check → registracija → checkout → webhook → **otključan pun izveštaj**. Jednokratna naplata (Full Audit) je time potvrđena end-to-end, uključujući Paddle webhook i provision.

Posle prelaska na Vercel Pro vraćeni su pravi cron rasporedi:
- oporavak audit jobova: **svaka 2 minuta**
- nurture mejlovi: **svakih sat**

## Defekt nađen i popravljen posle testa

Ekstrakcioni prolaz `working-capital-and-kpis` je prekoračio limit izlaznih tokena (6.000), vratio nepotpun JSON i **ceo audit je pao na fallback sa 0 nalaza** — takav izveštaj je kupac mogao da plati.

Popravke:
- izlazni budžet podignut na 12.000 (transakcije 16.000),
- automatski retry prolaza sa 1,75× većim budžetom kad odgovor bude odsečen,
- kad analiza ipak padne, kupcu se više ne piše „nema curenja" nego „analiza nije završena".

Posle popravke isti paket daje 43 nalaza umesto 0.

## Ograničenja trenutnog stanja

- Vercel je sada **Pro**: cron radi na 2 minuta (job recovery) i 1 sat (nurture).
- Besplatan check se čuva 14 dana; posle isteka se briše i korisnik mora ponovo da uploaduje.
- Nurture sekvenca šalje 5 mejlova (2h, 24h, 72h, 7d, 14d) ali na Hobby planu sa dnevnim cron-om tajming je pomeren na „jednom dnevno".
- Enterprise voice/chat endpointi još nisu zaštićeni auth-om (poznat troškovni rizik).

## NAPLATA: rešeno i verifikovano (25.11.2026)

Testirano na živom sajtu, bez naplate kartice, sa privremenim nalogom:

| Poziv | Rezultat |
|---|---|
| `POST /api/paddle/create-checkout-session` (Full Audit) | **200**, transakcija `txn_01m89j79d6k5nr321q21qy15g6`, checkout URL vraćen |
| Iznos u transakciji | **14.900 centi = 149,00 EUR**, price `pri_01m89gspvrkg5tgqpmt9bw8nqz` (nova cena) |
| `POST /api/paddle/create-subscription` (Pro monthly) | **200**, transakcija `txn_01m89j7ab285emjfqjckwf3afm` |
| Cene u Paddle | svih 5 aktivno: 149 €, 99 €/mo, 990 €/god, 399 €/mo, 3.990 €/god |

Uzrok ranijeg pada je bio Paddle API ključ bez dozvole za transakcije (`forbidden`). Novi ključ u Vercelu ima potrebne dozvole.

Dve testne transakcije su ostale kao nedovršeni draftovi u Paddle (`txn_01m89j79d6…`, `txn_01m89j7ab2…`) i same ističu. Mogu se i ručno poništiti u Paddle dashboardu.

Dodato: ako Paddle odbije zahtev zbog dozvole, beleži se `paddle_transaction_error` i šalje admin mejl.

## Obavezno pre marketinga

1. Rotirati Paddle API ključ koji je korišćen za kreiranje cena (bio je u razgovoru).
2. Proveriti da Paddle webhook `https://www.effluxa.com/api/paddle/webhook` prima nove price ID-jeve (isti proizvodi, pa bi trebalo da radi bez izmene).
3. Poslati sitemap u Google Search Console.
4. Prvih 20 mejlova firmama iz Xero/QuickBooks direktorijuma.
