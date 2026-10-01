import { describe, expect, it } from "vitest";
import { naKorting, zoekKortingscode } from "./kortingscode";
import { berekenWagen } from "./winkelwagen";
import { PRIJS_INCL_CENTEN } from "./pricing";

const consument = { landcode: "NL", isZakelijk: false, btwIdGevalideerd: false };

describe("zoekKortingscode", () => {
  it("herkent glasvezel20, ongeacht hoofdletters en spaties", () => {
    for (const invoer of ["glasvezel20", "GLASVEZEL20", " Glasvezel 20 "]) {
      expect(zoekKortingscode(invoer)).toEqual({ code: "GLASVEZEL20", percentage: 20 });
    }
  });

  it("weigert alles wat niet precies de code is", () => {
    for (const invoer of ["", "glasvezel", "glasvezel21", "glasvezel200", "x".repeat(500)]) {
      expect(zoekKortingscode(invoer)).toBeNull();
    }
    expect(zoekKortingscode(undefined)).toBeNull();
  });
});

describe("naKorting", () => {
  it("rondt per stuk af op hele centen", () => {
    expect(naKorting(2999, 20)).toBe(2399);
    expect(naKorting(2999, 0)).toBe(2999);
  });
});

describe("berekenWagen met kortingscode", () => {
  const wagen = { regels: [{ slug: "blusbox", aantal: 3 }] };
  const code = zoekKortingscode("glasvezel20");

  it("rekent 20% minder, en het kortingsbedrag is precies het verschil", () => {
    const zonder = berekenWagen(wagen, consument);
    const met = berekenWagen(wagen, { ...consument, korting: code });

    expect(zonder.totalen.totaalInclBtwCenten).toBe(3 * PRIJS_INCL_CENTEN);
    expect(met.totalen.totaalInclBtwCenten).toBe(3 * naKorting(PRIJS_INCL_CENTEN, 20));
    expect(met.korting?.bedragCenten).toBe(
      zonder.totalen.totaalInclBtwCenten - met.totalen.totaalInclBtwCenten,
    );
    expect(met.korting?.code).toBe("GLASVEZEL20");
    // btw klopt nog steeds op de cent met het totaal
    expect(met.totalen.subtotaalExclBtwCenten + met.totalen.btwBedragCenten).toBe(
      met.totalen.totaalInclBtwCenten,
    );
  });

  it("geeft de stukprijzen na korting door, voor Stripe en de orderregels", () => {
    const met = berekenWagen(wagen, { ...consument, korting: code });
    expect(met.regels[0].stukprijsInclBtwCenten).toBe(naKorting(PRIJS_INCL_CENTEN, 20));
    expect(met.regels[0].stukprijsInclBtwCenten! * 3).toBe(met.totalen.totaalInclBtwCenten);
  });

  it("laat de prijs met rust zonder code", () => {
    const zonder = berekenWagen(wagen, { ...consument, korting: null });
    expect(zonder.korting).toBeNull();
    expect(zonder.regels[0].stukprijsInclBtwCenten).toBe(PRIJS_INCL_CENTEN);
  });
});
