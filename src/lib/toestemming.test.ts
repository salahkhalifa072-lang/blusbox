import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TOESTEMMING_COOKIE,
  TOESTEMMING_VERSIE,
  bewaarKeuze,
  leesKeuze,
  wisKeuze,
} from "./toestemming";
import { isBetaald } from "./meting";

/**
 * De toestemmingscookie is het bewijs dat er gevraagd is voordat er
 * gemeten werd. Als die verkeerd gelezen wordt, gebeurt precies het
 * verkeerde: bij een te soepele lezing meet je zonder geldige toestemming,
 * bij een te strenge vraag je het bij elke pagina opnieuw.
 */

type NepDocument = { cookie: string };

function zetOmgeving(cookie: string) {
  const doc: NepDocument = { cookie };
  vi.stubGlobal("document", doc);
  vi.stubGlobal("location", { protocol: "https:" });
  vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  return doc;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("leesKeuze", () => {
  it("geeft null zonder cookie, want dat is 'nog niet gevraagd' en niet 'nee'", () => {
    zetOmgeving("");
    expect(leesKeuze()).toBe(null);
  });

  it("leest een geldige keuze", () => {
    zetOmgeving(`${TOESTEMMING_COOKIE}=verleend.${TOESTEMMING_VERSIE}`);
    expect(leesKeuze()).toBe("verleend");

    zetOmgeving(`${TOESTEMMING_COOKIE}=geweigerd.${TOESTEMMING_VERSIE}`);
    expect(leesKeuze()).toBe("geweigerd");
  });

  it("vindt de cookie ook tussen andere cookies", () => {
    zetOmgeving(
      `winkelwagen=abc; ${TOESTEMMING_COOKIE}=verleend.${TOESTEMMING_VERSIE}; sessie=xyz`,
    );
    expect(leesKeuze()).toBe("verleend");
  });

  it("negeert een keuze van een oudere versie van de vraag", () => {
    zetOmgeving(`${TOESTEMMING_COOKIE}=verleend.${TOESTEMMING_VERSIE - 1}`);
    expect(leesKeuze()).toBe(null);
  });

  it("negeert onzin in plaats van die als toestemming te lezen", () => {
    for (const waarde of ["", "ja", "true", "1", "verleend", "verleend.x"]) {
      zetOmgeving(`${TOESTEMMING_COOKIE}=${waarde}`);
      expect(leesKeuze(), `waarde ${JSON.stringify(waarde)}`).toBe(null);
    }
  });

  it("laat zich niet foppen door een cookie waarvan de naam erop eindigt", () => {
    zetOmgeving(`nep-${TOESTEMMING_COOKIE}=verleend.${TOESTEMMING_VERSIE}`);
    expect(leesKeuze()).toBe(null);
  });

  it("geeft null op de server, waar geen document bestaat", () => {
    vi.stubGlobal("document", undefined);
    expect(leesKeuze()).toBe(null);
  });
});

describe("bewaarKeuze", () => {
  it("schrijft de keuze met versie, vervaldatum en SameSite", () => {
    const doc = zetOmgeving("");
    bewaarKeuze("verleend");

    expect(doc.cookie).toContain(`${TOESTEMMING_COOKIE}=verleend.${TOESTEMMING_VERSIE}`);
    expect(doc.cookie).toContain("Path=/");
    expect(doc.cookie).toContain("SameSite=Lax");
    expect(doc.cookie).toContain("Secure");
    // een half jaar
    expect(doc.cookie).toMatch(/Max-Age=15724800/);
  });

  it("laat Secure weg op http, anders wordt hij lokaal nooit gezet", () => {
    const doc = zetOmgeving("");
    vi.stubGlobal("location", { protocol: "http:" });
    bewaarKeuze("geweigerd");
    expect(doc.cookie).not.toContain("Secure");
  });

  it("wist de keuze door de houdbaarheid op nul te zetten", () => {
    const doc = zetOmgeving(`${TOESTEMMING_COOKIE}=verleend.${TOESTEMMING_VERSIE}`);
    wisKeuze();
    expect(doc.cookie).toContain("Max-Age=0");
  });
});

describe("isBetaald", () => {
  it("telt een bestelling pas als er betaald is", () => {
    expect(isBetaald("betaald")).toBe(true);
    expect(isBetaald("in_behandeling")).toBe(true);
    expect(isBetaald("verzonden")).toBe(true);
    expect(isBetaald("geleverd")).toBe(true);
  });

  it("telt niets wat geen omzet is", () => {
    // `nieuw` staat er al vóór het betaalscherm; wie daar afhaakt zou
    // anders als verkoop meetellen.
    expect(isBetaald("nieuw")).toBe(false);
    expect(isBetaald("geannuleerd")).toBe(false);
    expect(isBetaald("terugbetaald")).toBe(false);
    expect(isBetaald("")).toBe(false);
  });
});
