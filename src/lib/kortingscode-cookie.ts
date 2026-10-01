import { cookies } from "next/headers";
import { normaliseerCode } from "./korting";

/**
 * De ingevoerde kortingscode onthouden tussen invoeren en afrekenen.
 *
 * Alleen de code staat erin, nooit een percentage of een bedrag — net als
 * bij de winkelwagen, die ook alleen slugs en aantallen bewaart. Wie de
 * cookie bewerkt verandert daarmee hooguit wélke code wordt opgezocht;
 * of die bestaat, actief is en wat hij waard is komt elk verzoek opnieuw
 * uit de database. Een zelfverzonnen cookie levert dus niets op.
 */

const COOKIE = "blusbox_korting";
const MAX_LEEFTIJD = 60 * 60 * 24 * 7; // een week

export async function leesKortingscode(): Promise<string | null> {
  const jar = await cookies();
  const ruw = jar.get(COOKIE)?.value;
  if (!ruw) return null;
  const code = normaliseerCode(ruw);
  return code || null;
}

export async function schrijfKortingscode(code: string): Promise<void> {
  const jar = await cookies();
  const genormaliseerd = normaliseerCode(code);

  if (!genormaliseerd) {
    jar.delete(COOKIE);
    return;
  }

  jar.set(COOKIE, genormaliseerd, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_LEEFTIJD,
  });
}

export async function wisKortingscode(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
