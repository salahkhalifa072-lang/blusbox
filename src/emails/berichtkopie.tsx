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
  Section,
  Text,
} from "@react-email/components";

/**
 * Kopie voor de winkelier van een bericht dat naar een klant is gegaan.
 *
 * Een aparte mail en geen bcc. Een bcc-adres reist mee in de kop van het
 * bericht dat de klant krijgt; sommige clients tonen dat, en doorsturen
 * legt het helemaal bloot. Twee losse verzendingen houden het gescheiden.
 *
 * De opmaak wijkt bewust af van alles wat naar klanten gaat: een bericht
 * dat je per ongeluk doorstuurt moet er meteen uitzien als administratie
 * en niet als iets dat voor een klant bedoeld was. Vandaar de kop
 * "verstuurd aan" bovenaan en het ontbreken van elke aanhef.
 */

export type BerichtkopieProps = {
  ordernummer: string;
  klantEmail: string;
  onderwerp: string;
  bericht: string;
  verstuurdOp: string;
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

export function Berichtkopie({
  ordernummer,
  klantEmail,
  onderwerp,
  bericht,
  verstuurdOp,
}: BerichtkopieProps) {
  const alineas = bericht
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((a) => a.trim())
    .filter(Boolean);

  return (
    <Html lang="nl">
      <Head />
      <Preview>{`Kopie · ${klantEmail} · ${onderwerp}`}</Preview>
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
            padding: "28px",
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
            Kopie voor jezelf · niet naar de klant
          </Text>

          <Heading
            as="h1"
            style={{
              margin: "8px 0 0",
              fontSize: "20px",
              lineHeight: 1.3,
              color: kleur.antraciet,
            }}
          >
            Verstuurd aan {klantEmail}
          </Heading>

          <Section
            style={{
              margin: "18px 0 0",
              padding: "12px 14px",
              backgroundColor: kleur.kastwit,
            }}
          >
            <Text style={{ margin: 0, fontSize: "13px", color: kleur.staal }}>
              Bestelling{" "}
              <span style={{ fontFamily: mono, color: kleur.antraciet }}>
                {ordernummer}
              </span>
            </Text>
            <Text style={{ margin: "4px 0 0", fontSize: "13px", color: kleur.staal }}>
              Onderwerp{" "}
              <span style={{ color: kleur.antraciet }}>{onderwerp}</span>
            </Text>
            <Text style={{ margin: "4px 0 0", fontSize: "13px", color: kleur.staal }}>
              Verstuurd op{" "}
              <span style={{ fontFamily: mono, color: kleur.antraciet }}>
                {verstuurdOp}
              </span>
            </Text>
          </Section>

          <Hr style={{ borderColor: kleur.rail, margin: "22px 0 16px" }} />

          <Text
            style={{
              margin: "0 0 10px",
              fontFamily: mono,
              fontSize: "10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: kleur.staal,
            }}
          >
            Dit kreeg de klant te lezen
          </Text>

          {alineas.map((alinea, i) => (
            <Text
              key={i}
              style={{
                margin: i === 0 ? 0 : "12px 0 0",
                fontSize: "14px",
                lineHeight: 1.6,
                color: kleur.antraciet,
                whiteSpace: "pre-line",
              }}
            >
              {alinea}
            </Text>
          ))}

          <Hr style={{ borderColor: kleur.rail, margin: "22px 0 12px" }} />

          <Text style={{ margin: 0, fontSize: "12px", color: kleur.staal }}>
            Antwoordt de klant, dan komt dat binnen op info@blusbox.nl.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
