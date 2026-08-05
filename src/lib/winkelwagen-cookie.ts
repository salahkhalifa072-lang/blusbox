import { cookies } from "next/headers";
import { naarCookie, uitCookie, type Winkelwagen } from "./winkelwagen";

/**
 * Cart persistence. The cookie holds slugs and quantities only — never
 * prices — so a visitor cannot edit their way to a discount: every amount
 * is recalculated server-side from the catalogue on each request.
 */

const COOKIE = "blusbox_wagen";
const MAX_LEEFTIJD = 60 * 60 * 24 * 30; // 30 dagen

export async function leesWagen(): Promise<Winkelwagen> {
  const jar = await cookies();
  return uitCookie(jar.get(COOKIE)?.value);
}

export async function schrijfWagen(wagen: Winkelwagen): Promise<void> {
  const jar = await cookies();
  const waarde = naarCookie(wagen);

  if (!waarde) {
    jar.delete(COOKIE);
    return;
  }

  jar.set(COOKIE, waarde, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_LEEFTIJD,
  });
}

/** Cheap count for the header badge. */
export async function wagenAantal(): Promise<number> {
  const wagen = await leesWagen();
  return wagen.regels.reduce((som, r) => som + r.aantal, 0);
}
