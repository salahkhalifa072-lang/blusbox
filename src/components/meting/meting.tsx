"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  abonneer,
  bewaarKeuze,
  leesKeuze,
  type Keuze,
} from "@/lib/toestemming";
import {
  GA4_ID,
  GOOGLE_ADS_ID,
  META_PIXEL_ID,
  METING_ID,
  metingActief,
} from "@/lib/meting";

/**
 * De toestemmingsvraag en, ná een ja, de meetscripts.
 *
 * Vóór toestemming wordt er niets van Google of Meta geladen. Dat is strenger dan
 * de toestemmingsmodus die Google zelf aanraadt, waarbij gtag.js meteen
 * laadt en alleen geen cookies zet. Die variant stuurt nog steeds een
 * verzoek naar Google mét het IP-adres van de bezoeker, en dat is op zich
 * al een gegeven dat je zonder toestemming niet hoort te delen. Hier komt
 * er pas iets op de lijn als er op "Akkoord" is gedrukt.
 *
 * Weigeren staat naast akkoord, even groot en even bereikbaar. Dat is geen
 * vormkwestie: een weigerknop die moeilijker te vinden is dan de
 * akkoordknop maakt de toestemming ongeldig, en dan heb je een banner
 * zonder dat hij iets oplost.
 */

function BannerKnop({
  onClick,
  variant,
  children,
}: {
  onClick: () => void;
  variant: "vol" | "leeg";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        variant === "vol"
          ? "rounded-full bg-antraciet px-5 py-2 text-sm font-medium text-kastwit transition-opacity hover:opacity-85"
          : "rounded-full border border-antraciet px-5 py-2 text-sm font-medium transition-colors hover:bg-antraciet hover:text-kastwit"
      }
    >
      {children}
    </button>
  );
}

/**
 * De Meta-pixel telt uit zichzelf alleen de eerste pagina: daarna wisselt
 * Next van pagina zonder dat de browser opnieuw laadt. Elke volgende
 * pagina melden we hier. De eerste slaan we over, die meldt het
 * basisscript al — anders telt elke landingspagina dubbel.
 */
function MetaPaginaweergave() {
  const pad = usePathname();
  const eerste = useRef(true);
  useEffect(() => {
    if (eerste.current) {
      eerste.current = false;
      return;
    }
    const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
    fbq?.("track", "PageView");
  }, [pad]);
  return null;
}

export function Meting() {
  /*
   * `undefined` is "nog niet gekeken" en `null` is "gekeken, niets
   * gevonden". Zonder dat onderscheid knippert de banner bij iedereen even
   * in beeld, ook bij wie allang een keuze heeft gemaakt: de eerste
   * weergave gebeurt op de server, waar de cookie niet wordt gelezen.
   */
  const [keuze, setKeuze] = useState<Keuze | null | undefined>(undefined);

  useEffect(() => {
    setKeuze(leesKeuze());
    return abonneer(setKeuze);
  }, []);

  if (!metingActief) return null;

  function kies(nieuw: Keuze) {
    bewaarKeuze(nieuw);
    setKeuze(nieuw);
  }

  return (
    <>
      {keuze === "verleend" && (
        <>
          {/*
            Eerst de wachtrij en de toestemmingsstand, dan pas de bibliotheek.
            gtag.js leest bij het laden wat er al in dataLayer staat, dus
            opdrachten die hier klaarstaan gaan niet verloren.
          */}
          <Script id="meting-basis" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=gtag;
gtag('js',new Date());
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});
gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'});
${GOOGLE_ADS_ID ? `gtag('config','${GOOGLE_ADS_ID}',{allow_enhanced_conversions:true});` : ""}
${GA4_ID ? `gtag('config','${GA4_ID}');` : ""}`}
          </Script>
          <Script
            id="meting-gtag"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${METING_ID}`}
          />
          {META_PIXEL_ID && (
            <>
              {/* De standaardcode van Meta, alleen ingekort. */}
              <Script id="meting-meta" strategy="afterInteractive">
                {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');
fbq('track','PageView');`}
              </Script>
              <MetaPaginaweergave />
            </>
          )}
        </>
      )}

      {keuze === null && (
        <div
          role="dialog"
          aria-label="Cookies"
          aria-live="polite"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-railstaal bg-kastwit"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-prose text-sm leading-relaxed">
              Wij meten met Google en Meta (Facebook, Instagram) of onze
              advertenties bestellingen opleveren.
              Daar zijn cookies voor nodig. Zonder jouw toestemming plaatsen we
              ze niet en werkt de winkel gewoon.{" "}
              <Link
                href="/cookiebeleid"
                className="underline underline-offset-4 hover:text-staal-tekst"
              >
                Cookiebeleid
              </Link>
            </p>
            <div className="flex flex-none gap-3">
              <BannerKnop variant="leeg" onClick={() => kies("geweigerd")}>
                Weigeren
              </BannerKnop>
              <BannerKnop variant="vol" onClick={() => kies("verleend")}>
                Akkoord
              </BannerKnop>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
