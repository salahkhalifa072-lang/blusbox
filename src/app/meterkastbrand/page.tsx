import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader, SectionTitle } from "@/components/site/page-header";
import { KruimelData } from "@/components/site/gestructureerde-data";
import { SiteFooter } from "@/components/site/footer";
import { Reveal } from "@/components/ui/reveal";
import { ClaimSource } from "@/components/ui/claim-source";
import { LogoBadge } from "@/components/site/logo";
import { ARTIKELEN } from "@/lib/kennisbank";
import { FaqList } from "@/components/ui/accordion";
import type { FaqItem } from "@/lib/faq";

export const metadata: Metadata = {
  // De zoekterm vooraan, en de belofte erachter: zo leest hij in Google.
  title: { absolute: "Brand in de meterkast: oorzaken, signalen en hoe je het voorkomt" },
  description:
    "Hoe brand in een meterkast of groepenkast ontstaat, waaraan je het herkent, waarom een aardlekschakelaar het niet altijd tegenhoudt en welke maatregelen wél helpen.",
  alternates: { canonical: "/meterkastbrand" },
};

/** §11 SEO pillar. Blog posts link up to this page. */

const oorzaken = [
  {
    t: "Een losse of verbrande klem",
    b: "De meest voorkomende start. Een verbinding die niet goed vastzit heeft een hogere overgangsweerstand. Daar ontstaat warmte, de klem verkleurt, het isolatiemateriaal verhardt en uiteindelijk ontsteekt het.",
  },
  {
    t: "Overbelasting van een groep",
    b: "Steeds meer vermogen door dezelfde bedrading: inductiekoken, een laadpunt, een warmtepomp. De automaat beschermt de kabel, maar niet elke warmteontwikkeling in de kast zelf.",
  },
  {
    t: "Verouderde installatie",
    b: "Bedrading en componenten uit de jaren zestig of zeventig zijn niet ontworpen voor de belasting van nu. Kunststof verhardt, isolatie wordt bros.",
  },
  {
    t: "Zonnepanelen en thuisaccu",
    b: "Omvormers en accusystemen brengen extra vermogen, extra componenten en extra warmte bij de verdeelinrichting. Meer aansluitingen betekent meer plekken waar het mis kan gaan.",
  },
];

/*
 * Vragen zoals mensen ze in Google typen. Google kan ze uitklapbaar onder
 * het zoekresultaat tonen, maar alleen als ze ook zichtbaar op de pagina
 * staan — daarom één lijst voor allebei.
 */
const vragen: FaqItem[] = [
  {
    vraag: "Hoe ontstaat brand in de meterkast?",
    antwoord:
      "Meestal door warmte op één punt: een verbinding die loszit, een groep die structureel te zwaar belast wordt of een verouderde installatie. Zo'n plek wordt langzaam warmer tot isolatiemateriaal kan gaan smeulen of ontbranden.",
  },
  {
    vraag: "Houdt een aardlekschakelaar brand in de meterkast tegen?",
    antwoord:
      "Niet altijd. Een aardlekschakelaar schakelt uit als er stroom weglekt naar aarde, en een groep schakelt uit bij overbelasting of kortsluiting. Een losse verbinding die warm wordt terwijl de stroom gewoon blijft lopen, wordt door geen van beide gezien.",
  },
  {
    vraag: "Wat moet je doen bij brand in de meterkast?",
    antwoord:
      "Haal iedereen naar buiten, sluit de deuren achter je en bel 112. Gebruik nooit water op een elektrische installatie. Ruik je alleen brandlucht of is de kast warm zonder rook of vuur, zet dan als het veilig kan de hoofdschakelaar uit en bel een erkend installateur.",
  },
  {
    vraag: "Welke brandblusser is geschikt voor de meterkast?",
    antwoord:
      "Voor een elektrische installatie is een CO₂-blusser bedoeld; die laat geen residu achter. Een poederblusser blust ook, maar het poeder verspreidt zich door de hele ruimte. Een handblusser werkt alleen als iemand de brand ziet. Een automatische blusmodule zoals Blusbox hangt in de kast zelf en grijpt bij 170 °C vanzelf in, zonder stroom.",
  },
  {
    vraag: "Is een brandblusser in de meterkast verplicht?",
    antwoord:
      "Voor een gewone woning niet. Verplicht zijn rookmelders: sinds 1 juli 2022 op elke verdieping met een woon- of slaapruimte. Een blusmiddel bij de meterkast is een vrijwillige extra maatregel.",
  },
];

const vragenData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: vragen.map((v) => ({
    "@type": "Question",
    name: v.vraag,
    acceptedAnswer: { "@type": "Answer", text: v.antwoord },
  })),
};

