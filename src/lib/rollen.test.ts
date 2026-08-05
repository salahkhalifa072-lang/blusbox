import { describe, expect, it } from "vitest";
import {
  GeenToegangError,
  ROLLEN,
  magDashboard,
  magInstallateursportaal,
  magLotsBeheren,
  magRecallOpenen,
  magZakelijkePrijzenZien,
  unitScope,
  vereis,
} from "./rollen";
import { hashWachtwoord, verifieerWachtwoord, wachtwoordProblemen } from "./wachtwoord";

describe("rolrechten", () => {
  it("laat alleen admin en operations in het dashboard", () => {
    expect(magDashboard("admin")).toBe(true);
    expect(magDashboard("operations")).toBe(true);
    expect(magDashboard("installateur")).toBe(false);
    expect(magDashboard("klant")).toBe(false);
  });

  it("laat alleen admin een recall openen", () => {
    // Opening a recall mails customers — operations may run the lot
    // register but may not trigger that on their own.
    expect(magRecallOpenen("admin")).toBe(true);
    expect(magRecallOpenen("operations")).toBe(false);
    expect(magRecallOpenen("installateur")).toBe(false);
    expect(magRecallOpenen("klant")).toBe(false);
  });

  it("laat operations het lotregister beheren", () => {
    expect(magLotsBeheren("operations")).toBe(true);
    expect(magLotsBeheren("klant")).toBe(false);
  });

  it("geeft installateurs toegang tot het portaal en zakelijke prijzen", () => {
    expect(magInstallateursportaal("installateur")).toBe(true);
    expect(magZakelijkePrijzenZien("installateur")).toBe(true);
    expect(magInstallateursportaal("klant")).toBe(false);
    expect(magZakelijkePrijzenZien("klant")).toBe(false);
  });

  it("geeft geen enkele rol per ongeluk alles", () => {
    for (const rol of ROLLEN) {
      if (rol === "admin") continue;
      const alles =
        magDashboard(rol) && magRecallOpenen(rol) && magLotsBeheren(rol);
      expect(alles).toBe(false);
    }
  });
});

describe("vereis", () => {
  it("gooit een GeenToegangError met de actie erin", () => {
    expect(() => vereis(false, "recall openen")).toThrowError(GeenToegangError);
    expect(() => vereis(false, "recall openen")).toThrowError(/recall openen/);
  });

  it("laat toegestane acties door", () => {
    expect(() => vereis(true, "dashboard openen")).not.toThrow();
  });
});

describe("unitScope", () => {
  it("geeft back-office alles", () => {
    expect(unitScope({ id: "u1", rol: "admin" })).toEqual({ soort: "alles" });
    expect(unitScope({ id: "u1", rol: "operations" })).toEqual({
      soort: "alles",
    });
  });

  it("beperkt een installateur tot eigen geplaatste units", () => {
    expect(unitScope({ id: "i1", rol: "installateur" })).toEqual({
      soort: "installateur",
      installateurId: "i1",
    });
  });

  it("beperkt een klant tot eigen units", () => {
    expect(unitScope({ id: "k1", rol: "klant" })).toEqual({
      soort: "eigenaar",
      userId: "k1",
    });
  });

  it("laat een klant nooit een scope zonder filter krijgen", () => {
    const scope = unitScope({ id: "k1", rol: "klant" });
    expect(scope.soort).not.toBe("alles");
  });
});

describe("wachtwoorden", () => {
  it("verifieert een correct wachtwoord", async () => {
    const hash = await hashWachtwoord("een lang genoeg wachtwoord");
    expect(await verifieerWachtwoord("een lang genoeg wachtwoord", hash)).toBe(
      true,
    );
  });

  it("wijst een fout wachtwoord af", async () => {
    const hash = await hashWachtwoord("een lang genoeg wachtwoord");
    expect(await verifieerWachtwoord("iets anders", hash)).toBe(false);
  });

  it("geeft twee keer een andere hash voor hetzelfde wachtwoord", async () => {
    const a = await hashWachtwoord("zelfde wachtwoord hier");
    const b = await hashWachtwoord("zelfde wachtwoord hier");
    expect(a).not.toBe(b);
  });

  it("crasht niet op een kapotte hash", async () => {
    expect(await verifieerWachtwoord("wat dan ook", "onzin")).toBe(false);
    expect(await verifieerWachtwoord("wat dan ook", "")).toBe(false);
  });

  it("vraagt om lengte, niet om leestekens", () => {
    expect(wachtwoordProblemen("kort")).toHaveLength(1);
    expect(wachtwoordProblemen("123456789012")).toContain(
      "Gebruik niet alleen cijfers.",
    );
    expect(wachtwoordProblemen("een prima lange zin")).toHaveLength(0);
  });
});
