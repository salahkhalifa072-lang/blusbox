import { lotsLijst } from "@/db/dashboard";
import { Cel, Leeg, Paneel, Rij, Tabel } from "@/components/dashboard/ui";
import { formatteerNl } from "@/lib/levensduur";
import { vereisDashboard } from "@/lib/sessie";
import { magRecallOpenen } from "@/lib/rollen";
import { RecallFormulier } from "./recall-formulier";

export const dynamic = "force-dynamic";

export default async function LotsPagina() {
  const actor = await vereisDashboard();
  const lots = await lotsLijst();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Lotregister</h1>
        <p className="mt-1 max-w-2xl text-sm text-staal-tekst">
          Elke unit is herleidbaar tot een productiepartij. Vanuit een
          lotnummer kun je in één handeling de afnemerslijst genereren.
        </p>
      </div>

      <Paneel titel="Partijen">
        {lots.length === 0 ? (
          <Leeg tekst="Nog geen lots vastgelegd." />
        ) : (
          <Tabel
            koppen={[
              "Lotnummer",
              "Product",
              "Productie",
              "Aantal",
              "Geleverd",
              "Geregistreerd",
              "Leverancier",
              "Documenten",
            ]}
          >
            {lots.map((l) => (
              <Rij key={l.id}>
                <Cel mono>
                  {l.lotNummer}
                  {l.openRecall ? (
                    <span className="data ml-2 rounded-full border border-blusrood-op-licht px-2 py-0.5 text-[10px] text-blusrood-op-licht">
                      recall
                    </span>
                  ) : null}
                </Cel>
                <Cel mono>{l.productSlug}</Cel>
                <Cel mono>{formatteerNl(l.productiedatum)}</Cel>
                <Cel mono>{l.aantal}</Cel>
                <Cel mono>{l.geleverd}</Cel>
                <Cel mono>{l.geregistreerd}</Cel>
                <Cel>{l.leverancier ?? "—"}</Cel>
                <Cel mono>
                  {[l.testrapportRef, l.docRef].filter(Boolean).join(" · ") ||
                    "—"}
                </Cel>
              </Rij>
            ))}
          </Tabel>
        )}
      </Paneel>

      {/* §9.7: only admin may open a recall; operations sees why not. */}
      {magRecallOpenen(actor.rol) ? (
        <Paneel titel="Recall openen">
          <RecallFormulier lotNummers={lots.map((l) => l.lotNummer)} />
        </Paneel>
      ) : (
        <Paneel titel="Recall openen">
          <Leeg tekst="Alleen een beheerder kan een recall openen. Neem contact op met de beheerder." />
        </Paneel>
      )}
    </div>
  );
}
