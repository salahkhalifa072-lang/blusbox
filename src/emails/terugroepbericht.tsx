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
 * §9.2 recall notice.
 *
 * This is the one mail that must not read like marketing. No greeting about
 * how much we value the customer, no product benefits, nothing above the
 * warning. Someone skimming the first two lines on a phone has to come away
 * knowing that a specific module in their meterkast is affected and what to
 * do about it.
 *
 * The layout deliberately breaks the house style in one place: a red band at
 * the top instead of the usual anthracite. §6 allows blusrood once per view
 * and this is what it is for.
 */

export type TerugroepProps = {
  lotNummer: string;
  reden: string;
  /** Absolute link to the page where the recipient confirms receipt */
  bevestigUrl: string;
  siteUrl: string;
  /** Set once the client supplies it; without it we only offer e-mail */
  telefoon?: string;
  contactEmail: string;
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

export function Terugroepbericht({
  lotNummer,
  reden,
  bevestigUrl,
  siteUrl,
  telefoon,
  contactEmail,
}: TerugroepProps) {
  return (
    <Html lang="nl">
      <Head />
      {/* Wat in de inbox naast de onderwerpregel staat. Hier telt elk woord. */}
      <Preview>
        Veiligheidswaarschuwing: de Blusbox uit lot {lotNummer} moet worden
        vervangen
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
              backgroundColor: kleur.rood,
              padding: "24px",
              borderRadius: "12px",
            }}
          >
            <Text
              style={{
                margin: 0,
                color: kleur.kastwit,
                fontFamily: mono,
                fontSize: "12px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Veiligheidswaarschuwing
            </Text>
            <Text
              style={{
                margin: "8px 0 0",
                color: "#ffffff",
                fontSize: "22px",
                fontWeight: 700,
                lineHeight: 1.3,
              }}
            >
              Vervang je Blusbox uit lot {lotNummer}
            </Text>
          </Section>

          <Text style={{ margin: "28px 0 0", fontSize: "16px", lineHeight: 1.6 }}>
            Je hebt een Blusbox-module gekocht uit lot{" "}
            <strong style={{ fontFamily: mono }}>{lotNummer}</strong>. Uit
            controle is gebleken dat modules uit dit lot mogelijk niet werken
            zoals ze horen te werken. Ga ervan uit dat jouw module{" "}
            <strong>op dit moment geen bescherming biedt</strong>.
          </Text>

          <Hr style={{ borderColor: kleur.rail, margin: "28px 0" }} />

          <Heading as="h2" style={{ fontSize: "16px", margin: "0 0 8px" }}>
            Wat er aan de hand is
          </Heading>
          <Text
            style={{
              margin: 0,
              fontSize: "14px",
              color: kleur.staal,
              lineHeight: 1.6,
            }}
          >
            {reden}
          </Text>

          <Hr style={{ borderColor: kleur.rail, margin: "28px 0" }} />

          <Heading as="h2" style={{ fontSize: "16px", margin: "0 0 12px" }}>
            Wat je moet doen
          </Heading>

          <Text style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: 1.6 }}>
            <strong>1. Laat de module zitten.</strong> Haal hem niet zelf uit
            de meterkast en gooi hem niet bij het restafval. Wij nemen hem
            terug zodra de vervangende module bij je is.
          </Text>
          <Text style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: 1.6 }}>
            <strong>2. Bevestig dat je dit bericht hebt gelezen.</strong> Dat
            doe je met de knop hieronder. Zolang we die bevestiging niet hebben,
            blijven we contact met je zoeken.
          </Text>
          <Text style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: 1.6 }}>
            <strong>3. Je krijgt kosteloos een vervangende module</strong>, met
            een retourinstructie voor de oude. Je hoeft niets te betalen.
          </Text>

          <Section style={{ margin: "28px 0 0", textAlign: "center" }}>
            <a
              href={bevestigUrl}
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
              Ik heb dit gelezen
            </a>
          </Section>
          <Text
            style={{
              margin: "12px 0 0",
              fontSize: "12px",
              color: kleur.rail,
              textAlign: "center",
              wordBreak: "break-all",
            }}
          >
            Werkt de knop niet? Open dan deze link: {bevestigUrl}
          </Text>

          <Hr style={{ borderColor: kleur.rail, margin: "28px 0" }} />

          <Heading as="h2" style={{ fontSize: "16px", margin: "0 0 8px" }}>
            Vragen
          </Heading>
          <Text
            style={{
              margin: 0,
              fontSize: "14px",
              color: kleur.staal,
              lineHeight: 1.6,
            }}
          >
            Mail ons op{" "}
            <a href={`mailto:${contactEmail}`} style={{ color: kleur.rood }}>
              {contactEmail}
            </a>
            {telefoon ? (
              <>
                {" "}
                of bel {telefoon}
              </>
            ) : null}
            . Vermeld het lotnummer{" "}
            <span style={{ fontFamily: mono }}>{lotNummer}</span>, dan kunnen we
            je meteen helpen.
          </Text>

          <Text
            style={{
              margin: "28px 0 0",
              fontSize: "12px",
              color: kleur.rail,
              lineHeight: 1.6,
            }}
          >
            Je ontvangt dit bericht omdat je een Blusbox uit dit lot hebt
            gekocht of geregistreerd. Dit is geen reclame en je kunt je hier
            niet voor afmelden — het gaat over de veiligheid van een product dat
            je in huis hebt.
          </Text>
          <Text style={{ margin: "12px 0 0", fontSize: "12px", color: kleur.rail }}>
            Blusbox · {siteUrl.replace(/^https?:\/\//, "")}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default Terugroepbericht;
