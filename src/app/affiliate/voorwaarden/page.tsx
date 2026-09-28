import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { bedrijf, bedrijfsregel } from "@/lib/bedrijf";
import { haalInstellingen } from "@/db/affiliate";
import { euro } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Affiliatevoorwaarden",
  description:
    "De voorwaarden van het Blusbox-affiliateprogramma: commissie, attributie, retouren, uitbetaling en beëindiging.",
  alternates: { canonical: "/affiliate/voorwaarden" },
};

export const dynamic = "force-dynamic";

/**
 * De affiliatevoorwaarden.
 *
 * De bedragen en percentages komen uit de instellingen in de database, niet
 * uit een vaste tekst. Verandert een beheerder het standaardpercentage, dan
 * verandert deze pagina mee — anders staat hier over een half jaar iets
 * anders dan wat het systeem uitkeert, en dat is precies het soort verschil
 * waar een geschil uit ontstaat.
 */
export default async function AffiliateVoorwaardenPagina() {
  const i = await haalInstellingen();
  const percentage = (i.standaardPercentageBp / 100)
    .toFixed(2)
    .replace(/[.,]00$/, "")
    .replace(".", ",");

  const artikelen = [
    {
      kop: "1. Wie deelneemt",
      tekst: `Deelname staat open voor personen van 18 jaar en ouder en voor bedrijven. Je meldt je aan met juiste gegevens. Wij beoordelen elke aanmelding en mogen een aanmelding zonder opgaaf van reden weigeren. Pas na goedkeuring werkt je persoonlijke link en kun je commissie opbouwen.`,
    },
    {
      kop: "2. Commissie",
      tekst: `Je ontvangt ${percentage}% over de productwaarde van elke geldige, betaalde bestelling die via jouw link tot stand komt. De productwaarde is de prijs na korting, exclusief btw en exclusief verzendkosten. Producten die als uitgesloten zijn aangemerkt tellen niet mee; de overige regels van dezelfde bestelling wel. Wij mogen het percentage wijzigen; een wijziging geldt vanaf het moment van aankondiging en nooit met terugwerkende kracht.`,
    },
    {
      kop: "3. Toeschrijving",
      tekst: `Klikt iemand op jouw link, dan onthouden wij dat ${i.attributieDagen} dagen in een cookie op ons eigen domein. Bestelt diegene binnen die termijn, dan wordt de bestelling aan jou toegeschreven. Klikt de bezoeker daarna op de link van een andere deelnemer, dan geldt die laatste klik. Wist de bezoeker zijn cookies of bestelt hij op een ander apparaat, dan kunnen wij de bestelling niet aan jou koppelen.`,
    },
    {
      kop: "4. Wanneer commissie vervalt",
      tekst: `Commissie vervalt geheel of gedeeltelijk bij annulering, retour, terugbetaling of terugboeking. Bij een gedeeltelijke retour vervalt het deel dat terugkomt. Commissie vervalt ook bij bestellingen die je zelf plaatst of die op jouw naam, account of e-mailadres staan, en bij bestellingen waarvan wij redelijkerwijs vaststellen dat ze met kunstmatig verkeer tot stand zijn gekomen.`,
    },
    {
      kop: "5. Goedkeuring en uitbetaling",
      tekst: `Een commissie staat eerst op "open" zolang de wettelijke bedenktijd van veertien dagen na levering loopt. Daarna wordt hij goedgekeurd. Uitbetaling gebeurt ${i.uitbetalingsfrequentie} zodra je goedgekeurde saldo ten minste ${euro(i.uitbetalingsdrempelCenten)} bedraagt. Haal je de drempel niet, dan blijft het saldo staan en telt het de volgende ronde mee. Je bent zelf verantwoordelijk voor de juistheid van je uitbetaalgegevens en voor de fiscale verwerking van wat je ontvangt.`,
    },
    {
      kop: "6. Hoe je promoot",
      tekst: `Je promoot eerlijk en herkenbaar. Je maakt duidelijk dat je een vergoeding ontvangt wanneer dat van toepassing is; dat is niet alleen netjes maar ook verplicht onder de regels voor reclame. Je doet geen uitspraken over brandveiligheid, werking of certificering die wij zelf niet doen. Je adverteert niet op de merknaam Blusbox of daarop lijkende termen in zoekmachines. Je verstuurt geen ongevraagde massamail en gebruikt geen kortingscode-, cashback- of couponsites zonder onze schriftelijke toestemming.`,
    },
    {
      kop: "7. Merk en materiaal",
      tekst: `Je mag onze naam, logo en productafbeeldingen gebruiken om naar ons te verwijzen, ongewijzigd en in een context die ons niet schaadt. Je wekt niet de indruk dat je namens Blusbox spreekt of dat jouw site van ons is. Wij kunnen dit gebruik op elk moment intrekken.`,
    },
    {
      kop: "8. Gegevens",
      tekst: `Je krijgt nooit gegevens van onze klanten te zien. In je dashboard staat dát er is besteld, wat het opleverde en wanneer — geen naam, geen adres, geen e-mailadres. Hoe wij jouw gegevens verwerken staat in de privacyverklaring.`,
    },
    {
      kop: "9. Schorsing en beëindiging",
      tekst: `Je kunt op elk moment stoppen. Wij kunnen je deelname schorsen of beëindigen bij overtreding van deze voorwaarden, bij vermoeden van fraude of wanneer wij het programma beëindigen. Commissie die op het moment van beëindiging al is goedgekeurd wordt gewoon uitbetaald. Bij aantoonbare fraude vervalt openstaande commissie en kunnen wij reeds uitbetaalde bedragen terugvorderen.`,
    },
    {
      kop: "10. Wijzigingen en recht",
      tekst: `Wij kunnen deze voorwaarden wijzigen. Bij een wezenlijke wijziging melden wij dat vooraf. Op deze overeenkomst is Nederlands recht van toepassing. Je neemt deel als zelfstandige partij; er ontstaat geen dienstverband, agentuur of samenwerkingsverband.`,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={`versie ${i.voorwaardenVersie}`}
        title="Affiliatevoorwaarden"
        lead="De afspraken van het Blusbox-partnerprogramma. Kort gehouden en in gewone taal, zodat je ze ook echt kunt lezen."
      />

      <main className="mx-auto max-w-3xl px-6 pb-24">
        <div className="space-y-8">
          {artikelen.map((a) => (
            <section key={a.kop}>
              <h2 className="font-display text-xl">{a.kop}</h2>
              <p className="mt-2 text-sm leading-relaxed text-staal-tekst">
                {a.tekst}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-12 border-t border-railstaal/60 pt-6">
          <p className="data text-xs text-staal-tekst">{bedrijfsregel}</p>
          <p className="data mt-1 text-xs text-staal-tekst">
            Vragen over het programma: {bedrijf.email}
          </p>
          <Link
            href="/affiliate"
            className="data mt-4 inline-block text-sm underline underline-offset-4"
          >
            Terug naar het partnerprogramma
          </Link>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
