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
 * §8 verzendbericht.
 *
 * De bestelbevestiging belooft letterlijk "zodra het pakket onderweg is,
 * laten we het weten". Dit is dat bericht.
 *
 * Twee dingen die hier per se in moeten en die een standaard verzendmail
 * niet heeft: dat het pakket als gevaarlijk goed reist (de bezorger kan er
 * naar vragen, en het pakket draagt een label), en dat de bedenktijd pas
 * begint bij ontvangst — niet nu.
 */

export type VerzendberichtProps = {
  ordernummer: string;
  adres: string[];
  trackAndTrace?: string;
  vervoerder?: string;
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

export function Verzendbericht({
  ordernummer,
  adres,
  trackAndTrace,
  vervoerder,
  siteUrl,
}: VerzendberichtProps) {
  return (
    <Html lang="nl">
      <Head />
      <Preview>Je Blusbox is onderweg — bestelling {ordernummer}</Preview>
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
            Je Blusbox is onderweg
          </Heading>
          <Text style={{ margin: 0, color: kleur.staal, lineHeight: 1.6 }}>
            We hebben je bestelling overgedragen aan de vervoerder.
          </Text>

          {trackAndTrace ? (
            <>
              <Hr style={{ borderColor: kleur.rail, margin: "28px 0" }} />
              <Heading as="h2" style={{ fontSize: "16px", margin: "0 0 8px" }}>
                Je zending volgen
              </Heading>
              <Text style={{ margin: "0 0 4px", fontSize: "14px" }}>
                Zendingnummer
                <span style={{ float: "right", fontFamily: mono }}>
                  {trackAndTrace}
                </span>
              </Text>
              {vervoerder ? (
                <Text
                  style={{ margin: 0, fontSize: "14px", color: kleur.staal }}
                >
                  Vervoerder
                  <span style={{ float: "right", fontFamily: mono }}>
                    {vervoerder}
                  </span>
                </Text>
              ) : null}
            </>
          ) : null}

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
              <strong>Het pakket reist als gevaarlijk goed.</strong> Er zit een
              label op en de vervoersdocumenten gaan mee in de doos. Bewaar die
              papieren; je hebt ze nodig als je de module ooit terugstuurt.
            </Text>
          </Section>

          <Hr style={{ borderColor: kleur.rail, margin: "28px 0" }} />

          <Text
            style={{
              margin: 0,
              fontSize: "14px",
              color: kleur.staal,
              lineHeight: 1.6,
            }}
          >
            Je bedenktijd van veertien dagen begint zodra je het pakket
            ontvangt, niet vandaag. Zodra de bezorging is verwerkt sturen we je
            de exacte einddatum.
          </Text>

          <Text
            style={{
              margin: "16px 0 0",
              fontSize: "12px",
              color: kleur.staal,
              lineHeight: 1.6,
            }}
          >
            Bij het pakket zit een registratiekaart met je lotnummer.
            Registreer de installatiedatum in je account, dan waarschuwen we je
            op tijd voordat de levensduur van tien jaar verloopt.
          </Text>
          <Text
            style={{ margin: "16px 0 0", fontSize: "12px", color: kleur.rail }}
          >
            Blusbox · {siteUrl.replace(/^https?:\/\//, "")}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default Verzendbericht;
