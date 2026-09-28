import { beforeAll, describe, expect, it } from "vitest";
import { leesAttributie, schrijfAttributie } from "./cookie";

beforeAll(() => {
  process.env.AUTH_SECRET ??= "test-geheim-voor-de-handtekening-1234567890";
});

const voorbeeld = {
  affiliateId: "11111111-2222-3333-4444-555555555555",
  klikId: "66666666-7777-8888-9999-000000000000",
  klikOp: Date.parse("2026-09-01T10:00:00Z"),
};

describe("attributiecookie", () => {
  it("leest terug wat erin is gezet", () => {
    const waarde = schrijfAttributie(voorbeeld);
    expect(leesAttributie(waarde)).toEqual(voorbeeld);
  });

  it("weigert een gewijzigd affiliate-id", () => {
    // Dit is de aanval waar de handtekening voor bestaat: de bezoeker
    // vervangt het id door dat van zichzelf en int de commissie op een
    // bestelling die er toch al kwam.
    const waarde = schrijfAttributie(voorbeeld);
    const [basis, hand] = waarde.split(".");
    const inhoud = Buffer.from(basis, "base64url").toString("utf8");
    const geknoeid = Buffer.from(
      inhoud.replace(voorbeeld.affiliateId, "99999999-9999-9999-9999-999999999999"),
      "utf8",
    ).toString("base64url");

    expect(leesAttributie(`${geknoeid}.${hand}`)).toBeNull();
  });

  it("weigert een verzonnen handtekening", () => {
    const waarde = schrijfAttributie(voorbeeld);
    const [basis] = waarde.split(".");
    expect(leesAttributie(`${basis}.ditisnietdehandtekening`)).toBeNull();
  });

  it("weigert rommel zonder om te vallen", () => {
    for (const waarde of [
      undefined,
      "",
      ".",
      "geenpunt",
      "a.b",
      "....",
      "%%%.%%%",
    ]) {
      expect(leesAttributie(waarde as string | undefined)).toBeNull();
    }
  });

  it("weigert een tijdstip uit de toekomst", () => {
    const waarde = schrijfAttributie({
      ...voorbeeld,
      klikOp: Date.now() + 10 * 60 * 1000,
    });
    expect(leesAttributie(waarde)).toBeNull();
  });

  it("geeft per keer dezelfde waarde voor dezelfde inhoud", () => {
    expect(schrijfAttributie(voorbeeld)).toBe(schrijfAttributie(voorbeeld));
  });
});
