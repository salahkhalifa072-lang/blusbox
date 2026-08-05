import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { SectionTitle } from "@/components/site/page-header";
import { SpecTable } from "@/components/ui/spec-table";
import { ClaimSource } from "@/components/ui/claim-source";
import { FaqList } from "@/components/ui/accordion";
import { VideoBlock } from "@/components/ui/video-block";
import { LogoBadge } from "@/components/site/logo";
import { productFacts } from "@/lib/product-facts";
import { faqUitgelicht } from "@/lib/faq";

export const metadata: Metadata = {
  // absolute: the product name is already the brand name, so the
  // "%s — Blusbox" template would stutter here
  title: { absolute: "Blusbox — automatische blusmodule voor de meterkast" },
  description:
    "Blusbox is een automatische blusmodule voor de meterkast. Activeert zichzelf bij 170 °C. Geen stroom, geen bediening, geen mens. Tien jaar levensduur.",
  alternates: { canonical: "/blusbox" },
};

/**
 * §5.2 PDP. Price is intentionally unset — the brief carries no pricing,
 * so the display renders a [VERIFY] state rather than a made-up number.
 */
const prijsIncl: number | null = null;

const inDoos = [
  "Blusbox-module met DIN-railclip",
  "Detectiekoord, voorgemonteerd",
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
  // gtin + offers are filled once the client supplies pricing and codes
  // [VERIFY: gtin, prijs, beschikbaarheid]
};

export default function BlusboxPage() {
  return (
    <>
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="pb-24">
        {/* Gallery + buy column */}
        <section className="bg-antraciet pb-16 pt-32 text-kastwit sm:pt-36">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-antraciet-verhoogd">
                <Image
                  src="/media/packshot.jpg"
                  alt="Blusbox-module: matrode behuizing met DIN-railclip en detectiekoord"
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
                <LogoBadge />
              </div>
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-antraciet-verhoogd">
                <VideoBlock
                  src="/media/meterkast-front.mp4"
                  poster="/media/meterkast-front.jpg"
                  label="Fragment: een beginnende brand in de meterkast wordt door de Blusbox-module met aerosol gedoofd"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <LogoBadge />
              </div>
              <p className="data text-xs text-railstaal">
                Beeld is een weergave.
              </p>
            </div>

            <div>
              <p className="data text-xs uppercase tracking-widest text-railstaal">
                blusmodule · meterkast
              </p>
              <h1 className="font-display mt-4 text-[clamp(2.5rem,6vw,4.5rem)]">
                Blusbox
              </h1>
              <p className="mt-4 text-lg text-kastwit/70">
                De laatste verdedigingslinie in je meterkast. Bij{" "}
                <span className="data text-kastwit">170 °C</span> activeert de
                module zichzelf en onderdrukt de brand in de kast — zonder
                stroom, zonder bediening, zonder mens.
              </p>

              {/* Price block */}
              <div className="mt-8 border-t border-kastwit/15 pt-6">
                {prijsIncl === null ? (
                  <p className="data text-2xl text-signaal">
                    [VERIFY: verkoopprijs incl. btw]
                  </p>
                ) : (
                  <p className="data text-3xl">
                    €{" "}
                    {prijsIncl.toLocaleString("nl-NL", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                )}
                <p className="mt-1 text-sm text-kastwit/60">
                  Incl. btw · zakelijke prijzen excl. btw na inloggen
                </p>

                <div className="data mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-railstaal">
                  <span>Voorraad: [VERIFY]</span>
                  <span>Levertijd: [VERIFY]</span>
                  <span>Lotnummer bij levering</span>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled
                    className="rounded-full bg-blusrood px-7 py-3.5 text-sm font-medium text-kastwit disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    In winkelwagen
                  </button>
                  <Link
                    href="/zakelijk"
                    className="rounded-full border border-kastwit/40 px-7 py-3.5 text-sm transition-colors hover:bg-kastwit hover:text-antraciet"
                  >
                    Zakelijk bestellen
                  </Link>
                </div>
                <p className="data mt-3 text-xs text-railstaal">
                  Bestellen gaat live zodra prijs en voorraad zijn ingesteld.
                </p>
              </div>

              {/* Reassurance strip */}
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  "14 dagen herroepingsrecht",
                  "Levering met ADR-papieren",
                  "Vervangingsherinnering na 10 jaar",
                  "Nederlandse handleiding",
                ].map((item) => (
                  <li
                    key={item}
                    className="rounded-xl border border-kastwit/15 px-4 py-3 text-sm text-kastwit/75"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Specs */}
        <section className="mx-auto max-w-6xl px-6 py-20">
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
              <ClaimSource label="[VERIFY: conformiteitsverklaring en productblad koppelen]" />

              <h3 className="font-display mt-12 text-xl">Wat je ontvangt</h3>
              <ul className="mt-4 space-y-2 text-sm text-staal-tekst">
                {inDoos.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="data text-blusrood" aria-hidden>
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
                  b: "Je hebt aaneengesloten vrije breedte op de rail nodig: [VERIFY: benodigde modulebreedte].",
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
                className="rounded-full bg-blusrood px-6 py-3 text-sm font-medium text-kastwit transition-colors hover:bg-[#b81e1b]"
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

      {/* Sticky mobile add-to-cart */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-railstaal bg-kastwit/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="data text-sm">
              {prijsIncl === null ? "[VERIFY: prijs]" : `€ ${prijsIncl}`}
            </p>
            <p className="text-[11px] text-staal-tekst">incl. btw</p>
          </div>
          <button
            type="button"
            disabled
            className="rounded-full bg-blusrood px-6 py-3 text-sm font-medium text-kastwit disabled:opacity-60"
          >
            In winkelwagen
          </button>
        </div>
      </div>

      <SiteFooter />
    </>
  );
}
