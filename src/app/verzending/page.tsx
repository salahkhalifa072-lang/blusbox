import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { Prose, DraftNotice } from "@/components/site/prose";
import { verzendwaarde } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Verzending",
  description:
    "Levertijden, verzendkosten en waarom Blusbox als gevaarlijk goed wordt verzonden — inclusief wat dat betekent voor bestemmingen en aantallen.",
  alternates: { canonical: "/verzending" },
};

export default function VerzendingPage() {
  return (
    <>
      <PageHeader
        eyebrow="service"
        title="Verzending"
        lead="Blusbox bevat een blusmiddel en wordt daarom verzonden als gevaarlijk goed. Dat bepaalt met welke vervoerder, naar welke bestemming en in welke aantallen wij kunnen leveren."
      />
      <main>
        <Prose>
          <DraftNotice what="levertijden, UN-nummer en transportklasse, en de lijst met toegestane bestemmingen en maximale aantallen per zending." />

          <h2>Altijd gratis verzending</h2>
          <p>
            Wij rekenen geen verzendkosten. Niet vanaf een bepaald bedrag, niet
            bij een actie — bij elke bestelling. De verzending is{" "}
            {verzendwaarde} waard en die betaal je niet.
          </p>
          <ul>
            <li>Verzendkosten Nederland: gratis</li>
            <li>Minimumbedrag: geen</li>
            <li>Levertijd: [VERIFY]</li>
            <li>Bezorging België: [VERIFY]</li>
          </ul>

          <h2>Waarom dit anders gaat dan bij een gewoon pakket</h2>
          <p>
            Het blusmiddel in de module valt onder een classificatie voor
            gevaarlijke goederen. Dat is geen bijzonderheid van dit product maar
            de normale gang van zaken bij blusmiddelen, en het heeft drie
            gevolgen.
          </p>
          <ul>
            <li>
              Niet elke vervoerder mag de zending vervoeren; wij werken met
              vervoerders die daarvoor zijn ingericht.
            </li>
            <li>
              Er gaan vervoersdocumenten mee. Die zitten bij de zending en
              hoeven verder niets van je te vragen.
            </li>
            <li>
              Niet elke bestemming en niet elk aantal is mogelijk. Wat naar jouw
              adres verzonden kan worden, zie je bij het afrekenen — in gewoon
              Nederlands, niet als foutmelding achteraf.
            </li>
          </ul>
          <p>[VERIFY: UN-nummer en transportklasse]</p>

          <h2>Bestemmingen</h2>
          <p>
            Wij leveren op dit moment in Nederland, met België in voorbereiding.
            Voor andere bestemmingen binnen de EU nemen wij zakelijke
            aanvragen per geval in behandeling via{" "}
            <Link href="/contact">contact</Link>.
          </p>

          <h2>Zakelijke leveringen</h2>
          <p>
            Bij grotere aantallen gelden andere vervoersvoorwaarden en soms een
            andere route. Bij de picklijst van elke zakelijke zending gaan de
            benodigde ADR-documenten mee. Meer daarover op{" "}
            <Link href="/zakelijk">zakelijk</Link>.
          </p>

          <h2>Retour sturen</h2>
          <p>
            Om dezelfde reden kun je een module niet zomaar in een gewone
            pakketzending terugsturen. Volg altijd de instructies die je bij je
            retourmelding krijgt — zie{" "}
            <Link href="/retourneren">retourneren</Link>.
          </p>
        </Prose>
      </main>
      <SiteFooter />
    </>
  );
}
