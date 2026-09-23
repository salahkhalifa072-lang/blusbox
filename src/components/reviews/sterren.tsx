/**
 * Sterrenwaardering.
 *
 * Eén pad dat vijf keer herhaald wordt, met een tweede rij eroverheen die
 * op breedte wordt afgeknipt. Daardoor kan 4,6 ook echt als 4,6 getoond
 * worden in plaats van afgerond naar 5 — en dat scheelt, want een
 * afgeronde 5 bij een gemiddelde van 4,6 is een te mooie voorstelling.
 */

function Ster({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path d="M10 1.5l2.47 5.35 5.83.7-4.3 3.98 1.14 5.77L10 14.4l-5.14 2.9 1.14-5.77-4.3-3.98 5.83-.7z" />
    </svg>
  );
}

export function Sterren({
  waarde,
  maat = "h-4 w-4",
  label,
}: {
  waarde: number;
  maat?: string;
  /** Voorgelezen tekst. Zonder dit hoort een schermlezer alleen "afbeelding". */
  label?: string;
}) {
  const deel = Math.max(0, Math.min(1, waarde / 5));

  return (
    <span
      className="relative inline-flex align-middle"
      role="img"
      aria-label={label ?? `${waarde.toString().replace(".", ",")} van de 5 sterren`}
    >
      <span className="flex gap-0.5 text-railstaal/50">
        {[0, 1, 2, 3, 4].map((i) => (
          <Ster key={i} className={maat} />
        ))}
      </span>
      <span
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${deel * 100}%` }}
        aria-hidden
      >
        <span className="flex gap-0.5 text-blusrood">
          {[0, 1, 2, 3, 4].map((i) => (
            <Ster key={i} className={maat} />
          ))}
        </span>
      </span>
    </span>
  );
}
