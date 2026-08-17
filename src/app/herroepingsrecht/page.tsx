import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { Prose, DraftNotice } from "@/components/site/prose";

export const metadata: Metadata = {
  title: "Herroepingsrecht",
  description:
    "Als consument heb je veertien dagen bedenktijd na ontvangst van je bestelling. Zo werkt het herroepingsrecht bij Blusbox.",
  alternates: { canonical: "/herroepingsrecht" },
};

export default function HerroepingsrechtPage() {
  return (
    <>
      <PageHeader
        eyebrow="consumentenrechten"
        title="Herroepingsrecht"
        lead="Koop je als consument op afstand, dan heb je veertien dagen bedenktijd. Je hoeft geen reden op te geven."
      />
      <main>
        <Prose>
          <DraftNotice what="het retouradres, wie de retourkosten draagt en de exacte terugbetalingstermijn moeten worden ingevuld en juridisch getoetst." />

          <h2>Veertien dagen bedenktijd</h2>
          <p>
            Je hebt het recht je bestelling binnen veertien dagen na ontvangst
            zonder opgave van reden te herroepen. Die termijn begint op de dag
            nadat jij, of iemand die jij hebt aangewezen, het product hebt
            ontvangen.
          </p>
          <p>
            Tijdens de bedenktijd ga je zorgvuldig om met het product en de
            verpakking. Je mag het product uitpakken en bekijken zoals je dat in
            een winkel zou doen. Gebruik je het verder dan nodig om de aard en
            werking te beoordelen, dan kunnen wij de waardevermindering
            verrekenen.
          </p>

          <h2>Zo meld je een herroeping</h2>
          <ol>
            <li>
              Meld binnen veertien dagen dat je de koop wilt herroepen. Dat kan
              via het retourformulier in je account, via het wettelijk
              modelformulier, of met een eigen ondubbelzinnige verklaring per
              e-mail.
            </li>
            <li>
              Je krijgt een bevestiging van je melding met de
              retourinstructies.
            </li>
            <li>
              Stuur het product binnen veertien dagen na je melding terug naar
              het adres dat je bij je bevestiging hebt gekregen.
            </li>
          </ol>

          <h2>Terugbetaling</h2>
          <p>
            Wij betalen alles terug wat je hebt betaald, inclusief de standaard
            verzendkosten van de heenzending. Kies je bij de bestelling voor een
            duurdere verzendmethode, dan vergoeden wij het standaardtarief.
          </p>
          <p>
            De terugbetaling doen wij uiterlijk veertien dagen nadat je de
            herroeping hebt gemeld, met hetzelfde betaalmiddel als waarmee je
            hebt betaald. Wij mogen wachten met terugbetalen tot wij het product
            terug hebben ontvangen, of tot jij hebt aangetoond dat je het hebt
            teruggestuurd.
          </p>
          <p>
            De directe kosten van het terugzenden zijn voor jou. Is het product
            defect of hebben wij iets verkeerds gestuurd, dan regelen en betalen
            wij het retour.
          </p>

          <h2>Let op bij verzending</h2>
          <p>
            Meld je retour eerst aan; je ontvangt dan het retouradres en de
            instructies. Zo kunnen wij je zending aan je bestelling koppelen en
            sneller terugbetalen.{" "}
            <Link href="/verzending">Meer over verzending</Link>.
          </p>

          <h2>Modelformulier</h2>
          <p>
            Het wettelijk modelformulier voor herroeping stel je hier
            beschikbaar:{" "}
            <a href="/herroepingsformulier.pdf">
              modelformulier voor herroeping (pdf)
            </a>
            . Gebruik ervan is niet verplicht — melden via{" "}
            <Link href="/retourneren/aanvragen">het retourformulier</Link> of
            met een eigen ondubbelzinnige verklaring mag ook.
          </p>

          <h2>Uitzonderingen</h2>
          <p>
            Het herroepingsrecht geldt voor consumenten. Zakelijke afnemers
            hebben dit wettelijke recht niet; voor hen gelden de{" "}
            <Link href="/algemene-voorwaarden">algemene voorwaarden</Link>.
          </p>
        </Prose>
      </main>
      <SiteFooter />
    </>
  );
}
