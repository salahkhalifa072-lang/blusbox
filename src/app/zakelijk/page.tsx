import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, SectionTitle } from "@/components/site/page-header";
import { KruimelData } from "@/components/site/gestructureerde-data";
import { SiteFooter } from "@/components/site/footer";
import { staffelOverzicht } from "@/lib/catalogus";
import { SpecTable } from "@/components/ui/spec-table";
import { ClaimSource } from "@/components/ui/claim-source";
import { Reveal } from "@/components/ui/reveal";
import { productFacts } from "@/lib/product-facts";

export const metadata: Metadata = {
  title: "Zakelijk",
  description:
    "Blusbox voor installateurs, VvE's, woningcorporaties en KAM-beheer. Een consequentiebeperkende maatregel in uw RI&E, met staffelprijzen en levering op rekening.",
  alternates: { canonical: "/zakelijk" },
};

/** §2/§5.4 — B2B pages address the reader with "u". */

const doelgroepen = [
  {
    t: "Installateurs",
    b: "U levert en monteert de module bij oplevering of tijdens onderhoud. Dealerprijzen, bulkbestellingen en een eigen register van geplaatste units.",
    href: "/installateurs",
  },
  {
    t: "VvE's en woningcorporaties",
    b: "Eén maatregel per meterkast, over een heel complex uit te rollen en per adres te registreren, inclusief vervangingstermijn.",
  },
  {
    t: "KAM en facility",
    b: "Een technische maatregel die aantoonbaar is vastgelegd: lotnummer, installatiedatum en vervangdatum per locatie.",
  },
];

