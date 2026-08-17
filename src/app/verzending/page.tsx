import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { Prose } from "@/components/site/prose";
import { verzendwaarde } from "@/lib/pricing";
import { LEVERTIJD } from "@/lib/verzending";

export const metadata: Metadata = {
  title: "Verzending",
  description:
    "Gratis verzending bij elke bestelling, bezorging binnen één werkdag in Nederland. Geen minimumbedrag en geen maximum aantal.",
  alternates: { canonical: "/verzending" },
};

export default function VerzendingPage() {
  return (
    <>
      <PageHeader
        eyebrow="service"
        title="Verzending"
        lead={`Gratis, bij elke bestelling en zonder minimumbedrag. In Nederland is je pakket er doorgaans binnen ${LEVERTIJD}.`}
      />
      <main>
        <Prose>
          <h2>Altijd gratis verzending</h2>
          <p>
            Wij rekenen geen verzendkosten. Niet vanaf een bepaald bedrag, niet
            bij een actie — bij elke bestelling. De verzending is{" "}
            {verzendwaarde} waard en die betaal je niet.
          </p>
          <ul>
            <li>Verzendkosten Nederland: gratis</li>
            <li>Minimumbedrag: geen</li>
            <li>Levertijd: {LEVERTIJD}</li>
            <li>Maximum aantal per zending: geen</li>
          </ul>

          <h2>Bestemmingen</h2>
          <p>
            Wij bezorgen op dit moment binnen Nederland. Voor levering elders in
            de EU nemen wij zakelijke aanvragen per geval in behandeling via{" "}
            <Link href="/contact">contact</Link>.
          </p>

          <h2>Zakelijke leveringen</h2>
          <p>
            Vanaf dertig stuks geldt een staffelkorting die oploopt met het
            aantal. Grotere aantallen gaan in meerdere dozen, met de lotnummers
            per doos vermeld. Meer daarover op{" "}
            <Link href="/zakelijk">zakelijk</Link>.
          </p>

          <h2>Retour sturen</h2>
          <p>
            Meld je retour eerst aan, dan ontvang je het retouradres en de
            instructies — zie <Link href="/retourneren">retourneren</Link>. Zo
            weten wij welk pakket eraan komt en kunnen we sneller terugbetalen.
          </p>
        </Prose>
      </main>
      <SiteFooter />
    </>
  );
}
