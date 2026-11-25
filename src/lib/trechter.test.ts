import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * De trechter praat met de browser (cookie, sessionStorage, fbq). Hier
 * staan daar namaakversies voor, zodat te tellen is wat er naar Meta zou
 * gaan zonder dat er iets verstuurd wordt.
 */
const stap = (aantal = 1) => ({
  regels: [{ id: "BB-MODULE-01", naam: "Blusbox", aantal, stukprijsCenten: 4091 }],
  waardeCenten: 4091 * aantal,
});

let opslag: Map<string, string>;
let fbq: ReturnType<typeof vi.fn>;

function zetOmgeving(toestemming: "verleend" | "geweigerd" | null) {
  opslag = new Map();
  fbq = vi.fn();
  vi.stubGlobal("document", {
    cookie: toestemming ? `blusbox-toestemming=${toestemming}.1` : "",
  });
  vi.stubGlobal("window", { fbq, gtag: vi.fn() });
  vi.stubGlobal("sessionStorage", {
    getItem: (k: string) => opslag.get(k) ?? null,
    setItem: (k: string, v: string) => void opslag.set(k, v),
    removeItem: (k: string) => void opslag.delete(k),
  });
}

const gebeurtenissen = () => fbq.mock.calls.map((c) => c[1] as string);

beforeEach(() => {
  vi.resetModules();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("startAfrekenen", () => {
  it("meldt niets zonder toestemming", async () => {
    zetOmgeving(null);
    const { startAfrekenen } = await import("./trechter");
    expect(startAfrekenen(stap())).toBe(false);
    expect(fbq).not.toHaveBeenCalled();
    expect(opslag.size).toBe(0);
  });

  it("meldt dezelfde wagen maar één keer per sessie", async () => {
    zetOmgeving("verleend");
    const { startAfrekenen } = await import("./trechter");
    startAfrekenen(stap());
    startAfrekenen(stap());
    startAfrekenen(stap());
    expect(gebeurtenissen().filter((g) => g === "InitiateCheckout")).toHaveLength(1);
  });

  it("stuurt eerst 'in de wagen' als die deze sessie nog niet gemeld is", async () => {
    zetOmgeving("verleend");
    const { startAfrekenen } = await import("./trechter");
    startAfrekenen(stap());
    expect(gebeurtenissen()).toEqual(["AddToCart", "InitiateCheckout"]);
  });

  it("stuurt 'in de wagen' niet nog eens als die al gemeld was", async () => {
    zetOmgeving("verleend");
    const { inWinkelwagen, startAfrekenen } = await import("./trechter");
    inWinkelwagen(stap());
    startAfrekenen(stap());
    expect(gebeurtenissen()).toEqual(["AddToCart", "InitiateCheckout"]);
  });

  it("ziet een gewijzigde wagen als een nieuwe start", async () => {
    zetOmgeving("verleend");
    const { startAfrekenen } = await import("./trechter");
    startAfrekenen(stap(1));
    startAfrekenen(stap(2));
    expect(gebeurtenissen().filter((g) => g === "InitiateCheckout")).toHaveLength(2);
    expect(gebeurtenissen().filter((g) => g === "AddToCart")).toHaveLength(1);
  });

  it("begint opnieuw na een aankoop", async () => {
    zetOmgeving("verleend");
    const { startAfrekenen, wisTrechterGeheugen } = await import("./trechter");
    startAfrekenen(stap());
    wisTrechterGeheugen();
    startAfrekenen(stap());
    expect(gebeurtenissen().filter((g) => g === "InitiateCheckout")).toHaveLength(2);
  });
});

describe("wagenHandtekening", () => {
  it("hangt niet af van de volgorde van de regels", async () => {
    zetOmgeving(null);
    const { wagenHandtekening } = await import("./trechter");
    const a = { id: "a", naam: "A", aantal: 1, stukprijsCenten: 1 };
    const b = { id: "b", naam: "B", aantal: 2, stukprijsCenten: 1 };
    expect(wagenHandtekening({ regels: [a, b], waardeCenten: 3 })).toBe(
      wagenHandtekening({ regels: [b, a], waardeCenten: 3 }),
    );
  });
});
