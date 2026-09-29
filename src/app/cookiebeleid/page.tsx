import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { Prose, DraftNotice } from "@/components/site/prose";
import { KeuzeAanpassen } from "@/components/meting/keuze-aanpassen";
import { GA4_ID, GOOGLE_ADS_ID, metingActief } from "@/lib/meting";

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
        lead="Zo min mogelijk. Wat wij niet nodig hebben om de winkel te laten werken, plaatsen wij alleen met jouw toestemming."
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

          {metingActief ? (
            <>
              <h2>{GA4_ID ? "Analytische en marketingcookies" : "Marketingcookies"}</h2>
              <p>
                Wij meten met Google of onze advertenties tot bestellingen
                leiden. Daarvoor plaatst Google cookies die je bezoek koppelen
                aan de advertentie waarop je hebt geklikt, en geeft onze site
                bij een afgeronde bestelling het ordernummer en het bedrag
                exclusief btw door. Je naam, adres en e-mailadres gaan daar
                niet in mee.
              </p>
              <p>
                Dit gebeurt alleen als je op &ldquo;Akkoord&rdquo; drukt. Kies
                je &ldquo;Weigeren&rdquo;, dan wordt er geen enkel script van
                Google geladen en gaat er ook geen verzoek naar Google — de
                winkel werkt dan precies hetzelfde.
              </p>
              <p>
                Gebruikte diensten:{" "}
                {[GOOGLE_ADS_ID ? "Google Ads" : null, GA4_ID ? "Google Analytics 4" : null]
                  .filter(Boolean)
                  .join(" en ")}
                , van Google Ireland Limited.
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
