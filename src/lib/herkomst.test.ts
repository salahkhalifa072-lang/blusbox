import { describe, expect, it } from "vitest";
import {
  bepaalHerkomst,
  herkomstGroep,
  herkomstTekst,
  leesHerkomstWaarde,
  schrijfHerkomst,
} from "./herkomst";

const nu = 1_700_000_000_000;
const b = (url: string, verwijzer?: string) =>
  bepaalHerkomst({ url, verwijzer, eigenHosts: ["blusbox.nl"], nu });

describe("bepaalHerkomst", () => {
  it("leest utm-labels en schoont ze op", () => {
    expect(
      b("https://www.blusbox.nl/blusbox?utm_source=Facebook&utm_medium=Paid%20Social&utm_campaign=Meterkast%20Nov&x=1"),
    ).toEqual({
      bron: "facebook",
      medium: "paid-social",
      campagne: "meterkast-nov",
      landing: "/blusbox",
      op: nu,
    });
  });

  it("herkent een Google-advertentieklik maar bewaart de gclid niet", () => {
    const h = b("https://www.blusbox.nl/?gclid=ABC123secret", "https://www.google.com/");
    expect(h).toMatchObject({ bron: "google", medium: "cpc", verwijzer: "google.com" });
    expect(JSON.stringify(h)).not.toContain("ABC123secret");
  });

  it("herkent gratis Shopping-vermeldingen", () => {
    expect(b("https://www.blusbox.nl/blusbox?srsltid=xyz", "https://www.google.nl/")).toMatchObject({
      bron: "google",
      medium: "gratis-vermelding",
    });
  });

  it("ziet fbclid als Meta, niet per se als advertentie", () => {
    expect(b("https://www.blusbox.nl/?fbclid=q", "https://l.facebook.com/")).toMatchObject({
      bron: "facebook",
      medium: "social",
    });
    expect(b("https://www.blusbox.nl/?fbclid=q", "https://l.instagram.com/")).toMatchObject({
      bron: "instagram",
    });
  });

  it("deelt verwijzers in", () => {
    expect(b("https://www.blusbox.nl/", "https://www.google.nl/search?q=meterkast")).toMatchObject({
      bron: "google",
      medium: "zoeken",
      verwijzer: "google.nl",
    });
    expect(b("https://www.blusbox.nl/", "https://chatgpt.com/")).toMatchObject({ bron: "chatgpt", medium: "ai" });
    expect(b("https://www.blusbox.nl/", "https://forum.example.nl/topic/123?user=jan")).toEqual({
      bron: "forum.example.nl",
      medium: "verwijzing",
      verwijzer: "forum.example.nl",
      landing: "/",
      op: nu,
    });
  });

  it("zegt niets bij intern doorklikken, intypen of terugkomen van het betalen", () => {
    expect(b("https://www.blusbox.nl/blusbox", "https://www.blusbox.nl/")).toBeNull();
    expect(b("https://www.blusbox.nl/blusbox", "https://blusbox.nl/")).toBeNull();
    expect(b("https://www.blusbox.nl/blusbox")).toBeNull();
    expect(b("https://www.blusbox.nl/betaald", "https://checkout.stripe.com/")).toBeNull();
    expect(b("https://www.blusbox.nl/betaald", "https://betalen.rabobank.nl/")).toBeNull();
  });

  it("ziet een partnerlink als partner", () => {
    expect(b("https://www.blusbox.nl/r/Jan-Installatie", "https://www.facebook.com/")).toMatchObject({
      bron: "jan-installatie",
      medium: "partner",
    });
    expect(herkomstTekst({ bron: "jan-installatie", medium: "partner", op: nu })).toBe("Partner jan-installatie");
  });

  it("verdraagt rommel", () => {
    expect(b("geen url")).toBeNull();
    expect(b("https://www.blusbox.nl/", "geen url")).toBeNull();
    expect(b("https://www.blusbox.nl/?utm_source=%3Cscript%3E")).toMatchObject({ bron: "script" });
  });
});

describe("cookie", () => {
  it("komt heel terug", () => {
    const h = b("https://www.blusbox.nl/blusbox?utm_source=ig&utm_medium=paid&utm_campaign=x")!;
    expect(leesHerkomstWaarde(schrijfHerkomst(h))).toEqual(h);
  });

  it("schoont een bewerkte cookie op", () => {
    const vies = encodeURIComponent(JSON.stringify({ bron: "<b>Hack</b>", medium: 5, landing: "/a?b=c", op: "x" }));
    const h = leesHerkomstWaarde(vies)!;
    expect(h.bron).toBe("bhack/b");
    expect(h.medium).toBe("onbekend");
    expect(h.landing).toBe("/abc"); // ? en = eruit
    expect(typeof h.op).toBe("number");
  });

  it("geeft null bij onzin", () => {
    expect(leesHerkomstWaarde(undefined)).toBeNull();
    expect(leesHerkomstWaarde("%%%")).toBeNull();
    expect(leesHerkomstWaarde(encodeURIComponent("[]"))).toBeNull();
  });
});

describe("tonen", () => {
  it("maakt er leesbare tekst van", () => {
    expect(herkomstTekst({ bron: "ig", medium: "paid", op: nu })).toBe("Instagram · advertentie");
    expect(herkomstTekst({ bron: "google", medium: "zoeken", op: nu })).toBe("Google · zoeken");
    expect(herkomstTekst({ bron: "direct", medium: "direct", op: nu })).toBe("Direct of ingetypt");
    expect(herkomstTekst(null)).toBe("Onbekend");
  });

  it("groepeert per bron", () => {
    expect(herkomstGroep({ bron: "facebook", medium: "cpc", op: nu })).toBe("Facebook (advertentie)");
    expect(herkomstGroep({ bron: "google", medium: "gratis-vermelding", op: nu })).toBe("Google Shopping (gratis)");
    expect(herkomstGroep({ bron: "facebook", medium: "social", op: nu })).toBe("Facebook");
  });
});
