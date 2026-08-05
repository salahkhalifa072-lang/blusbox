import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { Prose, DraftNotice } from "@/components/site/prose";

export const metadata: Metadata = {
  title: "Garantie en conformiteit",
  description:
    "Je wettelijke rechten bij een product dat niet aan de overeenkomst beantwoordt, en wat een eventuele commerciële garantie daar bovenop doet.",
  alternates: { canonical: "/garantie" },
};

export default function GarantiePage() {
  return (
    <>
      <PageHeader
        eyebrow="consumentenrechten"
        title="Garantie en"
        accent="conformiteit"
        lead="Je wettelijke rechten staan los van elke garantie die wij zelf geven. Ze vervallen nooit doordat een garantietermijn afloopt."
      />
      <main>
        <Prose>
          <DraftNotice what="of er naast de wettelijke conformiteit een commerciële garantie wordt gegeven, en zo ja met welke duur en voorwaarden." />

          <h2>Wettelijke conformiteit</h2>
          <p>
            Op grond van het Burgerlijk Wetboek (art. 7:17 BW) moet een geleverd
            product beantwoorden aan de overeenkomst. Het moet de eigenschappen
            bezitten die je op basis van de aard van het product en onze
            mededelingen mocht verwachten.
          </p>
          <p>
            Beantwoordt het product daar niet aan, dan heb je recht op
            herstel of vervanging. Is dat niet mogelijk of niet redelijk, dan
            kun je ontbinding van de koop of een prijsvermindering verlangen.
            Dit recht is niet gebonden aan een vaste termijn van een jaar of
            twee: bepalend is wat je bij dit product redelijkerwijs mocht
            verwachten.
          </p>
          <p>
            Blijkt binnen een jaar na levering een gebrek, dan wordt vermoed dat
            het product bij aflevering al niet aan de overeenkomst
            beantwoordde, tenzij wij aantonen dat dat anders is.
          </p>

          <h2>Levensduur is geen gebrek</h2>
          <p>
            Blusbox heeft een opgegeven levensduur van tien jaar. Het bereiken
            van die termijn is geen gebrek, maar het einde van de
            gebruiksduur waarvoor het product is ontworpen. Je krijgt daarvan
            automatisch bericht op twaalf, zes en één maand voor het einde.
          </p>
          <p>
            Datzelfde geldt voor een module die is geactiveerd: die heeft precies
            gedaan waarvoor hij gemaakt is en is daarna verbruikt.
          </p>

          <h2>Commerciële garantie</h2>
          <p>
            [VERIFY: geeft Blusbox een aanvullende fabrieks- of
            handelsgarantie? Zo ja: duur, dekking, voorwaarden en wie de
            garantie verstrekt.]
          </p>
          <p>
            Een commerciële garantie komt altijd bovenop je wettelijke rechten
            en kan die nooit beperken.
          </p>

          <h2>Een gebrek melden</h2>
          <p>
            Meld een gebrek zo snel als redelijkerwijs mogelijk is via{" "}
            <Link href="/contact">contact</Link>, met je bestelnummer en het
            lotnummer van de module. Met dat lotnummer kunnen wij precies zien
            uit welke productiepartij jouw unit komt.
          </p>
        </Prose>
      </main>
      <SiteFooter />
    </>
  );
}
