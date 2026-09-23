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

  const [email, wachtwoord] = process.argv.slice(2).filter((a) => a !== "--vraag");
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

  // Draaien met --vraag laat de connection string hier invoeren in plaats
  // van hem in de opdrachtregel te zetten. Dat scheelt de stap waar het
  // twee keer op misging — de voorbeeldtekst bleef staan en het script
  // schreef vrolijk naar de lokale database — en het houdt het
  // databasewachtwoord uit de shell-geschiedenis.
  if (process.argv.includes("--vraag")) {
    const { vraagVerbinding } = await import("./vraag-verbinding");
    process.env.DATABASE_URL = await vraagVerbinding();
  }

  // Tegen welke database schrijven we? Dit script wordt met een
  // meegegeven DATABASE_URL tegen productie gedraaid, en de meest
  // gemaakte fout is dat die niet doorkomt — dan landt de beheerder
  // ongemerkt in de lokale database en blijft inloggen op de site
  // mislukken. Alleen de host, nooit het wachtwoord uit de URL.
  const { waarWijst } = await import("./vraag-verbinding");
  const bron = process.env.DATABASE_URL ?? "";
  const waar = waarWijst(bron);
  console.log(`Database: ${waar}`);
  if (/^(localhost|127\.0\.0\.1)$/.test(new URL(bron).hostname)) {
    console.log("Let op: dit is de lokale database, niet productie.");
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

  // Terugcontrole. "Wachtwoord ingesteld" is een bewering; dit is een
  // bewijs. Het leest de hash terug langs dezelfde weg als de inlogcode,
  // zodat een mislukte schrijfactie of een afwijkende hash-instelling hier
  // aan het licht komt en niet pas op het inlogscherm.
  const { verifieerWachtwoord } = await import("@/lib/wachtwoord");
  const [terug] = await db
    .select({ hash: credentials.wachtwoordHash })
    .from(credentials)
    .where(eq(credentials.userId, userId))
    .limit(1);

  const klopt = terug ? await verifieerWachtwoord(wachtwoord, terug.hash) : false;
  if (!klopt) {
    console.error("Opgeslagen, maar de controle mislukte. Niet gebruiken.");
    process.exit(1);
  }

  console.log(`Gecontroleerd: inloggen met ${adres} werkt op ${waar}.`);
  process.exit(0);
}

main().catch((fout) => {
  console.error("Aanmaken mislukt:", fout);
  process.exit(1);
});
