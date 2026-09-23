// Explicit React import: this template is also rendered outside Next
// (scripts, tests), where the automatic JSX runtime is not configured.
import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";

/**
 * Een zelfgeschreven bericht aan één klant, over één bestelling.
 *
 * Dit is met opzet het soberste sjabloon van de verzameling. De andere
 * mails zijn documenten — een bevestiging, een verzendbericht — en die
 * mogen opmaak hebben. Dit is een persoonlijk bericht van de winkelier,
 * en dat leest verkeerd wanneer het in een sjabloon wordt geperst met
 * knoppen en kaders eromheen. Kop, tekst, afzender, klaar.
 *
 * Het bestelnummer staat er wel bij: de klant weet anders niet waar het
 * over gaat, zeker niet als er weken tussen zitten.
 */

export type KlantberichtProps = {
  ordernummer: string;
  bericht: string;
  siteUrl: string;
  bedrijf: { volledig: string; kvk: string; telefoon: string; email: string };
};

const kleur = {
  antraciet: "#16181a",
  kastwit: "#e8e9e6",
  staal: "#5f666b",
  rail: "#9ba1a6",
};

const mono =
  "'SFMono-Regular', ui-monospace, Menlo, Consolas, 'Liberation Mono', monospace";
const sans =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export function Klantbericht({
  ordernummer,
  bericht,
  siteUrl,
  bedrijf,
}: KlantberichtProps) {
  // Wat de winkelier typt is platte tekst. Lege regels scheiden alinea's,
  // enkele regeleindes blijven regeleindes — zoals in elk tekstvak.
  const alineas = bericht
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((a) => a.trim())
    .filter(Boolean);

  return (
    <Html lang="nl">
      <Head />
      <Preview>{`Bericht over je bestelling ${ordernummer}`}</Preview>
      <Body
        style={{
          margin: 0,
          padding: "24px 0",
          backgroundColor: kleur.kastwit,
          fontFamily: sans,
          color: kleur.antraciet,
        }}
      >
        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            padding: "32px",
          }}
        >
          <Text
            style={{
              margin: 0,
              fontFamily: mono,
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: kleur.staal,
            }}
          >
            Blusbox · bestelling {ordernummer}
          </Text>

          <Heading
            as="h1"
            style={{
              margin: "8px 0 20px",
              fontSize: "22px",
              lineHeight: 1.25,
              color: kleur.antraciet,
            }}
          >
            Bericht over je bestelling
          </Heading>

          {alineas.map((alinea, i) => (
            <Text
              key={i}
              style={{
                margin: i === 0 ? "0" : "14px 0 0",
                fontSize: "15px",
                lineHeight: 1.6,
                color: kleur.antraciet,
                whiteSpace: "pre-line",
              }}
            >
              {alinea}
            </Text>
          ))}

          <Hr style={{ borderColor: kleur.rail, margin: "28px 0 16px" }} />

          <Text style={{ margin: 0, fontSize: "13px", color: kleur.staal }}>
            {bedrijf.volledig}
          </Text>
          <Text style={{ margin: 0, fontSize: "13px", color: kleur.staal }}>
            {bedrijf.telefoon} · {bedrijf.email}
          </Text>
          <Text style={{ margin: 0, fontSize: "13px", color: kleur.staal }}>
            KvK {bedrijf.kvk} · {siteUrl.replace(/^https?:\/\//, "")}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
