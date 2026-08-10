# Deploy — blusbox.nl op Vercel

Canonical host is the apex, `blusbox.nl`. `www.blusbox.nl` must resolve but
308-redirects to the apex (see `next.config.ts`), so both names work and only
one serves content.

## 1. Repo naar GitHub

Er is nog geen remote. Maak een **private** repo (`blusbox`) en:

```bash
git remote add origin git@github.com:<jouw-account>/blusbox.git
git push -u origin main
```

## 2. Database

Vercel draait serverless: de lokale Postgres.app is daar niet bereikbaar.
Neem een managed Postgres in **eu-central-1 / Frankfurt** — dichtst bij
Nederlandse bezoekers, en klantgegevens blijven in de EU.

Vanuit het Vercel-dashboard: **Storage → Create Database → Neon**.

Draai daarna de migratie tegen de productiedatabase:

```bash
DATABASE_URL="<productie-connection-string>" npm run db:migrate
```

## 3. Environment variables in Vercel

Project → Settings → Environment Variables, alle drie de omgevingen tenzij
anders vermeld:

| Variabele | Waarde |
|---|---|
| `DATABASE_URL` | connection string van Neon (met `?sslmode=require`) |
| `NEXT_PUBLIC_SITE_URL` | `https://blusbox.nl` |
| `AUTH_SECRET` | 32 willekeurige bytes, base64 — `npx auth secret` |
| `AUTH_URL` | `https://blusbox.nl` |
| `AUTH_RESEND_KEY` | API-key van Resend, zodra dat account er is |
| `MAIL_VAN` | `Blusbox <noreply@blusbox.nl>` |
| `STRIPE_SECRET_KEY` | live-key (`sk_live_…`); gebruik de test-key in Preview |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` van het endpoint uit stap 4b |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_…` |

> `AUTH_SECRET` en `STRIPE_SECRET_KEY` horen nergens in de repo. Zet ze
> uitsluitend in Vercel.


### 4b. Stripe-webhook registreren

Lokaal draait de webhook via `stripe listen`; in productie moet het endpoint
in het dashboard staan, met een eigen signing secret.

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://blusbox.nl/api/stripe/webhook`
3. Selecteer deze gebeurtenissen:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
4. Kopieer het `whsec_…` en zet dat als `STRIPE_WEBHOOK_SECRET` in Vercel

> De laatste drie zijn niet optioneel: iDEAL wordt asynchroon afgewikkeld.
> Zonder die gebeurtenissen blijft een betaalde bestelling op `nieuw` staan
> en wordt een mislukte betaling nooit afgesloten.

Controleer ook **Settings → Business settings → Public details**: die naam
staat op de betaalpagina en op het bankafschrift van de klant.

## 5. Domein koppelen

Project → Settings → Domains → voeg **beide** toe:

- `blusbox.nl`
- `www.blusbox.nl`

Vercel toont daarna de exacte records. Standaard is dat:

| Type | Naam | Waarde |
|---|---|---|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

Neem over wat Vercel toont — die waarden kunnen wijzigen.

**Let op bij een `.nl`-registrar:** sommige panelen accepteren geen CNAME op
`www` als er al andere records staan; verwijder dan eerst een bestaand
`www`-record. Laat bestaande `MX`-records met rust, anders stopt de mail.

Propagatie duurt meestal minuten, soms tot 24 uur. TLS regelt Vercel zelf.

## 6. Controleren na livegang

```bash
curl -sI https://www.blusbox.nl | grep -iE "^HTTP|^location"   # 308 → apex
curl -sI https://blusbox.nl | head -1                          # 200
curl -s https://blusbox.nl/robots.txt                          # sitemap-URL
curl -s https://blusbox.nl/sitemap.xml | head -5               # blusbox.nl
```

Verwacht: `www` stuurt door naar de apex, `robots.txt` en `sitemap.xml`
verwijzen naar `https://blusbox.nl` (niet naar localhost — dan staat
`NEXT_PUBLIC_SITE_URL` verkeerd).

## 7. Voor de webshop echt open kan

Nog openstaand uit de brief, los van hosting:

- §14 stap 6: afgerond — catalogus, winkelwagen, Stripe, verzendregels
- Bedrijfsgegevens in de footer en op `/contact` (`[VERIFY]`: KvK, btw-id,
  adres, e-mail)
- Juridische teksten laten controleren — ze dragen nu een zichtbare
  "nog niet definitief"-melding
- Prijs staat op € 26,95 incl. btw, verzending altijd gratis

## Rollback

Vercel bewaart elke deployment. Bij een probleem: Deployments → de vorige →
**Promote to Production**. Een migratie draait niet vanzelf terug; schrijf
voor destructieve migraties eerst een `down`-script.
