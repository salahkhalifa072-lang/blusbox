import { describe, expect, it } from "vitest";
import {
  BEDENKTIJD_DAGEN,
  beoordeelSlug,
  commissieCenten,
  commissieNaTerugbetaling,
  grondslagCenten,
  haaltDrempel,
  isZelfverwijzing,
  klikIsGeldig,
  rijpOp,
  slugVoorstel,
  STANDAARD_ATTRIBUTIE_DAGEN,
  STANDAARD_PERCENTAGE_BP,
  veiligDoelPad,
} from "./rekenen";

const DAG = 24 * 60 * 60 * 1000;

describe("grondslag", () => {
  it("telt regels op, zonder btw en zonder verzendkosten", () => {
    // 2 × € 24,79 excl. btw — de consumentenprijs van € 29,99 is inclusief
    // btw en mag hier dus niet uitkomen.
    expect(
      grondslagCenten([{ stukprijsExclBtwCenten: 2479, aantal: 2 }]),
    ).toBe(4958);
  });

  it("laat uitgesloten producten weg maar houdt de rest overeind", () => {
    const regels = [
      { stukprijsExclBtwCenten: 2479, aantal: 2 },
      { stukprijsExclBtwCenten: 9900, aantal: 1, uitgesloten: true },
    ];
    expect(grondslagCenten(regels)).toBe(4958);
  });

  it("is nul als alles is uitgesloten", () => {
    expect(
      grondslagCenten([
        { stukprijsExclBtwCenten: 2479, aantal: 3, uitgesloten: true },
      ]),
    ).toBe(0);
  });

  it("is nul bij een lege bestelling", () => {
    expect(grondslagCenten([])).toBe(0);
  });
});

describe("commissiebedrag", () => {
  it("rekent precies 20% over de grondslag", () => {
    expect(commissieCenten(10000, STANDAARD_PERCENTAGE_BP)).toBe(2000);
  });

  it("geeft 20% van twee modules", () => {
    // grondslag 4958 → 991,6 cent → 992
    expect(commissieCenten(4958, 2000)).toBe(992);
  });

  it("rondt af op hele centen, naar boven bij een halve", () => {
    // 2479 × 2000 / 10000 = 495,8
    expect(commissieCenten(2479, 2000)).toBe(496);
    // 2500 × 2500 / 10000 = 625 exact
    expect(commissieCenten(2500, 2500)).toBe(625);
    // 1 × 5000 / 10000 = 0,5 → 1
    expect(commissieCenten(1, 5000)).toBe(1);
  });

  it("verwerkt een afwijkend percentage per affiliate", () => {
    expect(commissieCenten(10000, 2500)).toBe(2500);
    expect(commissieCenten(10000, 1000)).toBe(1000);
  });

  it("is nul bij een lege of negatieve grondslag", () => {
    expect(commissieCenten(0, 2000)).toBe(0);
    expect(commissieCenten(-500, 2000)).toBe(0);
  });

  it("is nul bij nul procent", () => {
    expect(commissieCenten(10000, 0)).toBe(0);
  });

  it("levert nooit een bedrag met decimalen op", () => {
    for (const grondslag of [1, 7, 333, 2479, 4958, 99999]) {
      const bedrag = commissieCenten(grondslag, 2000);
      expect(Number.isInteger(bedrag)).toBe(true);
    }
  });
});

