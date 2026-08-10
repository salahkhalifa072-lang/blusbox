import { bestellingenLijst } from "@/db/dashboard";
import { Cel, Leeg, Paneel, Rij, Status, Tabel } from "@/components/dashboard/ui";
import { euro } from "@/lib/pricing";
import { formatteerNl } from "@/lib/levensduur";

export const dynamic = "force-dynamic";

export default async function BestellingenPagina() {
  const bestellingen = await bestellingenLijst(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Bestellingen</h1>
        <p className="mt-1 text-sm text-staal-tekst">
          {bestellingen.length} bestellingen, nieuwste eerst.
        </p>
      </div>

      <Paneel titel="Alle bestellingen">
        {bestellingen.length === 0 ? (
          <Leeg tekst="Nog geen bestellingen." />
        ) : (
          <Tabel
            koppen={[
              "Bestelnummer",
              "Status",
              "E-mail",
              "Bezorging",
              "Totaal",
              "Geplaatst",
            ]}
          >
            {bestellingen.map((b) => (
              <Rij key={b.id}>
                <Cel mono>{b.ordernummer}</Cel>
                <Cel>
                  <Status waarde={b.status} />
                </Cel>
                <Cel>{b.email || "—"}</Cel>
                <Cel mono>
                  {[b.postcode, b.landcode].filter(Boolean).join(" · ") || "—"}
                </Cel>
                <Cel mono>{euro(b.totaalCenten)}</Cel>
                <Cel mono>
                  {formatteerNl(b.geplaatstOp.toISOString().slice(0, 10))}
                </Cel>
              </Rij>
            ))}
          </Tabel>
        )}
      </Paneel>
    </div>
  );
}
