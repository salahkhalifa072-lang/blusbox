/**
 * Vraagt de connection string op bij het uitvoeren in plaats van hem in de
 * opdrachtregel te laten plakken.
 *
 * Twee redenen. Een commando dat je eerst moet bewerken gaat fout — bij het
 * instellen van het beheerderswachtwoord bleef de voorbeeldtekst twee keer
 * staan, waarna het script naar de lokale database schreef en inloggen op
 * de site bleef mislukken zonder dat er iets op een fout leek. En een
 * connection string bevat het databasewachtwoord, dat hoort niet in de
 * terugscroll van een terminal of in de shell-geschiedenis.
 */
export async function vraagVerbinding(): Promise<string> {
  const readline = await import("node:readline/promises");
  const { Writable } = await import("node:stream");

  let verbergen = false;
  const uit = new Writable({
    write(brok, _codering, klaar) {
      if (!verbergen) process.stdout.write(brok);
      klaar();
    },
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: uit,
    terminal: true,
  });

  process.stdout.write("Plak de connection string (invoer blijft onzichtbaar): ");
  verbergen = true;
  const ingevoerd = (await rl.question("")).trim();
  verbergen = false;
  rl.close();
  process.stdout.write("\n");

  if (!ingevoerd) {
    console.error("Niets ingevoerd. Niets gedaan.");
    process.exit(1);
  }
  return ingevoerd;
}

/** Host en databasenaam uit een connection string, zonder de inloggegevens. */
export function waarWijst(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}`;
  } catch {
    console.error("DATABASE_URL is geen geldige URL. Niets gedaan.");
    process.exit(1);
  }
}
