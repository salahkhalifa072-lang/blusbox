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
 * §8 bezorgbericht.
 *
 * Bestaat vooral om één ding vast te leggen: de herroepingstermijn loopt
 * vanaf ontvangst, en dit is het bericht waarin de klant zwart-op-wit de
 * einddatum krijgt. Dat is niet alleen netjes maar ook de datum waar een
 * geschil later op teruggrijpt.
 *
 * Verder is dit het moment om te vragen de installatiedatum te registreren.
 * Zonder registratie kunnen we bij een terugroepactie alleen de koper
 * bereiken, en weten we niet waar de module hangt.
 */

export type BezorgberichtProps = {
  ordernummer: string;
  herroepingUiterlijk: string;
  siteUrl: string;
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

export function Bezorgbericht({
  ordernummer,
  herroepingUiterlijk,
  siteUrl,
}: BezorgberichtProps) {
  return (
    <Html lang="nl">
      <Head />
      <Preview>
        Je Blusbox is bezorgd — bedenktijd tot en met {herroepingUiterlijk}
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
            Je Blusbox is bezorgd
          </Heading>
          <Text style={{ margin: 0, color: kleur.staal, lineHeight: 1.6 }}>
            Volgens de vervoerder is je pakket afgeleverd. Klopt dat niet, laat
            het ons dan weten.
          </Text>

          <Hr style={{ borderColor: kleur.rail, margin: "28px 0" }} />

          <Heading as="h2" style={{ fontSize: "16px", margin: "0 0 8px" }}>
            Je bedenktijd
          </Heading>
          <Text
            style={{
              margin: 0,
              fontSize: "14px",
              color: kleur.staal,
              lineHeight: 1.6,
            }}
          >
            Je hebt veertien dagen bedenktijd, gerekend vanaf de bezorging. Je
            hoeft geen reden op te geven. Die termijn loopt tot en met{" "}
            <strong style={{ color: kleur.antraciet, fontFamily: mono }}>
              {herroepingUiterlijk}
            </strong>
            . Melden kan via{" "}
            <a
              href={`${siteUrl}/retourneren/aanvragen`}
              style={{ color: kleur.rood }}
            >
              het retourformulier
            </a>
            ; het wettelijk modelformulier zat als pdf bij je bevestiging.
          </Text>

          <Section
            style={{
              backgroundColor: "#faf3d4",
              border: `1px solid ${kleur.signaal}`,
              borderRadius: "10px",
              padding: "14px 16px",
              margin: "20px 0 0",
            }}
          >
            <Text style={{ margin: 0, fontSize: "13px", lineHeight: 1.6 }}>
              <strong>Meld een retour eerst aan.</strong> Dan weten wij welk
              pakket eraan komt en ontvang je het retouradres en de
              instructies. Ongevraagd terugsturen kost alleen maar tijd.
            </Text>
          </Section>

          <Hr style={{ borderColor: kleur.rail, margin: "28px 0" }} />

          <Heading as="h2" style={{ fontSize: "16px", margin: "0 0 8px" }}>
            Registreer je module
          </Heading>
          <Text
            style={{
              margin: 0,
              fontSize: "14px",
              color: kleur.staal,
              lineHeight: 1.6,
            }}
          >
            Op de registratiekaart in de doos staat je lotnummer. Registreer de
            installatiedatum, dan waarschuwen we je op tijd voordat de
            levensduur van tien jaar verloopt — en weten we je te vinden als er
            ooit iets met jouw partij aan de hand is.
          </Text>

          <Section style={{ margin: "24px 0 0", textAlign: "center" }}>
            <a
              href={`${siteUrl}/account`}
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
              Installatiedatum registreren
            </a>
          </Section>

          <Text
            style={{ margin: "28px 0 0", fontSize: "12px", color: kleur.rail }}
          >
            Blusbox · {siteUrl.replace(/^https?:\/\//, "")}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default Bezorgbericht;
