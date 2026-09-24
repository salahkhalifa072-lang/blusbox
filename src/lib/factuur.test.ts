import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { StandardFonts } from "pdf-lib";
import {
  berekenFactuur,
  datumNl,
  maakTekenbaar,
  toonPostcode,
  leesBedrag,
  maakFactuurPdf,
  vervaldatum,
  volgendFactuurnummer,
} from "./factuur";

describe("berekenFactuur", () => {
  it("rekent vanaf de brutoprijs, zodat het totaal op de cent klopt", () => {
    const f = berekenFactuur([
      { naam: "Blusbox", aantal: 2, stukprijsInclBtwCenten: 2999, btwPercentage: 21 },
    ]);
    expect(f.totaalInclBtwCenten).toBe(5998);
    expect(f.subtotaalExclBtwCenten + f.btwBedragCenten).toBe(5998);
    expect(f.subtotaalExclBtwCenten).toBe(4957);
    expect(f.btwBedragCenten).toBe(1041);
    expect(f.regels[0].stukprijsExclBtwCenten).toBe(2479);
  });

  it("telt meerdere regels op", () => {
    const f = berekenFactuur([
      { naam: "A", aantal: 1, stukprijsInclBtwCenten: 2999, btwPercentage: 21 },
      { naam: "B", aantal: 3, stukprijsInclBtwCenten: 2500, btwPercentage: 21 },
    ]);
    expect(f.totaalInclBtwCenten).toBe(2999 + 7500);
    expect(f.subtotaalExclBtwCenten + f.btwBedragCenten).toBe(f.totaalInclBtwCenten);
  });
});

describe("volgendFactuurnummer", () => {
  it("begint elk jaar bij 1", () => {
    expect(volgendFactuurnummer(2026, null)).toBe("F-2026-0001");
    expect(volgendFactuurnummer(2027, "F-2026-0042")).toBe("F-2027-0001");
  });
  it("volgt op het hoogste nummer", () => {
    expect(volgendFactuurnummer(2026, "F-2026-0009")).toBe("F-2026-0010");
  });
});

describe("leesBedrag", () => {
  it("leest Nederlandse en Engelse notatie", () => {
    expect(leesBedrag("29,99")).toBe(2999);
    expect(leesBedrag("€ 29.99")).toBe(2999);
    expect(leesBedrag("30")).toBe(3000);
  });
  it("weigert wat geen bedrag is", () => {
    expect(leesBedrag("")).toBeNull();
    expect(leesBedrag("29,999")).toBeNull();
    expect(leesBedrag("-5")).toBeNull();
    expect(leesBedrag("abc")).toBeNull();
  });
});

describe("vervaldatum", () => {
  it("ligt veertien dagen na de factuurdatum, ook over de maandgrens", () => {
    expect(vervaldatum("2026-09-24")).toBe("2026-10-08");
  });
});

describe("maakFactuurPdf", () => {
  it("levert een geldige pdf van één pagina op", async () => {
    const bytes = await maakFactuurPdf({
      factuurnummer: "F-2026-0001",
      ordernummer: "BB-2026-000007",
      factuurdatum: "2026-09-24",
      leverdatum: "2026-09-23",
      leverancier: {
        naam: "Blusbox.nl",
        straat: "Teststraat",
        huisnummer: "1",
        postcode: "1234 AB",
        plaats: "Teststad",
        landcode: "NL",
        telefoon: "+31 6 00000000",
        email: "info@blusbox.nl",
      },
      klant: {
        naam: "Jan Jansen",
        bedrijfsnaam: "Jansen Installatie B.V.",
        straat: "Kerkstraat",
        huisnummer: "12a",
        postcode: "3511 AB",
        plaats: "Utrecht",
      },
      totalen: berekenFactuur([
        { naam: "Blusbox blusmodule", aantal: 2, stukprijsInclBtwCenten: 2999, btwPercentage: 21 },
      ]),
      betaald: false,
      betaalUrl: "https://blusbox.nl/betalen/abc",
    });
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getTitle()).toContain("F-2026-0001");
  });

  it("kan namen aan die buiten het standaardlettertype vallen", async () => {
    const bytes = await maakFactuurPdf({
      factuurnummer: "F-2026-0002",
      ordernummer: "BB-2026-000008",
      factuurdatum: "2026-09-24",
      leverdatum: "2026-09-24",
      leverancier: {
        naam: "Blusbox.nl",
        straat: "Teststraat",
        huisnummer: "1",
        postcode: "1234 AB",
        plaats: "Teststad",
        landcode: "NL",
        telefoon: "+31 6 00000000",
        email: "info@blusbox.nl",
      },
      klant: {
        naam: "Şükrü Yılmaz — Łukasz Wiśniewski 李",
        straat: "Çiçekstraat",
        huisnummer: "3",
        postcode: "1011 AB",
        plaats: "Amsterdam",
      },
      totalen: berekenFactuur([
        { naam: "Blusbox blusmodule", aantal: 1, stukprijsInclBtwCenten: 2999, btwPercentage: 21 },
      ]),
      betaald: true,
    });
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  });
});

describe("maakTekenbaar", () => {
  it("valt terug op de basisletter en houdt Nederlandse letters", async () => {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    expect(maakTekenbaar("Şükrü Łukasz Yılmaz", font)).toBe("Sükrü Lukasz Yilmaz");
    expect(maakTekenbaar("Één café, € 29,99", font)).toBe("Één café, € 29,99");
    expect(maakTekenbaar("李", font)).toBe("?");
  });
});

describe("datumNl", () => {
  it("geeft de Nederlandse kalenderdatum, niet die in UTC", () => {
    // 23:30 UTC op 24 september is in Nederland al 25 september
    expect(datumNl(new Date("2026-09-24T23:30:00Z"))).toBe("2026-09-25");
    // en op oudejaarsavond is het in Nederland al het nieuwe jaar
    expect(datumNl(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
  });
});

describe("toonPostcode", () => {
  it("zet de spatie in een Nederlandse postcode en laat de rest met rust", () => {
    expect(toonPostcode("3511ab")).toBe("3511 AB");
    expect(toonPostcode("3511 AB")).toBe("3511 AB");
    expect(toonPostcode("B-1000")).toBe("B-1000");
  });
});
