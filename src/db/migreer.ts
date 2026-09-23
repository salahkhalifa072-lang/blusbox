import { config } from "dotenv";
import { vraagVerbinding, waarWijst } from "./vraag-verbinding";

/**
 * Migraties uitvoeren op een database die je bij het draaien opgeeft.
 *
 *   npm run db:migrate:prod
 *
 * Bestaat omdat de build op Vercel geen migratiestap heeft: `next build`
 * zet de code neer, niet het schema. Zonder dit draait er dus nieuwe code
 * tegen een oude tabel, en dat merk je pas als een kolom ontbreekt.
 *
 * Drizzle houdt zelf bij wat al gedraaid heeft, dus twee keer uitvoeren is
 * ongevaarlijk — de tweede keer doet niets.
 */
async function main() {
  config({ path: [".env.local", ".env"], quiet: true });
  process.env.DATABASE_URL = await vraagVerbinding();

  const waar = waarWijst(process.env.DATABASE_URL);
  console.log(`Database: ${waar}`);
  if (/^(localhost|127\.0\.0\.1)$/.test(new URL(process.env.DATABASE_URL).hostname)) {
    console.log("Let op: dit is de lokale database, niet productie.");
  }

  const postgres = (await import("postgres")).default;
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");

  // max: 1 — een migratie hoort over één verbinding te lopen, anders kan
  // een tweede verbinding halverwege een half gemigreerd schema zien.
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
  await sql.end();

  console.log(`Migraties uitgevoerd op ${waar}.`);
  process.exit(0);
}

main().catch((fout) => {
  console.error("Migreren mislukt:", String(fout).slice(0, 500));
  process.exit(1);
});
