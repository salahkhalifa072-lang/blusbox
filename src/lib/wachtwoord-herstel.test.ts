import { describe, expect, it } from "vitest";
import {
  GELDIGHEID_MINUTEN,
  beoordeelHerstel,
  geldigeTokenvorm,
  hashToken,
  herstelUrl,
  maakToken,
  tokenKlopt,
  verlooptOp,
  type HerstelRij,
} from "./wachtwoord-herstel";

const NU = new Date("2026-10-02T12:00:00Z");

function rij(aanpassing: Partial<HerstelRij> = {}, token = "x"): HerstelRij {
  return {
    userId: "11111111-1111-1111-1111-111111111111",
    tokenHash: hashToken(token),
    verlooptOp: new Date(NU.getTime() + 30 * 60 * 1000),
    gebruiktOp: null,
    ...aanpassing,
  };
}

describe("maakToken", () => {
  it("levert een token van de verwachte vorm en een hash die er niet op lijkt", () => {
    const { token, hash } = maakToken();
    expect(geldigeTokenvorm(token)).toBe(true);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(token);
  });

  it("geeft elke keer iets anders", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => maakToken().token));
    expect(tokens.size).toBe(50);
  });
});

describe("geldigeTokenvorm", () => {
  it("weigert alles wat niet uit maakToken komt", () => {
    for (const onzin of [
      "",
      "kort",
      "x".repeat(42),
      "x".repeat(44),
      "a/b+c" + "x".repeat(38),
      "../../etc/passwd",
      "' OR 1=1 --",
    ]) {
      expect(geldigeTokenvorm(onzin), JSON.stringify(onzin)).toBe(false);
    }
  });
});

describe("tokenKlopt", () => {
  it("herkent het eigen token en niets anders", () => {
    const { token, hash } = maakToken();
    expect(tokenKlopt(token, hash)).toBe(true);
    expect(tokenKlopt(maakToken().token, hash)).toBe(false);
  });

  it("valt niet om op een hash van de verkeerde lengte", () => {
    const { token } = maakToken();
    expect(tokenKlopt(token, "abc")).toBe(false);
    expect(tokenKlopt(token, "")).toBe(false);
  });
});

describe("beoordeelHerstel", () => {
  it("laat een vers token door", () => {
    const oordeel = beoordeelHerstel(rij({}, "geheim"), "geheim", NU);
    expect(oordeel).toEqual({
      geldig: true,
      userId: "11111111-1111-1111-1111-111111111111",
    });
  });

  it("geeft bij onbekend, verlopen en al gebruikt dezelfde melding", () => {
    // Wie een token raadt hoort niet te leren of hij in de buurt zat.
    const onbekend = beoordeelHerstel(null, "geheim", NU);
    const verkeerd = beoordeelHerstel(rij({}, "geheim"), "ander", NU);
    const verlopen = beoordeelHerstel(
      rij({ verlooptOp: new Date(NU.getTime() - 1) }, "geheim"),
      "geheim",
      NU,
    );
    const gebruikt = beoordeelHerstel(
      rij({ gebruiktOp: new Date(NU.getTime() - 60_000) }, "geheim"),
      "geheim",
      NU,
    );

    for (const o of [onbekend, verkeerd, verlopen, gebruikt]) {
      expect(o.geldig).toBe(false);
      expect(o.geldig === false && o.reden).toBe(
        onbekend.geldig === false ? onbekend.reden : "",
      );
    }
  });

  it("vervalt precies op het moment van verlopen, niet erna", () => {
    const opDeGrens = rij({ verlooptOp: NU }, "geheim");
    expect(beoordeelHerstel(opDeGrens, "geheim", NU).geldig).toBe(false);

    const netErvoor = rij({ verlooptOp: new Date(NU.getTime() + 1) }, "geheim");
    expect(beoordeelHerstel(netErvoor, "geheim", NU).geldig).toBe(true);
  });

  it("werkt één keer: na gebruik is hetzelfde token waardeloos", () => {
    const r = rij({}, "geheim");
    expect(beoordeelHerstel(r, "geheim", NU).geldig).toBe(true);
    const gebruikt = { ...r, gebruiktOp: NU };
    expect(beoordeelHerstel(gebruikt, "geheim", NU).geldig).toBe(false);
  });
});

describe("verlooptOp", () => {
  it("ligt een uur vooruit", () => {
    expect(verlooptOp(NU).getTime() - NU.getTime()).toBe(
      GELDIGHEID_MINUTEN * 60 * 1000,
    );
  });
});

describe("herstelUrl", () => {
  it("zet het token in het pad en niet in een querystring", () => {
    // Dat is de hele reden dat deze functie bestaat: een token, een
    // e-mailadres en een redirect in de querystring gaf eerder een
    // phishingwaarschuwing in Chrome.
    const url = herstelUrl("https://www.blusbox.nl", "abc123");
    expect(url).toBe("https://www.blusbox.nl/wachtwoord/herstel/abc123");
    expect(url).not.toContain("?");
    expect(url).not.toContain("=");
  });

  it("verdubbelt de schuine streep niet", () => {
    expect(herstelUrl("https://www.blusbox.nl/", "abc")).toBe(
      "https://www.blusbox.nl/wachtwoord/herstel/abc",
    );
  });
});
