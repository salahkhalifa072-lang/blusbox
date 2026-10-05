import { describe, expect, it } from "vitest";
import {
  MAX_PERCENTAGE_BP,
  beoordeelCode,
  kortingCenten,
  naKorting,
  normaliseerCode,
  toonPercentage,
  type Kortingscode,
} from "./korting";
import { PRIJS_EXCL_CENTEN, PRIJS_INCL_CENTEN } from "./pricing";
import { berekenTotalen, splitsIncl } from "./btw";
import { berekenWagen } from "./winkelwagen";
import { ROOKMELDER_SLUG } from "./catalogus";

function code(aanpassing: Partial<Kortingscode> = {}): Kortingscode {
  return {
    code: "glasvezel20",
    omschrijving: null,
    percentageBp: 2000,
    actief: true,
    geldigTot: null,
    maxGebruik: null,
    aantalGebruikt: 0,
    ...aanpassing,
  };
}

const NU = new Date("2026-10-01T12:00:00Z");

describe("normaliseerCode", () => {
  it("accepteert wat iemand van een folder overtypt", () => {
    for (const invoer of [
      "glasvezel20",
      "GLASVEZEL20",
      "  Glasvezel20  ",
      "GLASVEZEL 20",
      "glasvezel-20",
      "glasvezel_20",
      "glasvezel.20",
    ]) {
      expect(normaliseerCode(invoer), invoer).toBe("glasvezel20");
    }
  });

  it("begrenst de lengte, zodat een geplakte lap tekst geen query wordt", () => {
    expect(normaliseerCode("x".repeat(500))).toHaveLength(40);
  });
});

describe("beoordeelCode", () => {
  it("laat een gewone geldige code door", () => {
    const oordeel = beoordeelCode(code(), NU);
    expect(oordeel).toEqual({
      geldig: true,
      code: "glasvezel20",
      percentageBp: 2000,
    });
  });

  it("geeft bij een onbekende code dezelfde melding als bij een uitgezette code", () => {
    // Anders kan iemand door de meldingen te vergelijken uitvinden welke
    // codes bestaan, en dat is precies hoe andermans korting gevonden wordt.
    const onbekend = beoordeelCode(null, NU);
    const uit = beoordeelCode(code({ actief: false }), NU);
    expect(onbekend).toEqual(uit);
    expect(onbekend.geldig).toBe(false);
  });

  it("weigert een verlopen code", () => {
    const oordeel = beoordeelCode(
      code({ geldigTot: new Date("2026-09-30T23:59:59Z") }),
      NU,
    );
    expect(oordeel.geldig).toBe(false);
    expect(oordeel.geldig === false && oordeel.reden).toMatch(/verlopen/i);
  });

  it("laat een code op de laatste geldige seconde nog door", () => {
    const oordeel = beoordeelCode(
      code({ geldigTot: new Date("2026-10-01T12:00:01Z") }),
      NU,
    );
    expect(oordeel.geldig).toBe(true);
  });

  it("weigert een code die op is", () => {
    expect(beoordeelCode(code({ maxGebruik: 5, aantalGebruikt: 5 }), NU).geldig).toBe(
      false,
    );
    expect(beoordeelCode(code({ maxGebruik: 5, aantalGebruikt: 4 }), NU).geldig).toBe(
      true,
    );
  });

  it("behandelt geen maximum als onbeperkt", () => {
    expect(
      beoordeelCode(code({ maxGebruik: null, aantalGebruikt: 99_999 }), NU).geldig,
    ).toBe(true);
  });

  it("weigert onzinnige percentages", () => {
    expect(beoordeelCode(code({ percentageBp: 0 }), NU).geldig).toBe(false);
    expect(beoordeelCode(code({ percentageBp: -100 }), NU).geldig).toBe(false);
    expect(
      beoordeelCode(code({ percentageBp: MAX_PERCENTAGE_BP + 1 }), NU).geldig,
    ).toBe(false);
    expect(beoordeelCode(code({ percentageBp: MAX_PERCENTAGE_BP }), NU).geldig).toBe(
      true,
    );
  });
});

describe("kortingCenten", () => {
  it("rekent glasvezel20 op de winkelprijs uit tot een rond bedrag", () => {
    expect(PRIJS_INCL_CENTEN).toBe(4950);
    expect(kortingCenten(PRIJS_INCL_CENTEN, 2000)).toBe(990);
    expect(naKorting(PRIJS_INCL_CENTEN, 2000)).toBe(3960);
  });

  it("rondt één keer af over het hele bedrag", () => {
    // Drie stuks: 14850 × 20% = 2970 precies. Per regel afronden zou hier
    // hetzelfde geven, maar bij een percentage dat niet opgaat niet meer.
    expect(kortingCenten(3 * PRIJS_INCL_CENTEN, 2000)).toBe(2970);
    // 3099 excl. btw × 20% = 619,8 → 620
    expect(kortingCenten(3099, 2000)).toBe(620);
    // halve cent naar boven
    expect(kortingCenten(1, 5000)).toBe(1);
  });

  it("geeft nul terug bij niets te verrekenen", () => {
    expect(kortingCenten(0, 2000)).toBe(0);
    expect(kortingCenten(3750, 0)).toBe(0);
    expect(kortingCenten(-500, 2000)).toBe(0);
  });

  it("laat het restbedrag nooit onder nul zakken", () => {
    expect(naKorting(1000, 20_000)).toBe(0);
  });
});

