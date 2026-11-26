"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  abonneer,
  bewaarKeuze,
  bijOpenen,
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
 * Tellen op onze eigen server (api/toestemming): hoe vaak de vraag in
 * beeld kwam en hoe vaak er op "Akkoord" en op "Weigeren" is gedrukt.
 * Niet naar Google of Meta: daar mag pas iets heen na een ja. Lukt het
 * niet, dan merkt de bezoeker niets.
 *
 * Bij een storing aan de serverkant (5xx) of een weggevallen verbinding
 * proberen we het nog twee keer. Zonder dat valt een klik bij de eerste
 * hapering stil weg, en dan klopt de verhouding niet meer.
 */
const TEL_WACHTTIJDEN_MS = [1500, 5000];

type Telling = Keuze | "getoond";

function tel(keuze: Telling, poging = 0) {
  const opnieuw = () => {
    const wacht = TEL_WACHTTIJDEN_MS[poging];
    if (wacht !== undefined) setTimeout(() => tel(keuze, poging + 1), wacht);
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

/**
 * Of "getoond" in deze pagina al geteld is. Op moduleniveau en niet in een
 * ref: de layout blijft staan als Next van pagina wisselt, maar zo telt
 * ook een tweede exemplaar van het paneel niet dubbel. Een nieuwe
 * paginalading zonder keuze is wél een nieuwe vertoning.
 */
let getoondGeteld = false;

/** Naam van de CSS-variabele met de hoogte van het paneel (zie globals.css). */
const BALKHOOGTE = "--cookiebalk";

/**
 * Pagina's waar het paneel de pagina niet afsluit: wie wil lezen waar hij
 * ja of nee tegen zegt, moet dat kunnen vóór hij kiest. De link in het
 * paneel wijst hierheen. Het paneel blijft er wel staan, onderaan.
 */
const INFORMATIEF = ["/privacyverklaring", "/cookiebeleid"];

function PaneelKnop({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      // Weigeren en Akkoord zijn met opzet precies dezelfde knop: zelfde
      // maat, kleur, letter en gewicht. Alleen het woord verschilt.
      className="h-12 w-full rounded-full border-2 border-antraciet bg-antraciet px-4 text-base font-semibold text-kastwit transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blusrood-op-licht"
    >
      {children}
    </button>
  );
}

/**
 * De vraag, als paneel onderaan het scherm.
 *
 * Een echte modale <dialog>: de pagina erachter blijft zichtbaar maar
 * gedimd en reageert niet, de focus blijft in het paneel en Tab loopt
 * alleen langs de link en de twee knoppen. Er is geen kruisje en Escape
 * sluit het niet; sluit de browser hem toch (Chrome laat een tweede
 * Escape soms door), dan gaat hij meteen weer open. Wie weigert kan
 * daarna de hele winkel gebruiken: dit is een vraag, geen cookiemuur.
 *
 * Op de informatiepagina's staat hetzelfde paneel er zonder de pagina af
 * te sluiten, zodat de privacyverklaring te lezen is vóór de keuze.
 */
function Cookiepaneel({
  modaal,
  huidige,
  kies,
}: {
  modaal: boolean;
  huidige: Keuze | null;
  kies: (k: Keuze) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  // De hoogte doorgeven aan de pagina, zodat er onderaan ruimte vrijkomt
  // en de koopbalk erboven schuift zolang het paneel niet-modaal staat.
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

  useEffect(() => {
    const d = ref.current;
    if (!d) return;

    const openen = () => {
      if (d.open || !d.isConnected) return;
      if (modaal) d.showModal();
      else d.show();
    };
    // Van een informatiepagina naar een gewone pagina (of terug): opnieuw
    // openen in de andere stand. Het close-signaal komt pas later en vindt
    // het paneel dan al open.
    if (d.open) d.close();
    openen();

    const wortel = document.documentElement;
    if (modaal) {
      // Focus op het paneel zelf, niet op een van de knoppen: geen van
      // beide keuzes krijgt een duwtje.
      d.focus();
      // Een modale dialog houdt klikken tegen, maar niet het scrollen.
      wortel.style.overflow = "hidden";
    }

    const nietSluiten = (e: Event) => e.preventDefault();
    // Dicht zonder keuze: weer open. Na een keuze is dit paneel al weg.
    const terug = () => openen();
    d.addEventListener("cancel", nietSluiten);
    d.addEventListener("close", terug);
    return () => {
      d.removeEventListener("cancel", nietSluiten);
      d.removeEventListener("close", terug);
      wortel.style.overflow = "";
    };
  }, [modaal]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="cookievraag"
      aria-describedby="cookievraag-uitleg"
      tabIndex={-1}
      className="fixed inset-x-0 top-auto bottom-0 z-50 m-0 h-auto max-h-[40dvh] w-full max-w-none overflow-y-auto border-t border-railstaal bg-kastwit p-0 text-antraciet shadow-[0_-8px_24px_rgb(22_24_26/0.18)] outline-none backdrop:bg-antraciet/45"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto max-w-xl px-4 py-4 sm:px-6 sm:py-5">
        <p id="cookievraag" className="text-base font-semibold leading-snug">
          Mogen we cookies gebruiken om onze advertenties te meten?
        </p>
        <p id="cookievraag-uitleg" className="mt-1 text-sm leading-snug text-staal-tekst">
          Je kunt ook weigeren, de site werkt dan gewoon.{" "}
          <Link
            href="/privacyverklaring"
            className="text-antraciet underline underline-offset-2 hover:text-staal-tekst"
          >
            Privacyverklaring
          </Link>
          {huidige && (
            <>
              {" "}
              · Je huidige keuze:{" "}
              <strong className="font-semibold text-antraciet">
                {huidige === "verleend" ? "Akkoord" : "Weigeren"}
              </strong>
            </>
          )}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <PaneelKnop onClick={() => kies("geweigerd")}>Weigeren</PaneelKnop>
          <PaneelKnop onClick={() => kies("verleend")}>Akkoord</PaneelKnop>
        </div>
      </div>
    </dialog>
  );
}

/**
 * Toestemming ingetrokken nadat de scripts al draaiden: alles wat nog in
 * het geheugen zit stilzetten en de pagina opnieuw laden. Een
 * paginawissel binnen Next laadt de browser niet opnieuw, en gtag zou
 * zo'n wissel anders nog als paginaweergave doorgeven.
 */
function trekIn() {
  const venster = window as unknown as {
    fbq?: (...a: unknown[]) => void;
    gtag?: (...a: unknown[]) => void;
  };
  try {
    venster.fbq?.("consent", "revoke");
    venster.gtag?.("consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
  } catch {
    // Herladen hieronder doet de rest.
  }
  window.location.reload();
}

/** Interne pagina's: geen vraag en geen meting. Daar komen geen bezoekers van advertenties. */
const INTERN = ["/verkoop", "/dashboard", "/betaald", "/b/"];

function opPad(pad: string, lijst: string[]): boolean {
  return lijst.some((p) => pad === p || pad.startsWith(p.endsWith("/") ? p : `${p}/`));
}

export function Meting() {
  const pad = usePathname();
  /*
   * `undefined` is "nog niet gekeken" en `null` is "gekeken, niets
   * gevonden". Zonder dat onderscheid knippert het paneel bij iedereen even
   * in beeld, ook bij wie allang een keuze heeft gemaakt: de eerste
   * weergave gebeurt op de server, waar de cookie niet wordt gelezen.
   */
  const [keuze, setKeuze] = useState<Keuze | null | undefined>(undefined);
  /** Via "Cookie-instellingen" opnieuw geopend, terwijl er al een keuze is. */
  const [opnieuw, setOpnieuw] = useState(false);
  const vorige = useRef<Keuze | null | undefined>(undefined);

  useEffect(() => {
    setKeuze(leesKeuze());
    const stop1 = abonneer(setKeuze);
    const stop2 = bijOpenen(() => setOpnieuw(true));
    return () => {
      stop1();
      stop2();
    };
  }, []);

  useEffect(() => {
    if (vorige.current === "verleend" && keuze !== "verleend") trekIn();
    vorige.current = keuze;
  }, [keuze]);

  const intern = opPad(pad, INTERN);
  const toonPaneel = metingActief && !intern && (keuze === null || (opnieuw && keuze !== undefined));

  // Eén vertoning per paginalading, alleen bij wie nog niets koos.
  useEffect(() => {
    if (toonPaneel && keuze === null && !getoondGeteld) {
      getoondGeteld = true;
      tel("getoond");
    }
  }, [toonPaneel, keuze]);

  if (!metingActief || intern) return null;

  function kies(nieuw: Keuze) {
    // Alleen de eerste keuze telt mee, net als "getoond". Anders gaat
    // "weggegaan zonder keuze" (getoond − akkoord − weigeren) onder nul.
    const eerste = keuze === null;
    bewaarKeuze(nieuw);
    setKeuze(nieuw);
    setOpnieuw(false);
    if (eerste) tel(nieuw);
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

      {toonPaneel && (
        <Cookiepaneel
          modaal={!opPad(pad, INFORMATIEF)}
          huidige={keuze ?? null}
          kies={kies}
        />
      )}
    </>
  );
}
