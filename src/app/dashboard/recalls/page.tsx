import { recallsLijst } from "@/db/dashboard";
import { Cel, Leeg, Paneel, Rij, Tabel } from "@/components/dashboard/ui";
import { formatteerNl } from "@/lib/levensduur";
import { vereisDashboard } from "@/lib/sessie";
import { magRecallOpenen } from "@/lib/rollen";
import Link from "next/link";
import { sluitRecall } from "../lots/acties";
import { Verzendknop } from "./verzendknop";

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
          Per recall staat vast wie is aangeschreven, wie bericht heeft
          gekregen en wie heeft bevestigd. Klik op een lotnummer voor de
          afnemers erachter. Versturen is een aparte handeling:
          de lijst wordt bij het openen vastgelegd, zodat een storing bij de
          mailprovider hem niet kan kwijtmaken. Sluit een recall pas als
          iedereen is afgehandeld.
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
              "Verstuurd",
              "Bevestigd",
              "Versturen",
              "Status",
            ]}
          >
            {recalls.map((r) => (
              <Rij key={r.id}>
                <Cel>
                  <Link
                    href={`/dashboard/recalls/${r.id}`}
                    className="data underline underline-offset-4 hover:text-blusrood-op-licht"
                  >
                    {r.lotNummer}
                  </Link>
                </Cel>
                <Cel>{r.reden}</Cel>
                <Cel mono>
                  {formatteerNl(r.geopendOp.toISOString().slice(0, 10))}
                </Cel>
                <Cel mono>{r.aangeschreven}</Cel>
                <Cel mono>
                  {r.verzonden} / {r.aangeschreven}
                </Cel>
                <Cel mono>
                  {r.bevestigd} / {r.aangeschreven}
                </Cel>
                <Cel>
                  {r.geslotenOp || !magSluiten ? (
                    <span className="data text-xs text-staal-tekst">—</span>
                  ) : (
                    <Verzendknop
                      recallId={r.id}
                      openstaand={r.aangeschreven - r.verzonden}
                    />
                  )}
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
