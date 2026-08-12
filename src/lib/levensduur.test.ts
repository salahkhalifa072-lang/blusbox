import { describe, expect, it } from "vitest";
import {
  berekenVervaldatum,
  binnenHerroepingstermijn,
  formatteerNl,
  herinneringsdatums,
  herroepingUiterlijk,
  isVerlopen,
  plusMaanden,
  verlooptBinnenMaanden,
  verschuldigdeHerinnering,
  achterhaaldeHerinneringen,
} from "./levensduur";

describe("vervaldatum", () => {
  it("telt tien kalenderjaren op", () => {
    expect(berekenVervaldatum("2026-08-05")).toBe("2036-08-05");
  });

  it("klemt 29 februari naar 28 februari", () => {
    // 2024 is a leap year, 2034 is not. Adding "10 years" naively with a
    // date library that rolls over would give 01-03-2034, which would send
    // the reminder a day late and expire the unit a day late.
    expect(berekenVervaldatum("2024-02-29")).toBe("2034-02-28");
  });

  it("klemt maandeinden bij het optellen van maanden", () => {
    expect(plusMaanden("2026-01-31", 1)).toBe("2026-02-28");
    expect(plusMaanden("2024-01-31", 1)).toBe("2024-02-29");
    expect(plusMaanden("2026-03-31", -1)).toBe("2026-02-28");
  });

  it("rolt netjes over een jaargrens", () => {
    expect(plusMaanden("2026-12-15", 1)).toBe("2027-01-15");
    expect(plusMaanden("2026-01-15", -1)).toBe("2025-12-15");
  });
});

describe("herinneringen", () => {
  const vervaldatum = berekenVervaldatum("2026-08-05"); // 2036-08-05

  it("plant op twaalf, zes en één maand voor het einde", () => {
    expect(herinneringsdatums(vervaldatum)).toEqual({
      12: "2035-08-05",
      6: "2036-02-05",
      1: "2036-07-05",
    });
  });

  it("stuurt niets als er nog niets verschuldigd is", () => {
    expect(
      verschuldigdeHerinnering(vervaldatum, "2030-01-01", {
        12: false,
        6: false,
        1: false,
      }),
    ).toBeNull();
  });

  it("stuurt de twaalfmaandsherinnering op de dag zelf", () => {
    expect(
      verschuldigdeHerinnering(vervaldatum, "2035-08-05", {
        12: false,
        6: false,
        1: false,
      }),
    ).toBe(12);
  });

  it("kiest bij een late registratie de dringendste, niet de ruimste", () => {
    // Alle drie de momenten zijn al gepasseerd; de module verloopt over
    // zestien dagen. "Verloopt over een jaar" sturen is dan niet alleen
    // overbodig, het is onjuist.
    expect(
      verschuldigdeHerinnering(vervaldatum, "2036-07-20", {
        12: false,
        6: false,
        1: false,
      }),
    ).toBe(1);
  });

  it("noemt de termijnen die daarmee achterhaald zijn", () => {
    // Wie hoort dat het over een maand afloopt, hoeft daarna niet alsnog
    // te horen dat het over een half jaar afloopt.
    expect(achterhaaldeHerinneringen(1)).toEqual([12, 6]);
    expect(achterhaaldeHerinneringen(6)).toEqual([12]);
    expect(achterhaaldeHerinneringen(12)).toEqual([]);
  });

  it("gaat door naar de volgende zodra de vorige verstuurd is", () => {
    // Normaal verloop: op de twaalfmaandsdatum is alleen 12 verschuldigd,
    // een half jaar later 6, en zo verder.
    expect(
      verschuldigdeHerinnering(vervaldatum, "2035-08-05", {
        12: false,
        6: false,
        1: false,
      }),
    ).toBe(12);
    expect(
      verschuldigdeHerinnering(vervaldatum, "2036-02-05", {
        12: true,
        6: false,
        1: false,
      }),
    ).toBe(6);
    expect(
      verschuldigdeHerinnering(vervaldatum, "2036-07-05", {
        12: true,
        6: true,
        1: false,
      }),
    ).toBe(1);
    expect(
      verschuldigdeHerinnering(vervaldatum, "2036-07-20", {
        12: true,
        6: true,
        1: true,
      }),
    ).toBeNull();
  });
});

describe("verloop", () => {
  it("is niet verlopen op de vervaldatum zelf", () => {
    expect(isVerlopen("2036-08-05", "2036-08-05")).toBe(false);
    expect(isVerlopen("2036-08-05", "2036-08-06")).toBe(true);
  });

  it("signaleert units die binnen twaalf maanden verlopen", () => {
    expect(verlooptBinnenMaanden("2027-01-01", "2026-08-05")).toBe(true);
    expect(verlooptBinnenMaanden("2028-01-01", "2026-08-05")).toBe(false);
    // already expired units are not "expiring within" — they need a
    // different dashboard tile
    expect(verlooptBinnenMaanden("2026-08-04", "2026-08-05")).toBe(false);
  });
});

describe("herroepingstermijn", () => {
  it("loopt veertien dagen na levering", () => {
    expect(herroepingUiterlijk("2026-08-05")).toBe("2026-08-19");
  });

  it("laat een aanvraag op de laatste dag toe", () => {
    expect(binnenHerroepingstermijn("2026-08-05", "2026-08-19")).toBe(true);
  });

  it("weigert een dag te laat", () => {
    expect(binnenHerroepingstermijn("2026-08-05", "2026-08-20")).toBe(false);
  });

  it("rekent over een maandgrens heen", () => {
    expect(herroepingUiterlijk("2026-08-25")).toBe("2026-09-08");
  });
});

describe("datumnotatie", () => {
  it("schrijft dd-mm-jjjj", () => {
    expect(formatteerNl("2026-08-05")).toBe("05-08-2026");
  });
});