describe("terugbetalingen", () => {
  it("laat niets over bij een volledige terugbetaling", () => {
    expect(
      commissieNaTerugbetaling({
        oorspronkelijkeGrondslagCenten: 4958,
        terugbetaaldeGrondslagCenten: 4958,
        oorspronkelijkeCommissieCenten: 992,
      }),
    ).toBe(0);
  });

  it("halveert de commissie als de helft terugkomt", () => {
    expect(
      commissieNaTerugbetaling({
        oorspronkelijkeGrondslagCenten: 4958,
        terugbetaaldeGrondslagCenten: 2479,
        oorspronkelijkeCommissieCenten: 992,
      }),
    ).toBe(496);
  });

  it("laat alles staan als er niets terugkomt", () => {
    expect(
      commissieNaTerugbetaling({
        oorspronkelijkeGrondslagCenten: 4958,
        terugbetaaldeGrondslagCenten: 0,
        oorspronkelijkeCommissieCenten: 992,
      }),
    ).toBe(992);
  });

  it("kan niet meer terugdraaien dan er was", () => {
    expect(
      commissieNaTerugbetaling({
        oorspronkelijkeGrondslagCenten: 4958,
        terugbetaaldeGrondslagCenten: 99999,
        oorspronkelijkeCommissieCenten: 992,
      }),
    ).toBe(0);
  });

  it("negeert een negatief terugbetaald bedrag", () => {
    expect(
      commissieNaTerugbetaling({
        oorspronkelijkeGrondslagCenten: 4958,
        terugbetaaldeGrondslagCenten: -100,
        oorspronkelijkeCommissieCenten: 992,
      }),
    ).toBe(992);
  });
});

describe("attributieperiode", () => {
  const nu = new Date("2026-10-01T12:00:00Z");

  it("telt een verse klik mee", () => {
    expect(
      klikIsGeldig({
        klikOp: new Date(nu.getTime() - 1000),
        nu,
        attributieDagen: STANDAARD_ATTRIBUTIE_DAGEN,
      }),
    ).toBe(true);
  });

  it("telt een klik van precies dertig dagen oud nog mee", () => {
    expect(
      klikIsGeldig({
        klikOp: new Date(nu.getTime() - 30 * DAG),
        nu,
        attributieDagen: 30,
      }),
    ).toBe(true);
  });

  it("laat een klik van dertig dagen en een seconde vervallen", () => {
    expect(
      klikIsGeldig({
        klikOp: new Date(nu.getTime() - 30 * DAG - 1000),
        nu,
        attributieDagen: 30,
      }),
    ).toBe(false);
  });

  it("wantrouwt een klik uit de toekomst", () => {
    expect(
      klikIsGeldig({
        klikOp: new Date(nu.getTime() + 60_000),
        nu,
        attributieDagen: 30,
      }),
    ).toBe(false);
  });
});

describe("rijpdatum", () => {
  const betaald = new Date("2026-10-01T12:00:00Z");

  it("rekent veertien dagen vanaf levering, niet vanaf bestelling", () => {
    const geleverd = new Date("2026-10-05T09:00:00Z");
    const rijp = rijpOp({ geleverdOp: geleverd, balieverkoop: false, betaaldOp: betaald });
    expect(rijp?.toISOString()).toBe(
      new Date(geleverd.getTime() + BEDENKTIJD_DAGEN * DAG).toISOString(),
    );
  });

  it("heeft geen rijpdatum zolang er niet geleverd is", () => {
    expect(
      rijpOp({ geleverdOp: null, balieverkoop: false, betaaldOp: betaald }),
    ).toBeNull();
  });

  it("is bij balieverkoop meteen rijp: geen koop op afstand", () => {
    expect(
      rijpOp({ geleverdOp: null, balieverkoop: true, betaaldOp: betaald })?.toISOString(),
    ).toBe(betaald.toISOString());
  });
});

