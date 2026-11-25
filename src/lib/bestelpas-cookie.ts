import { cookies } from "next/headers";
import {
  BESTELPAS_COOKIE,
  BESTELPAS_MAX_LEEFTIJD,
  leesPassen,
  metPas,
} from "./bestelpas";

/**
 * De bestelpas in de cookie van de klant zetten. Alleen aan te roepen
 * waar cookies gezet mogen worden: in een server action of route handler.
 */
export async function geefBestelpas(ordernummer: string): Promise<void> {
  const pot = await cookies();
  pot.set(BESTELPAS_COOKIE, metPas(pot.get(BESTELPAS_COOKIE)?.value, ordernummer), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: BESTELPAS_MAX_LEEFTIJD,
  });
}

/** Heeft deze browser een geldige pas voor dit bestelnummer? */
export async function heeftBestelpas(ordernummer: string): Promise<boolean> {
  const pot = await cookies();
  return leesPassen(pot.get(BESTELPAS_COOKIE)?.value).includes(ordernummer);
}