describe("toonPercentage", () => {
  it("schrijft hele procenten zonder komma", () => {
    expect(toonPercentage(2000)).toBe("20%");
    expect(toonPercentage(500)).toBe("5%");
  });

  it("gebruikt een komma waar dat moet", () => {
    expect(toonPercentage(1250)).toBe("12,5%");
  });
});

describe("afronding blijft sluitend", () => {
  /*
   * De orderregels slaan een stukprijs op; het ordersubtotaal wordt apart
   * bewaard. Lopen die uiteen, dan telt de som van de factuurregels niet
   * op tot het factuurtotaal — en dat merk je pas bij de boekhouding.
   *
   * Dit ging mis bij drie modules, al vóór er kortingscodes bestonden:
   * het regeltotaal in één keer splitsen gaf 9298 terwijl drie keer de
   * gesplitste stukprijs 9297 is. Sinds de consumentenroute per stuk
   * splitst kan dat niet meer, en deze test houdt dat zo.
   */
  it("laat stukprijs × aantal gelijk zijn aan het subtotaal, bij elk aantal en elke korting", () => {
    for (const bp of [0, 2000, 1000, 3333, 1250]) {
      for (const aantal of [1, 2, 3, 4, 7, 10, 99]) {
        const brutoStuk = naKorting(PRIJS_INCL_CENTEN, bp);

        const totalen = berekenTotalen(
          [
            {
              aantal,
              stukprijsExclBtwCenten: naKorting(PRIJS_EXCL_CENTEN, bp),
              stukprijsInclBtwCenten: brutoStuk,
              btwPercentage: 21,
            },
          ],
          { landcode: "NL", isZakelijk: false, btwIdGevalideerd: false },
        );

        // Wat er in order_lines terechtkomt.
        const stukExcl = splitsIncl(brutoStuk, 21).exclCenten;
        const context = `${bp}bp × ${aantal}`;

        expect(stukExcl * aantal, `regels vs subtotaal bij ${context}`).toBe(
          totalen.subtotaalExclBtwCenten,
        );
        expect(
          totalen.subtotaalExclBtwCenten + totalen.btwBedragCenten,
          `optelling bij ${context}`,
        ).toBe(totalen.totaalInclBtwCenten);
        expect(totalen.totaalInclBtwCenten, `brutototaal bij ${context}`).toBe(
          brutoStuk * aantal,
        );
      }
    }
  });
});

describe("rookmelder in hetzelfde mandje", () => {
  /*
   * De rookmelder wordt meeverkocht bij het afrekenen. Een actiecode is
   * voor de Blusbox bedoeld; 20% op een product met een kleine marge
   * maakt hem een verliespost. En hij is geen blusmodule, dus hij hoort
   * niet mee te tellen voor de verzendregels.
   */
  const wagen = {
    regels: [
      { slug: "blusbox", aantal: 1 },
      { slug: ROOKMELDER_SLUG, aantal: 1 },
    ],
  };
  const opts = { landcode: "NL", isZakelijk: false, btwIdGevalideerd: false };

  it("telt zonder code gewoon beide prijzen op", () => {
    const o = berekenWagen(wagen, opts);
    expect(o.totalen.totaalInclBtwCenten).toBe(4950 + 1695);
    expect(o.aantalModules).toBe(1);
    expect(o.aantalArtikelen).toBe(2);
  });

  it("geeft de kortingscode alleen op de Blusbox", () => {
    const o = berekenWagen(wagen, {
      ...opts,
      korting: { code: "glasvezel20", percentageBp: 2000 },
    });
    expect(o.totalen.totaalInclBtwCenten).toBe(3960 + 1695);
    expect(o.korting?.bedragCenten).toBe(990);
  });

  it("houdt regels, subtotaal en btw sluitend", () => {
    const o = berekenWagen(wagen, {
      ...opts,
      korting: { code: "glasvezel20", percentageBp: 2000 },
    });
    const somRegels = o.regels.reduce((s, r) => s + r.regelExclBtwCenten, 0);
    expect(somRegels).toBe(o.totalen.subtotaalExclBtwCenten);
    expect(o.totalen.subtotaalExclBtwCenten + o.totalen.btwBedragCenten).toBe(
      o.totalen.totaalInclBtwCenten,
    );
  });

  it("is een losse rookmelder zonder module toch bestelbaar", () => {
    const o = berekenWagen({ regels: [{ slug: ROOKMELDER_SLUG, aantal: 1 }] }, opts);
    expect(o.aantalModules).toBe(0);
    expect(o.leeg).toBe(false);
    expect(o.totalen.totaalInclBtwCenten).toBe(1695);
  });
});
