import { describe, expect, it } from "vitest";
import { pasKortingToe } from "./artikelen";

describe("korting aan de deur", () => {
  it("verwerkt een rond bedrag exact in de stukprijs", () => {
    const r = pasKortingToe([{ slug: "blusbox", aantal: 1, stukprijsInclBtwCenten: 4950 }], 500);
    expect(r.totaalCenten).toBe(4450);
    expect(r.kortingCenten).toBe(500);
  });

  it("verdeelt over meerdere regels en meldt het werkelijke verschil", () => {
    const r = pasKortingToe(
      [
        { slug: "blusbox", aantal: 2, stukprijsInclBtwCenten: 4950 },
        { slug: "rookmelder", aantal: 1, stukprijsInclBtwCenten: 1695 },
      ],
      1000,
    );
    expect(Math.abs(r.kortingCenten - 1000)).toBeLessThanOrEqual(3);
    expect(r.totaalCenten).toBe(11595 - r.kortingCenten);
    expect(r.regels.every((x) => Number.isInteger(x.stukprijsInclBtwCenten))).toBe(true);
  });

  it("doet niets zonder korting", () => {
    const regels = [{ slug: "blusbox", aantal: 1, stukprijsInclBtwCenten: 4950 }];
    expect(pasKortingToe(regels, 0)).toEqual({ regels, kortingCenten: 0, totaalCenten: 4950 });
  });
});
