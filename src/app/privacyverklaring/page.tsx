import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { Prose, DraftNotice } from "@/components/site/prose";

export const metadata: Metadata = {
  title: "Privacyverklaring",
  description:
    "Welke persoonsgegevens Blusbox verwerkt, waarvoor, hoe lang en welke rechten je hebt.",
  alternates: { canonical: "/privacyverklaring" },
};

export default function PrivacyverklaringPage() {
  return (
    <>
      <PageHeader
        eyebrow="juridisch"
        title="Privacyverklaring"
        lead="Wij verwerken niet meer gegevens dan nodig is om te leveren, je rechten te kunnen nakomen en je op tijd te waarschuwen als je module aan vervanging toe is."
      />
      <main>
        <Prose>
          <DraftNotice what="verwerkersovereenkomsten, bewaartermijnen en de definitieve lijst van ontvangers moeten worden ingevuld en door een jurist getoetst." />

          <h2>Verwerkingsverantwoordelijke</h2>
          <p>
            [VERIFY: statutaire naam, adres, KvK-nummer en contactgegevens voor
            privacyvragen]
          </p>

          <h2>Welke gegevens en waarvoor</h2>
          <ul>
            <li>
              <strong>Bestelling en levering</strong> — naam, adres, e-mail,
              telefoonnummer en betaalgegevens. Grondslag: uitvoering van de
              overeenkomst.
            </li>
            <li>
              <strong>Zakelijke accounts</strong> — bedrijfsnaam, KvK-nummer en
              btw-identificatienummer, onder meer voor btw-verlegging.
              Grondslag: overeenkomst en wettelijke verplichting.
            </li>
            <li>
              <strong>Registratie van geplaatste units</strong> — lotnummer,
              installatiedatum en locatietype, gekoppeld aan je account. Dit
              gebruiken wij voor vervangingsherinneringen en om je te kunnen
              bereiken bij een productterugroep. Grondslag: gerechtvaardigd
              belang bij productveiligheid en uitvoering van de overeenkomst.
            </li>
            <li>
              <strong>Activeringen</strong> — datum, oorzaak, afloop en
              eventuele foto&apos;s die je zelf aanlevert. Grondslag:
              gerechtvaardigd belang bij productveiligheid.
            </li>
            <li>
              <strong>Contact</strong> — de gegevens die je in een bericht
              achterlaat. Grondslag: gerechtvaardigd belang bij het beantwoorden
              van je vraag.
            </li>
          </ul>

          <h2>Bewaartermijnen</h2>
          <p>
            Bestel- en factuurgegevens bewaren wij zolang de wettelijke fiscale
            bewaarplicht dat vereist. Gegevens over geplaatste units bewaren wij
            gedurende de levensduur van de module plus de periode die nodig is
            om een terugroep te kunnen uitvoeren. [VERIFY: exacte termijnen]
          </p>

          <h2>Ontvangers</h2>
          <p>
            Wij delen gegevens uitsluitend met partijen die nodig zijn om te
            kunnen leveren: de betaaldienstverlener, de vervoerder, de
            e-maildienst voor transactionele berichten en onze hostingpartij.
            Met elk van hen sluiten wij een verwerkersovereenkomst.
            [VERIFY: namen van de verwerkers]
          </p>

          <h2>Je rechten</h2>
          <p>
            Je hebt recht op inzage, correctie, verwijdering, beperking,
            bezwaar en overdraagbaarheid van je gegevens. Een verzoek dien je in
            via <Link href="/contact">contact</Link>. Je kunt ook een klacht
            indienen bij de Autoriteit Persoonsgegevens.
          </p>
          <p>
            Verwijdering van registratiegegevens van een geplaatste unit kan
            betekenen dat wij je niet meer kunnen waarschuwen bij een
            terugroepactie. Dat vermelden wij bij zo&apos;n verzoek uitdrukkelijk.
          </p>

          <h2>Cookies</h2>
          <p>
            Zie het <Link href="/cookiebeleid">cookiebeleid</Link>.
          </p>
        </Prose>
      </main>
      <SiteFooter />
    </>
  );
}
