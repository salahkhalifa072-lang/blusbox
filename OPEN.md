# Nog open

Levend overzicht van wat nog moet gebeuren. Bijgewerkt tijdens de bouw.
Laatst bijgewerkt: 11 augustus 2026, na §14 stap 11 (SEO, gestructureerde
data, toegankelijkheid en Lighthouse).

## Blokkerend vóór livegang

Zonder deze punten mag de webshop niet open.

| Wat | Waarom | Wie |
|---|---|---|
| Bedrijfsgegevens: statutaire naam, KvK, btw-id, adres, telefoon, e-mail | Wettelijk verplicht in footer, op `/contact`, in de algemene voorwaarden en op het herroepingsformulier. Staat nu overal als `[VERIFY]` | klant |
| Juridische teksten laten toetsen | AV, privacyverklaring, cookiebeleid en garantie zijn opgezette concepten met een zichtbare "nog niet definitief"-melding | jurist |
| `blusbox.nl` verifiëren in Resend | Zolang dat niet is gebeurd verstuurt Resend alleen naar het eigen accountadres — een echte klant krijgt niets | klant |
| SPF aanvullen voor Resend | Huidig record `v=spf1 a mx -all` autoriseert Resend niet | klant |
| Stripe-webhook registreren in productie | `stripe listen` werkt alleen lokaal. Zie DEPLOY.md §4b | klant |
| Stripe-weergavenaam staat op "Aegis supply" | Dat staat op de betaalpagina en het bankafschrift van de klant | klant |
| API-sleutels roteren | Stripe-testsleutel en Resend-sleutel zijn in een chattranscript beland | klant |
| `NEXT_PUBLIC_SITE_URL` in Vercel zetten | Werkt nu ook zonder, via het productiedomein van Vercel, maar expliciet is beter — en nodig zodra het domein wijzigt | klant |
| Kiezen: apex of www als hoofddomein | Nu bedient `www.blusbox.nl` de site en stuurt de apex door. Prima, maar leg de keuze vast | klant |

## Productgegevens die ontbreken

| Wat | Waar |
|---|---|
| UN-nummer en ADR-klasse | `lib/catalogus.ts`, picklijsten, `/verzending` |
| Verzendtarief, levertijd, maximum aantal per zending | `lib/verzending.ts`, `/verzending` |
| Prijs montageset en staffelprijzen multipack | `lib/catalogus.ts` |
| Voorraad en levertijd op de PDP | `/blusbox` |
| Benodigde modulebreedte op de DIN-rail | `/blusbox`, `/installatie` |
| Conformiteitsverklaring, SDS, productblad, handleiding | `/downloads` |
| Artikelnummer Arbobesluit voor consequentiebeperkende maatregelen | `/zakelijk` |
| Naam en achtergrond oprichter | `/over-ons` |

## Techniek nog te doen

### Uit stap 8 blijven liggen
- Recall-notices worden **wel** aangemaakt maar **nog niet gemaild**; de
  Resend-template en de verzendactie ontbreken
- Bevestiging per afnemer (`bevestigdOp`) kan nog niet worden geregistreerd
- Conversie en top-5 verwijzers op het overzicht vragen bezoekersstatistiek
  (stap 11)
- Picklijsten met ADR-papieren (§9.5) bestaan nog niet
- Producten, voorraad, klanten, kortingscodes, contenteditor en
  documentbibliotheek (§9.5) zijn nog niet gebouwd

### Volgende stappen uit §14
- Stap 12: Playwright-tests en launchchecklist

### Gemeten in stap 11

Toegankelijkheid: axe (WCAG 2.0 + 2.1, A + AA + best practice) draait schoon
op alle 22 publieke routes. Het contrast van tekst over film is apart
nagerekend — axe geeft daar geen oordeel over — door het samengestelde beeld
per pixel te meten over de hele looptijd van de video. Laagste waarde in de
hero is nu 3,9:1 tegen een eis van 3:1 voor displaytekst.

Lighthouse op **www.blusbox.nl**, na deploy — de norm uit §12 is ≥ 95 op
`/`, `/blusbox` en `/hoe-het-werkt`:

| | perf | a11y | best | seo |
|---|---|---|---|---|
| desktop | 100 · 100 · 100 | 100 | 100 | 100 |
| mobiel, echte throttling | 95 · 97 · 98 | 100 | 100 | 100 |
| mobiel, gesimuleerd 4G | 87 · 94 · 94 | 100 | 100 | 100 |

Gehaald op desktop en op mobiel met echte throttling. De gesimuleerde
mobiele meting blijft eronder en dat verschil is geen meetfout: Lighthouse
projecteert daar een koude verbinding met 150 ms RTT, waarbij DNS, TCP, TLS
en een render-blokkerende stylesheet elkaar opvolgen voordat er iets op het
scherm kan staan. De waargenomen LCP op desktop is 0,16–0,21 s.

Wat dit cijfer echt zou verbeteren is minder render-blokkerende CSS bij de
eerste paint — critical CSS inline zetten. Dat is een ingreep in de
buildpipeline en hoort niet meer bij stap 11.

### Kleiner, maar bewust blijven liggen
- `orders.mollieId` heet nog naar de oude provider; hernoemen vraagt een
  migratie en hoort bij de volgende schemawijziging
- De scrubvideo blijft bewust H.264, zonder AV1-variant: scrubben doet
  willekeurige sprongen door de tijdlijn en H.264 wordt overal in hardware
  gedecodeerd. De hero draait om dezelfde reden op H.264 — die is de LCP.
  AV1 staat wel klaar voor de losse fragmenten
- Video is opnieuw gecodeerd met ffmpeg (via `ffmpeg-static`, buiten het
  project geïnstalleerd): 8,6 MB → 1,1 MB, audio eruit (alles speelt muted)
  en `+faststart` erop. Er staat geen encodeerstap in de repo; wie nieuw
  beeld toevoegt moet dit met de hand doen
- Beeldmateriaal is niet consistent: de hero toont een grijze module met
  blauwe leidingen, de packshot een volledig rode
- E-mail bij verzending en levering bestaat nog niet
- Herinneringen op 12/6/1 maand worden berekend en getoond, maar er is nog
  geen planner die ze daadwerkelijk verstuurt
