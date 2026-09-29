/**
 * De toestemmingskeuze van de bezoeker.
 *
 * In een cookie en niet in localStorage, om twee redenen. Een cookie is
 * waar een toezichthouder hem zoekt als hij vraagt hoe je toestemming
 * vastlegt, en een cookie heeft een houdbaarheidsdatum die de browser
 * zelf bewaakt. De Autoriteit Persoonsgegevens gaat uit van opnieuw
 * vragen na een half jaar; dat staat hieronder als vervaltermijn en
 * hoeft dus nergens nagerekend te worden.
 *
 * Alleen aan de kant van de browser gelezen. Serverzijde zou netter
 * lijken — geen kort moment waarin de banner nog niet staat — maar een
 * cookie lezen in de layout maakt élke pagina van de site dynamisch, ook
 * de productpagina die nu statisch wordt uitgeserveerd. Dat is een hoge
 * prijs voor het wegpoetsen van één frame.
 */

export const TOESTEMMING_COOKIE = "blusbox-toestemming";

/**
 * Versie van de vraag. Meten we later iets anders, dan hoogt dit nummer
 * op en vervalt elke eerder gegeven toestemming vanzelf: toestemming voor
 * A is geen toestemming voor B.
 */
export const TOESTEMMING_VERSIE = 1;

/** Een half jaar, in seconden. */
const HOUDBAARHEID = 60 * 60 * 24 * 182;

export type Keuze = "verleend" | "geweigerd";

/** Naam van de gebeurtenis waarmee de banner de rest van de pagina wekt. */
const SIGNAAL = "blusbox-toestemming-gewijzigd";

function isKeuze(waarde: string): waarde is Keuze {
  return waarde === "verleend" || waarde === "geweigerd";
}

/**
 * De opgeslagen keuze, of null als er nog niets is gekozen.
 *
 * Null betekent uitdrukkelijk "nog niet gevraagd" en niet "nee". Het
 * verschil is zichtbaar: bij null komt de banner, bij "geweigerd" niet.
 */
export function leesKeuze(): Keuze | null {
  if (typeof document === "undefined") return null;

  const rij = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${TOESTEMMING_COOKIE}=`));
  if (!rij) return null;

  // vorm: <keuze>.<versie>
  const [keuze, versie] = decodeURIComponent(rij.slice(rij.indexOf("=") + 1)).split(".");
  if (!isKeuze(keuze)) return null;
  if (Number(versie) !== TOESTEMMING_VERSIE) return null;

  return keuze;
}

/** Keuze vastleggen en de rest van de pagina erover inlichten. */
export function bewaarKeuze(keuze: Keuze): void {
  if (typeof document === "undefined") return;

  const waarde = encodeURIComponent(`${keuze}.${TOESTEMMING_VERSIE}`);
  const veilig = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TOESTEMMING_COOKIE}=${waarde}; Path=/; Max-Age=${HOUDBAARHEID}; SameSite=Lax${veilig}`;

  window.dispatchEvent(new CustomEvent(SIGNAAL, { detail: keuze }));
}

/**
 * Keuze wissen, zodat de banner opnieuw verschijnt.
 *
 * Het cookiebeleid belooft dat je je keuze kunt aanpassen. Zonder deze
 * functie is dat een loze belofte: eenmaal geweigerd zou de bezoeker er
 * nooit meer op terug kunnen komen.
 */
export function wisKeuze(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TOESTEMMING_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent(SIGNAAL, { detail: null }));
}

/** Luisteren naar wijzigingen; geeft de opzegfunctie terug. */
export function abonneer(luisteraar: (keuze: Keuze | null) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const afhandelen = (e: Event) => {
    luisteraar((e as CustomEvent<Keuze | null>).detail ?? null);
  };
  window.addEventListener(SIGNAAL, afhandelen);
  return () => window.removeEventListener(SIGNAAL, afhandelen);
}
