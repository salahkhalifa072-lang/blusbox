# Nog open

Levend overzicht van wat nog moet gebeuren. Bijgewerkt tijdens de bouw.
Laatst bijgewerkt: 12 augustus 2026. De bouwvolgorde uit §14 is af; sindsdien
wordt gewerkt aan wat daarna nog openstond.

## Eerst dit: er staat geen database achter de live site

Gemeten op 12 augustus 2026 tegen www.blusbox.nl:

| Route | |
|---|---|
| `/`, `/blusbox`, `/winkelwagen`, `/api/wagen` | 200 |
| `/account`, `/dashboard` | **500** |

Het patroon is precies de scheidslijn tussen "raakt de database" en "raakt
hem niet". `src/db/index.ts` gooit bij het laden een fout zodra
`DATABASE_URL` ontbreekt; tijdens de build is er een uitwijk, daarbuiten
niet. De bouw slaagt dus, maar elke route die de database nodig heeft valt
om.

Wat dat betekent: **de live site kan op dit moment geen bestelling
aannemen en niemand kan inloggen.** Het is nu een folder. Alles wat
hieronder "af" heet — terugroepberichten, herinneringen, verzendmail —
werkt lokaal en kan in productie niet draaien zolang dit niet staat.

Dit is niet stuk gegaan door recent werk; `/account` raakt geen van de
nieuwe kolommen. De productiedatabase is vermoedelijk nooit aangemaakt: de
database die eerder is opgezet draait op Postgres.app op deze Mac, en die is
vanuit Vercel niet bereikbaar.

Te doen, in deze volgorde:

1. Managed Postgres aanmaken in eu-central-1 (Vercel → Storage → Neon).
   Zie `DEPLOY.md` §2.
2. `DATABASE_URL` in Vercel zetten voor alle omgevingen.
3. Migraties draaien tegen die database:
   `DATABASE_URL="<prod>" npm run db:migrate` — inclusief migratie `0001`,
   die `orders.verzonden_op` en `orders.track_and_trace` toevoegt. Zonder
   die stap valt het bestellingenscherm om zodra iemand inlogt.
4. Beheerdersaccount aanmaken: `DATABASE_URL="<prod>" npm run db:admin`.
5. Opnieuw controleren dat `/account` een 200 geeft.

## Blokkerend vóór livegang

Zonder deze punten mag de webshop niet open.

| Wat | Waarom | Wie |
|---|---|---|
| Productiedatabase (zie hierboven) | Zonder database geen bestellingen en geen inloggen | klant |
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
