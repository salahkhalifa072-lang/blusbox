import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  wachtwoord: string,
  salt: Buffer,
  lengte: number,
  opties: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/**
 * scrypt needs roughly 128 * N * r bytes. At N=2^15, r=8 that is exactly
 * 32 MiB, which is node's default maxmem ceiling — so the default fails.
 * Raise the guard well above what the parameters actually need.
 */
const MAXMEM = 128 * 1024 * 1024;

/**
 * Password hashing with node's built-in scrypt — no native dependency to
 * build, and memory-hard, unlike a bare SHA. Format:
 *   scrypt$N$r$p$<salt-base64>$<hash-base64>
 * so the cost parameters travel with the hash and can be raised later
 * without invalidating existing passwords.
 */

const PARAMS = { N: 2 ** 15, r: 8, p: 1 } as const;
const KEY_LENGTE = 64;

export async function hashWachtwoord(wachtwoord: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(wachtwoord.normalize("NFKC"), salt, KEY_LENGTE, {
    ...PARAMS,
    maxmem: MAXMEM,
  });
  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("base64"),
    hash.toString("base64"),
  ].join("$");
}

export async function verifieerWachtwoord(
  wachtwoord: string,
  opgeslagen: string,
): Promise<boolean> {
  const delen = opgeslagen.split("$");
  if (delen.length !== 6 || delen[0] !== "scrypt") return false;

  const [, n, r, p, saltB64, hashB64] = delen;
  const salt = Buffer.from(saltB64, "base64");
  const verwacht = Buffer.from(hashB64, "base64");

  let berekend: Buffer;
  try {
    berekend = await scrypt(wachtwoord.normalize("NFKC"), salt, verwacht.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: MAXMEM,
    });
  } catch {
    // Corrupt or hostile cost parameters must not crash a login attempt.
    return false;
  }

  // Length check first: timingSafeEqual throws on a length mismatch.
  if (berekend.length !== verwacht.length) return false;
  return timingSafeEqual(berekend, verwacht);
}

/**
 * Minimum policy. Length beats composition rules, so we ask for length
 * and reject only the obviously weak.
 */
export function wachtwoordProblemen(wachtwoord: string): string[] {
  const problemen: string[] = [];
  if (wachtwoord.length < 12) {
    problemen.push("Gebruik minimaal 12 tekens.");
  }
  if (/^\d+$/.test(wachtwoord)) {
    problemen.push("Gebruik niet alleen cijfers.");
  }
  return problemen;
}
