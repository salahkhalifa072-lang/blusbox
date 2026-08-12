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
 * §9.3 vervangingsherinnering.
 *
 * De site belooft op de homepage "automatisch bericht voordat de termijn
 * verloopt". Dit is dat bericht.
 *
 * Toon: dit is geen noodgeval en het moet ook niet als noodgeval lezen. De
 * module doet het nog; hij nadert het einde van zijn levensduur. Bij één
 * maand wordt de tekst dwingender, maar de opmaak blijft dezelfde — een rode
 * band bewaren we voor een terugroepactie, anders betekent rood niets meer.
 */

export type HerinneringProps = {
  /** 12, 6 of 1 — bepaalt de toon en de kop */
  maanden: 12 | 6 | 1;
  vervaldatum: string;
  installatiedatum: string;
  lotNummer: string;
  siteUrl: string;
  contactEmail: string;
};

const kleur = {
  antraciet: "#16181a",
  kastwit: "#e8e9e6",
  staal: "#5f666b",
  rail: "#9ba1a6",
  rood: "#b81e1b",
  signaal: "#f4c300",
};

const mono =
  "'SFMono-Regular', ui-monospace, Menlo, Consolas, 'Liberation Mono', monospace";
const sans =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

function kop(maanden: 12 | 6 | 1) {
  if (maanden === 12) return "Je Blusbox verloopt over een jaar";
  if (maanden === 6) return "Je Blusbox verloopt over een half jaar";
  return "Je Blusbox verloopt volgende maand";
}

function inleiding(maanden: 12 | 6 | 1) {
  if (maanden === 12) {
    return "Nog geen haast, maar goed om te weten: over ongeveer twaalf maanden loopt de levensduur van je module af. Je hoeft nu niets te doen.";
  }
  if (maanden === 6) {
    return "Over ongeveer zes maanden loopt de levensduur van je module af. Een goed moment om de vervanging in te plannen.";
  }
  return "Over ongeveer een maand loopt de levensduur van je module af. Na die datum kunnen we niet meer instaan voor de werking.";
}

export function Vervangingsherinnering({
  maanden,
  vervaldatum,
  installatiedatum,
  lotNummer,
  siteUrl,
  contactEmail,
}: HerinneringProps) {
  const dringend = maanden === 1;

  return (
    <Html lang="nl">
      <Head />
      <Preview>
        {kop(maanden)} — vervaldatum {vervaldatum}
      </Preview>
      <Body style={{ backgroundColor: kleur.kastwit, margin: 0, padding: 0 }}>
        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            padding: "32px 24px 48px",
            fontFamily: sans,
            color: kleur.antraciet,
          }}
        >
          <Section
            style={{
              backgroundColor: kleur.antraciet,
              padding: "24px",
              borderRadius: "12px",
            }}
          >
            <Text
              style={{
                margin: 0,
                color: kleur.kastwit,
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              BLUSBOX
            </Text>
            <Text
              style={{
                margin: "6px 0 0",
                color: kleur.rail,
                fontFamily: mono,
                fontSize: "12px",
              }}
            >
              Vervaldatum {vervaldatum}
            </Text>
          </Section>

          <Heading
            as="h1"
            style={{ fontSize: "24px", margin: "32px 0 8px", fontWeight: 700 }}
          >
            {kop(maanden)}
          </Heading>
          <Text style={{ margin: 0, color: kleur.staal, lineHeight: 1.6 }}>
            {inleiding(maanden)}
          </Text>

          <Hr style={{ borderColor: kleur.rail, margin: "28px 0" }} />

          <Heading as="h2" style={{ fontSize: "16px", margin: "0 0 12px" }}>
            Je module
          </Heading>
          <Text style={{ margin: "0 0 6px", fontSize: "14px" }}>
            Geïnstalleerd op
            <span style={{ float: "right", fontFamily: mono }}>
              {installatiedatum}
            </span>
          </Text>
          <Text style={{ margin: "0 0 6px", fontSize: "14px" }}>
            Vervangen vóór
            <span style={{ float: "right", fontFamily: mono }}>
              {vervaldatum}
            </span>
          </Text>
          <Text style={{ margin: "0 0 6px", fontSize: "14px" }}>
            Lotnummer
            <span style={{ float: "right", fontFamily: mono }}>
              {lotNummer}
            </span>
          </Text>

          <Hr style={{ borderColor: kleur.rail, margin: "28px 0" }} />

          <Text
            style={{ margin: 0, fontSize: "14px", color: kleur.staal, lineHeight: 1.6 }}
          >
            Een blusmodule heeft een houdbaarheid, net als een rookmelder of
            een brandblusser. Na tien jaar is niet gegarandeerd dat het
            blusmiddel nog de juiste hoeveelheid aerosol levert. Vervangen is
            een kwestie van de oude module van de rail klikken en de nieuwe
            erop.
          </Text>

          <Section style={{ margin: "24px 0 0", textAlign: "center" }}>
            <a
              href={`${siteUrl}/blusbox`}
              style={{
                display: "inline-block",
                backgroundColor: kleur.rood,
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 700,
                padding: "14px 28px",
                borderRadius: "999px",
                textDecoration: "none",
              }}
            >
              Vervangende module bestellen
            </a>
          </Section>

          {dringend ? (
            <Section
              style={{
                backgroundColor: "#faf3d4",
                border: `1px solid ${kleur.signaal}`,
                borderRadius: "10px",
                padding: "14px 16px",
                margin: "24px 0 0",
              }}
            >
              <Text style={{ margin: 0, fontSize: "13px", lineHeight: 1.6 }}>
                <strong>Gooi de oude module niet bij het afval.</strong> Hij
                valt onder de regels voor gevaarlijke goederen. Bij je nieuwe
                module zitten de instructies en de vervoersdocumenten om de
                oude terug te sturen.
              </Text>
            </Section>
          ) : null}

          <Hr style={{ borderColor: kleur.rail, margin: "28px 0" }} />

          <Text
            style={{ margin: 0, fontSize: "12px", color: kleur.staal, lineHeight: 1.6 }}
          >
            Vragen? Mail{" "}
            <a href={`mailto:${contactEmail}`} style={{ color: kleur.rood }}>
              {contactEmail}
            </a>{" "}
            en vermeld het lotnummer.
          </Text>
          <Text style={{ margin: "16px 0 0", fontSize: "12px", color: kleur.rail }}>
            Blusbox · {siteUrl.replace(/^https?:\/\//, "")}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default Vervangingsherinnering;
