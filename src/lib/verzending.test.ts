import { describe, expect, it } from "vitest";
import { LEVERTIJD, beoordeelVerzending } from "./verzending";

/**
 * §15: "het afrekenen mag geen bestelling aannemen die we niet kunnen
 * leveren." Dit zijn de gevallen die moeten weigeren, en ze moeten in het
 * Nederlands weigeren met een reden.
 *
 * De module draagt geen gevaarlijke-goederenclassificatie, dus er is geen
 * maximum per zending en geen beperking die uit het product voortkomt. Wat
 * overblijft is waar we bezorgen.
 */

describe("verzendbeoordeling", () => {
  it("staat een normale Nederlandse bestelling toe", () => {
    const oordeel = beoordeelVerzending({
      bestemming: { landcode: "NL" },
      aantalModules: 1,
    });
    expect(oordeel.toegestaan).toBe(true);
  });

  it("legt geen maximum op het aantal modules", () => {
    // Er is geen vervoersbeperking; honderd stuks mag net zo goed als één.
    expect(
      beoordeelVerzending({
        bestemming: { landcode: "NL" },
        aantalModules: 100,
      }).toegestaan,
    ).toBe(true);
  });

  it("weigert België, met een zakelijke route als uitweg", () => {
    const oordeel = beoordeelVerzending({
      bestemming: { landcode: "BE" },
      aantalModules: 1,
    });
    expect(oordeel.toegestaan).toBe(false);
    if (!oordeel.toegestaan) {
      expect(oordeel.reden).toMatch(/alleen in Nederland/i);
      expect(oordeel.oplossing).toMatch(/contact/i);
    }
  });

  it("noemt geen gevaarlijke goederen meer als reden", () => {
    // Het product valt daar niet onder; die reden zou onjuist zijn.
    for (const land of ["BE", "DE", "US"]) {
      const oordeel = beoordeelVerzending({
        bestemming: { landcode: land },
        aantalModules: 1,
      });
      if (!oordeel.toegestaan) {
        expect(oordeel.reden).not.toMatch(/gevaarlijk|ADR|UN-nummer/i);
      }
    }
  });

  it("weigert buiten de EU", () => {
    expect(
      beoordeelVerzending({
        bestemming: { landcode: "US" },
        aantalModules: 1,
      }).toegestaan,
    ).toBe(false);
  });

  it("laat een lege wagen overal heen", () => {
    expect(
      beoordeelVerzending({
        bestemming: { landcode: "DE" },
        aantalModules: 0,
      }).toegestaan,
    ).toBe(true);
  });

  it("weigert zonder gekozen land", () => {
    expect(
      beoordeelVerzending({
        bestemming: { landcode: "" },
        aantalModules: 1,
      }).toegestaan,
    ).toBe(false);
  });

  it("is ongevoelig voor hoofdletters en spaties", () => {
    expect(
      beoordeelVerzending({
        bestemming: { landcode: " nl " },
        aantalModules: 1,
      }).toegestaan,
    ).toBe(true);
  });

  it("geeft altijd een reden bij een weigering", () => {
    for (const land of ["BE", "DE", "US", ""]) {
      const oordeel = beoordeelVerzending({
        bestemming: { landcode: land },
        aantalModules: 1,
      });
      if (!oordeel.toegestaan) {
        expect(oordeel.reden.length).toBeGreaterThan(10);
      }
    }
  });
});

describe("levertijd", () => {
  it("staat op één werkdag", () => {
    // Wat hier staat, staat ook op de productpagina en op /verzending.
    expect(LEVERTIJD).toBe("1 werkdag");
  });
});