export default function ZakelijkPage() {
  return (
    <>
      <KruimelData kruimels={[{ naam: "Zakelijk", pad: "/zakelijk" }]} />
      <PageHeader
        eyebrow="zakelijk"
        title="De laatste laag,"
        accent="aantoonbaar vastgelegd."
        lead="Blusbox is een consequentiebeperkende maatregel voor elektrische behuizingen: hij grijpt in wanneer de maatregelen daarvoor zijn gepasseerd. Voor uw dossier telt niet alleen dát u iets heeft geplaatst, maar dat u kunt laten zien wat, waar en tot wanneer."
      />
      <main>
        {/* RI&E framing */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
            <Reveal>
              <SectionTitle>Blusbox in uw RI&amp;E</SectionTitle>
            </Reveal>
            <Reveal delay={80}>
              <div className="space-y-4 text-staal-tekst">
                <p>
                  Artikel 5 van de Arbowet verplicht u de risico&apos;s van de
                  arbeid schriftelijk vast te leggen in een risico-inventarisatie
                  en -evaluatie, met een plan van aanpak waarin staat binnen
                  welke termijn de maatregelen worden genomen.
                </p>
                <p>
                  Welke maatregel u kiest, is niet vrij. Artikel 3, eerste lid,
                  onder b van de Arbowet schrijft voor dat gevaren{" "}
                  <q>zoveel mogelijk in eerste aanleg bij de bron</q> worden
                  voorkomen of beperkt, en dat voor zover dat niet kan{" "}
                  <q>
                    andere doeltreffende maatregelen worden getroffen waarbij
                    maatregelen gericht op collectieve bescherming voorrang
                    hebben boven maatregelen gericht op individuele bescherming
                  </q>
                  . Dat is de arbeidshygiënische strategie.
                </p>
                <p>
                  Brand in een groeps- of verdeelkast laat zich zelden volledig
                  bij de bron uitsluiten: componenten verouderen, verbindingen
                  trillen los, belastingen veranderen. Wat dan overblijft is de
                  tweede trede — een doeltreffende, collectief werkende
                  maatregel. Blusbox is precies dat: hij beschermt niet één
                  persoon maar de installatie en iedereen in het pand, zonder dat
                  er iemand hoeft te handelen.
                </p>
                <p>
                  Voor arbeidsplaatsen is die tweede trede bovendien concreet
                  ingevuld. Artikel 3.8, eerste lid van het Arbobesluit bepaalt
                  dat er, afhankelijk van de aard van de arbeid en de daaraan
                  verbonden gevaren,{" "}
                  <q>voldoende passende brandbestrijdingsmiddelen aanwezig</q>{" "}
                  zijn. Datzelfde artikel onderscheidt in het derde en vierde lid
                  uitdrukkelijk <em>niet-automatische</em>{" "}
                  brandbestrijdingsmiddelen, die bereikbaar, bedienbaar en
                  gesignaleerd moeten zijn. Blusbox is automatisch: die eisen aan
                  bereikbaarheid en signalering gelden er niet voor, omdat er
                  niemand naartoe hoeft.
                </p>
                <p>
                  In uw RI&amp;E legt u de module dus vast als beheersmaatregel
                  bij het restrisico &apos;brand in de elektrische
                  installatie&apos;, met plaatsingslocatie, lotnummer en
                  vervangingsdatum als onderbouwing in uw plan van aanpak.
                </p>
                <div className="mt-6 rounded-2xl border border-railstaal/50 p-5">
                  <p className="data text-xs uppercase tracking-widest text-staal-tekst">
                    Reikwijdte
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    Artikel 3.8 van het Arbobesluit geldt voor{" "}
                    <strong>arbeidsplaatsen</strong>. Voor een meterkast in een
                    woning die geen arbeidsplaats is, geldt die verplichting
                    niet — daar is Blusbox een vrijwillige maatregel. Wij
                    presenteren de module nadrukkelijk niet als wettelijk
                    verplicht.
                  </p>
                </div>
                <ClaimSource
                  label="Arbowet art. 3 lid 1 onder b en art. 5; Arbobesluit art. 3.8 — wetten.overheid.nl"
                  url="https://wetten.overheid.nl/BWBR0008498/2024-01-01"
                />
              </div>
            </Reveal>
          </div>
        </section>

        {/* Doelgroepen */}
        <section className="bg-kastwit-dim py-20">
          <div className="mx-auto max-w-6xl px-6">
            <SectionTitle>Voor wie</SectionTitle>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {doelgroepen.map((d, i) => (
                <Reveal key={d.t} delay={i * 70}>
                  <article className="flex h-full flex-col rounded-2xl border border-railstaal/50 bg-kastwit p-8">
                    <h3 className="font-display text-2xl">{d.t}</h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-staal-tekst">
                      {d.b}
                    </p>
                    {d.href ? (
                      <Link
                        href={d.href}
                        className="data mt-5 text-xs underline underline-offset-4"
                      >
                        Naar het dealerprogramma
                      </Link>
                    ) : null}
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Verzekeraar + traceerbaarheid */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-4 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-2xl border border-railstaal/50 p-8">
                <h3 className="font-display text-2xl">
                  Wat uw verzekeraar wil zien
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-staal-tekst">
                  Bij schade gaat het om aantoonbaarheid: welke maatregel was
                  getroffen, wanneer, en was die op dat moment nog geldig. Elke
                  Blusbox draagt een lotnummer dat wij koppelen aan uw
                  bestelling en aan de installatiedatum. U kunt daardoor per
                  locatie laten zien welke module er hangt en tot wanneer die
                  meegaat.
                </p>
                <p className="data mt-4 text-xs text-staal-tekst">
                  Over dekking of premiekorting doen wij geen uitspraken; dat
                  is een zaak tussen u en uw verzekeraar.
                </p>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div className="h-full rounded-2xl border border-railstaal/50 p-8">
                <h3 className="font-display text-2xl">
                  Traceerbaar tot het lotnummer
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-staal-tekst">
                  {[
                    "Elke unit is herleidbaar tot productiepartij en leverancier.",
                    "Per adres of locatie legt u de installatiedatum vast.",
                    "De vervangingsdatum volgt automatisch: installatiedatum plus tien jaar.",
                    "Herinneringen gaan uit op twaalf, zes en één maand voor het einde.",
                    "Bij een productterugroep is de betrokken afnemerslijst één handeling.",
                  ].map((t) => (
                    <li key={t} className="flex gap-3">
                      <span className="data text-blusrood-op-licht" aria-hidden>
                        —
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Specs + offerte */}
        <section className="bg-antraciet py-20 text-kastwit">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2">
            <div>
              <SectionTitle>Staffelprijzen aanvragen</SectionTitle>
              <p className="mt-4 text-kastwit/70">
                Zakelijke prijzen zijn exclusief btw. Vanaf dertig stuks loopt
                de korting op met het aantal:
              </p>
              <ul className="data mt-4 space-y-1 text-sm text-kastwit/70">
                {staffelOverzicht().map((r) => (
                  <li key={r.vanaf}>
                    vanaf {r.vanaf} stuks — {String(r.korting).replace(".", ",")}%
                    korting
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-kastwit/70">
                Levering gaat op rekening na goedkeuring. Voor bestellingen
                binnen de EU buiten Nederland verwerken wij btw-verlegging op
                basis van een geldig btw-nummer.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="rounded-full bg-blusrood-vlak px-6 py-3 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18]"
                >
                  Offerte aanvragen
                </Link>
                <Link
                  href="/installateurs"
                  className="rounded-full border border-kastwit/40 px-6 py-3 text-sm transition-colors hover:bg-kastwit hover:text-antraciet"
                >
                  Voor installateurs
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-kastwit/15 p-6">
              <p className="data mb-4 text-xs uppercase tracking-widest text-railstaal">
                technische samenvatting
              </p>
              <div className="[&_th]:text-railstaal [&_tr]:border-kastwit/15">
                <SpecTable rows={productFacts} />
              </div>
            </div>
          </div>
        </section>

        {/* Cases */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <SectionTitle>Toepassingen</SectionTitle>
          <p className="mt-4 max-w-xl text-staal-tekst">
            Zodra de eerste projecten zijn opgeleverd, staan ze hier — met
            locatietype, aantal units en de reden waarom ervoor gekozen is.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {["Woningcorporatie", "VvE", "Bedrijfspand"].map((c) => (
              <div
                key={c}
                className="rounded-2xl border border-dashed border-railstaal p-8"
              >
                <p className="data text-xs text-staal-tekst">{c}</p>
                <p className="mt-3 text-sm text-staal-tekst">
                  Wij zijn net begonnen. Zodra de eerste projecten zijn
                  opgeleverd, staan ze hier — met cijfers, niet met verhalen.
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
