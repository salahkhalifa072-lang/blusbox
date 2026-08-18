# Nog open

Levend overzicht van wat nog moet gebeuren. Bijgewerkt tijdens de bouw.
Laatst bijgewerkt: 12 augustus 2026. De bouwvolgorde uit §14 is af; sindsdien
wordt gewerkt aan wat daarna nog openstond.

## Blokkerend vóór livegang

Zonder deze punten mag de webshop niet open.

| Wat | Waarom | Wie |
|---|---|---|
| Juridische teksten laten toetsen | AV, privacyverklaring, cookiebeleid en garantie zijn nu volledig ingevuld, maar niet door een jurist gezien. De "nog niet definitief"-melding staat er nog | jurist |
| **`info@blusbox.nl` kan geen post ontvangen** | Er is geen postbus en geen MX. Zie "E-mail in twee richtingen" hieronder voor het plan; er moet één gratis account worden aangemaakt en dat kan ik niet | klant |
| MailerSend: plan kiezen en `MAILERSEND_API_TOKEN` in Vercel zetten | DNS is klaar en verificatie loopt. Zonder token gaat er nog steeds geen mail uit | klant |
| API-sleutels roteren | Een Stripe-**live**-sleutel en een Resend-sleutel zijn in een chattranscript beland. Rol ze om vóór livegang | klant |

## E-mail: van Resend naar MailerSend (code af)

De verzendlaag praat nu met MailerSend, rechtstreeks tegen hun REST-API in
plaats van via een SDK — het is één POST, en een pakket erbij zou alleen een
extra afhankelijkheid zijn om bij te houden. `resend` is uit package.json.

Alle zes de berichten lopen via één weg (`lib/mailtransport.ts`), inclusief
de inloglink. Auth.js heeft geen MailerSend-provider, dus die magic link is
nu een eigen e-mailprovider die dezelfde verzendfunctie gebruikt. Dat is
bovendien netter: één afzenderdomein, en een probleem daarmee gedraagt zich
niet op één plek anders.

Tien tests op de verzendlaag (`lib/mailtransport.test.ts`). Die dekken vooral
de dingen die stil misgaan: het uit elkaar halen van "Blusbox <info@…>", en
dat een fout van MailerSend nooit een uitzondering wordt — de aanroeper zit
achter een betaling.

### E-mail in twee richtingen

Uitgaand en inkomend zijn twee losse problemen met losse oplossingen.

**Uitgaand — DNS klaar, account nog niet.** SPF, DKIM en return-path staan
en leveren geldige waarden op; `MAIL_VAN` staat in Vercel op
`Blusbox <info@blusbox.nl>`.

Maar het MailerSend-account moet eerst worden **goedgekeurd** — er staat een
mail "Let's get your account approved!" in de inbox van 12-08. Zonder
goedkeuring mag er niet naar klanten worden verstuurd; dat is dezelfde val
als bij Resend. Goedkeuring vraagt een compleet bedrijfsprofiel, en daar
ontbreken adres, plaats, postcode en land. Website en telefoon zijn
ingevuld, opslaan lukt pas als de adresvelden erbij staan.

Daarna nog: een plan kiezen (gratis = 500 per maand) en een API-token in
Vercel zetten als `MAILERSEND_API_TOKEN`.

**Inkomend — er is nog niets.** Nagekeken bij Theory7: `blusbox.nl` staat er
als domein zónder hostingpakket ("Niet gekoppeld"). De `mail.blusbox.nl` en
`ftp.blusbox.nl` in de zone zijn restanten van een standaardsjabloon; ze
wijzen naar `redirect01.theory7.net` en poort 25 staat daar dicht. Het
domeinbeheer bij Theory7 biedt wel een web-redirect maar géén
e-mail-doorsturen.

MailerSend lost dit niet op: hun inbound routing wil een aparte subdomein die
uitsluitend voor inbound wordt gebruikt, en levert af op een webhook — geen
postbus.

Gekozen richting (klant, 18-08): gratis doorsturen naar Gmail. Dat vraagt één
externe dienst, bijvoorbeeld ImprovMX (gratis, onbeperkt aliassen naar één
bestemming). Aanmaken van dat account kan alleen de klant; daarna zet ik de
twee MX-records.

**Let op bij antwoorden.** Doorsturen regelt alleen binnenkomende post. Wie
vanuit Gmail antwoordt, antwoordt vanaf het Gmail-adres — op een wettelijke
contactroute oogt dat rommelig, en met `p=reject` op dit domein kan een
poging om "namens" info@blusbox.nl te sturen zelfs geweigerd worden. De
oplossing is gratis: in Gmail "Verzenden als" instellen met de SMTP-relay van
MailerSend. Dan gaan antwoorden uit als info@blusbox.nl, ondertekend met
dezelfde DKIM-sleutel, en slagen ze gewoon voor DMARC.

