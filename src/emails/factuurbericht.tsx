// Explicit React import: this template is also rendered outside Next
// (scripts, tests), where the automatic JSX runtime is not configured.
import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";

/**
 * Factuur voor een balieverkoop, met de pdf als bijlage.
 *
 * Dit is de enige klantmail met een link erin, en dat is met opzet: zonder
 * link valt er niets te betalen. De link gaat naar blusbox.nl en niet
 * rechtstreeks naar Stripe — een Stripe-sessie verloopt na een dag, onze
 * eigen pagina maakt bij elke klik een verse.
 */

export type FactuurberichtProps = {
  klantNaam: string;
  factuurnummer: string;
  totaal: string;
  vervaldatum: string;
  betaalUrl: string;
  bedrijf: { volledig: string; kvk: string; telefoon: string; email: string };
  siteUrl: string;
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

export function Factuurbericht({
  klantNaam,
  factuurnummer,
  totaal,
  vervaldatum,
  betaalUrl,
  bedrijf,
  siteUrl,
}: FactuurberichtProps) {
  const alinea = {
    margin: "0 0 14px",
    fontSize: "15px",
    lineHeight: 1.6,
    color: kleur.antraciet,
  };

  return (
    <Html lang="nl">
      <Head />
      <Preview>{`Factuur ${factuurnummer} — ${totaal}`}</Preview>
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
            Blusbox · factuur {factuurnummer}
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
            Je factuur
          </Heading>

          <Text style={alinea}>Beste {klantNaam},</Text>
          <Text style={alinea}>
            Bedankt voor je aankoop van de Blusbox. In de bijlage vind je de
            factuur. Het bedrag van {totaal} kun je vóór {vervaldatum} betalen
            via de knop hieronder, met iDEAL of een andere betaalmethode.
          </Text>

          <Button
            href={betaalUrl}
            style={{
              display: "inline-block",
              margin: "6px 0 20px",
              padding: "12px 22px",
              borderRadius: "999px",
              backgroundColor: kleur.antraciet,
              color: kleur.kastwit,
              fontSize: "15px",
              textDecoration: "none",
            }}
          >
            {`Betaal ${totaal}`}
          </Button>

          <Text style={{ ...alinea, fontSize: "13px", color: kleur.staal }}>
            Werkt de knop niet? Open dan deze link: {betaalUrl}
          </Text>
          <Text style={alinea}>
            Vragen over de factuur? Bel ons op {bedrijf.telefoon} of mail naar{" "}
            {bedrijf.email}, met het factuurnummer erbij.
          </Text>

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
