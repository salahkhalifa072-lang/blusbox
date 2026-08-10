# Nog open

Levend overzicht van wat nog moet gebeuren. Bijgewerkt tijdens de bouw.
Laatst bijgewerkt: 10 augustus 2026, na §14 stap 10.

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
| `www.blusbox.nl` toevoegen in Vercel | DNS klopt, maar Vercel bedient de hostnaam nog niet | klant |

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
- Stap 11: SEO, gestructureerde data, toegankelijkheidsaudit
- Lighthouse is nog niet gedraaid; de norm uit §12 is ≥ 95 op `/`,
  `/blusbox` en `/hoe-het-werkt`
- Stap 12: Playwright-tests en launchchecklist

### Kleiner, maar bewust blijven liggen
- `orders.mollieId` heet nog naar de oude provider; hernoemen vraagt een
  migratie en hoort bij de volgende schemawijziging
- Geen AV1-variant naast H.264 (§7.10 vraagt beide). macOS levert alleen
  avconvert; een echte AV1-encode vraagt ffmpeg
- `meterkast-front.mp4` is 4,5 MB. Wordt nu pas geladen als de sectie in
  beeld komt, maar comprimeren zou beter zijn — avconvert maakte het
  bestand gróter, dus dit vraagt ffmpeg
- Beeldmateriaal is niet consistent: de hero toont een grijze module met
  blauwe leidingen, de packshot een volledig rode
- E-mail bij verzending en levering bestaat nog niet
- Herinneringen op 12/6/1 maand worden berekend en getoond, maar er is nog
  geen planner die ze daadwerkelijk verstuurt
