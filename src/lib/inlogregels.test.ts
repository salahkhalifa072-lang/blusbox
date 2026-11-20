import { describe, expect, it } from "vitest";
import { GRENZEN, beoordeelIp, blokduurMs, normaliseerIp, nooitBlokkeren } from "./inlogregels";

describe("beoordeelIp", () => {
  it("laat een paar typefouten met rust", () => {
    expect(beoordeelIp({ ipFout: 4, ipAdressen: 1 })).toBeNull();
    expect(beoordeelIp({ ipFout: GRENZEN.ipFout.aantal - 1, ipAdressen: 2 })).toBeNull();
  });

  it("blokkeert bij tien foute pogingen in een kwartier", () => {
    expect(beoordeelIp({ ipFout: 10, ipAdressen: 1 })).toMatch(/10 foute pogingen/);
  });

  it("blokkeert wie een lijst e-mailadressen afwerkt", () => {
    expect(beoordeelIp({ ipFout: 5, ipAdressen: 5 })).toMatch(/5 verschillende/);
  });
});

describe("blokduurMs", () => {
  const dag = 86_400_000;
  it("loopt op bij herhaling", () => {
    expect(blokduurMs(1)).toBe(dag);
    expect(blokduurMs(2)).toBe(7 * dag);
    expect(blokduurMs(3)).toBe(30 * dag);
    expect(blokduurMs(9)).toBe(30 * dag);
  });
});

describe("normaliseerIp", () => {
  it("laat IPv4 staan", () => {
    expect(normaliseerIp(" 203.0.113.7 ")).toBe("203.0.113.7");
    expect(normaliseerIp("::ffff:203.0.113.7")).toBe("203.0.113.7");
  });

  it("brengt IPv6 terug tot het /64-blok", () => {
    expect(normaliseerIp("2001:db8:abcd:12:1:2:3:4")).toBe("2001:db8:abcd:12::/64");
    expect(normaliseerIp("2001:DB8:ABCD:0012:ffff:ffff:ffff:ffff")).toBe("2001:db8:abcd:12::/64");
    expect(normaliseerIp("2001:db8::1")).toBe("2001:db8:0:0::/64");
    expect(normaliseerIp("[2001:db8:abcd:12::99]")).toBe("2001:db8:abcd:12::/64");
  });

  it("geeft twee adressen uit hetzelfde blok dezelfde uitkomst", () => {
    expect(normaliseerIp("2a02:a03f:1:2:aaaa::1")).toBe(normaliseerIp("2a02:a03f:1:2:bbbb::9"));
  });

  it("geeft leeg terug voor niets", () => {
    expect(normaliseerIp("")).toBe("");
  });
});

describe("nooitBlokkeren", () => {
  it("spaart onbekend en de eigen machine", () => {
    expect(nooitBlokkeren("onbekend")).toBe(true);
    expect(nooitBlokkeren(normaliseerIp("::1"))).toBe(true);
    expect(nooitBlokkeren("127.0.0.1")).toBe(true);
    expect(nooitBlokkeren("203.0.113.7")).toBe(false);
  });
});
