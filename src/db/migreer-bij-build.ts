/**
 * Migraties als stap in de build op Vercel.
 *
 * Zonder dit gaat nieuwe code live tegen een oud schema: de eerste query
 * die een nieuwe kolom noemt faalt, en bij de webhook betekent dat een
 * betaalde bestelling zonder bevestigingsmail. Hier draait het schema mee
 * vóórdat `next build` begint, en faalt de build als dat misgaat — dan
 * blijft de vorige versie gewoon online.
 *
 * Alleen op Vercel (VERCEL=1). Een lokale `npm run build` raakt geen
 * database; daarvoor is `npm run db:migrate` of `db:migrate:prod`.
 *
 * Previews hebben elk een eigen Neon-branch, dus een preview migreert zijn
 * eigen kopie en nooit productie. Drizzle houdt bij wat al gedraaid heeft;
 * een tweede keer doet niets.
 */
async function main() {
  if (process.env.VERCEL !== "1") {
    console.log("Geen Vercel-build: migraties overgeslagen.");
    return;
  }

  // De directe verbinding als die er is: de pooler van Neon is bedoeld
  // voor korte queries, een migratie hoort over één vaste verbinding.
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL ontbreekt; zonder schema-update niet bouwen.");
    process.exit(1);
  }

  const postgres = (await import("postgres")).default;
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");

  // onnotice stil: "schema bestaat al" bij elke build is ruis in de log.
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
    console.log(`Migraties bijgewerkt op ${new URL(url).hostname}.`);
  } finally {
    await sql.end();
  }
}

main().catch((fout) => {
  console.error("Migreren mislukt:", String(fout).slice(0, 500));
  process.exit(1);
});
