import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { catalogus } from "@/lib/catalogus";

/**
 * Seed the catalogue. Idempotent: re-running updates existing rows by slug
 * rather than inserting duplicates, so it is safe to run against
 * production. Run with:  npm run db:seed
 *
 * The database module is imported dynamically because static imports are
 * hoisted above every statement — including the dotenv call — so a
 * top-level import would evaluate before DATABASE_URL exists.
 */
async function main() {
  config({ path: [".env.local", ".env"], quiet: true });

  const { db } = await import("./index");
  const { products } = await import("./schema");

  console.log("Catalogus synchroniseren…");

  for (const item of catalogus) {
    const [bestaand] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, item.slug))
      .limit(1);

    const waarden = {
      slug: item.slug,
      naam: item.naam,
      omschrijving: item.omschrijving,
      prijsExclBtwCenten: item.prijsExclBtwCenten,
      btwPercentage: item.btwPercentage,
      gevaarlijkeGoederen: item.gevaarlijkeGoederen,
      unNummer: item.unNummer,
      adrKlasse: item.adrKlasse,
      actief: item.actief,
    };

    if (bestaand) {
      await db.update(products).set(waarden).where(eq(products.id, bestaand.id));
      console.log(`  bijgewerkt : ${item.slug}`);
    } else {
      await db.insert(products).values(waarden);
      console.log(`  toegevoegd : ${item.slug}`);
    }
  }

  const rijen = await db.select({ slug: products.slug }).from(products);
  console.log(`\nKlaar. ${rijen.length} producten in de catalogus.`);
  process.exit(0);
}

main().catch((fout) => {
  console.error("Seeden mislukt:", fout);
  process.exit(1);
});
