import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { Prose, DraftNotice } from "@/components/site/prose";
import { prijsIncl, verzendwaarde } from "@/lib/pricing";
import { bedrijf } from "@/lib/bedrijf";

export const metadata: Metadata = {
  title: "Algemene voorwaarden",
  description:
    "De algemene voorwaarden die gelden bij bestellingen bij Blusbox: bestellen, betalen, levering, herroeping, conformiteit en aansprakelijkheid.",
  alternates: { canonical: "/algemene-voorwaarden" },
};

export default function AlgemeneVoorwaardenPage() {
  return (
    <>
      <PageHeader
        eyebrow="juridisch"
        title="Algemene voorwaarden"
        lead="Deze voorwaarden gelden bij elke bestelling. Ben je consument, dan blijven je wettelijke rechten altijd gelden — ook waar deze voorwaarden iets anders zouden suggereren."
      />
      <main>
        <Prose>
          <DraftNotice what="deze tekst is opgesteld op basis van de wettelijke eisen maar is nog niet door een jurist getoetst. De bedrijfsgegevens, termijnen en de aansprakelijkheidsbepaling zijn ingevuld; laat ze vóór livegang controleren." />

          <p>
            <em>Versie 1 · laatst bijgewerkt op 5 augustus 2026</em>
          </p>

          <h2>Artikel 1 — Definities</h2>
          <ul>
            <li>
              <strong>Blusbox</strong>: {bedrijf.volledig}, de verkoper,
              hierna ook &apos;wij&apos; of &apos;ons&apos;.
            </li>
            <li>
              <strong>Consument</strong>: een natuurlijk persoon die niet handelt
              in de uitoefening van beroep of bedrijf.
            </li>
            <li>
              <strong>Zakelijke afnemer</strong>: iedere andere afnemer, waaronder
              installateurs, VvE&apos;s, woningcorporaties en bedrijven.
            </li>
            <li>
              <strong>Product</strong>: de Blusbox-blusmodule en de daarbij
              behorende vervangmodule.
            </li>
            <li>
              <strong>Overeenkomst</strong>: de koop op afstand die tot stand komt
              via deze website.
            </li>
          </ul>

          <h2>Artikel 2 — Wie wij zijn</h2>
          <ul>
            <li>{bedrijf.volledig}</li>
            <li>KvK-nummer: {bedrijf.kvk}</li>
            <li>Btw-identificatienummer: {bedrijf.btwId}</li>
            <li>
              E-mail:{" "}
              <a href={`mailto:${bedrijf.email}`}>{bedrijf.email}</a>
            </li>
            <li>
              Telefoon:{" "}
              <a href={`tel:${bedrijf.telefoonLink}`}>{bedrijf.telefoon}</a>
            </li>
          </ul>
          <p>
            Wij verkopen uitsluitend op afstand en houden geen bezoekadres voor
            publiek aan. Het retouradres ontvang je zodra je een retour aanmeldt.
            Wij beantwoorden vragen en klachten binnen twee werkdagen.
          </p>

          <h2>Artikel 3 — Toepasselijkheid</h2>
          <ol>
            <li>
              Deze voorwaarden zijn van toepassing op elk aanbod van Blusbox en
              op elke overeenkomst die tussen ons en jou tot stand komt.
            </li>
            <li>
              Voordat de overeenkomst wordt gesloten, stellen wij deze
              voorwaarden langs elektronische weg beschikbaar, zodat je ze kunt
              opslaan. Ze zijn ook op deze pagina te raadplegen.
            </li>
            <li>
              Afwijkingen van deze voorwaarden gelden alleen als wij die
              schriftelijk hebben bevestigd.
            </li>
            <li>
              Is een bepaling nietig of vernietigbaar, dan blijven de overige
              bepalingen gelden en vervangen wij de betreffende bepaling door een
              bepaling die de strekking ervan zo dicht mogelijk benadert.
            </li>
            <li>
              Algemene voorwaarden van een zakelijke afnemer worden uitdrukkelijk
              van de hand gewezen.
            </li>
          </ol>

          <h2>Artikel 4 — Het aanbod</h2>
          <ol>
            <li>
              Elk aanbod bevat een volledige en nauwkeurige omschrijving van het
              product. De afbeeldingen en filmbeelden op deze website zijn een
              weergave en kunnen op ondergeschikte punten afwijken van het
              geleverde product.
            </li>
            <li>
              Kennelijke vergissingen of fouten in het aanbod binden ons niet.
            </li>
            <li>
              Een aanbod geldt zolang de voorraad strekt en zolang het op de
              website staat.
            </li>
          </ol>

          <h2>Artikel 5 — Prijzen</h2>
          <ol>
            <li>
              Prijzen voor consumenten zijn inclusief btw. De actuele
              consumentenprijs van de Blusbox-module bedraagt {prijsIncl}.
            </li>
            <li>
              Prijzen voor zakelijke afnemers zijn exclusief btw en worden in
              staffels aangeboden. In één weergave tonen wij nooit tegelijk
              prijzen inclusief en exclusief btw.
            </li>
            <li>
              <strong>Verzendkosten brengen wij niet in rekening.</strong>{" "}
              Verzending is gratis bij elke bestelling, zonder minimumbedrag. De
              waarde van die verzending bedraagt {verzendwaarde} per zending.
              Wij behouden ons het recht voor dit voor toekomstige bestellingen
              te wijzigen; voor een reeds geplaatste bestelling geldt altijd wat
              bij het afrekenen is getoond.
            </li>
            <li>
              Voor je de bestelling definitief plaatst, tonen wij het totaalbedrag
              inclusief btw en inclusief eventuele bijkomende kosten.
            </li>
            <li>
              Prijswijzigingen als gevolg van wijzigingen in btw-tarieven mogen
              wij doorberekenen.
            </li>
          </ol>

          <h2>Artikel 6 — Totstandkoming van de overeenkomst</h2>
          <ol>
            <li>
              De overeenkomst komt tot stand op het moment dat je het aanbod
              aanvaardt en aan de daarbij gestelde voorwaarden voldoet.
            </li>
            <li>
              Wij bevestigen de ontvangst van je bestelling onverwijld langs
              elektronische weg. Zolang wij die bevestiging niet hebben gestuurd,
              kun je de overeenkomst ontbinden.
            </li>
            <li>
              Wij kunnen ons binnen wettelijke kaders op de hoogte stellen of je
              aan je betalingsverplichtingen kunt voldoen, en een bestelling
              gemotiveerd weigeren of aan bijzondere voorwaarden verbinden.
            </li>
            <li>
              Kunnen wij een bestelling om vervoerstechnische redenen niet
              uitvoeren (zie artikel 8), dan komt de overeenkomst voor dat deel
              niet tot stand en betalen wij een reeds betaald bedrag onverwijld
              terug.
            </li>
          </ol>

          <h2>Artikel 7 — Betaling</h2>
          <ol>
            <li>
              Betaling verloopt via de betaalmethoden die bij het afrekenen
              worden getoond, waaronder iDEAL.
            </li>
            <li>
              Zakelijke afnemers kunnen na goedkeuring op rekening bestellen. De
              betalingstermijn bedraagt dertig dagen na factuurdatum.
            </li>
            <li>
              Bij niet-tijdige betaling door een zakelijke afnemer zijn de
              wettelijke handelsrente en buitengerechtelijke incassokosten
              verschuldigd. Bij consumenten passen wij uitsluitend de wettelijke
              regeling toe, nadat wij eerst een aanmaning hebben gestuurd met een
              termijn van veertien dagen.
            </li>
            <li>
              Onjuistheden in verstrekte of vermelde betaalgegevens meld je ons
              onverwijld.
            </li>
          </ol>

          <h2>Artikel 8 — Levering</h2>
          <ol>
            <li>
              Als plaats van levering geldt het adres dat je aan ons hebt
              opgegeven.
            </li>
            <li>
              Wij voeren geaccepteerde bestellingen met bekwame spoed uit,
              uiterlijk binnen dertig dagen, tenzij een andere levertermijn is
              afgesproken. Bij vertraging melden wij dat binnen dertig dagen na
              de bestelling, waarna je de overeenkomst kosteloos kunt ontbinden.
            </li>
            <li>
              Wij bezorgen binnen Nederland, doorgaans binnen één werkdag.
              Verzending is gratis, zonder minimumbedrag en zonder maximum
              aantal per zending. Kunnen wij niet naar jouw adres leveren, dan
              zie je dat bij het afrekenen in gewoon Nederlands en niet als
              foutmelding achteraf.
            </li>
            <li>
              Bij zendingen gaan de vereiste vervoersdocumenten mee. Van jou
              wordt daarvoor niets verlangd.
            </li>
            <li>
              Het risico van beschadiging of vermissing berust bij ons tot het
              moment van bezorging bij jou of een door jou aangewezen persoon.
            </li>
            <li>
              Meer hierover staat op de pagina{" "}
              <Link href="/verzending">verzending</Link>.
            </li>
          </ol>

          <h2>Artikel 9 — Herroepingsrecht voor consumenten</h2>
          <ol>
            <li>
              Als consument kun je de overeenkomst gedurende veertien dagen na
              ontvangst van het product zonder opgave van redenen ontbinden.
            </li>
            <li>
              Tijdens die termijn ga je zorgvuldig om met het product en de
              verpakking. Je mag het product uitpakken en beoordelen zoals je dat
              in een winkel zou doen. Ga je verder dan dat, dan kunnen wij de
              waardevermindering in rekening brengen.
            </li>
            <li>
              Je meldt de herroeping binnen de termijn via het retourformulier in
              je account, via het wettelijk modelformulier of met een andere
              ondubbelzinnige verklaring. Vervolgens stuur je het product binnen
              veertien dagen na die melding terug.
            </li>
            <li>
              Meld je retour eerst aan. Je ontvangt dan het retouradres en de
              instructies, zodat wij je zending aan je bestelling kunnen
              koppelen.
            </li>
            <li>
              Wij betalen binnen veertien dagen na de melding terug, inclusief de
              standaard verzendkosten van de heenzending, met hetzelfde
              betaalmiddel als waarmee je hebt betaald. Wij mogen wachten tot wij
              het product terug hebben ontvangen of tot jij hebt aangetoond dat
              je het hebt teruggestuurd. De directe kosten van het terugzenden
              zijn voor jou, tenzij het product defect is of wij iets verkeerds
              hebben gestuurd.
            </li>
            <li>
              Zakelijke afnemers hebben geen wettelijk herroepingsrecht. De
              volledige regeling staat op{" "}
              <Link href="/herroepingsrecht">herroepingsrecht</Link>.
            </li>
          </ol>

          <h2>Artikel 10 — Conformiteit en garantie</h2>
          <ol>
            <li>
              Wij staan ervoor in dat het product beantwoordt aan de
              overeenkomst, aan de in het aanbod vermelde specificaties en aan de
              op het moment van levering bestaande wettelijke bepalingen (art.
              7:17 BW).
            </li>
            <li>
              Een eventuele door ons of de fabrikant verstrekte commerciële
              garantie laat je wettelijke rechten onverlet en kan die nooit
              beperken.
            </li>
            <li>
              Het bereiken van de opgegeven levensduur van tien jaar is geen
              gebrek, maar het einde van de gebruiksduur waarvoor het product is
              ontworpen. Hetzelfde geldt voor een module die is geactiveerd en
              daarmee verbruikt.
            </li>
            <li>
              Meer hierover staat op{" "}
              <Link href="/garantie">garantie en conformiteit</Link>.
            </li>
          </ol>

          <h2>Artikel 11 — Gebruik en toepassingsgebied</h2>
          <ol>
            <li>
              Het product is bestemd voor toepassing in elektrische behuizingen
              zoals beschreven in de handleiding en op{" "}
              <Link href="/hoe-het-werkt">hoe het werkt</Link>.
            </li>
            <li>
              Het product is een aanvullende maatregel. Het vervangt geen
              rookmelders, geen aardlekschakelaar, geen deugdelijke installatie
              en geen periodieke inspectie.
            </li>
            <li>
              Montage in afwijking van de handleiding, toepassing buiten het
              beschreven toepassingsgebied of gebruik van een geactiveerde of
              verlopen module valt buiten onze verantwoordelijkheid.
            </li>
            <li>
              Na een activering laat je de installatie controleren voordat de
              betreffende groep opnieuw wordt belast.
            </li>
          </ol>

          <h2>Artikel 12 — Aansprakelijkheid</h2>
          <ol>
            <li>
              Onze aansprakelijkheid jegens consumenten wordt niet verder beperkt
              dan de wet toestaat. Aansprakelijkheid voor schade door dood,
              lichamelijk letsel of opzet dan wel bewuste roekeloosheid sluiten
              wij nooit uit.
            </li>
            <li>
              Jegens zakelijke afnemers is onze aansprakelijkheid beperkt tot
              het factuurbedrag van de betreffende levering. Gevolgschade,
              gederfde winst en bedrijfsstilstand zijn uitgesloten. Deze
              beperking geldt niet bij opzet of bewuste roekeloosheid.
            </li>
            <li>
              Wij zijn niet aansprakelijk voor schade die het gevolg is van
              montage of gebruik in strijd met artikel 11.
            </li>
          </ol>

          <h2>Artikel 13 — Klachten en geschillen</h2>
          <ol>
            <li>
              Klachten over de uitvoering van de overeenkomst dien je binnen
              bekwame tijd volledig en duidelijk omschreven bij ons in, via{" "}
              <Link href="/contact">contact</Link>.
            </li>
            <li>
              Wij beantwoorden klachten binnen veertien dagen. Vraagt de
              afhandeling meer tijd, dan bevestigen wij de ontvangst en geven wij
              aan wanneer je een inhoudelijk antwoord kunt verwachten.
            </li>
            <li>
              Op overeenkomsten waarop deze voorwaarden van toepassing zijn, is
              uitsluitend Nederlands recht van toepassing.
            </li>
            <li>
              Consumenten kunnen een geschil ook voorleggen via het Europese
              ODR-platform van de Europese Commissie.
            </li>
          </ol>

          <h2>Artikel 14 — Persoonsgegevens</h2>
          <p>
            Hoe wij met je gegevens omgaan — waaronder de registratie van
            lotnummer en installatiedatum voor vervangings- en
            terugroepberichten — staat in de{" "}
            <Link href="/privacyverklaring">privacyverklaring</Link>.
          </p>

          <h2>Artikel 15 — Wijziging van deze voorwaarden</h2>
          <p>
            Wijzigingen gelden pas nadat ze op deze pagina zijn gepubliceerd. Op
            een reeds gesloten overeenkomst blijft de versie van toepassing die
            gold op het moment van bestellen. Elke versie draagt daarom een
            versienummer en een datum.
          </p>
        </Prose>
      </main>
      <SiteFooter />
    </>
  );
}
