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
 * Order confirmation (§8). Dutch, `je`-vorm — this is the consumer mail.
 *
 * Styling is inline and table-safe rather than Tailwind: mail clients
 * strip <style> blocks, and Outlook ignores most modern CSS. The palette
 * mirrors §6 so the mail reads as the same brand.
 */

export type BevestigingRegel = {
  naam: string;
  aantal: number;
  regelBedrag: string;
};

export type BevestigingProps = {
  ordernummer: string;
  regels: BevestigingRegel[];
  subtotaal: string;
  btw: string;
  verzendwaarde: string;
  totaal: string;
  adres: string[];
  herroepingUiterlijk: string;
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

export function Bestelbevestiging({
  ordernummer,
  regels,
  subtotaal,
  btw,
  verzendwaarde,
  totaal,
  adres,
  herroepingUiterlijk,
  siteUrl,
}: BevestigingProps) {
  return (
    <Html lang="nl">
      <Head />
      <Preview>
        Je bestelling {ordernummer} is bevestigd — Blusbox
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
              Bestelnummer {ordernummer}
            </Text>
          </Section>

          <Heading
            as="h1"
            style={{ fontSize: "24px", margin: "32px 0 8px", fontWeight: 700 }}
          >
            Bedankt voor je bestelling
          </Heading>
          <Text style={{ margin: 0, color: kleur.staal, lineHeight: 1.6 }}>
            We hebben je betaling ontvangen en maken je bestelling klaar voor
            verzending. Zodra het pakket onderweg is, laten we het weten.
          </Text>

          <Hr style={{ borderColor: kleur.rail, margin: "28px 0" }} />

          <Heading as="h2" style={{ fontSize: "16px", margin: "0 0 12px" }}>
            Je bestelling
          </Heading>
          {regels.map((r) => (
            <Text
              key={r.naam}
              style={{
                margin: "0 0 6px",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              {r.aantal}× {r.naam}
              <span style={{ float: "right", fontFamily: mono }}>
                {r.regelBedrag}
              </span>
            </Text>
          ))}

          <Hr style={{ borderColor: kleur.rail, margin: "16px 0" }} />

          <Text style={{ margin: "0 0 4px", fontSize: "14px", color: kleur.staal }}>
            Subtotaal excl. btw
            <span style={{ float: "right", fontFamily: mono }}>{subtotaal}</span>
          </Text>
          <Text style={{ margin: "0 0 4px", fontSize: "14px", color: kleur.staal }}>
            Btw
            <span style={{ float: "right", fontFamily: mono }}>{btw}</span>
          </Text>
          <Text style={{ margin: "0 0 4px", fontSize: "14px", color: kleur.staal }}>
            Verzending
            <span style={{ float: "right", fontFamily: mono }}>
              <span style={{ textDecoration: "line-through", color: kleur.rail }}>
                {verzendwaarde}
              </span>{" "}
              gratis
            </span>
          </Text>
          <Text style={{ margin: "12px 0 0", fontSize: "16px", fontWeight: 700 }}>
            Totaal incl. btw
            <span style={{ float: "right", fontFamily: mono }}>{totaal}</span>
          </Text>

          <Hr style={{ borderColor: kleur.rail, margin: "28px 0" }} />

          <Heading as="h2" style={{ fontSize: "16px", margin: "0 0 8px" }}>
            Bezorgadres
          </Heading>
          {adres.map((regel) => (
            <Text
              key={regel}
              style={{ margin: 0, fontSize: "14px", color: kleur.staal }}
            >
              {regel}
            </Text>
          ))}

          <Hr style={{ borderColor: kleur.rail, margin: "28px 0" }} />

          {/* §8: the withdrawal text and the model form travel with the
              confirmation, not buried on a page somewhere. */}
          <Heading as="h2" style={{ fontSize: "16px", margin: "0 0 8px" }}>
            Je bedenktijd
          </Heading>
          <Text style={{ margin: 0, fontSize: "14px", color: kleur.staal, lineHeight: 1.6 }}>
            Je hebt veertien dagen bedenktijd na ontvangst. Je hoeft geen reden
            op te geven. Op basis van vandaag loopt die termijn tot en met{" "}
            <strong style={{ color: kleur.antraciet, fontFamily: mono }}>
              {herroepingUiterlijk}
            </strong>
            . Het wettelijk modelformulier voor herroeping zit als pdf bij deze
            e-mail; gebruiken hoeft niet — melden via{" "}
            <a href={`${siteUrl}/retourneren/aanvragen`} style={{ color: kleur.rood }}>
              het retourformulier
            </a>{" "}
            mag ook.
          </Text>

          <Section
            style={{
              backgroundColor: "#faf3d4",
              border: "1px solid #f4c300",
              borderRadius: "10px",
              padding: "14px 16px",
              margin: "20px 0 0",
            }}
          >
            <Text style={{ margin: 0, fontSize: "13px", lineHeight: 1.6 }}>
              <strong>Stuur de module nooit ongevraagd terug.</strong> Blusbox
              valt onder een classificatie voor gevaarlijke goederen. Meld je
              retour eerst aan; je ontvangt dan de instructies en de
              vervoersdocumenten.
            </Text>
          </Section>

          <Hr style={{ borderColor: kleur.rail, margin: "28px 0" }} />

          <Text style={{ margin: 0, fontSize: "12px", color: kleur.staal, lineHeight: 1.6 }}>
            Bij levering ontvang je het lotnummer van je module. Registreer de
            installatiedatum in je account, dan waarschuwen we je op tijd
            voordat de levensduur van tien jaar verloopt.
          </Text>
          <Text style={{ margin: "16px 0 0", fontSize: "12px", color: kleur.rail }}>
            Blusbox · {siteUrl.replace(/^https?:\/\//, "")}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default Bestelbevestiging;
