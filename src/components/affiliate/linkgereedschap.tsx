"use client";

import { useMemo, useState } from "react";

/**
 * Linkgenerator met kopieerknop.
 *
 * De link wordt in de browser samengesteld en niet op de server opgehaald:
 * hij is volledig af te leiden uit de slug en de gekozen pagina, en dan is
 * een rondje naar de server per toetsaanslag zonde.
 *
 * Kopiëren gaat via de clipboard-API met een terugval op selecteren. Die
 * API werkt alleen op https en na een echte klik; op een telefoon in een
 * ingesloten webweergave ontbreekt hij soms helemaal, en dan moet er nog
 * steeds iets gebeuren dat de gebruiker verder helpt.
 */

const PAGINAS = [
  { pad: "/", naam: "Homepage" },
  { pad: "/blusbox", naam: "Productpagina" },
  { pad: "/hoe-het-werkt", naam: "Hoe het werkt" },
  { pad: "/meterkastbrand", naam: "Meterkastbrand" },
  { pad: "/zakelijk", naam: "Zakelijk" },
  { pad: "/installateurs", naam: "Voor installateurs" },
] as const;

function Kopieerknop({ waarde }: { waarde: string }) {
  const [staat, setStaat] = useState<"rust" | "gekopieerd" | "mislukt">("rust");

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(waarde);
      setStaat("gekopieerd");
    } catch {
      setStaat("mislukt");
    }
    // Terug naar rust, zodat de knop bij een tweede link niet blijft
    // zeggen dat er al iets gekopieerd is.
    setTimeout(() => setStaat("rust"), 2500);
  }

  return (
    <button
      type="button"
      onClick={kopieer}
      className="data shrink-0 rounded-full border border-antraciet px-4 py-2 text-xs transition-colors hover:bg-antraciet hover:text-kastwit"
      aria-live="polite"
    >
      {staat === "gekopieerd"
        ? "Gekopieerd"
        : staat === "mislukt"
          ? "Selecteer handmatig"
          : "Kopieer"}
    </button>
  );
}

function Linkregel({ label, link }: { label: string; link: string }) {
  return (
    <div>
      <p className="data text-xs uppercase tracking-widest text-staal-tekst">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="data min-w-0 flex-1 rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-3 py-2 text-xs"
        />
        <Kopieerknop waarde={link} />
      </div>
    </div>
  );
}

export function Linkgereedschap({
  slug,
  basisUrl,
}: {
  slug: string;
  basisUrl: string;
}) {
  const [pad, setPad] = useState<string>("/");
  const [bron, setBron] = useState("");
  const [campagne, setCampagne] = useState("");

  const standaard = `${basisUrl}/r/${slug}`;

  const samengesteld = useMemo(() => {
    const url = new URL(`${basisUrl}/r/${slug}`);
    if (pad !== "/") url.searchParams.set("naar", pad);
    if (bron.trim()) url.searchParams.set("utm_source", bron.trim());
    if (campagne.trim()) url.searchParams.set("utm_campaign", campagne.trim());
    if (bron.trim() || campagne.trim()) url.searchParams.set("utm_medium", "affiliate");
    return url.toString();
  }, [basisUrl, slug, pad, bron, campagne]);

  return (
    <div className="space-y-8">
      <Linkregel label="Je persoonlijke link" link={standaard} />

      <div className="border-t border-railstaal/50 pt-6">
        <p className="font-medium">Link naar een specifieke pagina</p>
        <p className="mt-1 text-sm text-staal-tekst">
          Handig als je ergens specifiek over schrijft. De bezoeker komt dan
          meteen op de juiste pagina uit, en de verkoop telt gewoon mee.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="pad" className="block text-sm font-medium">
              Pagina
            </label>
            <select
              id="pad"
              value={pad}
              onChange={(e) => setPad(e.target.value)}
              className="data mt-1.5 w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-3 py-2 text-sm"
            >
              {PAGINAS.map((p) => (
                <option key={p.pad} value={p.pad}>
                  {p.naam}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="bron" className="block text-sm font-medium">
              Bron
              <span className="ml-1.5 text-xs font-normal text-staal-tekst">
                optioneel
              </span>
            </label>
            <input
              id="bron"
              value={bron}
              onChange={(e) => setBron(e.target.value)}
              placeholder="nieuwsbrief"
              className="data mt-1.5 w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="campagne" className="block text-sm font-medium">
              Campagne
              <span className="ml-1.5 text-xs font-normal text-staal-tekst">
                optioneel
              </span>
            </label>
            <input
              id="campagne"
              value={campagne}
              onChange={(e) => setCampagne(e.target.value)}
              placeholder="najaar"
              className="data mt-1.5 w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-5">
          <Linkregel label="Jouw samengestelde link" link={samengesteld} />
        </div>
      </div>
    </div>
  );
}
