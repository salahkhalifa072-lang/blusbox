import { describe, expect, it } from "vitest";
import {
  bepaalKoperType,
  berekenTotalen,
  btwVerlegd,
  exclBtw,
  inclBtw,
  isEuLand,
  prijsWeergave,
  rondAf,
} from "./btw";
import { PRIJS_EXCL_CENTEN, PRIJS_INCL_CENTEN } from "./pricing";

describe("btw-berekening", () => {
  it("rekent 21% btw over een enkele regel", () => {
    const t = berekenTotalen(
      [{ aantal: 1, stukprijsExclBtwCenten: 2227, btwPercentage: 21 }],
      { landcode: "NL", isZakelijk: false, btwIdGevalideerd: false },
    );
    expect(t.subtotaalExclBtwCenten).toBe(2227);
    expect(t.btwBedragCenten).toBe(468);
    expect(t.totaalInclBtwCenten).toBe(2695);
  });

  it("komt uit op de gepubliceerde consumentenprijs", () => {
    // The site advertises € 26,95 incl. — the stored excl. price must
    // round-trip to exactly that, or the PDP and the invoice disagree.
    expect(inclBtw(PRIJS_EXCL_CENTEN)).toBe(PRIJS_INCL_CENTEN);
    expect(exclBtw(PRIJS_INCL_CENTEN)).toBe(PRIJS_EXCL_CENTEN);
  });

  it("rondt btw per regel af, niet per stuk", () => {
    // Per unit: 2227 * 0.21 = 467.67 -> 468, times 3 = 1404.
    // Per line:  6681 * 0.21 = 1403.01 -> 1403. The line total is correct.
    const t = berekenTotalen(
      [{ aantal: 3, stukprijsExclBtwCenten: 2227, btwPercentage: 21 }],
      { landcode: "NL", isZakelijk: false, btwIdGevalideerd: false },
    );
    expect(t.subtotaalExclBtwCenten).toBe(6681);
    expect(t.btwBedragCenten).toBe(1403);
    expect(t.totaalInclBtwCenten).toBe(8084);
  });

  it("telt meerdere regels op", () => {
    const t = berekenTotalen(
      [
        { aantal: 2, stukprijsExclBtwCenten: 2227, btwPercentage: 21 },
        { aantal: 1, stukprijsExclBtwCenten: 1000, btwPercentage: 21 },
      ],
      { landcode: "NL", isZakelijk: false, btwIdGevalideerd: false },
    );
    expect(t.subtotaalExclBtwCenten).toBe(5454);
    expect(t.btwBedragCenten).toBe(935 + 210);
  });

  it("telt verzendkosten mee als die er ooit komen", () => {
    const gratis = berekenTotalen(
      [{ aantal: 1, stukprijsExclBtwCenten: 2227, btwPercentage: 21 }],
      { landcode: "NL", isZakelijk: false, btwIdGevalideerd: false },
    );
    expect(gratis.verzendkostenCenten).toBe(0);
    expect(gratis.totaalInclBtwCenten).toBe(2695);

    const betaald = berekenTotalen(
      [{ aantal: 1, stukprijsExclBtwCenten: 2227, btwPercentage: 21 }],
      {
        landcode: "NL",
        isZakelijk: false,
        btwIdGevalideerd: false,
        verzendkostenCenten: 600,
      },
    );
    expect(betaald.totaalInclBtwCenten).toBe(3295);
  });

  it("rondt half naar boven, ook bij negatieve bedragen", () => {
    expect(rondAf(0.5)).toBe(1);
    expect(rondAf(1.5)).toBe(2);
    expect(rondAf(-0.5)).toBe(-1);
    expect(rondAf(-1.5)).toBe(-2);
  });
});

describe("btw-verlegging", () => {
  it("verlegt niet bij een consument", () => {
    expect(
      btwVerlegd({ landcode: "DE", isZakelijk: false, btwIdGevalideerd: true }),
    ).toBe(false);
  });

  it("verlegt niet binnen Nederland", () => {
    expect(
      btwVerlegd({ landcode: "NL", isZakelijk: true, btwIdGevalideerd: true }),
    ).toBe(false);
  });

  it("verlegt bij een zakelijke EU-koper met gevalideerd btw-nummer", () => {
    expect(
      btwVerlegd({ landcode: "BE", isZakelijk: true, btwIdGevalideerd: true }),
    ).toBe(true);
  });

  it("verlegt NIET zonder gevalideerd btw-nummer", () => {
    // Without a valid VIES check we charge Dutch btw; the risk of an
    // unverified reverse charge sits with the seller.
    expect(
      btwVerlegd({ landcode: "BE", isZakelijk: true, btwIdGevalideerd: false }),
    ).toBe(false);
  });

  it("rekent geen btw als er verlegd wordt", () => {
    const t = berekenTotalen(
      [{ aantal: 10, stukprijsExclBtwCenten: 2227, btwPercentage: 21 }],
      { landcode: "BE", isZakelijk: true, btwIdGevalideerd: true },
    );
    expect(t.btwVerlegd).toBe(true);
    expect(t.btwBedragCenten).toBe(0);
    expect(t.totaalInclBtwCenten).toBe(22270);
  });

  it("herkent kopertypes", () => {
    const zakelijk = { isZakelijk: true, btwIdGevalideerd: true };
    expect(bepaalKoperType({ landcode: "NL", ...zakelijk })).toBe("zakelijk_nl");
    expect(bepaalKoperType({ landcode: "DE", ...zakelijk })).toBe("zakelijk_eu");
    expect(bepaalKoperType({ landcode: "GB", ...zakelijk })).toBe(
      "zakelijk_buiten_eu",
    );
    expect(
      bepaalKoperType({
        landcode: "NL",
        isZakelijk: false,
        btwIdGevalideerd: false,
      }),
    ).toBe("consument");
  });

  it("kent het VK niet meer als EU-land", () => {
    expect(isEuLand("GB")).toBe(false);
    expect(isEuLand("be")).toBe(true);
  });
});

describe("prijsweergave per accounttype", () => {
  it("toont consumenten inclusief btw", () => {
    expect(prijsWeergave("klant")).toEqual({
      toon: "incl",
      toelichting: "incl. btw",
    });
  });

  it("toont zakelijke accounts exclusief btw", () => {
    for (const rol of ["installateur", "admin", "operations"] as const) {
      expect(prijsWeergave(rol).toon).toBe("excl");
    }
  });

  it("toont nooit beide tegelijk", () => {
    // §8: never both in one view — the contract is a single mode.
    const modi = (["klant", "installateur"] as const).map(
      (r) => prijsWeergave(r).toon,
    );
    for (const m of modi) expect(["incl", "excl"]).toContain(m);
  });
});
