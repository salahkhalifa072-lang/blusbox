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

  it("vraagt de retour eerst aan te melden", async () => {
    // Zonder aanmelding komt er een pakket binnen dat aan geen bestelling
    // te koppelen is; dat vertraagt de terugbetaling.
    const tekst = tekstUitPdf(await maakHerroepingsformulier());
    expect(tekst).toContain("aan");
    expect(tekst).toMatch(/retouradres/i);
  });

  it("draagt de bedrijfsgegevens die het formulier vraagt", async () => {
    const tekst = tekstUitPdf(await maakHerroepingsformulier());
    expect(tekst).toContain("86275437");
    expect(tekst).toContain("info@blusbox.nl");
    // Geen placeholders meer op een wettelijk document.
    expect(tekst).not.toContain("VERIFY");
  });

  it("zegt dat gebruik van het formulier niet verplicht is", async () => {
    const tekst = tekstUitPdf(await maakHerroepingsformulier());
    expect(tekst).toContain("niet verplicht");
  });
});
