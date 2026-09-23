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
 * Bestelmelding voor de winkelier — niet voor de klant.
 *
 * Dit is bewust een andere mail dan de bestelbevestiging. Die is een
 * juridisch document voor de koper, in `je`-vorm, met het
 * herroepingsformulier erbij. Deze is een werkopdracht: alles wat nodig is
 * om te pakken en te verzenden moet zichtbaar zijn zonder ergens op te
 * klikken, want hij wordt meestal op een telefoon gelezen.
 *
 * Daarom staat het e-mailadres van de klant er groot in en is het
 * antwoordadres de klant zelf: vanuit je postvak op Beantwoorden drukken
 * moet direct bij de koper uitkomen.
 */

export type MeldingRegel = {
  naam: string;
  aantal: number;
  regelBedrag: string;
};

export type BestelmeldingProps = {
  ordernummer: string;
  klantEmail: string;
  regels: MeldingRegel[];
  subtotaal: string;
  btw: string;
  verzendwaarde: string;
  totaal: string;
  adres: string[];
  geplaatstOp: string;
  siteUrl: string;
};

const kleur = {
  antraciet: "#16181a",
  kastwit: "#e8e9e6",
  staal: "#5f666b",
  rail: "#9ba1a6",
  rood: "#b81e1b",
};

const mono =
  "'SFMono-Regular', ui-monospace, Menlo, Consolas, 'Liberation Mono', monospace";
const sans =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export function Bestelmelding({
  ordernummer,
  klantEmail,
  regels,
  subtotaal,
  btw,
  verzendwaarde,
  totaal,
  adres,
  geplaatstOp,
  siteUrl,
}: BestelmeldingProps) {
  const aantalTotaal = regels.reduce((som, r) => som + r.aantal, 0);

  return (
    <Html lang="nl">
      <Head />
      <Preview>
        {`${ordernummer} — ${totaal} — ${aantalTotaal}x — ${klantEmail}`}
      </Preview>
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
            Nieuwe bestelling
          </Text>

          <Heading
            as="h1"
            style={{
              margin: "6px 0 0",
              fontSize: "26px",
              lineHeight: 1.2,
              color: kleur.antraciet,
            }}
          >
            {ordernummer}
          </Heading>

          <Text style={{ margin: "4px 0 0", fontSize: "13px", color: kleur.staal }}>
            Betaald op {geplaatstOp}
          </Text>

          {/* Het klantadres is het enige waar je meteen iets mee moet kunnen:
              bevestigen, vragen stellen, verzendbericht sturen. */}
          <Section
            style={{
              margin: "20px 0 0",
              padding: "14px 16px",
              backgroundColor: kleur.kastwit,
            }}
          >
            <Text
              style={{
                margin: 0,
                fontFamily: mono,
                fontSize: "10px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: kleur.staal,
              }}
            >
              Klant
            </Text>
            <Text
              style={{
                margin: "4px 0 0",
                fontSize: "16px",
                fontWeight: 600,
                color: kleur.antraciet,
                wordBreak: "break-all",
              }}
            >
              {klantEmail}
            </Text>
          </Section>

          <Hr style={{ borderColor: kleur.rail, margin: "22px 0" }} />

          <Text
            style={{
              margin: 0,
              fontFamily: mono,
              fontSize: "10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: kleur.staal,
            }}
          >
            Te verzenden
          </Text>

          {regels.map((r, i) => (
            <Section key={i} style={{ margin: "10px 0 0" }}>
              <Text style={{ margin: 0, fontSize: "15px" }}>
                <span style={{ fontFamily: mono, color: kleur.rood, fontWeight: 700 }}>
                  {r.aantal}&times;
                </span>{" "}
                {r.naam}
                <span style={{ float: "right", fontFamily: mono, color: kleur.staal }}>
                  {r.regelBedrag}
                </span>
              </Text>
            </Section>
          ))}

          <Hr style={{ borderColor: kleur.rail, margin: "22px 0" }} />

          <Text style={{ margin: 0, fontSize: "14px", color: kleur.staal }}>
            Subtotaal
            <span style={{ float: "right", fontFamily: mono }}>{subtotaal}</span>
          </Text>
          <Text style={{ margin: "6px 0 0", fontSize: "14px", color: kleur.staal }}>
            Btw
            <span style={{ float: "right", fontFamily: mono }}>{btw}</span>
          </Text>
          <Text style={{ margin: "6px 0 0", fontSize: "14px", color: kleur.staal }}>
            Verzending
            <span style={{ float: "right", fontFamily: mono }}>{verzendwaarde}</span>
          </Text>
          <Text
            style={{
              margin: "10px 0 0",
              fontSize: "18px",
              fontWeight: 700,
              color: kleur.antraciet,
            }}
          >
            Totaal
            <span style={{ float: "right", fontFamily: mono }}>{totaal}</span>
          </Text>

          <Hr style={{ borderColor: kleur.rail, margin: "22px 0" }} />

          <Text
            style={{
              margin: 0,
              fontFamily: mono,
              fontSize: "10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: kleur.staal,
            }}
          >
            Bezorgadres
          </Text>
          {adres.map((regel, i) => (
            <Text key={i} style={{ margin: i === 0 ? "6px 0 0" : 0, fontSize: "15px" }}>
              {regel}
            </Text>
          ))}

          <Text style={{ margin: "24px 0 0", fontSize: "12px", color: kleur.staal }}>
            {siteUrl.replace(/^https?:\/\//, "")}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
