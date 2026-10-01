import type { Metadata } from "next";
import { Cel, Leeg, Paneel, Rij, Tabel, Tegel } from "@/components/dashboard/ui";
import { alleCodes } from "@/db/korting";
import { toonPercentage } from "@/lib/korting";
import { formatteerNl } from "@/lib/levensduur";
import { ActiefKnop } from "@/components/dashboard/kortingscode-knop";

export const metadata: Metadata = {
  title: "Kortingscodes",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

/** Zelfde notatie als op de andere beheerpagina's. */
const datum = (d: Date | null) =>
  d ? formatteerNl(d.toISOString().slice(0, 10)) : "geen einddatum";

/**
 * Beheer van de kortingscodes.
 *
 * Aan- en uitzetten kan hier; nieuwe codes maken bewust niet. Eén code
 * aanmaken is zeldzaam en kan in de database, maar een knop ervoor
 * betekent een formulier met percentage, einddatum en maximum, en elk
 * van die velden is een manier om per ongeluk 90% korting live te zetten.
 * Komt er behoefte aan meer acties tegelijk, dan is dat het moment om het
 * formulier wél te bouwen — met een bevestiging op het percentage.
 */
export default async function KortingscodesPagina() {
  const codes = await alleCodes();

  const actief = codes.filter((c) => c.actief);
  const ingewisseld = codes.reduce((som, c) => som + c.aantalGebruikt, 0);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl">Kortingscodes</h1>
        <p className="mt-2 max-w-prose text-sm text-staal-tekst">
          De korting gaat op de stukprijs, vóór de btw. Daardoor loopt hij mee
          in het bedrag dat Stripe int, op de factuur en in de grondslag van de
          affiliatecommissie — een partner verdient dus over wat er
          binnenkomt, niet over de winkelprijs.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Tegel label="Codes" waarde={String(codes.length)} />
        <Tegel label="Actief" waarde={String(actief.length)} />
        <Tegel label="Keer ingewisseld" waarde={String(ingewisseld)} />
      </div>

      <Paneel titel="Alle codes">
        {codes.length === 0 ? (
          <Leeg tekst="Er zijn nog geen kortingscodes." />
        ) : (
          <Tabel
            koppen={[
              "Code",
              "Korting",
              "Geldig tot",
              "Gebruikt",
              "Status",
              "Actie",
            ]}
          >
            {codes.map((c) => (
              <Rij key={c.id}>
                <Cel mono>
                  {c.code.toUpperCase()}
                  {c.omschrijving && (
                    <span className="block font-sans text-xs normal-case text-staal-tekst">
                      {c.omschrijving}
                    </span>
                  )}
                </Cel>
                <Cel mono>{toonPercentage(c.percentageBp)}</Cel>
                <Cel mono>
                  {datum(c.geldigTot)}
                </Cel>
                <Cel mono>
                  {c.aantalGebruikt}
                  {c.maxGebruik !== null && ` / ${c.maxGebruik}`}
                </Cel>
                <Cel mono>{c.actief ? "actief" : "uit"}</Cel>
                <Cel>
                  <ActiefKnop code={c.code} actief={c.actief} />
                </Cel>
              </Rij>
            ))}
          </Tabel>
        )}
      </Paneel>
    </div>
  );
}
