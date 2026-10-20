import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { Prose, DraftNotice } from "@/components/site/prose";
import { bedrijf } from "@/lib/bedrijf";

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
          <ul>
            <li>{bedrijf.volledig}</li>
            <li>KvK-nummer: {bedrijf.kvk}</li>
            <li>
              Privacyvragen:{" "}
              <a href={`mailto:${bedrijf.email}`}>{bedrijf.email}</a>
            </li>
            <li>
              Telefoon:{" "}
              <a href={`tel:${bedrijf.telefoonLink}`}>{bedrijf.telefoon}</a>
            </li>
          </ul>

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
            om een terugroep te kunnen uitvoeren. Concreet: bestel- en
            factuurgegevens zeven jaar (fiscale bewaarplicht), gegevens over een
            geplaatste module tot tien jaar na installatie plus één jaar, en een
            account zolang je het gebruikt.
          </p>

          <h2>Ontvangers</h2>
          <p>
            Wij delen gegevens uitsluitend met partijen die nodig zijn om te
            kunnen leveren en met je te communiceren. Concreet zijn dat:
          </p>
          <ul>
            <li>Stripe, voor het afhandelen van betalingen;</li>
            <li>Vercel, waar de website draait;</li>
            <li>Neon, voor onze database (servers in Frankfurt);</li>
            <li>
              MailerSend, dat onze transactionele e-mails verstuurt, zoals de
              orderbevestiging, de factuur en berichten over je bestelling;
            </li>
            <li>
              Theory7, dat onze e-maildomeinen host. E-mail die je naar een
              @blusbox.nl-adres stuurt, wordt doorgestuurd naar een mailbox bij
              Google;
            </li>
            <li>de vervoerder die je pakket bezorgt.</li>
          </ul>
          <p>
            Met deze partijen maken wij afspraken over de verwerking van je
            gegevens. Een deel van hen kan gegevens ook buiten de Europese
            Economische Ruimte verwerken. Dat gebeurt dan op grond van
            standaardcontractbepalingen van de Europese Commissie of een
            adequaatheidsbesluit.
          </p>

          <h2>Advertenties en statistieken</h2>
          <p>
            Als je daar in de cookiebanner toestemming voor geeft, meten wij met
            Google Ads en Google Analytics of onze advertenties tot bestellingen
            leiden. Geef je geen toestemming, dan worden die diensten niet
            geladen. Welke cookies dat zijn en hoe je je toestemming intrekt,
            lees je in ons <Link href="/cookiebeleid">cookiebeleid</Link>.
          </p>

          <h2>Google Klantenreviews</h2>
          <p>
            Na een betaalde bestelling vraagt Google je op de
            bevestigingspagina of je na levering een korte enquête over je
            aankoop wilt ontvangen. Alleen als je daar ja op zegt, ontvangt
            Google je e-mailadres, je bestelnummer, het land van levering, de
            verwachte leverdatum en de productcode, om je die enquête te
            sturen. Zeg je nee of sluit je het venster, dan gebeurt er niets.
            Voor de enquête zelf geldt het privacybeleid van Google.
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
