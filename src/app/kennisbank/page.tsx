import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { KruimelData } from "@/components/site/gestructureerde-data";
import { SiteFooter } from "@/components/site/footer";
import { ARTIKELEN } from "@/lib/kennisbank";

export const metadata: Metadata = {
  title: "Kennisbank brandveiligheid en de meterkast",
  description:
    "Antwoorden op vragen over brand in de meterkast, brandblussers, blusdekens en rookmelders. Praktisch, zonder vakjargon.",
  alternates: { canonical: "/kennisbank" },
};

export default function KennisbankPagina() {
  return (
    <>
      <KruimelData kruimels={[{ naam: "Kennisbank", pad: "/kennisbank" }]} />
      <PageHeader
        eyebrow="kennisbank"
        title="Brandveiligheid,"
        accent="helder uitgelegd"
        lead="Wat doe je als de meterkast warm wordt? Welke blusser past waar? Korte antwoorden op de vragen die we het vaakst horen."
      />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* De pijlerpagina eerst: daar komen de artikelen op uit. */}
          <li>
            <Link
              href="/meterkastbrand"
              className="flex h-full flex-col rounded-2xl border border-antraciet bg-antraciet p-6 text-kastwit transition-transform hover:-translate-y-0.5"
            >
              <span className="data text-[11px] uppercase tracking-widest text-railstaal">Uitgebreid artikel</span>
              <span className="font-display mt-3 text-2xl">Brand in de meterkast</span>
              <span className="mt-2 text-sm text-kastwit/75">
                Hoe een kastbrand ontstaat, waarom de aardlekschakelaar hem niet altijd tegenhoudt en wat wél helpt.
              </span>
              <span className="data mt-auto pt-5 text-xs">Lees verder →</span>
            </Link>
          </li>
          {ARTIKELEN.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/kennisbank/${a.slug}`}
                className="flex h-full flex-col rounded-2xl border border-railstaal/60 bg-kastwit p-6 transition-colors hover:border-antraciet"
              >
                <span className="data text-[11px] uppercase tracking-widest text-staal-tekst">
                  {a.leestijd} min lezen
                </span>
                <span className="font-display mt-3 text-2xl">{a.kop}</span>
                <span className="mt-2 text-sm text-staal-tekst">{a.omschrijving}</span>
                <span className="data mt-auto pt-5 text-xs">Lees verder →</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
