import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { vereisDashboard } from "@/lib/sessie";
import { magVerkopersBeheren, vereis } from "@/lib/rollen";
import { euro } from "@/lib/pricing";
import { trekVerkoperIn } from "./acties";
import { VerkoperFormulier } from "./formulier";

/** Verkopers aan de deur: wie mag er namens Blusbox verkopen, en hoeveel. */
export default async function VerkopersPagina() {
  const actor = await vereisDashboard();
  vereis(magVerkopersBeheren(actor.rol), "verkopers beheren");

  const verkopers = await db
    .select({
      id: users.id,
      email: users.email,
      naam: users.name,
      verkocht: sql<number>`count(${orders.id}) filter (where ${orders.status} = 'geleverd')::int`,
      omzet: sql<number>`coalesce(sum(${orders.totaalInclBtwCenten}) filter (where ${orders.status} = 'geleverd'), 0)::int`,
      // Wat de verkoper contant ontving en dus nog moet afdragen.
      contant: sql<number>`coalesce(sum(${orders.totaalInclBtwCenten}) filter (where ${orders.status} = 'geleverd' and ${orders.mollieId} like 'contant:%'), 0)::int`,
    })
    .from(users)
    .leftJoin(orders, eq(orders.verkoperId, users.id))
    .where(eq(users.rol, "verkoper"))
    .groupBy(users.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Verkopers</h1>
        <p className="mt-1 max-w-2xl text-sm text-staal-tekst">
          Verkopers aan de deur loggen in op blusbox.nl/account en komen dan op hun verkooppagina. Ze zien
          alleen hun eigen verkopen en kunnen geen prijzen aanpassen. Na elke betaling krijg jij een kopie
          van de factuur; bij contant staat erin wie het geld heeft. <Link href="/verkoop" className="underline underline-offset-4">Zelf een verkoop invoeren →</Link>
        </p>
      </div>
      <VerkoperFormulier />
      {verkopers.length > 0 && (
        <ul className="divide-y divide-railstaal/40 rounded-2xl bg-kastwit">
          {verkopers.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <span>
                <span className="block text-sm font-medium">{v.naam ?? v.email}</span>
                <span className="data text-xs text-staal-tekst">{v.email}</span>
              </span>
              <span className="data text-right text-sm">
                {v.verkocht} verkocht · {euro(v.omzet)}
                {v.contant > 0 && (
                  <span className="block text-xs text-staal-tekst">waarvan contant {euro(v.contant)}</span>
                )}
              </span>
              <form action={trekVerkoperIn}>
                <input type="hidden" name="id" value={v.id} />
                <button type="submit" className="text-xs text-blusrood-op-licht underline underline-offset-4">
                  Toegang intrekken
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
