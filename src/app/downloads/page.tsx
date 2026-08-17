import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";

export const metadata: Metadata = {
  title: "Downloads",
  description:
    "Handleiding, conformiteitsverklaring, veiligheidsinformatieblad en productblad van Blusbox.",
  alternates: { canonical: "/downloads" },
};

/**
 * §9.5 the document library is versioned in the dashboard; this page is the
 * public view of it. Files are listed but not linked until the client
 * supplies them — a dead link on a safety document is worse than none.
 */
const documenten = [
  {
    t: "Handleiding",
    b: "Montage, plaatsing van het detectiekoord en wat te doen na een activering.",
    meta: "PDF · Nederlands",
  },
  {
    t: "Conformiteitsverklaring (DoC)",
    b: "Verklaring van de fabrikant met de toegepaste normen.",
    meta: "PDF",
  },
  {
    t: "Veiligheidsinformatieblad (SDS)",
    b: "Samenstelling, hantering en maatregelen bij onbedoeld vrijkomen.",
    meta: "PDF",
  },
  {
    t: "Productblad",
    b: "Maatvoering, technische gegevens en toepassingsgebied op één A4.",
    meta: "PDF",
  },
];

export default function DownloadsPage() {
  return (
    <>
      <PageHeader
        eyebrow="documentatie"
        title="Downloads"
        lead="Alle documenten bij het product. Voor installateurs staat aanvullend verkoop- en instructiemateriaal in het dealerportaal."
      />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <ul className="divide-y divide-railstaal/50 border-y border-railstaal/50">
          {documenten.map((d) => (
            <li
              key={d.t}
              className="flex flex-wrap items-start justify-between gap-4 py-6"
            >
              <div className="max-w-md">
                <h2 className="font-display text-xl">{d.t}</h2>
                <p className="mt-1 text-sm leading-relaxed text-staal-tekst">
                  {d.b}
                </p>
                <p className="data mt-2 text-xs text-staal-tekst">{d.meta}</p>
              </div>
              <span className="data rounded-full border border-dashed border-railstaal px-4 py-2 text-xs text-staal-tekst">
                nog niet beschikbaar
              </span>
            </li>
          ))}
        </ul>
        <p className="data mt-8 text-xs text-staal-tekst">
          Documenten worden gekoppeld zodra de definitieve versies zijn
          aangeleverd. Elke versie krijgt een datum, zodat altijd te zien is
          welke versie bij welke levering hoort.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
