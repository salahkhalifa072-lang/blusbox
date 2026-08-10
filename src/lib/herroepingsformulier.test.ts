import { describe, expect, it } from "vitest";
import zlib from "node:zlib";
import { maakHerroepingsformulier } from "./herroepingsformulier";

/**
 * The model withdrawal form is prescribed by law: Bijlage I, deel B of
 * Directive 2011/83/EU. A trader may not impose formal requirements beyond
 * it, so the wording must survive refactors untouched. These tests pin the
 * exact sentences rather than merely checking that a PDF was produced.
 */

function tekstUitPdf(pdf: Uint8Array): string {
  const data = Buffer.from(pdf);
  const stukken: string[] = [];

  const raw = data.toString("latin1");
  const re = /stream\r?\n/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(raw)) !== null) {
    const start = m.index + m[0].length;
    const end = raw.indexOf("endstream", start);
    if (end < 0) continue;
    try {
      const uit = zlib.inflateSync(data.subarray(start, end));
      const s = uit.toString("latin1");
      for (const [, hex] of s.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)) {
        stukken.push(Buffer.from(hex, "hex").toString("latin1"));
      }
    } catch {
      // not a deflate stream — skip
    }
  }
  return stukken.join("\n");
}

describe("modelformulier voor herroeping", () => {
  it("levert een geldig pdf-bestand", async () => {
    const pdf = await maakHerroepingsformulier();
    expect(pdf.byteLength).toBeGreaterThan(500);
    expect(Buffer.from(pdf.subarray(0, 5)).toString()).toBe("%PDF-");
  });

  it("bevat de wettelijke tekst woordelijk", async () => {
    const tekst = tekstUitPdf(await maakHerroepingsformulier());

    // Verbatim from Publicatieblad van de EU, L 304/85.
    for (const regel of [
      "Modelformulier voor herroeping",
      "(dit formulier alleen invullen en terugzenden als u de overeenkomst wilt herroepen)",
      "herroep/herroepen",
      "Besteld op (*)/Ontvangen op (*)",
      "Naam/Namen consument(en)",
      "Adres consument(en)",
      "Handtekening van consument(en)",
      "Datum",
      "(*) Doorhalen wat niet van toepassing is.",
    ]) {
      expect(tekst).toContain(regel);
    }
  });

  it("waarschuwt dat de module niet ongevraagd teruggestuurd mag worden", async () => {
    // A consumer who posts an aerosol module without the transport papers
    // can have the parcel refused; the form has to say so.
    const tekst = tekstUitPdf(await maakHerroepingsformulier());
    expect(tekst).toContain("gevaarlijke goederen");
  });

  it("zegt dat gebruik van het formulier niet verplicht is", async () => {
    const tekst = tekstUitPdf(await maakHerroepingsformulier());
    expect(tekst).toContain("niet verplicht");
  });
});
