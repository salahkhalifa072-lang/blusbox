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
      // Beide knoppen even groot: zelfde hoogte, zelfde breedte.
      className={`h-9 w-full whitespace-nowrap rounded-full border border-antraciet px-4 text-sm font-medium sm:w-auto sm:px-5 ${
        variant === "vol"
          ? "bg-antraciet text-kastwit transition-opacity hover:opacity-85"
          : "transition-colors hover:bg-antraciet hover:text-kastwit"
      }`}
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

/**
 * De klik tellen op onze eigen server (api/toestemming), zodat we weten
 * welk deel van de bezoekers akkoord geeft. Niet naar Google of Meta: daar
 * mag pas iets heen na een ja. Lukt het niet, dan merkt de bezoeker niets.
 *
 * Bij een storing aan de serverkant (5xx) of een weggevallen verbinding
 * proberen we het nog twee keer. Zonder dat valt een klik bij de eerste
 * hapering stil weg, en dan klopt de verhouding niet meer.
 */
const TEL_WACHTTIJDEN_MS = [1500, 5000];

function telKeuze(keuze: Keuze, poging = 0) {
  const opnieuw = () => {
    const wacht = TEL_WACHTTIJDEN_MS[poging];
    if (wacht !== undefined) setTimeout(() => telKeuze(keuze, poging + 1), wacht);
  };
  try {
    fetch("/api/toestemming", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ keuze }),
      keepalive: true,
    })
      .then((antwoord) => {
        if (antwoord.status >= 500) opnieuw();
      })
      .catch(opnieuw);
  } catch {
    // Geen fetch, geen teller.
  }
}

/** Naam van de CSS-variabele met de hoogte van de balk (zie globals.css). */
const BALKHOOGTE = "--cookiebalk";

/**
 * De balk zelf: smal, onderaan, en niet óver de pagina.
 *
 * Hij staat vast onderaan het scherm, maar meldt zijn hoogte aan de
 * pagina. Die maakt onderaan evenveel ruimte vrij, en de koopbalken op
 * een telefoon schuiven erboven. Zo ligt er nooit een knop onder, ook
 * niet bij wie de vraag negeert.
 */
function Cookiebalk({ kies }: { kies: (k: Keuze) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const wortel = document.documentElement;
    const meet = () => wortel.style.setProperty(BALKHOOGTE, `${el.offsetHeight}px`);
    meet();
    const ro = new ResizeObserver(meet);
    ro.observe(el);
    return () => {
      ro.disconnect();
      wortel.style.removeProperty(BALKHOOGTE);
    };
  }, []);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Cookies"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-railstaal bg-kastwit"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Telefoon: tekst links, de twee knoppen rechts onder elkaar. Zo
          blijft de balk laag en zijn beide knoppen even groot. */}
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2 sm:gap-6 sm:px-6 sm:py-3">
        <p className="min-w-0 flex-1 text-xs leading-4 sm:text-sm sm:leading-snug">
          Wij gebruiken cookies om te meten of onze advertenties werken.
          Zonder toestemming plaatsen we ze niet en werkt de winkel gewoon.{" "}
          <Link
            href="/cookiebeleid"
            className="underline underline-offset-2 hover:text-staal-tekst"
          >
            Cookiebeleid
          </Link>
        </p>
        <div className="grid flex-none gap-1.5 sm:flex sm:gap-3">
          <BannerKnop variant="leeg" onClick={() => kies("geweigerd")}>
            Weigeren
          </BannerKnop>
          <BannerKnop variant="vol" onClick={() => kies("verleend")}>
            Akkoord
          </BannerKnop>
        </div>
      </div>
    </div>
  );
}

/** Interne pagina's: geen banner en geen meting. Daar komen geen bezoekers van advertenties. */
const INTERN = ["/verkoop", "/dashboard", "/betaald", "/b/"];

export function Meting() {
  const pad = usePathname();
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
  if (INTERN.some((p) => pad === p || pad.startsWith(p.endsWith("/") ? p : `${p}/`))) return null;

  function kies(nieuw: Keuze) {
    bewaarKeuze(nieuw);
    setKeuze(nieuw);
    telKeuze(nieuw);
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

      {keuze === null && <Cookiebalk kies={kies} />}
    </>
  );
}
