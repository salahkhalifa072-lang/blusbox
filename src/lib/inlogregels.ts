/**
 * De regels waarmee verdachte inlogpogingen herkend worden. Puur rekenwerk,
 * zodat ze zonder database te testen zijn; het tellen en blokkeren zelf
 * zit in inlogbewaking.ts.
 *
 * Drie soorten aanval, drie regels:
 *
 * 1. Raden vanaf één adres: veel foute pogingen in korte tijd. Een mens die
 *    zijn wachtwoord vergeten is, probeert het drie, vier keer en klikt dan
 *    op "wachtwoord vergeten". Tien keer in een kwartier is een script.
 *
 * 2. Lijsten afwerken (credential stuffing): één adres dat foute pogingen
 *    doet op veel verschillende e-mailadressen. Dat is iemand met een
 *    gelekte lijst van een andere site, die kijkt waar hij binnenkomt.
 *
 * 3. Verspreid raden: duizenden adressen die elk een paar keer hetzelfde
 *    account proberen (een botnet, of een AI die door proxy's roteert).
 *    Per adres valt dat niet op, dus hier telt het account. Het account
 *    gaat even "afkoelen": dan worden een kwartier lang geen wachtwoorden
 *    meer geprobeerd. Geen IP-blokkade, want dat zijn er te veel en het
 *    kunnen gekaapte computers van gewone mensen zijn.
 *
 * Met deze grenzen haalt een aanvaller hooguit ruim 80 pogingen per uur
 * op één account, hoeveel adressen hij ook inzet. 30.000 pogingen duurt
 * dan meer dan twee weken, en met de code uit de authenticator-app heeft
 * zelfs een goed geraden wachtwoord geen waarde.
 */

export const GRENZEN = {
  /** Regel 1: foute pogingen per IP binnen het venster. */
  ipFout: { aantal: 10, minuten: 15 },
  /** Regel 2: verschillende e-mailadressen met een foute poging per IP. */
  ipAdressen: { aantal: 5, minuten: 60 },
  /** Regel 3: foute pogingen op één account, vanaf alle IP's samen. */
  accountFout: { aantal: 20, minuten: 15 },
  /** Herstelmails per e-mailadres per uur; daarboven niets meer versturen. */
  herstelPerAdres: { aantal: 3, minuten: 60 },
} as const;

export type Telling = {
  ipFout: number;
  ipAdressen: number;
};

/** Reden voor een blokkade, of null als er niets aan de hand is. */
export function beoordeelIp(t: Telling): string | null {
  if (t.ipFout >= GRENZEN.ipFout.aantal) {
    return `${t.ipFout} foute pogingen binnen ${GRENZEN.ipFout.minuten} minuten`;
  }
  if (t.ipAdressen >= GRENZEN.ipAdressen.aantal) {
    return `foute pogingen op ${t.ipAdressen} verschillende e-mailadressen binnen een uur`;
  }
  return null;
}

/**
 * Hoe lang een blokkade duurt: een dag, bij herhaling een week, daarna een
 * maand. Niet voor altijd: IP-adressen wisselen van eigenaar, en wie
 * vandaag een gekaapt adres gebruikt, is volgend jaar misschien een klant.
 */
export function blokduurMs(keer: number): number {
  const dag = 24 * 60 * 60 * 1000;
  if (keer <= 1) return dag;
  if (keer === 2) return 7 * dag;
  return 30 * dag;
}

/* ---------------------------------------------------------- IP-adressen */

function vouwIpv6Uit(ip: string): string[] | null {
  const [links, rechts, ...rest] = ip.split("::");
  if (rest.length > 0) return null;
  const l = links ? links.split(":") : [];
  const r = rechts !== undefined ? (rechts ? rechts.split(":") : []) : null;
  if (r === null) return l.length === 8 ? l : null;
  const nullen = 8 - l.length - r.length;
  if (nullen < 1) return null;
  return [...l, ...Array(nullen).fill("0"), ...r];
}

/**
 * Eén vorm per adres, zodat tellen en blokkeren klopt.
 *
 * IPv4 blijft zoals hij is. Van IPv6 tellen alleen de eerste vier groepen
 * (het /64-blok): een thuisaansluiting of server krijgt zo'n blok in zijn
 * geheel, en kan daarbinnen elke poging van een ander adres doen. Wie per
 * los IPv6-adres blokkeert, blokkeert dus niets.
 */
export function normaliseerIp(ruw: string): string {
  let ip = ruw.trim().toLowerCase();
  if (!ip) return "";
  if (ip.startsWith("[") && ip.includes("]")) ip = ip.slice(1, ip.indexOf("]"));
  ip = ip.replace(/%.*$/, "");
  const v4 = ip.match(/^(?:::ffff:)?(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (v4) return v4[1];
  if (!ip.includes(":")) return ip;
  if (ip === "::1") return ip;
  const groepen = vouwIpv6Uit(ip);
  if (!groepen || groepen.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return ip;
  return `${groepen
    .slice(0, 4)
    .map((g) => g.replace(/^0+(?=.)/, ""))
    .join(":")}::/64`;
}

/**
 * Adressen die nooit geblokkeerd worden: onbekend (dan zou één blokkade
 * iedereen zonder adres treffen) en de eigen machine (lokaal ontwikkelen).
 */
export function nooitBlokkeren(ip: string): boolean {
  return ip === "onbekend" || ip === "::1" || ip.startsWith("127.");
}
