import { beforeAll, describe, expect, it } from "vitest";
import {
  base32,
  codeVoorStap,
  controleerCode,
  hashHerstelcode,
  leesTussenstap,
  lijktOpHerstelcode,
  maakTussenstap,
  nieuweHerstelcodes,
  nieuwGeheim,
  ontsleutel,
  otpauthLink,
  stapVoor,
  uitBase32,
  versleutel,
} from "./totp";

beforeAll(() => {
  process.env.AUTH_SECRET ??= "test-geheim-alleen-voor-vitest";
});

// RFC 6238, bijlage B: SHA1 met de ASCII-sleutel "12345678901234567890".
const RFC_SLEUTEL = Buffer.from("12345678901234567890");
const RFC = [
  [59, "94287082"],
  [1111111109, "07081804"],
  [1111111111, "14050471"],
  [1234567890, "89005924"],
  [2000000000, "69279037"],
  [20000000000, "65353130"],
] as const;

describe("TOTP volgens RFC 6238", () => {
  it.each(RFC)("t=%i geeft %s", (t, verwacht) => {
    expect(codeVoorStap(RFC_SLEUTEL, stapVoor(t * 1000), 8)).toBe(verwacht);
  });

  it("zes cijfers zijn de laatste zes van de acht", () => {
    expect(codeVoorStap(RFC_SLEUTEL, stapVoor(59_000))).toBe("287082");
  });
});

describe("base32", () => {
  it("gaat heen en terug", () => {
    const bytes = Buffer.from("12345678901234567890");
    expect(base32(bytes)).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
    expect(uitBase32(base32(bytes)).equals(bytes)).toBe(true);
  });

  it("accepteert spaties en kleine letters zoals mensen hem overtypen", () => {
    expect(uitBase32("gezd gnbv gy3t qojq gezd gnbv gy3t qojq").toString()).toBe(
      "12345678901234567890",
    );
  });

  it("nieuw geheim is 32 tekens", () => {
    expect(nieuwGeheim()).toMatch(/^[A-Z2-7]{32}$/);
  });
});

describe("controleerCode", () => {
  const geheim = base32(RFC_SLEUTEL);
  const nu = 1_234_567_890_000;
  const stap = stapVoor(nu);
  const code = (s: number) => codeVoorStap(RFC_SLEUTEL, s);

  it("accepteert de huidige code en geeft de stap terug", () => {
    expect(controleerCode(geheim, code(stap), nu)).toBe(stap);
  });

  it("staat één stap klokafwijking toe, niet twee", () => {
    expect(controleerCode(geheim, code(stap - 1), nu)).toBe(stap - 1);
    expect(controleerCode(geheim, code(stap + 1), nu)).toBe(stap + 1);
    expect(controleerCode(geheim, code(stap - 2), nu)).toBeNull();
    expect(controleerCode(geheim, code(stap + 2), nu)).toBeNull();
  });

  it("weigert een code die al gebruikt is", () => {
    expect(controleerCode(geheim, code(stap), nu, stap)).toBeNull();
    expect(controleerCode(geheim, code(stap - 1), nu, stap)).toBeNull();
  });

  it("weigert alles wat geen zes cijfers is", () => {
    expect(controleerCode(geheim, "", nu)).toBeNull();
    expect(controleerCode(geheim, "12345", nu)).toBeNull();
    expect(controleerCode(geheim, "abcdef", nu)).toBeNull();
  });

  it("negeert een spatie in het midden", () => {
    const c = code(stap);
    expect(controleerCode(geheim, `${c.slice(0, 3)} ${c.slice(3)}`, nu)).toBe(stap);
  });
});

describe("herstelcodes", () => {
  it("maakt acht unieke codes in de vorm XXXX-XXXX", () => {
    const codes = nieuweHerstelcodes();
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8);
    for (const c of codes) expect(c).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
  });

  it("hash is ongevoelig voor streepje en hoofdletters", () => {
    expect(hashHerstelcode("abcd-efgh")).toBe(hashHerstelcode("ABCDEFGH"));
    expect(lijktOpHerstelcode("abcd efgh")).toBe(true);
    expect(lijktOpHerstelcode("123456")).toBe(false);
  });
});

describe("versleuteling", () => {
  it("gaat heen en terug, met elke keer een andere uitkomst", () => {
    const a = versleutel("GEHEIM");
    expect(a).not.toBe(versleutel("GEHEIM"));
    expect(ontsleutel(a)).toBe("GEHEIM");
  });

  it("weigert een aangepaste waarde", () => {
    const [v, iv, tag, data] = versleutel("GEHEIM").split(".");
    const anders = Buffer.from(data, "base64");
    anders[0] ^= 1;
    expect(() => ontsleutel([v, iv, tag, anders.toString("base64")].join("."))).toThrow();
  });
});

describe("tussenstap", () => {
  it("geeft het gebruikers-id terug binnen vijf minuten", () => {
    const t = maakTussenstap("abc", 1000);
    expect(leesTussenstap(t, 1000 + 4 * 60_000)).toBe("abc");
    expect(leesTussenstap(t, 1000 + 6 * 60_000)).toBeNull();
  });

  it("weigert een vervalst briefje", () => {
    const [, vervalt, handtekening] = maakTussenstap("abc", 1000).split(".");
    expect(leesTussenstap(`iemand-anders.${vervalt}.${handtekening}`, 1000)).toBeNull();
    expect(leesTussenstap("onzin", 1000)).toBeNull();
  });
});

describe("otpauth-link", () => {
  it("bevat uitgever, sleutel en de standaardinstellingen", () => {
    const l = otpauthLink("ABC", "a@b.nl");
    expect(l.startsWith("otpauth://totp/Blusbox%3Aa%40b.nl?")).toBe(true);
    expect(l).toContain("secret=ABC");
    expect(l).toContain("issuer=Blusbox");
    expect(l).toContain("digits=6");
  });
});
