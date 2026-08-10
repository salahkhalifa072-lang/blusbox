import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { hashWachtwoord, wachtwoordProblemen } from "@/lib/wachtwoord";

/**
 * Creates or updates an admin account.
 *
 *   npm run db:admin -- admin@blusbox.nl 'een lang wachtwoord'
 *
 * The password is read from argv rather than hard-coded, so no default
 * credential can ever ship. Run it again with the same e-mail to reset.
 */
async function main() {
  config({ path: [".env.local", ".env"], quiet: true });

  const [email, wachtwoord] = process.argv.slice(2);
  if (!email || !wachtwoord) {
    console.error(
      "Gebruik: npm run db:admin -- <e-mail> <wachtwoord>\n" +
        "Bijvoorbeeld: npm run db:admin -- admin@blusbox.nl 'kies iets lang'",
    );
    process.exit(1);
  }

  const problemen = wachtwoordProblemen(wachtwoord);
  if (problemen.length > 0) {
    console.error("Wachtwoord voldoet niet:", problemen.join(" "));
    process.exit(1);
  }

  const { db } = await import("./index");
  const { users } = await import("./schema");
  const { credentials } = await import("./auth-schema");

  const adres = email.trim().toLowerCase();
  const hash = await hashWachtwoord(wachtwoord);

  const [bestaand] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, adres))
    .limit(1);

  let userId: string;
  if (bestaand) {
    await db
      .update(users)
      .set({ rol: "admin", aanspreekvorm: "u" })
      .where(eq(users.id, bestaand.id));
    userId = bestaand.id;
    console.log(`Bestaand account bijgewerkt naar admin: ${adres}`);
  } else {
    const [nieuw] = await db
      .insert(users)
      .values({
        email: adres,
        name: "Beheerder",
        rol: "admin",
        aanspreekvorm: "u",
        emailVerified: new Date(),
      })
      .returning({ id: users.id });
    userId = nieuw.id;
    console.log(`Adminaccount aangemaakt: ${adres}`);
  }

  await db
    .insert(credentials)
    .values({ userId, wachtwoordHash: hash })
    .onConflictDoUpdate({
      target: credentials.userId,
      set: { wachtwoordHash: hash, bijgewerktOp: new Date() },
    });

  console.log("Wachtwoord ingesteld. Inloggen kan via /account.");
  process.exit(0);
}

main().catch((fout) => {
  console.error("Aanmaken mislukt:", fout);
  process.exit(1);
});
