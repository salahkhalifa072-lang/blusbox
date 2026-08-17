import { describe, expect, it } from "vitest";
import {
  MAX_AANTAL_PER_REGEL,
  berekenWagen,
  naarCookie,
  normaliseerWagen,
  uitCookie,
  verwijder,
  voegToe,
  wijzigAantal,
} from "./winkelwagen";
import { PRIJS_INCL_CENTEN } from "./pricing";

const nlConsument = {
  landcode: "NL",
  isZakelijk: false,
  btwIdGevalideerd: false,
};

describe("wagen bewerken", () => {
  it("voegt een artikel toe", () => {
    const wagen = voegToe({ regels: [] }, "blusbox");
    expect(wagen.regels).toEqual([{ slug: "blusbox", aantal: 1 }]);
  });

  it("telt hetzelfde artikel op in plaats van te dupliceren", () => {
    let wagen = voegToe({ regels: [] }, "blusbox");
    wagen = voegToe(wagen, "blusbox", 2);
    expect(wagen.regels).toEqual([{ slug: "blusbox", aantal: 3 }]);
  });

  it("wijzigt en verwijdert", () => {
    let wagen = voegToe({ regels: [] }, "blusbox", 5);
    wagen = wijzigAantal(wagen, "blusbox", 2);
    expect(wagen.regels[0].aantal).toBe(2);
    wagen = wijzigAantal(wagen, "blusbox", 0);
    expect(wagen.regels).toHaveLength(0);
  });

  it("verwijdert een onbekend artikel zonder te klagen", () => {
    expect(verwijder({ regels: [] }, "bestaat-niet").regels).toHaveLength(0);
  });
});

describe("normalisatie tegen rommelige invoer", () => {
  it("negeert onbekende slugs", () => {
    const wagen = normaliseerWagen({
      regels: [
        { slug: "blusbox", aantal: 1 },
        { slug: "niet-bestaand", aantal: 3 },
      ],
    });
    expect(wagen.regels).toEqual([{ slug: "blusbox", aantal: 1 }]);
  });

  it("negeert inactieve artikelen", () => {
    // montageset staat op actief: false tot de prijs bekend is
    expect(
      normaliseerWagen({ regels: [{ slug: "montageset", aantal: 1 }] }).regels,
    ).toHaveLength(0);
  });

  it("negeert nul, negatieve en onzinnige aantallen", () => {
    const wagen = normaliseerWagen({
      regels: [
        { slug: "blusbox", aantal: 0 },
        { slug: "vervangmodule", aantal: -5 },
        { slug: "blusbox", aantal: Number.NaN },
      ],
    });
    expect(wagen.regels).toHaveLength(0);
  });

  it("begrenst het aantal per regel", () => {
    const wagen = normaliseerWagen({
      regels: [{ slug: "blusbox", aantal: 100000 }],
    });
    expect(wagen.regels[0].aantal).toBe(MAX_AANTAL_PER_REGEL);
  });

  it("kapt een gebroken aantal af naar een heel getal", () => {
    const wagen = normaliseerWagen({
      regels: [{ slug: "blusbox", aantal: 2.9 }],
    });
    expect(wagen.regels[0].aantal).toBe(2);
  });
});

describe("cookie", () => {
  it("gaat heen en weer zonder verlies", () => {
    const wagen = voegToe(voegToe({ regels: [] }, "blusbox", 2), "vervangmodule");
    expect(uitCookie(naarCookie(wagen))).toEqual(wagen);
  });

  it("levert een lege wagen bij een ontbrekende cookie", () => {
    expect(uitCookie(undefined).regels).toHaveLength(0);
  });

  it("overleeft een beschadigde cookie", () => {
    // A stale or hand-edited cookie must not break the shop.
    for (const rommel of ["", ":::", "blusbox", "blusbox:abc", "<script>"]) {
      expect(() => uitCookie(rommel)).not.toThrow();
    }
    expect(uitCookie("blusbox:abc").regels).toHaveLength(0);
  });

  it("laat een verwijderd artikel stilletjes vallen", () => {
    expect(uitCookie("oud-artikel:3,blusbox:1").regels).toEqual([
      { slug: "blusbox", aantal: 1 },
    ]);
  });
});

describe("wagenberekening", () => {
  it("rekent één module af op de gepubliceerde prijs", () => {
    const overzicht = berekenWagen(
      { regels: [{ slug: "blusbox", aantal: 1 }] },
      nlConsument,
    );
    expect(overzicht.totalen.totaalInclBtwCenten).toBe(PRIJS_INCL_CENTEN);
    expect(overzicht.totalen.verzendkostenCenten).toBe(0);
  });

  it("rekent nooit verzendkosten", () => {
    const overzicht = berekenWagen(
      { regels: [{ slug: "blusbox", aantal: 4 }] },
      nlConsument,
    );
    expect(overzicht.totalen.verzendkostenCenten).toBe(0);
  });

  it("telt de modules in de wagen", () => {
    const overzicht = berekenWagen(
      {
        regels: [
          { slug: "blusbox", aantal: 2 },
          { slug: "vervangmodule", aantal: 1 },
        ],
      },
      { landcode: "NL", isZakelijk: true, btwIdGevalideerd: false },
    );
    expect(overzicht.aantalModules).toBe(3);
  });

  it("legt geen maximum meer op het aantal", () => {
    // Er is geen vervoersbeperking; honderd stuks mag gewoon.
    const overzicht = berekenWagen(
      { regels: [{ slug: "blusbox", aantal: 100 }] },
      { landcode: "NL", isZakelijk: true, btwIdGevalideerd: false },
    );
    expect(overzicht.verzending.toegestaan).toBe(true);
    expect(overzicht.afrekenbaar).toBe(true);
  });

  it("blokkeert afrekenen naar een land waar wij niet leveren", () => {
    const overzicht = berekenWagen(
      { regels: [{ slug: "blusbox", aantal: 1 }] },
      { landcode: "DE", isZakelijk: false, btwIdGevalideerd: false },
    );
    expect(overzicht.afrekenbaar).toBe(false);
  });

  it("blokkeert afrekenen met een lege wagen", () => {
    const overzicht = berekenWagen({ regels: [] }, nlConsument);
    expect(overzicht.leeg).toBe(true);
    expect(overzicht.afrekenbaar).toBe(false);
  });

  it("verlegt btw voor een zakelijke EU-koper met geldig btw-nummer", () => {
    const overzicht = berekenWagen(
      { regels: [{ slug: "blusbox", aantal: 1 }] },
      { landcode: "BE", isZakelijk: true, btwIdGevalideerd: true },
    );
    expect(overzicht.totalen.btwVerlegd).toBe(true);
    expect(overzicht.totalen.btwBedragCenten).toBe(0);
    // ...but it still cannot be shipped there yet
    expect(overzicht.afrekenbaar).toBe(false);
  });
});
