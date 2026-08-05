import { describe, expect, it } from "vitest";
import {
  MAX_MODULES_PER_ZENDING,
  adrPapieren,
  beoordeelVerzending,
} from "./verzending";

/**
 * §15: "checkout cannot accept an order it cannot ship." These are the
 * cases that must refuse, and they must refuse in Dutch with a reason.
 */

describe("verzendbeoordeling", () => {
  it("staat een normale Nederlandse bestelling toe", () => {
    const oordeel = beoordeelVerzending({
      bestemming: { landcode: "NL" },
      aantalModules: 1,
    });
    expect(oordeel.toegestaan).toBe(true);
  });

  it("weigert België met uitleg dat het in voorbereiding is", () => {
    const oordeel = beoordeelVerzending({
      bestemming: { landcode: "BE" },
      aantalModules: 1,
    });
    expect(oordeel.toegestaan).toBe(false);
    if (!oordeel.toegestaan) {
      expect(oordeel.reden).toMatch(/nog niet/i);
      expect(oordeel.oplossing).toBeTruthy();
    }
  });

  it("weigert een ander EU-land, met een zakelijke route als uitweg", () => {
    const oordeel = beoordeelVerzending({
      bestemming: { landcode: "DE" },
      aantalModules: 1,
    });
    expect(oordeel.toegestaan).toBe(false);
    if (!oordeel.toegestaan) {
      expect(oordeel.reden).toMatch(/gevaarlijke goederen/i);
      expect(oordeel.oplossing).toMatch(/contact/i);
    }
  });

  it("weigert buiten de EU", () => {
    const oordeel = beoordeelVerzending({
      bestemming: { landcode: "US" },
      aantalModules: 1,
    });
    expect(oordeel.toegestaan).toBe(false);
  });

  it("weigert boven het maximum aantal modules", () => {
    const oordeel = beoordeelVerzending({
      bestemming: { landcode: "NL" },
      aantalModules: MAX_MODULES_PER_ZENDING + 1,
    });
    expect(oordeel.toegestaan).toBe(false);
    if (!oordeel.toegestaan) {
      // the message must name both numbers, or the customer cannot act
      expect(oordeel.reden).toContain(String(MAX_MODULES_PER_ZENDING));
      expect(oordeel.reden).toContain(String(MAX_MODULES_PER_ZENDING + 1));
    }
  });

  it("staat precies het maximum toe", () => {
    expect(
      beoordeelVerzending({
        bestemming: { landcode: "NL" },
        aantalModules: MAX_MODULES_PER_ZENDING,
      }).toegestaan,
    ).toBe(true);
  });

  it("meldt het land vóór het aantal", () => {
    // Splitting the order does not help someone in the wrong country, so
    // the country problem must be the one reported.
    const oordeel = beoordeelVerzending({
      bestemming: { landcode: "US" },
      aantalModules: 999,
    });
    expect(oordeel.toegestaan).toBe(false);
    if (!oordeel.toegestaan) {
      expect(oordeel.reden).not.toContain("999");
    }
  });

  it("laat een mandje zonder modules overal heen", () => {
    // A montageset on its own is not hazardous.
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

describe("ADR-papieren", () => {
  it("levert niets bij een zending zonder modules", () => {
    expect(
      adrPapieren({ aantalModules: 0, unNummer: "UN0432", adrKlasse: "1.4S" }),
    ).toBeNull();
  });

  it("levert de gegevens bij een zending met modules", () => {
    expect(
      adrPapieren({ aantalModules: 3, unNummer: "UN0432", adrKlasse: "1.4S" }),
    ).toEqual({ unNummer: "UN0432", adrKlasse: "1.4S", aantal: 3 });
  });

  it("verzint geen UN-nummer als dat nog niet bevestigd is", () => {
    const papieren = adrPapieren({
      aantalModules: 1,
      unNummer: null,
      adrKlasse: null,
    });
    expect(papieren?.unNummer).toContain("VERIFY");
    expect(papieren?.adrKlasse).toContain("VERIFY");
  });
});