### DNS gedaan op 18 augustus 2026

Domein stond al in MailerSend, en de DKIM- en Return-Path-records waren al
gezet. Twee dingen aangepast in de zone bij Theory7:

**Er stonden twee SPF-records naast elkaar.** Het oude `v=spf1 a mx -all`
én het nieuwe met MailerSend erin. Volgens RFC 7208 is dat een PermError:
SPF telt dan als mislukt, ongeacht wat er in staat. Dat is ook wat
MailerSend bedoelde met "your domain has an SPF record but it contains
errors". Het oude record is verwijderd; er staat er nu precies één.

**DMARC stond op `aspf=s`** (strikte SPF-uitlijning). MailerSend verstuurt
met een Return-Path op `mta.blusbox.nl`, en dat is niet létterlijk gelijk aan
`blusbox.nl` — met strikte uitlijning valt SPF dus altijd af. DKIM lijnt wel
strikt uit, dus DMARC slaagde nog, maar dan op één been: gaat er iets mis met
de ondertekening, dan wordt de mail bij `p=reject` geweigerd in plaats van in
de spam gezet. Nu `aspf=r`, zodat SPF ook meetelt. `p=reject` en `adkim=s`
staan onveranderd.

Terugdraaien is één veld: `aspf=r` weer op `aspf=s`.

**Wat er nog moet gebeuren, en dat kan alleen jij:**

1. Kies een plan in MailerSend (gratis = 500 mails per maand, ruim genoeg om
   te beginnen). Zonder plan blijft het een trial-account.
2. Maak een API-token en zet die in Vercel als `MAILERSEND_API_TOKEN`,
   omgeving Production.
3. Zet `MAIL_VAN` op `Blusbox <info@blusbox.nl>`.
4. Redeploy.

## Betalen (af, met één slag om de arm)

Getest op de live site op 18 augustus 2026. Het afrekenen opent een echte
`cs_live_`-sessie met iDEAL, kaart, Klarna en Bancontact; de bestelling komt
correct in de database met het juiste bedrag en het sessie-ID. De testorder
is daarna weer verwijderd, zodat de eerste echte klant `BB-2026-000001`
krijgt.

De restricted key (`rk_live_`) blijkt genoeg rechten te hebben voor Checkout
Sessions.

`STRIPE_WEBHOOK_SECRET` staat in Vercel en wordt gebruikt: een verzoek met
een onjuiste handtekening levert in de logs "No signatures found matching
the expected signature" op, en niet "secret ontbreekt". De
handtekeningcontrole werkt dus.

**Wat niet bewezen is:** dat dit geheim bij déze webhook-bestemming hoort.
Dat blijkt pas bij de eerste echte betaling. Ga na die eerste bestelling
meteen kijken in Stripe → Workbench → Webhooks → blusbox-productie →
Leveringen: staat daar een 2xx, dan klopt alles. Staat er 400, dan is het
verkeerde `whsec_` geplakt en blijft de bestelling op `nieuw` staan terwijl
het geld wel binnen is.

## Productiedatabase (af)

Neon Postgres, regio Frankfurt (`eu-central-1`), gratis plan, gekoppeld aan
het Vercel-project `blusbox`. Previews krijgen een eigen databasebranch, zodat
een testbestelling nooit in de echte data belandt. Migraties gedraaid, de
catalogus staat erin en er is een beheerdersaccount op `info@blusbox.nl`.

Neon Auth staat uit: wij gebruiken Auth.js met een eigen `users`-tabel, en
twee inlogsystemen naast elkaar is vragen om problemen.

Ook gezet in Vercel: `AUTH_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`,
`MAIL_CONTACT` en `CONTACT_TELEFOON`.

## Productgegevens die nog ontbreken

| Wat | Waar |
|---|---|
| Conformiteitsverklaring, veiligheidsinformatieblad, productblad, handleiding | `/downloads` — staan nu als "nog niet beschikbaar" |
| Bronnen bij de claims over werkingsprincipe en oorzaken van kastbranden | `/hoe-het-werkt`, `/meterkastbrand` |
| Artikelnummer Arbobesluit voor consequentiebeperkende maatregelen | `/zakelijk` |

## Gevaarlijke goederen — eruit gehaald, met één kanttekening

