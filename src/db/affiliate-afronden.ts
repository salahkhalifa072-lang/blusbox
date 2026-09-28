import { config } from "dotenv";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { vraagVerbinding, waarWijst } from "./vraag-verbinding";

/**
 * Maakt de affiliate-migratie af.
 *
 *   npm run db:affiliate:afronden
 *
 * Bestaat omdat migratie 0006 op productie in delen is toegepast via de
 * Neon-console: de tabellen, de kolom, het rol-type en alle indexen staan
 * er, maar de foreign keys niet, en de migratie is niet geregistreerd.
 *
 * Alles hieronder is idempotent. Een constraint die er al staat wordt
 * overgeslagen in plaats van een fout te geven, zodat dit script ook
 * gedraaid kan worden tegen een database waar de migratie wél netjes is
 * gedraaid — dan doet het niets.
 *
 * Draai dit één keer tegen productie. Daarna is `npm run db:migrate:prod`
 * weer de normale weg voor toekomstige migraties.
 */

type Sleutel = {
  tabel: string;
  naam: string;
  kolom: string;
  doelTabel: string;
  bijVerwijderen: "cascade" | "restrict" | "set null";
};

const SLEUTELS: Sleutel[] = [
  { tabel: "affiliates", naam: "affiliates_user_id_users_id_fk", kolom: "user_id", doelTabel: "users", bijVerwijderen: "cascade" },

  { tabel: "affiliate_attributies", naam: "affiliate_attributies_order_id_orders_id_fk", kolom: "order_id", doelTabel: "orders", bijVerwijderen: "cascade" },
  { tabel: "affiliate_attributies", naam: "affiliate_attributies_affiliate_id_affiliates_id_fk", kolom: "affiliate_id", doelTabel: "affiliates", bijVerwijderen: "restrict" },
  { tabel: "affiliate_attributies", naam: "affiliate_attributies_klik_id_affiliate_klikken_id_fk", kolom: "klik_id", doelTabel: "affiliate_klikken", bijVerwijderen: "set null" },

  { tabel: "affiliate_auditlog", naam: "affiliate_auditlog_actor_user_id_users_id_fk", kolom: "actor_user_id", doelTabel: "users", bijVerwijderen: "set null" },
  { tabel: "affiliate_auditlog", naam: "affiliate_auditlog_affiliate_id_affiliates_id_fk", kolom: "affiliate_id", doelTabel: "affiliates", bijVerwijderen: "set null" },
  { tabel: "affiliate_auditlog", naam: "affiliate_auditlog_commissie_id_affiliate_commissies_id_fk", kolom: "commissie_id", doelTabel: "affiliate_commissies", bijVerwijderen: "set null" },

  { tabel: "affiliate_commissies", naam: "affiliate_commissies_order_id_orders_id_fk", kolom: "order_id", doelTabel: "orders", bijVerwijderen: "restrict" },
  { tabel: "affiliate_commissies", naam: "affiliate_commissies_affiliate_id_affiliates_id_fk", kolom: "affiliate_id", doelTabel: "affiliates", bijVerwijderen: "restrict" },

  { tabel: "affiliate_klikken", naam: "affiliate_klikken_affiliate_id_affiliates_id_fk", kolom: "affiliate_id", doelTabel: "affiliates", bijVerwijderen: "cascade" },
  { tabel: "affiliate_klikken", naam: "affiliate_klikken_link_id_affiliate_links_id_fk", kolom: "link_id", doelTabel: "affiliate_links", bijVerwijderen: "set null" },

  { tabel: "affiliate_links", naam: "affiliate_links_affiliate_id_affiliates_id_fk", kolom: "affiliate_id", doelTabel: "affiliates", bijVerwijderen: "cascade" },

  { tabel: "affiliate_uitbetalingen", naam: "affiliate_uitbetalingen_affiliate_id_affiliates_id_fk", kolom: "affiliate_id", doelTabel: "affiliates", bijVerwijderen: "restrict" },

  // Deze twee namen kapt Postgres af op 63 tekens; ze blijven uniek maar
  // de afgekapte vorm is wat er uiteindelijk in pg_constraint staat.
  { tabel: "affiliate_uitbetaling_regels", naam: "affiliate_uitbetaling_regels_uitbetaling_id_affiliate_uitbetali", kolom: "uitbetaling_id", doelTabel: "affiliate_uitbetalingen", bijVerwijderen: "cascade" },
  { tabel: "affiliate_uitbetaling_regels", naam: "affiliate_uitbetaling_regels_commissie_id_affiliate_commissies_", kolom: "commissie_id", doelTabel: "affiliate_commissies", bijVerwijderen: "restrict" },

  { tabel: "affiliate_voorwaarden_acceptatie", naam: "affiliate_voorwaarden_acceptatie_affiliate_id_affiliates_id_fk", kolom: "affiliate_id", doelTabel: "affiliates", bijVerwijderen: "cascade" },
];

