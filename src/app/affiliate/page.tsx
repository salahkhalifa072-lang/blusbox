import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, SectionTitle } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { FaqList } from "@/components/ui/accordion";
import { Aanmeldformulier } from "@/components/affiliate/aanmeldformulier";
import { Banners } from "@/components/affiliate/banners";
import { siteUrl } from "@/lib/site";
import { PROGRAMMA, STAPPEN, VOORWAARDEN_KORT, VRAGEN } from "@/lib/affiliate/teksten";

/**
 * Zoekwoorden staan in de titel en de beschrijving, niet in een
 * keywords-tag: die leest Google al sinds 2009 niet meer.
 *
 * "Affiliateprogramma" én "partnerprogramma" staan er allebei in omdat
 * mensen op allebei zoeken en het in het Nederlands door elkaar wordt
 * gebruikt. Het onderwerp erbij — brandbeveiliging, meterkast — want op
 * kale termen als "partnerprogramma" concurreer je met bol.com en
 * Amazon, en dat win je niet. Op "affiliateprogramma brandbeveiliging"
 * wel.
 */
export const metadata: Metadata = {
  title: `Affiliateprogramma — verdien ${PROGRAMMA.percentage}% commissie`,
  description: `Partnerprogramma van Blusbox: verdien ${PROGRAMMA.percentage}% commissie over elke verkoop van de automatische blusmodule voor de meterkast. Gratis aanmelden, eigen link, ${PROGRAMMA.attributieDagen} dagen geldig, maandelijkse uitbetaling.`,
  alternates: { canonical: "/affiliate" },
  openGraph: {
    type: "website",
    title: `Blusbox affiliateprogramma — ${PROGRAMMA.percentage}% commissie`,
    description: `Word partner van Blusbox en verdien ${PROGRAMMA.percentage}% over elke verkoop via jouw link.`,
    url: "/affiliate",
  },
};

/**
 * De publieke wervingspagina.
 *
 * Bewust zonder rekenvoorbeelden van wat je kunt verdienen. "Verdien tot
 * € 2.000 per maand" is precies de belofte die de ACM als misleidend
 * aanmerkt zodra je hem niet kunt onderbouwen, en wij kennen het bereik
 * van een aanvrager niet. Wat er wél staat is het percentage en hoe het
 * werkt; dat kan iedereen zelf doorrekenen.
 */
export default function AffiliatePagina() {
  /*
   * FAQPage-data. Google kan hiermee de vragen uitklapbaar onder het
   * zoekresultaat tonen, wat de regel breder maakt en meer klikken
   * oplevert. De antwoorden zijn dezelfde als op de pagina zelf — iets
   * anders in de structuur zetten dan wat de bezoeker ziet is precies
   * waar Google handmatige maatregelen voor uitdeelt.
   */
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: VRAGEN.map((v) => ({
      "@type": "Question",
      name: v.vraag,
      acceptedAnswer: { "@type": "Answer", text: v.antwoord },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
      <PageHeader
        eyebrow="partnerprogramma"
        title={`Blusbox affiliateprogramma`}
        lead={`Verdien ${PROGRAMMA.percentage}% commissie over elke verkoop via jouw persoonlijke link. Geen kosten, geen minimum, geen verplichtingen.`}
      />

      <main className="pb-24">
        {/* Stappen */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STAPPEN.map((stap) => (
              <li
                key={stap.nummer}
                className="rounded-2xl border border-railstaal/50 bg-kastwit p-6"
              >
                <p className="data text-xs tracking-widest text-blusrood-op-licht">
                  {stap.nummer}
                </p>
                <p className="mt-3 font-display text-xl">{stap.kop}</p>
                <p className="mt-2 text-sm leading-relaxed text-staal-tekst">
                  {stap.tekst}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Kerngetallen */}
        <section className="bg-antraciet py-16 text-kastwit">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-3">
            {[
              { waarde: `${PROGRAMMA.percentage}%`, label: "commissie per verkoop" },
              { waarde: `${PROGRAMMA.attributieDagen} dagen`, label: "geldigheid van je link" },
              { waarde: PROGRAMMA.drempel, label: "vanaf dit bedrag betalen we uit" },
            ].map((k) => (
              <div key={k.label}>
                <p className="data text-4xl">{k.waarde}</p>
                <p className="mt-1 text-sm text-kastwit/60">{k.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Voorwaarden in het kort */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <SectionTitle>De regels, in het kort</SectionTitle>
          <div className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2">
            {VOORWAARDEN_KORT.map((v) => (
              <div key={v.kop}>
                <p className="font-medium">{v.kop}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-staal-tekst">
                  {v.tekst}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/affiliate/voorwaarden"
            className="data mt-8 inline-block text-sm underline underline-offset-4 hover:text-staal-tekst"
          >
            Alle affiliatevoorwaarden lezen
          </Link>
        </section>

        {/* Banners — voorproefje, zonder code. */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <SectionTitle>Kant-en-klare banners</SectionTitle>
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-staal-tekst">
            Geen ontwerpwerk nodig. Vier standaardmaten met het product, de
            prijs en een knop erin. Na goedkeuring krijg je de code met jouw
            eigen link, om te plakken waar je maar wil.
          </p>
          <div className="mt-8">
            <Banners basisUrl={siteUrl} />
          </div>
        </section>

        {/* Aanmelden */}
        <section id="aanmelden" className="bg-kastwit-dim py-16 scroll-mt-24">
          <div className="mx-auto max-w-3xl px-6">
            <SectionTitle>Aanmelden</SectionTitle>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-staal-tekst">
              Vul het formulier in. Wij kijken persoonlijk naar elke aanmelding
              en laten binnen een paar werkdagen weten of je meedoet.
            </p>
            <div className="mt-8">
              <Aanmeldformulier />
            </div>
          </div>
        </section>

        {/* Vragen */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <SectionTitle>Veelgestelde vragen</SectionTitle>
          <div className="mt-8">
            <FaqList
              items={VRAGEN.map((v) => ({
                vraag: v.vraag,
                antwoord: v.antwoord,
              }))}
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
