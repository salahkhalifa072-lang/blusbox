import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { bedrijf, type Verzendadres } from "./bedrijf";
import { exclBtw, splitsIncl } from "./btw";
import { euro } from "./pricing";
import { formatteerNl, type IsoDatum } from "./levensduur";

/**
 * Factuur voor een balieverkoop: de klant heeft de module al meegenomen en
 * betaalt achteraf via een link in de mail.
 *
 * Wat er op moet staat in art. 35a Wet OB 1968: factuurdatum, een
 * doorlopend nummer, naam, adres en btw-id van de leverancier, naam en
 * adres van de afnemer, aard en hoeveelheid, leverdatum, eenheidsprijs
 * excl. btw, het tarief en het btw-bedrag. Ontbreekt er één, dan is het
 * voor een zakelijke afnemer geen factuur waarop hij btw kan aftrekken.
 */

/** Consumenten krijgen twee weken; de AV geven zakelijke afnemers er dertig. */
export const BETAALTERMIJN_DAGEN = 14;

export type FactuurRegelInvoer = {
  naam: string;
  aantal: number;
  /** Wat er met de klant is afgesproken, per stuk, incl. btw */
  stukprijsInclBtwCenten: number;
  btwPercentage: number;
};

export type FactuurRegel = FactuurRegelInvoer & {
  stukprijsExclBtwCenten: number;
  regelExclBtwCenten: number;
  regelBtwCenten: number;
  regelInclBtwCenten: number;
};

export type FactuurTotalen = {
  regels: FactuurRegel[];
  subtotaalExclBtwCenten: number;
  btwBedragCenten: number;
  totaalInclBtwCenten: number;
};

/**
 * Van brutobedrag naar netto en btw, per regel.
 *
 * Aan de balie is de afgesproken prijs incl. btw de waarheid — de klant
 * heeft "€ 29,99" gehoord, niet "€ 24,79 plus btw". Daarom wordt er
 * teruggerekend vanaf het regeltotaal, net als bij de webshop (zie
 * splitsIncl): zo klopt het te betalen bedrag altijd op de cent.
 */
export function berekenFactuur(invoer: FactuurRegelInvoer[]): FactuurTotalen {
  const regels = invoer.map((r) => {
    const regelIncl = r.aantal * r.stukprijsInclBtwCenten;
    const { exclCenten, btwCenten } = splitsIncl(regelIncl, r.btwPercentage);
    return {
      ...r,
      stukprijsExclBtwCenten: exclBtw(r.stukprijsInclBtwCenten, r.btwPercentage),
      regelExclBtwCenten: exclCenten,
      regelBtwCenten: btwCenten,
      regelInclBtwCenten: regelIncl,
    };
  });

  const som = (f: (r: FactuurRegel) => number) =>
    regels.reduce((t, r) => t + f(r), 0);

  return {
    regels,
    subtotaalExclBtwCenten: som((r) => r.regelExclBtwCenten),
    btwBedragCenten: som((r) => r.regelBtwCenten),
    totaalInclBtwCenten: som((r) => r.regelInclBtwCenten),
  };
}

/** "29,99", "29.99" of "€ 29,99" naar centen; null als het geen bedrag is. */
export function leesBedrag(invoer: string): number | null {
  const schoon = invoer.replace(/[€\s]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(schoon)) return null;
  return Math.round(Number(schoon) * 100);
}

/** F-2026-0001 — volgt op het hoogste nummer van dat jaar. */
export function volgendFactuurnummer(
  jaar: number,
  hoogste: string | null | undefined,
): string {
  const prefix = `F-${jaar}-`;
  const vorig =
    hoogste && hoogste.startsWith(prefix)
      ? Number(hoogste.slice(prefix.length))
      : 0;
  const volgend = (Number.isFinite(vorig) ? vorig : 0) + 1;
  return prefix + String(volgend).padStart(4, "0");
}

export function vervaldatum(factuurdatum: IsoDatum): IsoDatum {
  const [j, m, d] = factuurdatum.split("-").map(Number);
  const dt = new Date(Date.UTC(j, m - 1, d + BETAALTERMIJN_DAGEN));
  return dt.toISOString().slice(0, 10);
}

