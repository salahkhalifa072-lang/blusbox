import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { SectionTitle } from "@/components/site/page-header";
import { KruimelData } from "@/components/site/gestructureerde-data";
import { SpecTable } from "@/components/ui/spec-table";
import { FaqList } from "@/components/ui/accordion";
import { Galerij } from "@/components/product/galerij";
import { AantalKiezer } from "@/components/product/aantal-kiezer";
import { Betaalmethoden } from "@/components/product/betaalmethoden";
import { kenmerken, productFacts } from "@/lib/product-facts";
import { faqUitgelicht } from "@/lib/faq";
import { LEVERTIJD } from "@/lib/verzending";
import { voegToeAanWagen } from "@/app/winkelwagen/acties";
import {
  adviesprijs,
  gratisVerzending,
  prijsExcl,
  prijsIncl,
  verzendwaarde,
  ADVIESPRIJS_CENTEN,
  KORTINGSPERCENTAGE,
  PRIJS_INCL_CENTEN,
  TOON_ADVIESPRIJS,
} from "@/lib/pricing";
import { Reviews } from "@/components/reviews/reviews";
import { Sterren } from "@/components/reviews/sterren";
import { REVIEWS, gemiddeldeWaardering } from "@/lib/reviews";

export const metadata: Metadata = {
  // absolute: the product name is already the brand name, so the
  // "%s — Blusbox" template would stutter here
  title: { absolute: "Blusbox — automatische blusmodule voor de meterkast" },
  description:
    "Blusbox is een automatische blusmodule voor de meterkast. Activeert zichzelf bij 170 °C. Geen stroom, geen bediening, geen mens. Tien jaar levensduur.",
  alternates: { canonical: "/blusbox" },
};

/** §5.2 PDP. Price and shipping come from lib/pricing. */

const inDoos = [
  "Blusbox-module met DIN-railclip",
  "Detectiekoord, al aangesloten op de module",
  "Montage-instructie in het Nederlands",
  "Registratiekaart met lotnummer voor je vervangingstermijn",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Blusbox",
  description:
    "Automatische condensed-aerosol blusmodule voor de meterkast. Zelfactiverend bij 170 °C, zonder stroom of bediening.",
  brand: { "@type": "Brand", name: "Blusbox" },
  category: "Brandbeveiliging",
  offers: {
    "@type": "Offer",
    price: (PRIJS_INCL_CENTEN / 100).toFixed(2),
    priceCurrency: "EUR",
    // Wat de site toont moet zijn wat Google leest; lopen die uiteen, dan
    // is dat een reden voor afkeuring in Search Console.
    ...(TOON_ADVIESPRIJS
      ? {
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            priceType: "https://schema.org/ListPrice",
            price: (ADVIESPRIJS_CENTEN / 100).toFixed(2),
            priceCurrency: "EUR",
          },
        }
      : {}),
    availability: "https://schema.org/InStock",
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingRate: {
        "@type": "MonetaryAmount",
        value: "0",
        currency: "EUR",
      },
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: "NL",
      },
    },
  },
};

