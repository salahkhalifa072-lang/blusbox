import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { Prose, DraftNotice } from "@/components/site/prose";

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
          <DraftNotice what="de definitieve cookietabel volgt zodra betaal-, analyse- en eventuele advertentiediensten zijn gekozen en gekoppeld." />

          <h2>Functionele cookies</h2>
          <p>
            Deze zijn nodig om de site te laten werken en worden zonder
            toestemming geplaatst: het onthouden van je winkelwagen, je
            ingelogde sessie en of je een consumenten- of zakelijk account
            hebt (dat laatste bepaalt of je prijzen inclusief of exclusief btw
            ziet).
          </p>

          <h2>Analytische cookies</h2>
          <p>
            Wij willen weten welke pagina&apos;s bezoekers helpen en welke niet.
            Dat doen wij met een instelling die zo min mogelijk gegevens
            verzamelt. [VERIFY: gekozen analysedienst en of die privacyvriendelijk
            is ingericht]
          </p>

          <h2>Marketingcookies</h2>
          <p>
            Alleen na jouw toestemming, en alleen als er daadwerkelijk
            advertentiecampagnes lopen. [VERIFY: worden er
            advertentieplatformen gebruikt?]
          </p>

          <h2>Je keuze aanpassen</h2>
          <p>
            Je keuze kun je op elk moment wijzigen via de cookie-instellingen.
            Je kunt cookies ook verwijderen via je browser; functionele cookies
            worden dan opnieuw geplaatst zodra je de site gebruikt.
            [VERIFY: link naar cookie-instellingen zodra de consentoplossing is
            gekoppeld]
          </p>

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
