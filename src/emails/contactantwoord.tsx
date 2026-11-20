// Explicit React import: this template is also rendered outside Next
// (scripts, tests), where the automatic JSX runtime is not configured.
import * as React from "react";
import { Body, Container, Head, Hr, Html, Preview, Text } from "@react-email/components";

/**
 * Antwoord op een vraag via het contactformulier.
 *
 * Net zo sober als het klantbericht: een persoonlijk antwoord, geen
 * nieuwsbrief. Onder de streep staat de oorspronkelijke vraag, zodat de
 * klant weet waar het over gaat, ook als hij het formulier allang vergeten
 * is. Beantwoorden komt uit bij info@blusbox.nl.
 */

export type ContactantwoordProps = {
  tekst: string;
  origineel: { naam: string; bericht: string; ontvangen: string };
  bedrijf: { volledig: string; email: string; kvk: string };
  siteUrl: string;
};

const kleur = { antraciet: "#16181a", kastwit: "#e8e9e6", staal: "#5f666b", rail: "#9ba1a6" };
const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

function alineas(t: string): string[] {
  return t
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((a) => a.trim())
    .filter(Boolean);
}

export function Contactantwoord({ tekst, origineel, bedrijf, siteUrl }: ContactantwoordProps) {
  const eerste = alineas(tekst)[0] ?? "";
  return (
    <Html lang="nl">
      <Head />
      <Preview>{eerste.slice(0, 90)}</Preview>
      <Body style={{ margin: 0, padding: "24px 0", backgroundColor: kleur.kastwit, fontFamily: sans, color: kleur.antraciet }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", backgroundColor: "#ffffff", padding: "32px" }}>
          {alineas(tekst).map((a, i) => (
            <Text
              key={i}
              style={{ margin: i === 0 ? "0" : "14px 0 0", fontSize: "15px", lineHeight: 1.6, whiteSpace: "pre-line" }}
            >
              {a}
            </Text>
          ))}

          <Hr style={{ borderColor: kleur.rail, margin: "28px 0 16px" }} />

          <Text style={{ margin: 0, fontSize: "13px", color: kleur.staal }}>{bedrijf.volledig}</Text>
          <Text style={{ margin: 0, fontSize: "13px", color: kleur.staal }}>{bedrijf.email}</Text>
          <Text style={{ margin: 0, fontSize: "13px", color: kleur.staal }}>
            KvK {bedrijf.kvk} · {siteUrl.replace(/^https?:\/\//, "")}
          </Text>

          <Text style={{ margin: "28px 0 6px", fontSize: "12px", color: kleur.staal }}>
            Op {origineel.ontvangen} schreef {origineel.naam}:
          </Text>
          <Text
            style={{
              margin: 0,
              paddingLeft: "12px",
              borderLeft: `3px solid ${kleur.rail}`,
              fontSize: "13px",
              lineHeight: 1.55,
              color: kleur.staal,
              whiteSpace: "pre-line",
            }}
          >
            {origineel.bericht}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
