import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  hkdfSync,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

/**
 * Eenmalige codes uit een authenticator-app (RFC 6238), zonder extra
 * pakket: HMAC-SHA1, zes cijfers, elke 30 seconden een nieuwe. Dat is wat
 * Google Authenticator, Microsoft Authenticator, 1Password en Authy allemaal
 * verwachten; afwijken van SHA1 of zes cijfers wordt door een deel van die
 * apps stil genegeerd, en dan klopt er geen enkele code.
 *
 * Alles hier is puur rekenwerk, zodat het zonder database te testen is.
 * Het bijhouden van pogingen en gebruikte codes zit in tweestaps.ts.
 */

const STAP_SECONDEN = 30;
const CIJFERS = 6;

/* --------------------------------------------------------------- base32 */

const ALFABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32(bytes: Buffer): string {
  let bits = 0;
  let waarde = 0;
  let uit = "";
  for (const b of bytes) {
    waarde = (waarde << 8) | b;
    bits += 8;
    while (bits >= 5) {
      uit += ALFABET[(waarde >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) uit += ALFABET[(waarde << (5 - bits)) & 31];
  return uit;
}

export function uitBase32(tekst: string): Buffer {
  const schoon = tekst.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let waarde = 0;
  const uit: number[] = [];
  for (const teken of schoon) {
    const i = ALFABET.indexOf(teken);
    if (i < 0) throw new Error("Ongeldig teken in base32-sleutel");
    waarde = (waarde << 5) | i;
    bits += 5;
    if (bits >= 8) {
      uit.push((waarde >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(uit);
}

/* ----------------------------------------------------------------- codes */

/** 160 bits, de lengte die RFC 4226 aanraadt voor SHA1. */
export function nieuwGeheim(): string {
  return base32(randomBytes(20));
}

export function stapVoor(ms: number): number {
  return Math.floor(ms / 1000 / STAP_SECONDEN);
}

export function codeVoorStap(
  geheim: Buffer,
  stap: number,
  cijfers = CIJFERS,
): string {
  const teller = Buffer.alloc(8);
  teller.writeBigUInt64BE(BigInt(stap));
  const hmac = createHmac("sha1", geheim).update(teller).digest();
  const start = hmac[hmac.length - 1] & 0x0f;
  const getal = hmac.readUInt32BE(start) & 0x7fffffff;
  return String(getal % 10 ** cijfers).padStart(cijfers, "0");
}

/**
 * Controleert een code en geeft de stap terug waar hij bij hoort, of null.
 *
 * Eén stap speling naar voren en naar achteren: een telefoonklok die een
 * halve minuut afwijkt komt vaker voor dan je denkt, en wie de code net
 * voor de wissel overtypt is anders telkens te laat.
 *
 * `laatsteStap` is de stap van de vorige geslaagde code. Een code uit die
 * stap of eerder telt niet meer: wie over je schouder meekijkt, of een
 * code uit een netwerklog vist, kan hem zo niet nog een keer gebruiken.
 */
export function controleerCode(
  geheimBase32: string,
  invoer: string,
  nuMs: number,
  laatsteStap = -1,
): number | null {
  const code = invoer.replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return null;
  const geheim = uitBase32(geheimBase32);
  const nu = stapVoor(nuMs);
  for (const stap of [nu - 1, nu, nu + 1]) {
    if (stap <= laatsteStap) continue;
    const verwacht = Buffer.from(codeVoorStap(geheim, stap));
    if (timingSafeEqual(verwacht, Buffer.from(code))) return stap;
  }
  return null;
}

/** De link achter de QR-code die de app inleest. */
export function otpauthLink(geheim: string, email: string): string {
  const uitgever = "Blusbox";
  const label = encodeURIComponent(`${uitgever}:${email}`);
  const params = new URLSearchParams({
    secret: geheim,
    issuer: uitgever,
    algorithm: "SHA1",
    digits: String(CIJFERS),
    period: String(STAP_SECONDEN),
  });
  return `otpauth://totp/${label}?${params}`;
}

/** Sleutel in groepjes van vier, om hem met de hand over te typen. */
export function inGroepjes(geheim: string): string {
  return geheim.match(/.{1,4}/g)?.join(" ") ?? geheim;
}

/* ----------------------------------------------------------- herstelcodes */

// Zonder 0/O en 1/I/L: herstelcodes worden op papier bewaard en later
// overgetypt, en dat zijn precies de tekens die dan door elkaar lopen.
const HERSTEL_ALFABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Acht codes van acht tekens, als XXXX-XXXX. Ruim 39 bits per code. */
export function nieuweHerstelcodes(aantal = 8): string[] {
  return Array.from({ length: aantal }, () => {
    let s = "";
    for (let i = 0; i < 8; i++) s += HERSTEL_ALFABET[randomInt(HERSTEL_ALFABET.length)];
    return `${s.slice(0, 4)}-${s.slice(4)}`;
  });
}

export function normaliseerHerstelcode(invoer: string): string {
  return invoer.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function lijktOpHerstelcode(invoer: string): boolean {
  return normaliseerHerstelcode(invoer).length === 8;
}

/**
 * Herstelcodes worden alleen als hash bewaard. Gewoon SHA-256 is hier
 * genoeg: de codes zijn willekeurig en lang, er valt niets te raden met
 * een woordenlijst zoals bij een wachtwoord.
 */
export function hashHerstelcode(invoer: string): string {
  return createHash("sha256").update(normaliseerHerstelcode(invoer)).digest("hex");
}

/* ------------------------------------------------- versleuteling in de db */

function sleutel(doel: string): Buffer {
  const geheim = process.env.AUTH_SECRET;
  if (!geheim) throw new Error("AUTH_SECRET ontbreekt");
  return Buffer.from(hkdfSync("sha256", geheim, "blusbox", doel, 32));
}

/**
 * Het TOTP-geheim staat versleuteld in de database (AES-256-GCM, sleutel
 * afgeleid van AUTH_SECRET). Een gelekte databasedump levert zo geen
 * werkende codes op.
 *
 * Gevolg: wie AUTH_SECRET vervangt, maakt alle gekoppelde apps onbruikbaar.
 * De herstelcodes blijven dan wel werken (die hangen er niet van af), en
 * met `npm run db:tweestaps-uit` zet je het voor een account uit.
 */
export function versleutel(tekst: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", sleutel("tweestaps-geheim"), iv);
  const data = Buffer.concat([c.update(tekst, "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), data.toString("base64")].join(".");
}

export function ontsleutel(opgeslagen: string): string {
  const [versie, iv, tag, data] = opgeslagen.split(".");
  if (versie !== "v1") throw new Error("Onbekende versie van versleuteld geheim");
  const d = createDecipheriv("aes-256-gcm", sleutel("tweestaps-geheim"), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(data, "base64")), d.final()]).toString("utf8");
}

/* ---------------------------------------------------- tussenstap bij login */

const TUSSENSTAP_MS = 5 * 60 * 1000;

/**
 * Bewijs dat iemand het wachtwoord goed had, voor de tweede stap.
 *
 * Het wachtwoord zelf wordt niet meegenomen naar het codescherm. In plaats
 * daarvan krijgt de browser vijf minuten lang dit ondertekende briefje in
 * een httpOnly-cookie: gebruikers-id plus vervaltijd, met een HMAC die
 * alleen de server kan maken.
 */
export function maakTussenstap(userId: string, nuMs = Date.now()): string {
  const inhoud = `${userId}.${nuMs + TUSSENSTAP_MS}`;
  const handtekening = createHmac("sha256", sleutel("tweestaps-tussenstap"))
    .update(inhoud)
    .digest("base64url");
  return `${inhoud}.${handtekening}`;
}

export function leesTussenstap(token: string, nuMs = Date.now()): string | null {
  const delen = token.split(".");
  if (delen.length !== 3) return null;
  const [userId, vervalt, handtekening] = delen;
  const verwacht = createHmac("sha256", sleutel("tweestaps-tussenstap"))
    .update(`${userId}.${vervalt}`)
    .digest();
  const gekregen = Buffer.from(handtekening, "base64url");
  if (gekregen.length !== verwacht.length || !timingSafeEqual(gekregen, verwacht)) return null;
  if (!(Number(vervalt) > nuMs)) return null;
  return userId;
}
