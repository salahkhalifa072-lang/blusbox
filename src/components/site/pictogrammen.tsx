/**
 * Pictograms in the ISO 7010 idiom the brief asks for (§6): geometric,
 * built on a 24-unit grid, single stroke weight, square caps softened only
 * where a curve is unavoidable. Drawn inline rather than pulled from an
 * icon set — Phosphor and Lucide are rounded and friendly, which reads as
 * generic SaaS next to Anton and a DIN-rail grid.
 *
 * `currentColor` throughout, so a parent decides the colour.
 */

type Props = { className?: string };

const basis = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
  "aria-hidden": true,
};

/** Parcel with a motion mark — shipping. */
export function IcoonVerzending({ className }: Props) {
  return (
    <svg {...basis} className={className}>
      <path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4v-9Z" />
      <path d="M3.5 7.5 12 11.5l8.5-4" />
      <path d="M12 11.5v9" />
    </svg>
  );
}

/** Thermometer at its trigger point — the 170 °C moment. */
export function IcoonTemperatuur({ className }: Props) {
  return (
    <svg {...basis} className={className}>
      <path d="M10 14.2V4.5a2 2 0 1 1 4 0v9.7" />
      <circle cx="12" cy="17" r="3.2" />
      <path d="M16.5 6h3M16.5 9h3M16.5 12h3" />
    </svg>
  );
}

/** Ring with a tick at the top — a term that runs and then comes due. */
export function IcoonLevensduur({ className }: Props) {
  return (
    <svg {...basis} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 6.5V12l4 2.5" />
    </svg>
  );
}

/** Arrow turning back into the box — right of withdrawal. */
export function IcoonRetour({ className }: Props) {
  return (
    <svg {...basis} className={className}>
      <path d="M4 12a8 8 0 1 1 2.6 5.9" />
      <path d="M3.5 7.5v4.5H8" />
    </svg>
  );
}

/** Struck-through plug — no power, no wiring. */
export function IcoonGeenStroom({ className }: Props) {
  return (
    <svg {...basis} className={className}>
      <path d="M9 3.5v4M15 3.5v4" />
      <path d="M6.5 7.5h11v3a5.5 5.5 0 0 1-11 0v-3Z" />
      <path d="M12 16v4.5" />
    </svg>
  );
}

/** Enclosure with a rail — fits the meterkast. */
export function IcoonMeterkast({ className }: Props) {
  return (
    <svg {...basis} className={className}>
      <rect x="4" y="3.5" width="16" height="17" />
      <path d="M4 10h16M4 14h16" />
      <path d="M15 6.2v1.6" />
    </svg>
  );
}