export default function MeterkastbrandPage() {
  return (
    <>
      <KruimelData kruimels={[{ naam: "Brand in de meterkast", pad: "/meterkastbrand" }]} />
      <PageHeader
        eyebrow="kennisartikel"
        title="Brand in de"
        accent="meterkast"
        lead="Een kastbrand begint klein, stil en op een plek waar niemand kijkt. Dit artikel legt uit hoe dat gaat, waarom bestaande beveiligingen het niet altijd tegenhouden, en wat je eraan kunt doen."
      />
      <main>
        {/* Hoe het begint */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
            <Reveal>
              <SectionTitle>Hoe een kastbrand begint</SectionTitle>
            </Reveal>
            <Reveal delay={80}>
              <div className="space-y-4 text-staal-tekst">
                <p>
                  Vrijwel elke brand in een meterkast begint met warmte op één
                  punt. Niet met een vonk of een knal, maar met een verbinding
                  waar de stroom net iets meer moeite moet doen dan bedoeld. Die
                  extra moeite komt vrij als warmte.
                </p>
                <p>
                  Dat proces verloopt over maanden. Het kunststof rond de klem
                  verkleurt, de isolatie verhardt en wordt bros, en op enig
                  moment is er genoeg brandbaar materiaal op een hoge genoeg
                  temperatuur. Pas dán ontstaat vlam — in een gesloten kast vol
                  kunststof, kabels en lucht.
                </p>
                <p>
                  Het vervelende is dat de installatie tot dat moment gewoon
                  functioneert. Er valt niets uit, er is geen storing, en er is
                  dus geen aanleiding om de kast open te doen.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Oorzaken */}
        <section className="bg-kastwit-dim py-20">
          <div className="mx-auto max-w-6xl px-6">
            <SectionTitle>De vier meest voorkomende oorzaken</SectionTitle>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {oorzaken.map((o, i) => (
                <Reveal key={o.t} delay={i * 60}>
                  <article className="h-full rounded-2xl border border-railstaal/50 bg-kastwit p-8">
                    <h3 className="font-display text-xl">{o.t}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-staal-tekst">
                      {o.b}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
            <ClaimSource label="[VERIFY: bron voor verdeling van oorzaken van kastbranden in Nederland]" />
          </div>
        </section>

        {/* Waarom bestaande beveiliging niet genoeg is */}
        <section className="bg-antraciet py-20 text-kastwit">
          <div className="mx-auto max-w-6xl px-6">
            <SectionTitle>
              Waarom je aardlekschakelaar dit{" "}
              <span className="accent">niet</span> tegenhoudt
            </SectionTitle>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {[
                {
                  t: "De aardlekschakelaar",
                  b: "Schakelt uit bij een lekstroom naar aarde — bedoeld om mensen te beschermen tegen elektrocutie. Een klem die warm loopt zonder aardlek merkt hij niet op.",
                },
                {
                  t: "De installatieautomaat",
                  b: "Beschermt de kabel tegen overbelasting en kortsluiting. Een slechte verbinding die warmte maakt zonder de nominale stroom te overschrijden, valt daarbuiten.",
                },
                {
                  t: "De rookmelder",
                  b: "Waarschuwt jou als er al rook is, en pas als die rook de melder bereikt. Hij blust niets, en 's nachts win je er hooguit minuten mee.",
                },
              ].map((x, i) => (
                <Reveal key={x.t} delay={i * 70}>
                  <article className="h-full rounded-2xl border border-kastwit/15 p-8">
                    <h3 className="font-display text-xl">{x.t}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-kastwit/70">
                      {x.b}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
            <p className="mt-8 max-w-2xl text-kastwit/70">
              Stuk voor stuk zijn dit goede maatregelen die je moet hebben. Ze
              zitten alleen allemaal vóór het moment waarop het misgaat, of ná
              het moment waarop het al brandt. Daartussen zit een gat.
            </p>
          </div>
        </section>

        {/* Wat wel helpt */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <SectionTitle>Wat je er wél aan kunt doen</SectionTitle>
              <ol className="mt-6 space-y-5">
                {[
                  {
                    t: "Laat de kast periodiek nakijken",
                    b: "Een installateur kan verbindingen natrekken en verkleuring zien voordat het brandbaar wordt. Zeker bij een installatie ouder dan twintig jaar of na uitbreiding met zonnepanelen.",
                  },
                  {
                    t: "Breid niet eindeloos uit op oude bedrading",
                    b: "Nieuw vermogen op een oude verdeelinrichting is de snelste weg naar warmte in de kast.",
                  },
                  {
                    t: "Zorg voor werkende rookmelders",
                    b: "Ze blussen niets, maar ze wekken mensen. Dat blijft de belangrijkste maatregel voor de mensen in huis.",
                  },
                  {
                    t: "Leg een laatste verdedigingslinie in de kast",
                    b: "Een automatische blusmodule grijpt in binnen de kast, op het moment dat alle voorgaande lagen gepasseerd zijn — zonder stroom en zonder dat er iemand bij hoeft te zijn.",
                  },
                ].map((s, i) => (
                  <li key={s.t} className="flex gap-4">
                    <span className="data mt-1 text-sm text-blusrood-op-licht">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-medium">{s.t}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-staal-tekst">
                        {s.b}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/blusbox"
                  className="rounded-full bg-blusrood-vlak px-6 py-3 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18]"
                >
                  Bekijk Blusbox
                </Link>
                <Link
                  href="/hoe-het-werkt"
                  className="rounded-full border border-antraciet px-6 py-3 text-sm transition-colors hover:bg-antraciet hover:text-kastwit"
                >
                  Hoe het werkt
                </Link>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image
                  src="/media/meterkast-front.jpg"
                  alt="Vooraanzicht van een Nederlandse meterkast met automaten, aardlekschakelaar en een Blusbox-module op de DIN-rail"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
                <LogoBadge />
              </div>
            </Reveal>
          </div>
        </section>
        <section className="mx-auto max-w-3xl px-6 pb-20">
          <SectionTitle>Veelgestelde vragen over brand in de meterkast</SectionTitle>
          <div className="mt-8">
            <FaqList items={vragen} />
          </div>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(vragenData) }}
          />
        </section>

        <nav aria-label="Verder lezen" className="mx-auto max-w-6xl px-6 pb-20">
          <h2 className="font-display text-2xl">Verder lezen</h2>
          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ARTIKELEN.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/kennisbank/${a.slug}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-railstaal/60 px-5 py-4 transition-colors hover:border-antraciet"
                >
                  <span>{a.kop}</span>
                  <span aria-hidden>→</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
      <SiteFooter />
    </>
  );
}
