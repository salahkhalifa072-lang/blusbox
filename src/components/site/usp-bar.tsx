import { gratisVerzending, verzendwaarde } from "@/lib/pricing";

/**
 * Announcement strip pinned above the header — the standard place a Dutch
 * webshop states its shipping promise. One line, one message.
 */
export function ShippingBanner() {
  return (
    <div className="bg-blusrood-vlak text-kastwit">
      <p className="data mx-auto max-w-6xl px-6 py-2 text-center text-[11px] uppercase tracking-widest sm:text-xs">
        {gratisVerzending.kort} · t.w.v. {verzendwaarde}
      </p>
    </div>
  );
}

const usps = [
  {
    t: gratisVerzending.kort,
    b: `Geen minimumbedrag. Wij rekenen de ${verzendwaarde} verzendkosten nooit door.`,
  },
  {
    t: "Zelfactiverend bij 170 °C",
    b: "Geen stroom, geen bediening, geen mens nodig.",
  },
  {
    t: "10 jaar levensduur",
    b: "Met automatische herinnering voordat de termijn verloopt.",
  },
  {
    t: "14 dagen bedenktijd",
    b: "Niet tevreden? Binnen veertien dagen terugsturen.",
  },
];

/** Trust row, placed directly under the hero. */
export function UspBar() {
  return (
    <section aria-label="Onze voorwaarden" className="bg-kastwit-dim">
      <div className="mx-auto grid max-w-6xl gap-px bg-railstaal/40 px-6 py-0 sm:grid-cols-2 lg:grid-cols-4">
        {usps.map((u) => (
          <div key={u.t} className="bg-kastwit-dim px-4 py-6">
            <p className="font-medium">{u.t}</p>
            <p className="mt-1 text-xs leading-relaxed text-staal-tekst">
              {u.b}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
