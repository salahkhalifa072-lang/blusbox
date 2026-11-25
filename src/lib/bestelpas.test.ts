import { beforeAll, describe, expect, it } from "vitest";
import { leesPassen, metPas, pasCode, pasKlopt } from "./bestelpas";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-geheim-voor-de-bestelpas";
});

describe("bestelpas", () => {
  it("accepteert de eigen code en geen andere", () => {
    const code = pasCode("BB-2026-000035");
    expect(pasKlopt("BB-2026-000035", code)).toBe(true);
    expect(pasKlopt("BB-2026-000036", code)).toBe(false);
    expect(pasKlopt("BB-2026-000035", code.slice(0, -1) + "x")).toBe(false);
    expect(pasKlopt("BB-2026-000035", "")).toBe(false);
    expect(pasKlopt("BB-2026-000035", null)).toBe(false);
  });

  it("is zonder het servergeheim niet na te maken", () => {
    const code = pasCode("BB-2026-000035");
    process.env.AUTH_SECRET = "een-ander-geheim";
    expect(pasKlopt("BB-2026-000035", code)).toBe(false);
    process.env.AUTH_SECRET = "test-geheim-voor-de-bestelpas";
  });

  it("bewaart meerdere bestellingen, nieuwste voorop, hooguit vijf", () => {
    let cookie: string | undefined;
    for (let i = 1; i <= 7; i++) cookie = metPas(cookie, `BB-2026-00000${i}`);
    expect(leesPassen(cookie)).toEqual([
      "BB-2026-000007",
      "BB-2026-000006",
      "BB-2026-000005",
      "BB-2026-000004",
      "BB-2026-000003",
    ]);
  });

  it("laat een zelfgemaakte of bewerkte cookie niets opleveren", () => {
    expect(leesPassen("BB-2026-000035.geraden")).toEqual([]);
    expect(leesPassen("BB-2026-000035")).toEqual([]);
    expect(leesPassen(",,.")).toEqual([]);
    expect(leesPassen(undefined)).toEqual([]);
    const echt = metPas(undefined, "BB-2026-000035");
    // Het nummer vervangen en de handtekening laten staan werkt niet.
    expect(leesPassen(echt.replace("000035", "000036"))).toEqual([]);
  });
});
