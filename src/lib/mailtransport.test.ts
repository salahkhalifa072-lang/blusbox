import { afterEach, describe, expect, it, vi } from "vitest";
import { mailBeschikbaar, splitsAfzender, verstuurMail } from "./mailtransport";

/**
 * §3 verzendlaag.
 *
 * Het gaat hier om twee dingen die stil kunnen falen: het uit elkaar halen
 * van de afzenderregel, en wat er gebeurt als MailerSend nee zegt. Dat
 * laatste mag nooit een uitzondering worden — de aanroeper zit achter een
 * betaling.
 */

describe("afzender uit elkaar halen", () => {
  it("splitst naam en adres", () => {
    expect(splitsAfzender("Blusbox <info@blusbox.nl>")).toEqual({
      name: "Blusbox",
      email: "info@blusbox.nl",
    });
  });

  it("accepteert een kaal adres", () => {
    expect(splitsAfzender("info@blusbox.nl")).toEqual({
      email: "info@blusbox.nl",
    });
  });

  it("laat de naam weg als die leeg is", () => {
    expect(splitsAfzender("  <info@blusbox.nl>")).toEqual({
      email: "info@blusbox.nl",
    });
  });

  it("houdt spaties buiten het adres", () => {
    // Een spatie in het adres levert bij MailerSend een 422 op, en die
    // foutmelding wijst niet naar de afzenderregel.
    const uit = splitsAfzender("  Blusbox   <  info@blusbox.nl  >  ");
    expect(uit.email).toBe("info@blusbox.nl");
    expect(uit.name).toBe("Blusbox");
  });
});

describe("versturen", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("meldt netjes dat er geen token is, zonder te gooien", async () => {
    vi.stubEnv("MAILERSEND_API_TOKEN", "");
    const uit = await verstuurMail({
      naar: "a@b.nl",
      onderwerp: "test",
      html: "<p>test</p>",
    });
    expect(uit.verstuurd).toBe(false);
    expect(mailBeschikbaar()).toBe(false);
  });

  it("neemt het foutlichaam mee in de reden", async () => {
    // "422" alleen zegt niemand iets; MailerSend schrijft in het lichaam
    // bijvoorbeeld dat het afzenderdomein niet geverifieerd is.
    vi.stubEnv("MAILERSEND_API_TOKEN", "test-token");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response('{"message":"The from.email must be verified."}', {
          status: 422,
        }),
      ),
    );

    const uit = await verstuurMail({
      naar: "a@b.nl",
      onderwerp: "test",
      html: "<p>test</p>",
    });
    expect(uit.verstuurd).toBe(false);
    if (!uit.verstuurd) {
      expect(uit.reden).toContain("422");
      expect(uit.reden).toContain("must be verified");
    }
  });

  it("ziet 202 met een bericht-id in de kop als geslaagd", async () => {
    vi.stubEnv("MAILERSEND_API_TOKEN", "test-token");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(null, {
          status: 202,
          headers: { "x-message-id": "abc123" },
        }),
      ),
    );

    const uit = await verstuurMail({
      naar: "a@b.nl",
      onderwerp: "test",
      html: "<p>test</p>",
    });
    expect(uit).toEqual({ verstuurd: true, id: "abc123" });
  });

  it("gooit niet als het netwerk eruit ligt", async () => {
    vi.stubEnv("MAILERSEND_API_TOKEN", "test-token");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("getaddrinfo ENOTFOUND");
      }),
    );

    const uit = await verstuurMail({
      naar: "a@b.nl",
      onderwerp: "test",
      html: "<p>test</p>",
    });
    expect(uit.verstuurd).toBe(false);
    if (!uit.verstuurd) expect(uit.reden).toContain("ENOTFOUND");
  });

  it("stuurt de bijlage mee zoals MailerSend hem wil", async () => {
    vi.stubEnv("MAILERSEND_API_TOKEN", "test-token");
    const nep = vi.fn(async () => new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", nep);

    await verstuurMail({
      naar: "a@b.nl",
      onderwerp: "test",
      html: "<p>x</p>",
      bijlagen: [{ filename: "formulier.pdf", content: "QQ==" }],
    });

    const body = JSON.parse(String(leesBody(nep)));
    expect(body.attachments).toEqual([
      { filename: "formulier.pdf", content: "QQ==", disposition: "attachment" },
    ]);
  });

  it("zet eigen kop-velden om naar de vorm van MailerSend", async () => {
    // MailerSend wil een lijst met {name, value}, geen object.
    vi.stubEnv("MAILERSEND_API_TOKEN", "test-token");
    const nep = vi.fn(async () => new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", nep);

    await verstuurMail({
      naar: "a@b.nl",
      onderwerp: "test",
      html: "<p>x</p>",
      headers: { Importance: "high" },
    });

    const body = JSON.parse(String(leesBody(nep)));
    expect(body.headers).toEqual([{ name: "Importance", value: "high" }]);
  });
});

/** De body die aan `fetch` is meegegeven, zonder de mocktypering te vechten. */
function leesBody(nep: { mock: { calls: unknown[][] } }): unknown {
  const eerste = nep.mock.calls[0] as [string, RequestInit] | undefined;
  if (!eerste) throw new Error("fetch is niet aangeroepen");
  return eerste[1].body;
}
