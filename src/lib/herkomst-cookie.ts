import { cookies } from "next/headers";
import { HERKOMST_COOKIE, leesHerkomstWaarde, type Herkomst } from "./herkomst";

/** De herkomst uit de cookie die de middleware bij binnenkomst zette. */
export async function leesHerkomst(): Promise<Herkomst | null> {
  const jar = await cookies();
  return leesHerkomstWaarde(jar.get(HERKOMST_COOKIE)?.value);
}
