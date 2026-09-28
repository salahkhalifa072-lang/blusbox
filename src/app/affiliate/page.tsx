import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, SectionTitle } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { FaqList } from "@/components/ui/accordion";
import { Aanmeldformulier } from "@/components/affiliate/aanmeldformulier";
import { PROGRAMMA, STAPPEN, VOORWAARDEN_KORT, VRAGEN } from "@/lib/affiliate/teksten";

export const metadata: Metadata = {
  title: `Verdien ${PROGRAMMA.percentage}% commissie met Blusbox`,
  description: `Word Blusbox-affiliate en verdien ${PROGRAMMA.percentage}% commissie over elke verkoop via jouw persoonlijke link. Geen kosten, geen verplichtingen.`,
  alternates: { canonical: "/affiliate" },
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
  return (
    <>
      <PageHeader
        eyebrow="partnerprogramma"
        title={`Verdien ${PROGRAMMA.percentage}% commissie met Blusbox`}
        lead="Deel je persoonlijke link. Bestelt iemand een Blusbox, dan gaat een vijfde van de productwaarde naar jou. Geen kosten, geen minimum, geen verplichtingen."
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
