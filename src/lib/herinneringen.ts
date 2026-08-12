import { herinneringsOntvangers, markeerHerinnering } from "@/db/queries";
import {
  achterhaaldeHerinneringen,
  verschuldigdeHerinnering,
  type IsoDatum,
} from "@/lib/levensduur";
import { stuurVervangingsherinnering } from "@/lib/mail";
import type { Actor } from "@/db/queries";

/**
 * §9.3 de herinneringsronde.
 *
 * Wordt één keer per dag aangeroepen. Per unit bepaalt
 * `verschuldigdeHerinnering` welke van de drie aan de beurt is: de
 * dringendste termijn die al gepasseerd is. Iemand die zijn module pas na
 * negen jaar registreert krijgt daarmee één bericht dat klopt, in plaats van
 * drie waarvan er twee de verkeerde termijn noemen.
 *
 * Draait bewust sequentieel: Resend kent een snelheidslimiet en dit is werk
 * dat 's nachts loopt, dus haast is niet nodig. Een adres dat het niet doet
 * wordt niet gestempeld en komt de volgende ronde vanzelf terug.
 */

export type RondeResultaat = {
  bekeken: number;
  verstuurd: number;
  mislukt: number;
  problemen: { email: string; reden: string }[];
};

/** Het systeem zelf is de actor; dit draait zonder ingelogde gebruiker. */
const SYSTEEM: Actor = { id: "systeem", rol: "admin" };

export async function draaiHerinneringsronde(
  vandaag: IsoDatum,
): Promise<RondeResultaat> {
  const kandidaten = await herinneringsOntvangers(SYSTEEM, vandaag);

  let verstuurd = 0;
  const problemen: { email: string; reden: string }[] = [];

  for (const unit of kandidaten) {
    const maand = verschuldigdeHerinnering(unit.vervaldatum, vandaag, {
      12: unit.herinnering12Op !== null,
      6: unit.herinnering6Op !== null,
      1: unit.herinnering1Op !== null,
    });
    if (!maand) continue;

    const resultaat = await stuurVervangingsherinnering({
      email: unit.email,
      maanden: maand,
      vervaldatum: unit.vervaldatum,
      installatiedatum: unit.installatiedatum,
      lotNummer: unit.lotNummer,
    });

    if (resultaat.verstuurd) {
      await markeerHerinnering(unit.unitId, maand);
      // De ruimere termijnen zijn hiermee achterhaald. Zonder dit krijgt een
      // laat geregistreerde unit morgen alsnog "verloopt over een half jaar"
      // terwijl het bericht van vandaag al zei dat het volgende maand is.
      for (const oud of achterhaaldeHerinneringen(maand)) {
        await markeerHerinnering(unit.unitId, oud);
      }
      verstuurd++;
    } else {
      problemen.push({ email: unit.email, reden: resultaat.reden });
    }
  }

  return {
    bekeken: kandidaten.length,
    verstuurd,
    mislukt: problemen.length,
    problemen,
  };
}
