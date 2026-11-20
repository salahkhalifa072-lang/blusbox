import { config } from "dotenv";
import { eq } from "drizzle-orm";

/**
 * Noodknop: tweestapsverificatie uitzetten voor één account.
 *
 *   npm run db:tweestaps-uit -- admin@blusbox.nl            (lokaal)
 *   npm run db:tweestaps-uit:prod -- admin@blusbox.nl       (vraagt de productie-URL)
 *
 * Voor wie zijn telefoon én zijn herstelcodes kwijt is. Wie bij de database
 * kan, kan dit sowieso; de site zelf biedt geen omweg zonder code.
 */
async function main() {
  config({ path: [".env.local", ".env"], quiet: true });

  const [email] = process.argv.slice(2).filter((a) => a !== "--vraag");
  if (!email) {
    console.error("Gebruik: npm run db:tweestaps-uit -- <e-mail>");
    process.exit(1);
  }

  if (process.argv.includes("--vraag")) {
    const { vraagVerbinding } = await import("./vraag-verbinding");
    process.env.DATABASE_URL = await vraagVerbinding();
  }
  const { waarWijst } = await import("./vraag-verbinding");
  console.log(`Database: ${waarWijst(process.env.DATABASE_URL ?? "")}`);

  const { db } = await import("./index");
  const { users } = await import("./schema");
  const { tweestaps } = await import("./auth-schema");

  const [gebruiker] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);
  if (!gebruiker) {
    console.error(`Geen account met ${email}.`);
    process.exit(1);
  }

  const weg = await db
    .delete(tweestaps)
    .where(eq(tweestaps.userId, gebruiker.id))
    .returning({ id: tweestaps.userId });
  console.log(
    weg.length > 0
      ? `Tweestapsverificatie uitgezet voor ${email}. Log in met alleen het wachtwoord en zet het daarna opnieuw aan.`
      : `${email} had geen tweestapsverificatie.`,
  );
  process.exit(0);
}

main().catch((fout) => {
  console.error("Mislukt:", fout);
  process.exit(1);
});
