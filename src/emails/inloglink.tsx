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
 * §3 inloglink.
 *
 * Kort houden. Iemand die deze mail opent wil één ding, en elke extra
 * alinea is een alinea waarin de knop niet staat.
 *
 * Wel nadrukkelijk vermelden dat de link vanzelf verloopt en wat te doen
 * als je hem niet zelf hebt aangevraagd — dat is precies het bericht dat
 * misbruikt wordt om mensen ergens in te laten loggen.
 */

export type InloglinkProps = {
  url: string;
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

export function Inloglink({ url, siteUrl }: InloglinkProps) {
  return (
    <Html lang="nl">
      <Head />
      <Preview>Je inloglink voor Blusbox — 24 uur geldig</Preview>
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
          </Section>

          <Heading
            as="h1"
            style={{ fontSize: "24px", margin: "32px 0 8px", fontWeight: 700 }}
          >
            Inloggen bij Blusbox
          </Heading>
          <Text style={{ margin: 0, color: kleur.staal, lineHeight: 1.6 }}>
            Klik op de knop hieronder om in te loggen. De link werkt 24 uur en
            daarna niet meer.
          </Text>

          <Section style={{ margin: "28px 0 0", textAlign: "center" }}>
            <a
              href={url}
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
              Inloggen
            </a>
          </Section>
          <Text
            style={{
              margin: "12px 0 0",
              fontSize: "12px",
              color: kleur.rail,
              textAlign: "center",
              wordBreak: "break-all",
              fontFamily: mono,
            }}
          >
            {url}
          </Text>

          <Hr style={{ borderColor: kleur.rail, margin: "28px 0" }} />

          <Text
            style={{
              margin: 0,
              fontSize: "13px",
              color: kleur.staal,
              lineHeight: 1.6,
            }}
          >
            Heb je zelf geen inloglink aangevraagd? Dan hoef je niets te doen —
            zonder deze mail komt niemand in je account. Klik in dat geval ook
            niet op de knop.
          </Text>
          <Text style={{ margin: "16px 0 0", fontSize: "12px", color: kleur.rail }}>
            Blusbox · {siteUrl.replace(/^https?:\/\//, "")}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default Inloglink;
