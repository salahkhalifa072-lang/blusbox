import { describe, expect, it } from "vitest";
import { splitsAdresregel } from "./adresregel";

describe("splitsAdresregel", () => {
  it.each([
    ["Biezelingsestraat 22B", "Biezelingsestraat", "22B"],
    ["Damrak 1", "Damrak", "1"],
    ["Van Baerlestraat 12-3", "Van Baerlestraat", "12-3"],
    ["Laan van Meerdervoort 7 hs", "Laan van Meerdervoort", "7 hs"],
    ["2e Hugo de Grootstraat 14", "2e Hugo de Grootstraat", "14"],
    ["Kerkstraat 4 bis", "Kerkstraat", "4 bis"],
    ["  Dorpsstraat   9a ", "Dorpsstraat", "9a"],
  ])("%s", (regel, straat, huisnummer) => {
    expect(splitsAdresregel(regel)).toEqual({ straat, huisnummer });
  });

  it("laat de regel heel als er geen huisnummer te vinden is", () => {
    expect(splitsAdresregel("Postbus zonder nummer")).toEqual({
      straat: "Postbus zonder nummer",
      huisnummer: "",
    });
  });
});
