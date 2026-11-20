import { afterEach, describe, expect, it, vi } from "vitest";

/*
 * Het antwoord op een contactbericht, zonder echte mail: fetch wordt
 * onderschept en we kijken wat er naar MailerSend zou gaan.
 */
describe("stuurContactantwoord", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("stuurt vanaf info@blusbox.nl, met de vraag eronder en antwoorden naar info@", async () => {
    vi.stubEnv("MAILERSEND_API_TOKEN", "test-token");
    vi.stubEnv("DATABASE_URL", process.env.DATABASE_URL ?? "postgres://x@127.0.0.1:5432/x");
    const verzonden: Record<string, unknown>[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        verzonden.push(JSON.parse(String(init.body)));
        return new Response(null, { status: 202, headers: { "x-message-id": "abc" } });
      }),
    );

    const { stuurContactantwoord } = await import("./mail");
    const uit = await stuurContactantwoord({
      naar: "klant@voorbeeld.nl",
      onderwerp: "Re: Past het in mijn meterkast?",
      tekst: "Hallo Piet,\n\nJa, dat past.\n\nGroet, Blusbox",
      origineel: {
        naam: "Piet <script>",
        bericht: "Past hij in een oude kast?",
        ontvangenOp: new Date("2026-11-20T10:00:00Z"),
      },
    });

    expect(uit).toEqual({ verstuurd: true, id: "abc" });
    const mail = verzonden[0] as {
      from: { email: string };
      to: { email: string }[];
      reply_to: { email: string };
      subject: string;
      html: string;
      text: string;
    };
    expect(mail.from.email).toBe("info@blusbox.nl");
    expect(mail.to).toEqual([{ email: "klant@voorbeeld.nl" }]);
    expect(mail.reply_to.email).toBe("info@blusbox.nl");
    expect(mail.subject).toBe("Re: Past het in mijn meterkast?");
    expect(mail.text).toContain("Ja, dat past.");
    expect(mail.text).toContain("> Past hij in een oude kast?");
    expect(mail.html).toContain("Past hij in een oude kast?");
    // Wat de klant typte komt ontsnapt in de html, niet als echte tag.
    expect(mail.html).not.toContain("<script>");
  });
});