async function main() {
  config({ path: [".env.local", ".env"], quiet: true });
  process.env.DATABASE_URL = await vraagVerbinding();

  const waar = waarWijst(process.env.DATABASE_URL);
  console.log(`Database: ${waar}\n`);

  const postgres = (await import("postgres")).default;
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });

  let toegevoegd = 0;
  let aanwezig = 0;

  for (const s of SLEUTELS) {
    const [bestaat] = await sql<{ n: number }[]>`
      SELECT count(*)::int AS n FROM pg_constraint
      WHERE conname = ${s.naam}`;

    if ((bestaat?.n ?? 0) > 0) {
      aanwezig++;
      continue;
    }

    // Identifiers kunnen niet als parameter mee, dus ze worden hier
    // samengevoegd. Ze komen uit de lijst hierboven en niet van buiten;
    // er is geen invoer van een gebruiker bij betrokken.
    await sql.unsafe(
      `ALTER TABLE "${s.tabel}" ADD CONSTRAINT "${s.naam}" ` +
        `FOREIGN KEY ("${s.kolom}") REFERENCES "public"."${s.doelTabel}"("id") ` +
        `ON DELETE ${s.bijVerwijderen}`,
    );
    console.log(`  toegevoegd: ${s.naam.slice(0, 60)}`);
    toegevoegd++;
  }

  console.log(
    `\nForeign keys: ${toegevoegd} toegevoegd, ${aanwezig} stonden er al.`,
  );

  // De migratie registreren, zodat db:migrate:prod hem niet opnieuw
  // probeert toe te passen op tabellen die al bestaan.
  const bestand = readFileSync("drizzle/0006_affiliateprogramma.sql", "utf8");
  const hash = createHash("sha256").update(bestand).digest("hex");

  const [al] = await sql<{ n: number }[]>`
    SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations WHERE hash = ${hash}`;

  if ((al?.n ?? 0) > 0) {
    console.log("Migratie stond al geregistreerd.");
  } else {
    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${Date.now()})`;
    console.log("Migratie 0006 geregistreerd.");
  }

  const [tabellen] = await sql<{ n: number }[]>`
    SELECT count(*)::int AS n FROM information_schema.tables
    WHERE table_schema = 'public'
      AND (table_name LIKE 'affiliate%' OR table_name = 'verwerkte_webhooks')`;
  const [unieke] = await sql<{ n: number }[]>`
    SELECT count(*)::int AS n FROM pg_indexes
    WHERE schemaname = 'public' AND indexname LIKE '%uniek'`;

  await sql.end();

  console.log(`\nControle op ${waar}:`);
  console.log(`  tabellen        ${tabellen.n} (verwacht 11)`);
  console.log(`  unieke indexen  ${unieke.n}`);
  console.log(
    tabellen.n === 11 ? "\nHet affiliateschema is compleet." : "\nLet op: tabelaantal wijkt af.",
  );
  process.exit(0);
}

main().catch((fout) => {
  console.error("Afronden mislukt:", String(fout).slice(0, 500));
  process.exit(1);
});
