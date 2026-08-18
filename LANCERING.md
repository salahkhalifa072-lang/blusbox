# Launchchecklist

Af te lopen vóórdat de webshop opengaat. Wat hier niet is afgevinkt, is niet
gecontroleerd — niet "waarschijnlijk goed".

Wie een punt afvinkt zet er de datum bij. `OPEN.md` houdt bij wat nog moet
gebeuren en wie aan zet is; deze lijst is de laatste controle.

## 0. Werkt de omgeving überhaupt

- [x] Neon Postgres in Frankfurt, gekoppeld aan het Vercel-project — 12-08-2026
- [x] Migraties gedraaid, catalogus geseed, voorraad op 300
- [x] Beheerdersaccount `info@blusbox.nl`
- [ ] `https://www.blusbox.nl/account` geeft 200 en niet 500 — snelste controle
      of de database bereikbaar is vanaf de live site

## 1. Wettelijk verplicht

Zonder deze punten mag een Nederlandse webshop niet verkopen.

- [x] Handelsnaam, KvK, btw-id, telefoon en e-mail staan in de footer, op
      `/contact`, in de voorwaarden en op het herroepingsformulier — 12-08-2026
- [x] Geen `[VERIFY]` meer op een publieke pagina
- [ ] Geen vestigingsadres getoond: dat is een bewuste keuze. Zorg dat het
      retouradres wél in de retourbevestiging staat
- [ ] Algemene voorwaarden, privacyverklaring, cookiebeleid en garantie zijn
      door een jurist bekeken en de "nog niet definitief"-melding is weg
- [ ] De prijs staat overal inclusief btw voor consumenten (§8)
- [ ] Herroepingsrecht van veertien dagen staat vóór het afrekenen genoemd
- [ ] Het modelformulier voor herroeping is te downloaden en gaat mee in de
      bevestigingsmail

## 2. Product en verzending

- [x] Geen gevaarlijke-goederenclassificatie — bevestigd door de klant,
      12-08-2026. Zie de kanttekening in `OPEN.md`
- [x] Verzending gratis, levertijd één werkdag, geen maximum per zending
- [x] Voorraad 300 stuks
- [ ] Vervoerder gekozen en tarief afgestemd
- [ ] Conformiteitsverklaring, veiligheidsinformatieblad, productblad en
      handleiding staan op `/downloads`

## 3. Betalen

- [x] Stripe staat in live-modus — geverifieerd 18-08-2026 met een echte
      `cs_live_`-sessie op www.blusbox.nl
- [x] Weergavenaam is "Blusbox"
- [x] iDEAL, kaart, Klarna en Bancontact staan aan (dashboard bepaalt dit,
      niet de code)
- [x] Webhook `blusbox-productie` geregistreerd, `STRIPE_WEBHOOK_SECRET`
      staat in Vercel en wordt aantoonbaar gebruikt (een foute handtekening
      geeft "No signatures found", niet "secret ontbreekt")
- [ ] Eén echte bestelling gedaan met een echte betaalmethode, en daarna
      terugbetaald
- [ ] Bij die test: order ging van `nieuw` naar `betaald`, bevestigingsmail
      kwam aan, herroepingsformulier zat erbij
- [ ] Diezelfde order op verzonden en daarna op geleverd gezet; beide
      berichten kwamen aan en de einddatum van de bedenktijd klopte

## 4. E-mail

- [ ] `blusbox.nl` is geverifieerd in Resend
- [ ] SPF, DKIM en DMARC staan in DNS en zijn groen in Resend
- [ ] Afzenderadres is een adres dat gelezen wordt, geen `no-reply@`
- [ ] `CRON_SECRET` staat in Vercel; zonder dat draait de dagelijkse
      herinneringsronde niet (`/api/cron/herinneringen`)
- [ ] Testmail aangekomen bij Gmail, Outlook en een eigen domein — niet in
      de spammap

## 5. Domein en hosting

- [ ] `blusbox.nl` en `www.blusbox.nl` komen allebei aan
- [ ] Eén van de twee is de canonieke host; de ander stuurt door met 301
- [ ] `NEXT_PUBLIC_SITE_URL` staat in Vercel op de canonieke host
- [ ] HTTPS werkt, certificaat is geldig, HSTS staat aan
- [ ] `robots.txt` en `sitemap.xml` komen aan en verwijzen naar de
      canonieke host
- [ ] Sitemap ingediend in Search Console en zonder fouten verwerkt
- [ ] Geen enkele `<link rel="canonical">` wijst naar localhost

## 6. Kwaliteit

Dit deel is geautomatiseerd. Draai het en lees de uitkomst.

```bash
npm run lint && npx tsc --noEmit && npm test && npm run e2e
```

- [ ] `npm test` — 134 unittests groen
- [ ] `npm run e2e` — 116 tests groen op desktop én mobiel, inclusief de
      toegankelijkheidsaudit op alle publieke routes
- [ ] Beheerdeel meegetest: `E2E_ADMIN_EMAIL=… E2E_ADMIN_WACHTWOORD=… npm run e2e`
      geeft 126 tests groen (de tien extra zijn de dashboardschermen)
- [ ] Lighthouse ≥ 95 op `/`, `/blusbox` en `/hoe-het-werkt` (§12). Meet
      tegen productie, niet lokaal
- [ ] De site is bruikbaar zonder JavaScript: prijs, tekst en navigatie
      zichtbaar

## 7. Beveiliging

- [ ] Alle sleutels die ooit in een chat, mail of screenshot hebben gestaan
      zijn geroteerd — zeker de Stripe- en Resend-sleutels
- [ ] `.env.local` staat niet in Git — `git log --all --full-history -- .env.local`
      geeft niets
- [ ] Een anonieme bezoeker komt niet in `/dashboard` of `/portaal`
      (afgedekt door `e2e/toegang.spec.ts`)
- [ ] Een installateur ziet alleen zijn eigen plaatsingen
- [ ] Er staat een admin-account klaar met een wachtwoord dat nergens
      anders gebruikt wordt

## 8. Na livegang

- [ ] Eerste echte bestelling handmatig nagelopen: betaling, mail, lotnummer
- [ ] Search Console: geen dekkingsfouten na een week
- [ ] Een terugroepactie een keer droog geoefend op testdata, zodat je weet
      hoe het werkt vóórdat het nodig is. Let op: versturen werkt pas zodra
      `blusbox.nl` in Resend geverifieerd is

## Wat bewust nog niet af is

Deze punten blokkeren de opening niet, maar iemand moet ze weten:

- `orders.mollieId` heet nog naar de vorige betaalprovider

Zie `OPEN.md` voor de volledige lijst.
