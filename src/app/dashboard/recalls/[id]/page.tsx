import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lots, recalls } from "@/db/schema";
import { recallOntvangersLijst } from "@/db/dashboard";
import { Cel, Leeg, Paneel, Rij, Tabel } from "@/components/dashboard/ui";
import { formatteerNl } from "@/lib/levensduur";
import { vereisDashboard } from "@/lib/sessie";
import { magRecallOpenen } from "@/lib/rollen";
import { HandBevestiging } from "./hand-bevestiging";

export const dynamic = "force-dynamic";

/**
 * §9.2 één terugroepactie, afnemer voor afnemer.
 *
 * Bestaat omdat een recall pas dicht kan als iedereen is afgehandeld, en
 * "afgehandeld" niet alleen betekent dat iemand op de knop in de mail heeft
 * gedrukt. Wie belt of terugschrijft moet hier met de hand afgevinkt kunnen
 * worden, anders blijft de actie eeuwig openstaan op mensen die allang
 * gereageerd hebben.
 */

const datum = (d: Date | null) =>
  d ? formatteerNl(d.toISOString().slice(0, 10)) : "—";

export default async function RecallDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await vereisDashboard();

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) notFound();

  const [recall] = await db
    .select({
      id: recalls.id,
      reden: recalls.reden,
      geopendOp: recalls.geopendOp,
      geslotenOp: recalls.geslotenOp,
      lotNummer: lots.lotNummer,
    })
    .from(recalls)
    .innerJoin(lots, eq(lots.id, recalls.lotId))
    .where(eq(recalls.id, id))
    .limit(1);

  if (!recall) notFound();

  const ontvangers = await recallOntvangersLijst(recall.id);
  const magBevestigen = magRecallOpenen(actor.rol);

  const bevestigd = ontvangers.filter((o) => o.bevestigdOp !== null).length;
  const verzonden = ontvangers.filter((o) => o.verzondenOp !== null).length;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/recalls"
          className="data text-xs text-staal-tekst underline underline-offset-4 hover:text-antraciet"
        >
          ← Alle recalls
        </Link>
        {/* Geen "Lot {lotNummer}": lotnummers beginnen zelf al met LOT-. */}
        <h1 className="font-display mt-2 text-3xl">Terugroepactie</h1>
        <p className="data mt-1 text-lg">{recall.lotNummer}</p>
        <p className="mt-2 max-w-2xl text-sm text-staal-tekst">
          {recall.reden}
        </p>
        <p className="data mt-2 text-xs text-staal-tekst">
          Geopend {datum(recall.geopendOp)}
          {recall.geslotenOp ? ` · gesloten ${datum(recall.geslotenOp)}` : null}
          {" · "}
          {verzonden}/{ontvangers.length} bericht verstuurd
          {" · "}
          {bevestigd}/{ontvangers.length} bevestigd
        </p>
      </div>

      <Paneel titel="Afnemers">
        {ontvangers.length === 0 ? (
          <Leeg tekst="Geen afnemers bij deze recall." />
        ) : (
          <Tabel
            koppen={[
              "E-mailadres",
              "Bericht verstuurd",
              "Bevestigd",
              "Actie",
            ]}
          >
            {ontvangers.map((o) => (
              <Rij key={o.id}>
                <Cel mono>{o.email}</Cel>
                <Cel mono>{datum(o.verzondenOp)}</Cel>
                <Cel mono>{datum(o.bevestigdOp)}</Cel>
                <Cel>
                  {o.bevestigdOp ? (
                    <span className="data text-xs text-staal-tekst">
                      afgehandeld
                    </span>
                  ) : magBevestigen ? (
                    <HandBevestiging noticeId={o.id} email={o.email} />
                  ) : (
                    <span className="data text-xs text-staal-tekst">—</span>
                  )}
                </Cel>
              </Rij>
            ))}
          </Tabel>
        )}
      </Paneel>

      {bevestigd < ontvangers.length && !recall.geslotenOp ? (
        <p className="text-sm text-staal-tekst">
          Er staan nog {ontvangers.length - bevestigd} afnemers open. Sluit de
          recall pas als iedereen is bereikt — desnoods telefonisch, en vink
          hier af wie heeft gereageerd.
        </p>
      ) : null}
    </div>
  );
}
