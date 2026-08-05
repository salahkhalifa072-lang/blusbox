import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { Prose, DraftNotice } from "@/components/site/prose";

export const metadata: Metadata = {
  title: "Algemene voorwaarden",
  description: "De algemene voorwaarden die gelden bij bestellingen bij Blusbox.",
  alternates: { canonical: "/algemene-voorwaarden" },
};

export default function AlgemeneVoorwaardenPage() {
  return (
    <>
      <PageHeader
        eyebrow="juridisch"
        title="Algemene voorwaarden"
        lead="Deze voorwaarden gelden bij elke bestelling. Je wettelijke rechten als consument blijven hoe dan ook gelden."
      />
      <main>
        <Prose>
          <DraftNotice what="de volledige tekst moet door een jurist worden opgesteld of getoetst. Onderstaande opzet geeft alleen de hoofdstukindeling en de punten die voor dit product afwijken van een standaardset." />

          <h2>1. Wie wij zijn</h2>
          <p>
            [VERIFY: statutaire naam, handelsnaam, vestigingsadres, KvK-nummer,
            btw-identificatienummer en contactgegevens]
          </p>

          <h2>2. Toepasselijkheid</h2>
          <p>
            Deze voorwaarden zijn van toepassing op elk aanbod en elke
            overeenkomst tussen ons en jou. Wijken wij ergens van af, dan
            leggen wij dat schriftelijk vast.
          </p>

          <h2>3. Aanbod en overeenkomst</h2>
          <p>
            Prijzen op de site zijn voor consumenten inclusief btw en voor
            zakelijke accounts exclusief btw. Kennelijke vergissingen of fouten
            binden ons niet. [VERIFY: geldigheidsduur van aanbiedingen]
          </p>

          <h2>4. Betaling</h2>
          <p>
            Betaling verloopt via de betaalmethoden die bij het afrekenen worden
            getoond. Zakelijke afnemers kunnen na goedkeuring op rekening
            bestellen. [VERIFY: betalingstermijn en gevolgen bij te late
            betaling]
          </p>

          <h2>5. Levering en gevaarlijke goederen</h2>
          <p>
            Het product valt onder een classificatie voor gevaarlijke goederen.
            Wij leveren uitsluitend naar bestemmingen en in aantallen die
            volgens de geldende vervoersregels zijn toegestaan. Kunnen wij een
            bestelling niet vervoeren, dan komt die niet tot stand en betalen wij
            een eventueel reeds betaald bedrag terug. Zie{" "}
            <Link href="/verzending">verzending</Link>.
          </p>

          <h2>6. Herroepingsrecht</h2>
          <p>
            Consumenten hebben veertien dagen bedenktijd. De volledige regeling
            staat op <Link href="/herroepingsrecht">herroepingsrecht</Link>. Dit
            recht geldt niet voor zakelijke afnemers.
          </p>

          <h2>7. Conformiteit en garantie</h2>
          <p>
            Zie <Link href="/garantie">garantie en conformiteit</Link>. Een
            eventuele commerciële garantie laat de wettelijke rechten
            onverlet.
          </p>

          <h2>8. Gebruik van het product</h2>
          <p>
            Het product is bedoeld voor toepassing in elektrische behuizingen
            zoals beschreven in de handleiding en op{" "}
            <Link href="/hoe-het-werkt">hoe het werkt</Link>. Toepassing buiten
            het beschreven toepassingsgebied, of montage in afwijking van de
            handleiding, valt buiten onze verantwoordelijkheid.
          </p>

          <h2>9. Aansprakelijkheid</h2>
          <p>
            [VERIFY: aansprakelijkheidsbepaling, af te stemmen met verzekeraar
            en jurist. Let op dat aansprakelijkheid voor consumenten niet verder
            beperkt mag worden dan de wet toestaat.]
          </p>

          <h2>10. Klachten en geschillen</h2>
          <p>
            Klachten kun je indienen via <Link href="/contact">contact</Link>. Wij
            reageren binnen [VERIFY: termijn]. Op onze overeenkomsten is
            Nederlands recht van toepassing. Consumenten kunnen daarnaast
            gebruikmaken van het Europese ODR-platform.
          </p>

          <h2>11. Persoonsgegevens</h2>
          <p>
            Hoe wij met je gegevens omgaan staat in de{" "}
            <Link href="/privacyverklaring">privacyverklaring</Link>.
          </p>
        </Prose>
      </main>
      <SiteFooter />
    </>
  );
}