export default function BlusboxPage() {
  const gemiddelde = gemiddeldeWaardering();

  return (
    <>
      <KruimelData kruimels={[{ naam: "Blusbox", pad: "/blusbox" }]} />
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="pb-24">
        {/* Galerij + koopblok. Het koopblok is op desktop sticky: bij een
            pagina van deze lengte scrolde de prijs en de knop uit beeld, en
            dan moet iemand terug omhoog om te bestellen. */}
        <section className="bg-antraciet pb-20 pt-32 text-kastwit sm:pt-36">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-2 lg:items-start lg:gap-16">
            <Galerij />

            <div className="lg:sticky lg:top-28">
              <p className="data text-xs uppercase tracking-widest text-railstaal">
                blusmodule · meterkast
              </p>
              <h1 className="font-display mt-4 text-[clamp(2.5rem,6vw,4.5rem)]">
                Blusbox
              </h1>

              {/* Waardering direct onder de titel. Verdwijnt vanzelf zolang
                  er geen beoordelingen zijn — een lege sterrenrij of een
                  nul-score doet meer kwaad dan helemaal niets tonen. */}
              {gemiddelde !== null && (
                <a
                  href="#beoordelingen"
                  className="mt-3 inline-flex items-center gap-2 text-sm text-kastwit/80 underline-offset-4 hover:underline"
                >
                  <Sterren waarde={gemiddelde} />
                  <span className="data">
                    {gemiddelde.toString().replace(".", ",")}
                  </span>
                  <span className="text-kastwit/60">
                    · {REVIEWS.length}{" "}
                    {REVIEWS.length === 1 ? "beoordeling" : "beoordelingen"}
                  </span>
                </a>
              )}
              {/* Kenmerken in het kort, zoals een marktplaats dat onder de
                  titel doet. Wie hier al afhaakt op "geen stroom nodig"
                  hoeft de rest van de pagina niet te lezen. */}
              <ul className="mt-5 flex flex-wrap gap-2">
                {kenmerken.map((k) => (
                  <li
                    key={k}
                    className="data rounded-full border border-kastwit/20 px-3 py-1 text-[11px] text-kastwit/75"
                  >
                    {k}
                  </li>
                ))}
              </ul>

              <a
                href="#specificaties"
                className="data mt-3 inline-block text-xs text-railstaal underline underline-offset-4 hover:text-kastwit"
              >
                Alle specificaties
              </a>

              <p className="mt-4 text-lg text-kastwit/70">
                De laatste verdedigingslinie in je meterkast. Bij{" "}
                <span className="data text-kastwit">170 °C</span> activeert de
                module zichzelf en onderdrukt de brand in de kast — zonder
                stroom, zonder bediening, zonder mens.
              </p>

              <div className="mt-8 border-t border-kastwit/15 pt-6">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                  <p className="data text-3xl">{prijsIncl}</p>
                  {TOON_ADVIESPRIJS && (
                    <>
                      <span className="data text-lg text-railstaal line-through">
                        {adviesprijs}
                      </span>
                      <span className="rounded-full bg-blusrood-vlak px-3 py-1 text-xs font-medium">
                        −{KORTINGSPERCENTAGE}%
                      </span>
                    </>
                  )}
                </div>
                <p className="mt-2 text-sm text-kastwit/60">
                  Incl. btw ({prijsExcl} excl. btw)
                  {TOON_ADVIESPRIJS && <> · adviesprijs {adviesprijs}</>}
                </p>
                <p className="data mt-3 text-sm text-kastwit/80">
                  Verzendkosten{" "}
                  <span className="text-railstaal line-through">
                    {verzendwaarde}
                  </span>{" "}
                  <span className="text-kastwit">gratis</span>
                </p>

                <div className="data mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-railstaal">
                  <span>Op voorraad</span>
                  <span>Levertijd: {LEVERTIJD}</span>
                  <span>Lotnummer bij levering</span>
                </div>

                <form action={voegToeAanWagen} className="mt-6">
                  <input type="hidden" name="slug" value="blusbox" />
                  <AantalKiezer />
                </form>

                <Link
                  href="/zakelijk"
                  className="mt-4 inline-block rounded-full border border-kastwit/40 px-7 py-3 text-sm transition-colors hover:bg-kastwit hover:text-antraciet"
                >
                  Zakelijk bestellen
                </Link>

                {/* Vertrouwenspunten binnen het koopblok en niet eronder:
                    wie twijfelt bij de knop moet ze zien zonder te scrollen.
                    Alleen dingen die wij waarmaken — geen "dag en nacht
                    klantenservice" bij een eenmanszaak. */}
                <ul className="mt-6 space-y-2 border-t border-kastwit/15 pt-6">
                  {[
                    gratisVerzending.kort,
                    `Levertijd ${LEVERTIJD}, verstuurd uit Nederland`,
                    "14 dagen bedenktijd, retour zonder opgaaf van reden",
                    "Wettelijke garantie en Nederlandse handleiding",
                  ].map((punt) => (
                    <li key={punt} className="flex gap-2 text-sm text-kastwit/75">
                      <span aria-hidden className="text-blusrood-op-donker">—</span>
                      <span>{punt}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 border-t border-kastwit/15 pt-6">
                  <Betaalmethoden donker />
                </div>
              </div>

            </div>
          </div>

        </section>

        {/* Specs */}
        <section id="specificaties" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <SectionTitle>Specificaties</SectionTitle>
              <p className="mt-4 max-w-sm text-staal-tekst">
                Alles wat hieronder staat is door de leverancier bevestigd.
                Ontbreekt er een waarde, dan staat die er bewust niet in.
              </p>
            </div>
            <div>
              <SpecTable rows={productFacts} />

              <h3 className="font-display mt-12 text-xl">Wat je ontvangt</h3>
              <ul className="mt-4 space-y-2 text-sm text-staal-tekst">
                {inDoos.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="data text-blusrood-op-donker" aria-hidden>
                      —
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Fit helper */}
        <section className="bg-kastwit-dim py-20">
          <div className="mx-auto max-w-6xl px-6">
            <SectionTitle accent="in mijn kast?">Past dit</SectionTitle>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  nr: "01",
                  t: "Open je meterkast",
                  b: "Zoek de DIN-rail waar je automaten op zitten. Blusbox klikt op dezelfde rail.",
                },
                {
                  nr: "02",
                  t: "Meet de vrije ruimte",
                  b: "De module klikt op elke standaard DIN-rail. Er is geen bijzondere breedte of adapter nodig.",
                },
                {
                  nr: "03",
                  t: "Twijfel je?",
                  b: "Stuur een foto van je groepenkast en je krijgt binnen één werkdag antwoord.",
                },
              ].map((s) => (
                <article
                  key={s.nr}
                  className="rounded-2xl border border-railstaal/50 bg-kastwit p-6"
                >
                  <p className="data text-xs text-staal-tekst">{s.nr}</p>
                  <h3 className="font-display mt-2 text-xl">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-staal-tekst">
                    {s.b}
                  </p>
                </article>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="rounded-full bg-blusrood-vlak px-6 py-3 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18]"
              >
                Stuur een foto van je kast
              </Link>
              <Link
                href="/installatie"
                className="rounded-full border border-antraciet px-6 py-3 text-sm transition-colors hover:bg-antraciet hover:text-kastwit"
              >
                Naar de installatiepagina
              </Link>
            </div>
          </div>
        </section>

        {/* Downloads */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <SectionTitle>Documentatie</SectionTitle>
          <p className="mt-4 max-w-xl text-staal-tekst">
            Handleiding, conformiteitsverklaring, veiligheidsinformatieblad en
            productblad staan gebundeld op de downloadpagina.
          </p>
          <Link
            href="/downloads"
            className="mt-6 inline-block rounded-full border border-antraciet px-6 py-3 text-sm transition-colors hover:bg-antraciet hover:text-kastwit"
          >
            Naar downloads
          </Link>
        </section>

        {/* Beoordelingen. Staan vóór de FAQ: wie twijfelt leest eerst wat
            anderen vonden en pas daarna de kleine lettertjes. Toont zichzelf
            niet zolang lib/reviews.ts leeg is. */}
        <div id="beoordelingen" className="scroll-mt-24">
          <Reviews titel="Beoordelingen" />
        </div>

        {/* FAQ excerpt */}
        <section className="mx-auto max-w-6xl px-6 pb-4">
          <SectionTitle>Veelgestelde vragen</SectionTitle>
          <div className="mt-8">
            <FaqList items={faqUitgelicht} />
          </div>
          <Link
            href="/veelgestelde-vragen"
            className="data mt-6 inline-block text-sm underline underline-offset-4 hover:text-staal-tekst"
          >
            Alle vragen bekijken
          </Link>
        </section>
      </main>

      {/* Sticky mobile add-to-cart. Een benoemde <section> en geen <div>:
          hij staat buiten <main>, en losse inhoud buiten een landmark is
          voor voorleessoftware lastig te vinden. Kwam niet uit de audit van
          stap 11 — die draaide alleen op desktopbreedte. */}
      <section
        aria-label="Bestellen"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-railstaal bg-kastwit/95 px-4 py-3 backdrop-blur-md lg:hidden"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="data text-sm">{prijsIncl}</p>
            <p className="text-[11px] text-staal-tekst">
              incl. btw · gratis verzending
            </p>
          </div>
          <form action={voegToeAanWagen}>
            <input type="hidden" name="slug" value="blusbox" />
            <input type="hidden" name="aantal" value={1} />
            <button
              type="submit"
              className="rounded-full bg-blusrood-vlak px-6 py-3 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18]"
            >
              In winkelwagen
              <span className="sr-only"> (onderbalk)</span>
            </button>
          </form>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
