import { retourenLijst } from "@/db/dashboard";
import { Cel, Leeg, Paneel, Rij, Status, Tabel } from "@/components/dashboard/ui";
import { formatteerNl } from "@/lib/levensduur";

export const dynamic = "force-dynamic";

export default async function RetourenPagina() {
  const retouren = await retourenLijst();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Retouren</h1>
        <p className="mt-1 max-w-2xl text-sm text-staal-tekst">
          Of de aanvraag binnen de bedenktijd van veertien dagen viel, is
          vastgelegd op het moment van aanvragen en verandert niet meer.
        </p>
      </div>

      <Paneel titel="Aanvragen">
        {retouren.length === 0 ? (
          <Leeg tekst="Nog geen retouraanvragen." />
        ) : (
          <Tabel
            koppen={["Bestelnummer", "Status", "Binnen termijn", "Reden", "Aangevraagd"]}
          >
            {retouren.map((r) => (
              <Rij key={r.id}>
                <Cel mono>{r.ordernummer}</Cel>
                <Cel>
                  <Status waarde={r.status} />
                </Cel>
                <Cel mono>{r.binnenTermijn ? "ja" : "nee"}</Cel>
                <Cel>{r.reden ?? "—"}</Cel>
                <Cel mono>
                  {formatteerNl(r.aangevraagdOp.toISOString().slice(0, 10))}
                </Cel>
              </Rij>
            ))}
          </Tabel>
        )}
      </Paneel>
    </div>
  );
}