Op verzoek van de klant is de hele gevaarlijke-goederenclassificatie uit het
systeem verwijderd: geen UN-nummer, geen ADR-klasse, geen maximum per
zending, geen vervoersdocumenten, geen waarschuwingen in mails en op
pagina's. Drieëntwintig bestanden geraakt, plus een migratie die de drie
kolommen uit `products` haalt.

**Kanttekening voor later.** Condensed-aerosolmodules krijgen van
fabrikanten vaak wél een classificatie (UN0432 of UN3268 komt veel voor).
Levert de leverancier alsnog een veiligheidsinformatieblad of een
ADR-classificatie aan, dan moet dit terug — vervoerders en verzekeraars gaan
daarop af, en een zending die verkeerd is aangemeld kan blijven staan. De
git-historie tot commit `22708c1` bevat de volledige oude implementatie.

## Techniek nog te doen

### Uit stap 8 blijven liggen
- ~~Recall-notices worden wel aangemaakt maar niet gemaild~~ **af** — zie
  hieronder
- ~~Bevestiging per afnemer (`bevestigdOp`)~~ **af**
- Conversie en top-5 verwijzers op het overzicht vragen bezoekersstatistiek
- Picklijsten met ADR-papieren (§9.5) bestaan nog niet
- Producten, voorraad, klanten, kortingscodes, contenteditor en
  documentbibliotheek (§9.5) zijn nog niet gebouwd

### §14 is afgelopen
De laatste stap leverde 100 end-to-end-tests op (`npm run e2e`), die op
desktop én mobiel draaien tegen een productiebuild. De launchchecklist staat
in `LANCERING.md`.

Wat die tests onderweg boven water haalden, en wat daarop is aangepast:
- Op "In winkelwagen" klikken deed zichtbaar niets. De teller in de kop
  ververst pas bij een paginawissel, en de actie stuurde nergens heen. Nu
  gaat de bezoeker naar de wagen.
- De wagenteller was op telefoons helemaal verborgen (`hidden sm:inline`).
- De 404 kreeg twee tegenstrijdige robots-instructies mee: `noindex` van
  Next zelf en `index, follow` uit de rootlayout.
- De koopbalk onderaan de productpagina stond op smalle schermen buiten elk
  landmark. De audit van stap 11 draaide alleen op desktopbreedte en zag
  hem daarom niet.

### Terugroepberichten (af)

De hele keten werkt nu: mailsjabloon, versturen per ontvanger, en een
publieke pagina waar de afnemer bevestigt dat hij het gelezen heeft.

Een paar keuzes die niet vanzelf spreken:
- **Versturen staat los van het openen van een recall.** De lijst met
  afnemers wordt bij het openen vastgelegd; versturen is een aparte knop.
  Een storing bij de mailprovider kan de lijst dus niet kwijtmaken, en
  opnieuw drukken stuurt alleen wat nog niet weg was.
- **Eén mail per ontvanger, niet één bcc.** Bcc zou elk adres aan elke
  andere afnemer laten zien, en één slecht adres zou de hele partij
  meenemen.
- **`verzondenOp` wordt pas gestempeld nadat Resend het bericht heeft
  aangenomen.** Andersom zou een mislukte verzending eruitzien als
  afgehandeld, en die afnemer krijgt dan nooit meer bericht. Mislukte
  adressen komen met reden in beeld, zodat iemand ze kan nabellen.
- **Bevestigen is een knop, geen link met de id erin.** Virusscanners en
  previewers openen elke link in een mail; bij een GET zou de halve lijst
  "bevestigd" zijn zonder dat er een mens gekeken heeft.
- De bevestigpagina toont géén persoonsgegevens, alleen lotnummer en reden.
  Wordt de link doorgestuurd, dan lekt er niets dat niet toch al openbaar is
  zodra er een terugroepactie loopt.

Getest tegen een echte Postgres-engine (`src/db/terugroep.test.ts`, 9 tests):
niemand krijgt het dubbel, de eerste bevestiging blijft staan, en een
bevestiging bij de één raakt de ander niet.

**Let op:** versturen kan nu nog niet naar echte klanten. Resend weigert elk
adres behalve dat van het eigen account zolang `blusbox.nl` niet geverifieerd
is — dat staat bovenaan bij de blokkerende punten. De code vangt dat netjes
af: het bericht blijft op "nog te versturen" staan.

### Vervangingsherinneringen (af)

De homepage belooft "automatisch bericht voordat de termijn verloopt". Dat
bericht bestaat nu: een dagelijkse ronde op `/api/cron/herinneringen`, met
een sjabloon per termijn (12, 6 en 1 maand).

