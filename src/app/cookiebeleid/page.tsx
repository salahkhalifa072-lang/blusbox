import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { Prose, DraftNotice } from "@/components/site/prose";
import { KeuzeAanpassen } from "@/components/meting/keuze-aanpassen";
import { GA4_ID, GOOGLE_ADS_ID, META_PIXEL_ID, metingActief } from "@/lib/meting";

export const metadata: Metadata = {
  title: "Cookiebeleid",
  description:
    "Welke cookies Blusbox plaatst, waarvoor ze dienen en hoe je je keuze aanpast.",
  alternates: { canonical: "/cookiebeleid" },
};

export default function CookiebeleidPage() {
  return (
    <>
      <PageHeader
        eyebrow="juridisch"
        title="Cookiebeleid"
        lead="Zo min mogelijk. Wat wij niet nodig hebben om de winkel te laten werken, plaatsen wij alleen met jouw toestemming, op één kleine uitzondering na: de herkomstcookie hieronder."
      />
      <main>
        <Prose>
          {!metingActief && (
            <DraftNotice what="de definitieve cookietabel volgt zodra betaal-, analyse- en eventuele advertentiediensten zijn gekozen en gekoppeld." />
          )}

          <h2>Functionele cookies</h2>
          <p>
            Deze zijn nodig om de site te laten werken en worden zonder
            toestemming geplaatst: het onthouden van je winkelwagen, je
            ingelogde sessie en of je een consumenten- of zakelijk account
            hebt (dat laatste bepaalt of je prijzen inclusief of exclusief btw
            ziet).
            {metingActief && (
              <>
                {" "}
                Daar komt de cookie bij waarin je keuze hieronder wordt
                vastgelegd — zonder die cookie zouden wij het elke pagina
                opnieuw moeten vragen.
              </>
            )}
          </p>

          <h2>Herkomstcookie</h2>
          <p>
            Kom je binnen via een link op een andere site, een advertentie of
            een zoekmachine, dan onthouden wij dat 30 dagen in een eigen cookie
            (<code>bb_herkomst</code>). Bestel je, dan gaat het mee op je
            bestelling. Zo weten wij welke kanalen bestellingen opleveren.
          </p>
          <p>
            Er staat alleen in waar je vandaan kwam (bijvoorbeeld
            &ldquo;facebook&rdquo; of &ldquo;google, zoeken&rdquo;), de naam
            van de campagne als die in de link stond, de domeinnaam van de
            verwijzende site en de eerste pagina die je bij ons opende. Geen
            klik-ID van Google of Meta, geen zoekterm, niets waarmee je te
            herkennen bent. De cookie wordt alleen door onze eigen site
            gelezen en met niemand gedeeld. Weggooien kan via je browser; de
            winkel werkt dan precies hetzelfde.
          </p>

          {metingActief ? (
            <>
              <h2>{GA4_ID ? "Analytische en marketingcookies" : "Marketingcookies"}</h2>
              <p>
                Wij meten met Google of onze advertenties tot bestellingen
                leiden. Daarvoor plaatst Google cookies die je bezoek koppelen
                aan de advertentie waarop je hebt geklikt, en geeft onze site
                bij een afgeronde bestelling het ordernummer en het bedrag
                exclusief btw door. Daarbij gaat ook je e-mailadres mee, maar
                versleuteld (gehasht) in je eigen browser: Google kan het
                niet lezen, alleen vergelijken met een account dat het al
                kent. Je naam en adres gaan niet mee.
              </p>
              <p>
                Ook geven we door wanneer je iets in de winkelwagen legt en
                wanneer je begint met afrekenen, met het product en het bedrag
                exclusief btw. Dan zien we waar bezoekers afhaken. Daarvoor
                bewaren we na het toevoegen maximaal twee minuten een cookie
                (<code>blusbox-toegevoegd</code>) met wat je toevoegde. Ook
                onthoudt je browser tot je hem sluit welke stap al is
                doorgegeven, zodat die niet dubbel telt.
              </p>
              {META_PIXEL_ID && (
                <p>
                  Hetzelfde doen wij met de Meta-pixel, voor advertenties op
                  Facebook en Instagram. Meta plaatst daarvoor een cookie
                  (onder meer <code>_fbp</code>), ziet welke pagina&apos;s
                  van onze winkel je bezoekt en krijgt bij een bestelling het
                  ordernummer, het bedrag exclusief btw, welke producten het
                  zijn en je e-mailadres, ook dat gehasht in je browser. Ook
                  krijgt Meta dezelfde tussenstappen door als Google.
                  Heb je een account bij Facebook of Instagram, dan kan Meta
                  je bezoek daaraan koppelen.
                </p>
              )}
              <p>
                Dit gebeurt alleen als je op &ldquo;Akkoord&rdquo; drukt. Kies
                je &ldquo;Weigeren&rdquo;, dan wordt er geen enkel script van
                Google of Meta geladen en gaat er ook geen verzoek naar hen — de
                winkel werkt dan precies hetzelfde.
              </p>
              <p>
                Wij tellen zelf hoe vaak er op &ldquo;Akkoord&rdquo; en op
                &ldquo;Weigeren&rdquo; wordt gedrukt. Dat zijn twee tellers op
                onze eigen server; er wordt daarbij niets over jou
                vastgelegd.
              </p>
              <p>
                Gebruikte diensten:{" "}
                {[GOOGLE_ADS_ID ? "Google Ads" : null, GA4_ID ? "Google Analytics 4" : null]
                  .filter(Boolean)
                  .join(" en ")}
                , van Google Ireland Limited
                {META_PIXEL_ID ? ", en de Meta-pixel, van Meta Platforms Ireland Limited" : ""}.
              </p>
            </>
          ) : (
            <>
              <h2>Analytische cookies</h2>
              <p>
                Die gebruiken wij niet. Er staat geen bezoekersstatistiek op
                deze site — geen Google Analytics, geen alternatief. Wij weten
                dus niet welke pagina&apos;s je bekijkt.
              </p>

              <h2>Marketingcookies</h2>
              <p>
                Die gebruiken wij ook niet. Er lopen geen advertentiecampagnes
                en er staan geen trackers van advertentieplatformen op deze
                site.
              </p>
            </>
          )}

          <h2>Je keuze aanpassen</h2>
          {metingActief ? (
            <KeuzeAanpassen />
          ) : (
            <>
              <p>
                Omdat wij alleen functionele cookies plaatsen — je winkelwagen
                en je inlogsessie — is er niets om toestemming voor te vragen
                en dus ook geen keuze om aan te passen. Je kunt cookies
                verwijderen via je browser; de functionele cookies worden dan
                opnieuw geplaatst zodra je de site gebruikt.
              </p>
              <p>
                Gaan wij later wel meten of adverteren, dan vragen wij daar
                vooraf toestemming voor en past deze pagina zich daarop aan.
              </p>
            </>
          )}

          <h2>Meer weten</h2>
          <p>
            Hoe wij met persoonsgegevens omgaan staat in de{" "}
            <Link href="/privacyverklaring">privacyverklaring</Link>.
          </p>
        </Prose>
      </main>
      <SiteFooter />
    </>
  );
}
