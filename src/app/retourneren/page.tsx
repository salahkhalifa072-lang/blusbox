import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { Prose, DraftNotice } from "@/components/site/prose";

export const metadata: Metadata = {
  title: "Retourneren",
  description:
    "Een bestelling terugsturen: melden via je account, retourinstructies ontvangen en terugbetaling binnen veertien dagen.",
  alternates: { canonical: "/retourneren" },
};

export default function RetournerenPage() {
  return (
    <>
      <PageHeader
        eyebrow="service"
        title="Retourneren"
        lead="Melden, instructies afwachten, terugsturen. Je hebt veertien dagen bedenktijd en hoeft geen reden op te geven."
      />
      <main>
        <Prose>
          <DraftNotice what="retouradres, retourkosten, verpakkingseisen voor de retourzending en de afhandelingstermijn." />

          <h2>In het kort</h2>
          <ol>
            <li>
              <Link href="/retourneren/aanvragen">Meld je retour aan</Link> met
              je bestelnummer en e-mailadres — een account is niet nodig.
            </li>
            <li>
              Je krijgt een retournummer en instructies, inclusief hoe het
              product verpakt en aangeboden moet worden.
            </li>
            <li>
              Stuur het product terug volgens die instructies, binnen veertien
              dagen na je melding.
            </li>
            <li>
              Na ontvangst en controle betalen wij terug binnen de wettelijke
              termijn.
            </li>
          </ol>

          <h2>Binnen de bedenktijd</h2>
          <p>
            Als consument kun je binnen veertien dagen na ontvangst zonder
            opgave van reden herroepen. De voorwaarden en termijnen daarvoor
            staan op de pagina{" "}
            <Link href="/herroepingsrecht">herroepingsrecht</Link>.
          </p>

          <h2>Buiten de bedenktijd</h2>
          <p>
            Is de bedenktijd voorbij, dan kun je nog steeds een beroep doen op
            je wettelijke rechten als het product niet is wat je ervan mocht
            verwachten. Zie <Link href="/garantie">garantie en conformiteit</Link>.
          </p>

          <h2>Meld je retour eerst aan</h2>
          <p>
            Bij je melding ontvang je het retouradres en de instructies. Dat is
            geen formaliteit: zo weten wij welk pakket eraan komt, kunnen we het
            aan jouw bestelling koppelen en sneller terugbetalen. Een pakket dat
            onaangekondigd binnenkomt zonder afzender kost iedereen tijd.
          </p>
          <p>
            De kosten van de retourzending zijn voor jou, tenzij het product
            defect is of wij iets verkeerds hebben gestuurd — in dat geval
            regelen en betalen wij het retour.
          </p>

          <h2>Geactiveerde modules</h2>
          <p>
            Een module die is afgegaan, is verbruikt en kan niet worden
            geretourneerd of hergebruikt. Meld de activering in je account —
            zowel voor de vervanging als voor het activeringsregister. Gooi hem
            niet bij het restafval; stuur hem naar ons terug, dan zorgen wij
            voor de verwerking.
          </p>
        </Prose>
      </main>
      <SiteFooter />
    </>
  );
}