Bij het bouwen kwam een fout boven water in logica die er al maanden stond
en getest was. `verschuldigdeHerinnering` koos de **ruimste** termijn die
gepasseerd was. Voor een unit die pas laat wordt geregistreerd — bijvoorbeeld
drie weken voor het verlopen — betekende dat een mail met "je Blusbox
verloopt over een jaar", gevolgd door "over een half jaar" en pas als derde
het bericht dat klopte. Drie berichten, twee met onjuiste informatie. Niemand
had het gemerkt omdat er nog nooit iets verstuurd werd.

Nu wordt de **dringendste** gepasseerde termijn gekozen, en worden de
ruimere termijnen meteen afgestempeld: één bericht dat klopt. De oude tests
legden het verkeerde gedrag vast en zijn herschreven.

Verder:
- Beveiligd met `CRON_SECRET` in plaats van een sessie; een planner logt niet
  in. Zonder dat geheim weigert het endpoint dienst, en bij een verkeerd
  token geeft het 404 in plaats van 403 — wie het niet heeft, hoeft niet te
  weten dat het bestaat.
- `vercel.json` draait hem elke dag om 07:00.
- Gasten krijgen hem ook: het adres komt van het account als dat er is, en
  anders van de bestelling.
- Units zonder e-mailadres blijven weg uit de ronde, maar blijven wel in het
  dashboard staan als "verloopt binnenkort".

Getest in `src/db/herinneringen.test.ts` (9 tests) tegen een echte
Postgres-engine, plus de termijnlogica in `levensduur.test.ts`.

**Zelfde blokkade als bij de terugroepberichten:** zolang `blusbox.nl` niet
in Resend geverifieerd is, komt er niets aan bij een echte klant. Een
mislukte verzending wordt niet afgestempeld, dus de ronde pakt hem de
volgende dag gewoon weer op.

### Verzend- en bezorgbericht (af)

De bestelbevestiging beloofde met zoveel woorden "zodra het pakket onderweg
is, laten we het weten". Die mail bestond niet, en er was ook geen manier om
een bestelling op verzonden of geleverd te zetten — het dashboard was op dit
punt alleen kijken.

Nu: twee knoppen per bestelling, met een optioneel zendingnummer, en twee
berichten. De statuswijziging gaat vóór de mail; blijft de mail steken, dan
is de bestelling nog steeds verzonden en kan het bericht opnieuw. Andersom
zou een storing bij Resend de hele afhandeling blokkeren.

Het bezorgbericht doet meer dan melden dat het pakket er is: het legt de
einddatum van de bedenktijd vast. Die termijn loopt vanaf ontvangst, dus pas
op dat moment is de datum bekend. `geleverdOp` is daarmee een veld met
juridische betekenis, en het kan daarom niet achteraf verzet worden.

Onderweg gevonden: **ingelogde klanten kregen geen enkele mail na de
bestelbevestiging.** `gastEmail` blijft leeg zodra er een account aan de
bestelling hangt — dat is met opzet, het adres hangt dan aan de gebruiker.
Alles wat alleen `gastEmail` las, stuurde dus niets. De bestelbevestiging
ontsnapte eraan doordat Stripe het adres meegeeft; dat vangnet is er bij
een mail vanuit het dashboard niet. `contactadresVanBestelling` lost het nu
overal op, met tests voor beide gevallen.

Schemawijziging: `orders.verzonden_op` en `orders.track_and_trace`
(migratie `0001`, alleen toevoegingen).

### Recall per afnemer (af)

Een terugroepactie kon niet worden afgesloten als iemand telefonisch
reageerde: de enige manier om te bevestigen was de knop in de mail. De
functies om dat met de hand te doen stonden er wel, maar hingen aan geen
enkel scherm. Er is nu een detailpagina per recall — `/dashboard/recalls/<id>`
— met per afnemer of het bericht weg is, of er bevestigd is, en een knop om
dat laatste zelf vast te leggen.

Daarbij kwam een toegankelijkheidsfout boven water die er al langer zat: de
dashboardtabellen scrollen horizontaal, maar de scrollregio kon geen focus
krijgen. Met alleen een toetsenbord kwam je dus niet bij de rechterkolommen,
en daar staan juist de knoppen. Opgelost in `components/dashboard/ui.tsx`.

Dat het zo lang meeging heeft een oorzaak: het beheerdeel zit achter een
login en zat daarom niet in de geautomatiseerde audit. Dat is nu rechtgezet
met een aparte Playwright-opzet die één keer inlogt (`e2e/beheer.spec.ts`,
10 tests). Zonder `E2E_ADMIN_EMAIL` en `E2E_ADMIN_WACHTWOORD` draaien die
niet mee — de suite blijft dus groen op een verse kloon.

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