describe("zelfverwijzing", () => {
  const affiliate = {
    affiliateUserId: "aff-1",
    affiliateEmail: "partner@example.nl",
  };

  it("herkent dezelfde ingelogde gebruiker", () => {
    expect(
      isZelfverwijzing({
        ...affiliate,
        bestellerUserId: "aff-1",
        bestellerEmail: "anders@example.nl",
      }),
    ).toBe(true);
  });

  it("herkent hetzelfde e-mailadres, ongeacht hoofdletters en spaties", () => {
    expect(
      isZelfverwijzing({
        ...affiliate,
        bestellerUserId: null,
        bestellerEmail: "  Partner@Example.NL ",
      }),
    ).toBe(true);
  });

  it("laat een gewone klant met rust", () => {
    expect(
      isZelfverwijzing({
        ...affiliate,
        bestellerUserId: "klant-9",
        bestellerEmail: "klant@example.nl",
      }),
    ).toBe(false);
  });

  it("slaat niet aan op een lege bestelling zonder e-mailadres", () => {
    expect(
      isZelfverwijzing({
        affiliateUserId: "aff-1",
        affiliateEmail: "",
        bestellerUserId: null,
        bestellerEmail: null,
      }),
    ).toBe(false);
  });
});

describe("uitbetalingsdrempel", () => {
  it("betaalt uit vanaf precies vijftig euro", () => {
    expect(haaltDrempel(5000, 5000)).toBe(true);
  });

  it("houdt een bedrag eronder vast", () => {
    expect(haaltDrempel(4999, 5000)).toBe(false);
  });

  it("betaalt nooit nul uit", () => {
    expect(haaltDrempel(0, 0)).toBe(false);
  });
});

describe("slugs", () => {
  it("accepteert een normale naam", () => {
    expect(beoordeelSlug("jan-de-vries").geldig).toBe(true);
    expect(beoordeelSlug("partner123").geldig).toBe(true);
  });

  it("weigert te kort, te lang en rare tekens", () => {
    expect(beoordeelSlug("ab").geldig).toBe(false);
    expect(beoordeelSlug("a".repeat(33)).geldig).toBe(false);
    expect(beoordeelSlug("Jan de Vries").geldig).toBe(false);
    expect(beoordeelSlug("jan_de_vries").geldig).toBe(false);
    expect(beoordeelSlug("-jan").geldig).toBe(false);
    expect(beoordeelSlug("jan-").geldig).toBe(false);
  });

  it("weigert woorden die met routes botsen", () => {
    for (const woord of ["admin", "api", "dashboard", "blusbox", "r"]) {
      expect(beoordeelSlug(woord).geldig).toBe(false);
    }
  });

  it("maakt een bruikbaar voorstel uit een naam met accenten", () => {
    expect(slugVoorstel("José Álvarez")).toBe("jose-alvarez");
    expect(slugVoorstel("Blus & Co B.V.")).toBe("blus-co-b-v");
  });

  it("levert altijd iets bruikbaars op", () => {
    const voorstel = slugVoorstel("!!");
    expect(voorstel.length).toBeGreaterThanOrEqual(3);
    expect(beoordeelSlug(voorstel).geldig).toBe(true);
  });
});

describe("doelpad", () => {
  it("laat een gewoon intern pad door", () => {
    expect(veiligDoelPad("/blusbox")).toBe("/blusbox");
    expect(veiligDoelPad("/zakelijk?x=1")).toBe("/zakelijk?x=1");
  });

  it("weigert een externe URL", () => {
    expect(veiligDoelPad("https://kwaadaardig.example")).toBe("/");
    expect(veiligDoelPad("http://kwaadaardig.example")).toBe("/");
  });

  it("weigert een protocol-relatief pad", () => {
    // Ziet eruit als een pad, is het niet: //host gaat naar een ander domein.
    expect(veiligDoelPad("//kwaadaardig.example")).toBe("/");
    expect(veiligDoelPad("///kwaadaardig.example")).toBe("/");
  });

  it("weigert javascript- en backslash-trucs", () => {
    expect(veiligDoelPad("/\\kwaadaardig.example")).toBe("/");
    expect(veiligDoelPad("/javascript:alert(1)")).toBe("/");
  });

  it("valt terug op de homepage bij niets", () => {
    expect(veiligDoelPad(null)).toBe("/");
    expect(veiligDoelPad("")).toBe("/");
    expect(veiligDoelPad("blusbox")).toBe("/");
  });
});
