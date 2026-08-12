import { bestellingenLijst } from "@/db/dashboard";
import { Cel, Leeg, Paneel, Rij, Status, Tabel } from "@/components/dashboard/ui";
import { euro } from "@/lib/pricing";
import { formatteerNl } from "@/lib/levensduur";
import { Afhandelen } from "./afhandelen";

export const dynamic = "force-dynamic";

export default async function BestellingenPagina() {
  const bestellingen = await bestellingenLijst(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Bestellingen</h1>
        <p className="mt-1 max-w-2xl text-sm text-staal-tekst">
          {bestellingen.length} bestellingen, nieuwste eerst. Op geleverd
          zetten start de bedenktijd van veertien dagen; de klant krijgt dan
          per mail de einddatum.
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
              "Afhandeling",
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
                <Cel>
                  <Afhandelen
                    ordernummer={b.ordernummer}
                    status={b.status}
                    verzonden={b.verzondenOp !== null}
                    geleverd={b.geleverdOp !== null}
                  />
                </Cel>
              </Rij>
            ))}
          </Tabel>
        )}
      </Paneel>
    </div>
  );
}