export type FactuurGegevens = {
  factuurnummer: string;
  ordernummer: string;
  factuurdatum: IsoDatum;
  leverdatum: IsoDatum;
  leverancier: Verzendadres;
  klant: {
    naam: string;
    bedrijfsnaam?: string | null;
    straat: string;
    huisnummer: string;
    postcode: string;
    plaats: string;
  };
  totalen: FactuurTotalen;
  betaald: boolean;
  betaalUrl?: string;
};

/** Zelfde eenvoudige woordafbreking als het herroepingsformulier. */
function breekAf(tekst: string, font: PDFFont, grootte: number, breedte: number) {
  const regels: string[] = [];
  let huidig = "";
  for (const woord of tekst.split(" ")) {
    const kandidaat = huidig ? `${huidig} ${woord}` : woord;
    if (font.widthOfTextAtSize(kandidaat, grootte) > breedte && huidig) {
      regels.push(huidig);
      huidig = woord;
    } else {
      huidig = kandidaat;
    }
  }
  if (huidig) regels.push(huidig);
  return regels;
}

export async function maakFactuurPdf(f: FactuurGegevens): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Factuur ${f.factuurnummer} — Blusbox`);
  pdf.setLanguage("nl-NL");

  const pagina = pdf.addPage([595.28, 841.89]); // A4
  const gewoon = await pdf.embedFont(StandardFonts.Helvetica);
  const vet = await pdf.embedFont(StandardFonts.HelveticaBold);

  const marge = 56;
  const rechts = pagina.getWidth() - marge;
  const zwart = rgb(0.086, 0.094, 0.102); // --antraciet
  const grijs = rgb(0.45, 0.47, 0.49);
  const rail = rgb(0.61, 0.63, 0.65); // --railstaal

  const tekst = (
    t: string,
    x: number,
    y: number,
    o: { font?: PDFFont; grootte?: number; kleur?: typeof zwart; rechts?: boolean } = {},
  ) => {
    const font = o.font ?? gewoon;
    const grootte = o.grootte ?? 10;
    const breedte = font.widthOfTextAtSize(t, grootte);
    pagina.drawText(t, {
      x: o.rechts ? x - breedte : x,
      y,
      size: grootte,
      font,
      color: o.kleur ?? zwart,
    });
  };
  const lijn = (y: number) =>
    pagina.drawLine({
      start: { x: marge, y },
      end: { x: rechts, y },
      thickness: 0.75,
      color: rail,
    });

  let y = pagina.getHeight() - marge;

  // Kop: leverancier links, "Factuur" rechts
  tekst("BLUSBOX", marge, y, { font: vet, grootte: 16 });
  tekst("Factuur", rechts, y, { font: vet, grootte: 16, rechts: true });
  y -= 22;

  const lev = f.leverancier;
  const leverancierRegels = [
    bedrijf.volledig,
    `${lev.straat} ${lev.huisnummer}`,
    `${lev.postcode} ${lev.plaats}`,
    `KvK ${bedrijf.kvk}`,
    `Btw-id ${bedrijf.btwId}`,
    `${bedrijf.telefoon} · ${bedrijf.email}`,
  ];
  const kenmerken: [string, string][] = [
    ["Factuurnummer", f.factuurnummer],
    ["Factuurdatum", formatteerNl(f.factuurdatum)],
    ["Leverdatum", formatteerNl(f.leverdatum)],
    ["Vervaldatum", formatteerNl(vervaldatum(f.factuurdatum))],
    ["Bestelnummer", f.ordernummer],
  ];

  const kopY = y;
  for (const r of leverancierRegels) {
    tekst(r, marge, y, { grootte: 9, kleur: grijs });
    y -= 13;
  }
  let ky = kopY;
  for (const [label, waarde] of kenmerken) {
    tekst(label, rechts - 110, ky, { grootte: 9, kleur: grijs, rechts: true });
    tekst(waarde, rechts, ky, { grootte: 9, rechts: true });
    ky -= 13;
  }
  y = Math.min(y, ky) - 20;

  // Afnemer
  tekst("Aan", marge, y, { font: vet, grootte: 10 });
  y -= 15;
  const k = f.klant;
  for (const r of [
    k.bedrijfsnaam || null,
    k.bedrijfsnaam ? `t.a.v. ${k.naam}` : k.naam,
    `${k.straat} ${k.huisnummer}`,
    `${k.postcode} ${k.plaats}`,
  ].filter((r): r is string => Boolean(r))) {
    tekst(r, marge, y);
    y -= 14;
  }
  y -= 22;

  // Regels
  const kol = {
    omschrijving: marge,
    aantal: marge + 250,
    stuk: marge + 330,
    btw: marge + 390,
    bedrag: rechts,
  };
  const kopjes: [string, number, boolean][] = [
    ["Omschrijving", kol.omschrijving, false],
    ["Aantal", kol.aantal, true],
    ["Stukprijs excl.", kol.stuk, true],
    ["Btw", kol.btw, true],
    ["Bedrag excl. btw", kol.bedrag, true],
  ];
  for (const [t, x, r] of kopjes) {
    tekst(t, x, y, { font: vet, grootte: 9, rechts: r });
  }
  y -= 8;
  lijn(y);
  y -= 16;

  for (const r of f.totalen.regels) {
    const naamRegels = breekAf(r.naam, gewoon, 10, kol.aantal - kol.omschrijving - 40);
    tekst(naamRegels[0], kol.omschrijving, y);
    tekst(String(r.aantal), kol.aantal, y, { rechts: true });
    tekst(euro(r.stukprijsExclBtwCenten), kol.stuk, y, { rechts: true });
    tekst(`${r.btwPercentage}%`, kol.btw, y, { rechts: true });
    tekst(euro(r.regelExclBtwCenten), kol.bedrag, y, { rechts: true });
    for (const vervolg of naamRegels.slice(1)) {
      y -= 13;
      tekst(vervolg, kol.omschrijving, y);
    }
    y -= 18;
  }
  lijn(y + 6);
  y -= 12;

  // Totalen, per tarief. Er is er vandaag één; groeperen houdt het
  // correct als dat ooit verandert.
  const perTarief = new Map<number, { excl: number; btw: number }>();
  for (const r of f.totalen.regels) {
    const t = perTarief.get(r.btwPercentage) ?? { excl: 0, btw: 0 };
    t.excl += r.regelExclBtwCenten;
    t.btw += r.regelBtwCenten;
    perTarief.set(r.btwPercentage, t);
  }

  const totaalRegel = (label: string, bedrag: string, nadruk = false) => {
    tekst(label, kol.btw, y, { rechts: true, font: nadruk ? vet : gewoon });
    tekst(bedrag, kol.bedrag, y, { rechts: true, font: nadruk ? vet : gewoon });
    y -= 16;
  };
  totaalRegel("Subtotaal excl. btw", euro(f.totalen.subtotaalExclBtwCenten));
  for (const [tarief, t] of perTarief) {
    totaalRegel(`Btw ${tarief}% over ${euro(t.excl)}`, euro(t.btw));
  }
  y -= 2;
  totaalRegel("Totaal incl. btw", euro(f.totalen.totaalInclBtwCenten), true);
  y -= 24;

  // Betaling
  const breedte = rechts - marge;
  const alinea = (t: string, o: { font?: PDFFont; kleur?: typeof zwart } = {}) => {
    for (const r of breekAf(t, o.font ?? gewoon, 10, breedte)) {
      tekst(r, marge, y, { font: o.font, kleur: o.kleur });
      y -= 14;
    }
  };

  if (f.betaald) {
    alinea("Deze factuur is voldaan. Dank je wel.", { font: vet });
  } else {
    alinea(
      `Graag voldoen vóór ${formatteerNl(vervaldatum(f.factuurdatum))} via de betaallink in de e-mail bij deze factuur (iDEAL, kaart of een andere methode op de betaalpagina).`,
    );
    if (f.betaalUrl) {
      y -= 2;
      alinea(f.betaalUrl, { kleur: grijs });
    }
    y -= 4;
    alinea(`Vermeld bij vragen het factuurnummer ${f.factuurnummer}.`, {
      kleur: grijs,
    });
  }

  y -= 10;
  alinea(
    "Aankoop ter plaatse; het product is bij aankoop meegegeven. Garantie volgens onze algemene voorwaarden.",
    { kleur: grijs },
  );

  return pdf.save();
}
