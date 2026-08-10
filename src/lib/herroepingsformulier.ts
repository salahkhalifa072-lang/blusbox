import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * The statutory model withdrawal form (§8).
 *
 * The wording is the official Dutch text of Bijlage I, deel B of Directive
 * 2011/83/EU as published in the Publicatieblad van de EU, L 304/85. It is
 * reproduced verbatim and must not be reworded, shortened or "improved" —
 * a trader may not impose formal requirements beyond the model form, and
 * paraphrasing it would do exactly that.
 *
 * The only thing we fill in is the trader's own details, which the form
 * itself instructs the trader to supply.
 */

/** [VERIFY] until the client supplies the company registration details. */
export const HANDELAAR = {
  naam: "[VERIFY: statutaire naam]",
  adres: "[VERIFY: vestigingsadres]",
  email: "[VERIFY: e-mailadres]",
} as const;

const REGELS: { tekst: string; ruimte: number }[] = [
  {
    tekst:
      "— Aan [hier dient de handelaar zijn naam, adres en, indien van toepassing, zijn fax en e-mailadres in te vullen]:",
    ruimte: 3,
  },
  {
    tekst:
      "— Ik/Wij (*) deel/delen (*) u hierbij mede dat ik/wij (*) onze overeenkomst betreffende de verkoop van de volgende goederen/levering van de volgende dienst (*) herroep/herroepen (*)",
    ruimte: 3,
  },
  { tekst: "— Besteld op (*)/Ontvangen op (*)", ruimte: 2 },
  { tekst: "— Naam/Namen consument(en)", ruimte: 2 },
  { tekst: "— Adres consument(en)", ruimte: 3 },
  {
    tekst:
      "— Handtekening van consument(en) (alleen wanneer dit formulier op papier wordt ingediend)",
    ruimte: 3,
  },
  { tekst: "— Datum", ruimte: 2 },
];

/** Naive word wrap — the fonts here are metric-known, so this is exact. */
function breekAf(
  tekst: string,
  font: import("pdf-lib").PDFFont,
  grootte: number,
  breedte: number,
): string[] {
  const woorden = tekst.split(" ");
  const regels: string[] = [];
  let huidig = "";

  for (const woord of woorden) {
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

export async function maakHerroepingsformulier(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Modelformulier voor herroeping — Blusbox");
  pdf.setSubject(
    "Wettelijk modelformulier voor herroeping (Bijlage I, deel B, Richtlijn 2011/83/EU)",
  );
  pdf.setLanguage("nl-NL");

  const pagina = pdf.addPage([595.28, 841.89]); // A4
  const gewoon = await pdf.embedFont(StandardFonts.Helvetica);
  const vet = await pdf.embedFont(StandardFonts.HelveticaBold);

  const marge = 56;
  const breedte = pagina.getWidth() - marge * 2;
  const zwart = rgb(0.086, 0.094, 0.102); // --antraciet
  const grijs = rgb(0.45, 0.47, 0.49);
  let y = pagina.getHeight() - marge;

  const schrijf = (
    tekst: string,
    opties: {
      font?: import("pdf-lib").PDFFont;
      grootte?: number;
      kleur?: typeof zwart;
      naRegel?: number;
    } = {},
  ) => {
    const font = opties.font ?? gewoon;
    const grootte = opties.grootte ?? 10;
    for (const regel of breekAf(tekst, font, grootte, breedte)) {
      pagina.drawText(regel, {
        x: marge,
        y,
        size: grootte,
        font,
        color: opties.kleur ?? zwart,
      });
      y -= grootte * 1.45;
    }
    y -= opties.naRegel ?? 0;
  };

  const lijn = (lengte = breedte) => {
    pagina.drawLine({
      start: { x: marge, y },
      end: { x: marge + lengte, y },
      thickness: 0.75,
      color: rgb(0.61, 0.63, 0.65), // --railstaal
    });
    y -= 16;
  };

  schrijf("BLUSBOX", { font: vet, grootte: 16, naRegel: 6 });
  schrijf("Modelformulier voor herroeping", {
    font: vet,
    grootte: 13,
    naRegel: 4,
  });
  schrijf("(dit formulier alleen invullen en terugzenden als u de overeenkomst wilt herroepen)", {
    grootte: 9.5,
    kleur: grijs,
    naRegel: 18,
  });

  for (const { tekst, ruimte } of REGELS) {
    schrijf(tekst, { grootte: 10, naRegel: 8 });

    // The "Aan" line is the trader's own details, so it is pre-filled
    // rather than left as blank rules for the consumer to guess at.
    if (tekst.startsWith("— Aan")) {
      schrijf(HANDELAAR.naam, { grootte: 10, font: vet });
      schrijf(HANDELAAR.adres, { grootte: 10 });
      schrijf(HANDELAAR.email, { grootte: 10, naRegel: 10 });
      continue;
    }

    for (let i = 0; i < ruimte; i++) lijn();
    y -= 6;
  }

  y -= 6;
  schrijf("(*) Doorhalen wat niet van toepassing is.", {
    grootte: 9,
    kleur: grijs,
    naRegel: 20,
  });

  lijn();
  schrijf("Stuur dit formulier naar:", { font: vet, grootte: 10, naRegel: 4 });
  schrijf(HANDELAAR.naam, { grootte: 10 });
  schrijf(HANDELAAR.adres, { grootte: 10 });
  schrijf(HANDELAAR.email, { grootte: 10, naRegel: 14 });

  schrijf(
    "Je kunt de herroeping ook melden via je account of met een eigen ondubbelzinnige verklaring. Gebruik van dit formulier is niet verplicht.",
    { grootte: 9, kleur: grijs },
  );
  schrijf(
    "Let op: de Blusbox-module valt onder een classificatie voor gevaarlijke goederen. Stuur hem daarom nooit ongevraagd terug — je ontvangt retourinstructies na je melding.",
    { grootte: 9, kleur: grijs },
  );

  return pdf.save();
}
