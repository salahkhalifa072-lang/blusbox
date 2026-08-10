import { recallsLijst } from "@/db/dashboard";
import { Cel, Leeg, Paneel, Rij, Tabel } from "@/components/dashboard/ui";
import { formatteerNl } from "@/lib/levensduur";
import { vereisDashboard } from "@/lib/sessie";
import { magRecallOpenen } from "@/lib/rollen";
import { sluitRecall } from "../lots/acties";

export const dynamic = "force-dynamic";

export default async function RecallsPagina() {
  const actor = await vereisDashboard();
  const recalls = await recallsLijst();
  const magSluiten = magRecallOpenen(actor.rol);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Recalls</h1>
        <p className="mt-1 max-w-2xl text-sm text-staal-tekst">
          Per recall staat vast wie is aangeschreven en wie heeft bevestigd.
          Sluit een recall pas als iedereen is afgehandeld.
        </p>
      </div>

      <Paneel titel="Terugroepacties">
        {recalls.length === 0 ? (
          <Leeg tekst="Geen recalls. Dat is het doel." />
        ) : (
          <Tabel
            koppen={[
              "Lot",
              "Reden",
              "Geopend",
              "Aangeschreven",
              "Bevestigd",
              "Status",
            ]}
          >
            {recalls.map((r) => (
              <Rij key={r.id}>
                <Cel mono>{r.lotNummer}</Cel>
                <Cel>{r.reden}</Cel>
                <Cel mono>
                  {formatteerNl(r.geopendOp.toISOString().slice(0, 10))}
                </Cel>
                <Cel mono>{r.aangeschreven}</Cel>
                <Cel mono>
                  {r.bevestigd} / {r.aangeschreven}
                </Cel>
                <Cel>
                  {r.geslotenOp ? (
                    <span className="data text-xs text-staal-tekst">
                      gesloten {formatteerNl(r.geslotenOp.toISOString().slice(0, 10))}
                    </span>
                  ) : magSluiten ? (
                    <form action={sluitRecall}>
                      <input type="hidden" name="recallId" value={r.id} />
                      <button
                        type="submit"
                        className="data rounded-full border border-antraciet px-3 py-1 text-xs transition-colors hover:bg-antraciet hover:text-kastwit"
                      >
                        Sluiten
                      </button>
                    </form>
                  ) : (
                    <span className="data text-xs text-staal-tekst">open</span>
                  )}
                </Cel>
              </Rij>
            ))}
          </Tabel>
        )}
      </Paneel>
    </div>
  );
}
