import { gratisVerzending, verzendwaarde } from "@/lib/pricing";
import {
  IcoonLevensduur,
  IcoonRetour,
  IcoonTemperatuur,
  IcoonVerzending,
} from "@/components/site/pictogrammen";

/**
 * Announcement strip pinned above the header — the standard place a Dutch
 * webshop states its shipping promise. One line, one message.
 */
export function ShippingBanner() {
  return (
    <div className="bg-blusrood-vlak text-kastwit">
      <p className="data mx-auto flex max-w-6xl items-center justify-center gap-2 px-6 py-2 text-[11px] uppercase tracking-widest sm:text-xs">
        <IcoonVerzending className="h-3.5 w-3.5 shrink-0" />
        <span>
          {gratisVerzending.kort} · t.w.v. {verzendwaarde}
        </span>
      </p>
    </div>
  );
}

const usps = [
  {
    Icoon: IcoonVerzending,
    kop: gratisVerzending.kort,
    regel: `Geen minimumbedrag — wij rekenen de ${verzendwaarde} nooit door.`,
  },
  {
    Icoon: IcoonTemperatuur,
    kop: "Zelfactiverend bij 170 °C",
    regel: "Geen stroom, geen bediening, geen mens nodig.",
  },
  {
    Icoon: IcoonLevensduur,
    kop: "10 jaar levensduur",
    regel: "Met automatisch bericht voordat de termijn verloopt.",
  },
  {
    Icoon: IcoonRetour,
    kop: "14 dagen bedenktijd",
    regel: "Niet tevreden? Binnen veertien dagen retour.",
  },
];

/**
 * Trust row under the hero.
 *
 * Cards on the light ground rather than a flat divided strip: the strip
 * read as a footer and got skipped. The pictogram carries the meaning at a
 * glance, the heading confirms it, the line underneath answers the obvious
 * follow-up question. Icons stay in --antraciet — §6 allows red once per
 * screen, and on the homepage that is already spent on the hero.
 */
export function UspBar() {
  return (
    <section aria-label="Onze voorwaarden" className="bg-kastwit-dim">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {usps.map(({ Icoon, kop, regel }) => (
            <li
              key={kop}
              className="group rounded-2xl border border-railstaal/45 bg-kastwit p-6 transition-colors hover:border-antraciet/35"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-railstaal/45 text-antraciet transition-colors group-hover:border-antraciet/35">
                <Icoon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-medium leading-snug">{kop}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-staal-tekst">
                {regel}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
