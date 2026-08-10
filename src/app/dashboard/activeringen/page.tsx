import { activeringenLijst } from "@/db/dashboard";
import { Cel, Leeg, Paneel, Rij, Tabel } from "@/components/dashboard/ui";
import { formatteerNl } from "@/lib/levensduur";

export const dynamic = "force-dynamic";

export default async function ActiveringenPagina() {
  const activeringen = await activeringenLijst(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Activeringen</h1>
        <p className="mt-1 max-w-2xl text-sm text-staal-tekst">
          Elke gemelde inzet in het veld. Dit register is op termijn de enige
          praktijkdata die er in deze niche bestaat — en het beste
          verkoopargument richting zakelijke afnemers.
        </p>
      </div>

      <Paneel titel="Meldingen">
        {activeringen.length === 0 ? (
          <Leeg tekst="Nog geen activeringen gemeld." />
        ) : (
          <Tabel
            koppen={["Datum", "Lot", "Locatie", "Postcode", "Oorzaak", "Afloop"]}
          >
            {activeringen.map((a) => (
              <Rij key={a.id}>
                <Cel mono>
                  {formatteerNl(a.gebeurdOp.toISOString().slice(0, 10))}
                </Cel>
                <Cel mono>{a.lotNummer}</Cel>
                <Cel>{a.locatieType.replace(/_/g, " ")}</Cel>
                <Cel mono>{a.postcode ?? "—"}</Cel>
                <Cel>{a.oorzaak ?? "—"}</Cel>
                <Cel>{a.afloop ?? "—"}</Cel>
              </Rij>
            ))}
          </Tabel>
        )}
      </Paneel>
    </div>
  );
}
