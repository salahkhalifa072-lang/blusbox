"use client";

import { useState } from "react";

/**
 * De bannerset, met kant-en-klare insluitcode.
 *
 * Met een slug erbij (in het dashboard) krijgt elke banner de
 * persoonlijke link van díé affiliate; zonder slug (op de publieke
 * pagina) is het alleen een voorproefje. Zo staat er nergens een
 * voorbeeldcode met een vreemde slug erin die iemand per ongeluk
 * overneemt — dan zou hij commissie voor een ander lopen verdienen.
 *
 * De banners worden door de server getekend en niet als bestand
 * aangeboden. Downloaden kan wel, maar het heeft een nadeel dat de meeste
 * programma's over het hoofd zien: een gedownloade banner bevriest de
 * prijs. Verandert die, dan hangen er overal afbeeldingen met een bedrag
 * dat niet meer klopt. Wie de link gebruikt, heeft dat probleem niet.
 */

const MATEN = [
  {
    formaat: "728x90",
    naam: "Leaderboard",
    gebruik: "Boven of onder een artikel, op een breed scherm.",
  },
  {
    formaat: "300x250",
    naam: "Rechthoek",
    gebruik: "In een zijbalk of middenin een artikel. Meest gebruikt.",
  },
  {
    formaat: "160x600",
    naam: "Wolkenkrabber",
    gebruik: "Smalle zijbalk, loopt mee met de tekst.",
  },
  {
    formaat: "320x100",
    naam: "Mobiel",
    gebruik: "Smalle schermen, tussen twee alinea's.",
  },
] as const;

function Kopieerknop({ waarde, label }: { waarde: string; label: string }) {
  const [staat, setStaat] = useState<"rust" | "ok" | "mislukt">("rust");

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(waarde);
      setStaat("ok");
    } catch {
      setStaat("mislukt");
    }
    setTimeout(() => setStaat("rust"), 2500);
  }

  return (
    <button
      type="button"
      onClick={kopieer}
      aria-live="polite"
      className="data rounded-full border border-antraciet px-3 py-1.5 text-xs transition-colors hover:bg-antraciet hover:text-kastwit"
    >
      {staat === "ok"
        ? "Gekopieerd"
        : staat === "mislukt"
          ? "Selecteer handmatig"
          : label}
    </button>
  );
}

export function Banners({
  slug,
  basisUrl,
}: {
  /** Leeg op de publieke pagina: dan alleen voorbeelden, geen code. */
  slug?: string;
  basisUrl: string;
}) {
  return (
    <div className="space-y-8">
      {MATEN.map((m) => {
        const beeld = `${basisUrl}/api/banner/${m.formaat}`;
        const doel = slug ? `${basisUrl}/r/${slug}` : `${basisUrl}/blusbox`;
        const [b, h] = m.formaat.split("x");

        const code = `<a href="${doel}" target="_blank" rel="noopener sponsored"><img src="${beeld}" width="${b}" height="${h}" alt="Blusbox — automatische blusmodule voor de meterkast" style="border:0;max-width:100%;height:auto"></a>`;

        return (
          <div
            key={m.formaat}
            className="border-t border-railstaal/50 pt-6 first:border-t-0 first:pt-0"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">
                {m.naam}{" "}
                <span className="data ml-1 text-xs text-staal-tekst">
                  {m.formaat}
                </span>
              </p>
            </div>
            <p className="mt-0.5 text-sm text-staal-tekst">{m.gebruik}</p>

            {/* Het echte beeld, op ware grootte tot het scherm te smal
                wordt. Een geschaald voorbeeld liegt over de leesbaarheid. */}
            <div className="mt-4 overflow-x-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={beeld}
                width={Number(b)}
                height={Number(h)}
                alt={`Voorbeeld van de ${m.naam}-banner, ${m.formaat} pixels`}
                className="max-w-full rounded-lg"
                loading="lazy"
              />
            </div>

            {slug ? (
              <div className="mt-4">
                <label
                  htmlFor={`code-${m.formaat}`}
                  className="data text-xs uppercase tracking-widest text-staal-tekst"
                >
                  Code om te plakken
                </label>
                <div className="mt-2 flex flex-wrap items-start gap-3">
                  <textarea
                    id={`code-${m.formaat}`}
                    readOnly
                    rows={3}
                    value={code}
                    onFocus={(e) => e.currentTarget.select()}
                    className="data min-w-0 flex-1 rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-3 py-2 text-[11px] leading-relaxed"
                  />
                  <div className="flex flex-col gap-2">
                    <Kopieerknop waarde={code} label="Kopieer code" />
                    <Kopieerknop waarde={beeld} label="Kopieer beeld-URL" />
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-staal-tekst">
                Na goedkeuring staat hier de code met jouw eigen link erin.
              </p>
            )}
          </div>
        );
      })}

      <p className="border-t border-railstaal/50 pt-5 text-xs leading-relaxed text-staal-tekst">
        De banners worden door ons getekend en bij elke weergave opgehaald.
        Verandert de prijs, dan verandert hij overal mee — je hoeft niets te
        vervangen. Sla ze dus niet op als bestand; dan bevriest het bedrag.
        {" "}
        <span className="block pt-2">
          De <span className="data">rel=&quot;sponsored&quot;</span> in de code
          hoort erbij: die vertelt zoekmachines dat het om een betaalde
          verwijzing gaat. Dat is niet alleen netjes maar ook wat Google
          verwacht, en het voorkomt dat jouw site erop wordt aangekeken.
        </span>
      </p>
    </div>
  );
}
