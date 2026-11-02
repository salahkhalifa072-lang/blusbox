import { leesKeuze } from "./toestemming";
import {
  GA4_ID,
  GOOGLE_ADS_ID,
  GOOGLE_ADS_LABEL_AFREKENEN,
  GOOGLE_ADS_LABEL_WAGEN,
  META_PIXEL_ID,
} from "./meting";

/**
 * De tussenstappen van de trechter: in de wagen en begonnen met afrekenen.
 *
 * Bij een lage verkoop leren Google en Meta van deze signalen, en ze laten
 * zien waar bezoekers afhaken. De aankoop zelf staat los hiervan, in
 * components/meting/aankoop.
 *
 * Dezelfde regels als bij de aankoop: niets zonder toestemming en alle
 * bedragen exclusief btw, anders lopen de rapportages uiteen.
 *
 * Alleen uit de browser, niet ook via de Conversions API. Dat is alleen bij
 * de aankoop de moeite waard, en een tussenstap die één keer ontbreekt
 * vertekent geen omzetcijfer.
 */

export const TOEGEVOEGD_COOKIE = "blusbox-toegevoegd";

export type TrechterRegel = {
  id: string;
  naam: string;
  aantal: number;
  /** Stukprijs exclusief btw, in centen. */
  stukprijsCenten: number;
};

export type TrechterStap = {
  regels: TrechterRegel[];
  /** Exclusief btw en exclusief verzendkosten. */
  waardeCenten: number;
};

type MeetFn = (...args: unknown[]) => void;

const MAX_POGINGEN = 25;
const WACHTTIJD_MS = 400;

/**
 * Meldt een stap aan Google en Meta. Geeft false zonder toestemming, zodat
 * de aanroeper het later nog eens kan proberen.
 *
 * Gewacht wordt om dezelfde reden als bij de aankoop: wie rechtstreeks op
 * /afrekenen binnenkomt, is er eerder dan de meetscripts. Per platform
 * bijgehouden, zodat een geblokkeerde pixel Google niet tegenhoudt.
 */
function meld(
  stap: TrechterStap,
  namen: { label: string; ga4: string; meta: string },
): boolean {
  if (leesKeuze() !== "verleend") return false;

  const waarde = stap.waardeCenten / 100;
  let googleOpen = Boolean((GOOGLE_ADS_ID && namen.label) || GA4_ID);
  let metaOpen = Boolean(META_PIXEL_ID);

  function probeer(): boolean {
    const venster = window as unknown as { gtag?: MeetFn; fbq?: MeetFn };

    if (googleOpen && venster.gtag) {
      if (GOOGLE_ADS_ID && namen.label) {
        venster.gtag("event", "conversion", {
          send_to: `${GOOGLE_ADS_ID}/${namen.label}`,
          value: waarde,
          currency: "EUR",
        });
      }
      if (GA4_ID) {
        venster.gtag("event", namen.ga4, {
          value: waarde,
          currency: "EUR",
          items: stap.regels.map((r) => ({
            item_id: r.id,
            item_name: r.naam,
            quantity: r.aantal,
            price: r.stukprijsCenten / 100,
          })),
        });
      }
      googleOpen = false;
    }

    if (metaOpen && venster.fbq) {
      venster.fbq("track", namen.meta, {
        value: waarde,
        currency: "EUR",
        content_type: "product",
        content_ids: stap.regels.map((r) => r.id),
        contents: stap.regels.map((r) => ({
          id: r.id,
          quantity: r.aantal,
          item_price: r.stukprijsCenten / 100,
        })),
        num_items: stap.regels.reduce((n, r) => n + r.aantal, 0),
      });
      metaOpen = false;
    }

    return !googleOpen && !metaOpen;
  }

  if (!probeer()) {
    let pogingen = 0;
    const wachten = setInterval(() => {
      pogingen += 1;
      if (probeer() || pogingen >= MAX_POGINGEN) clearInterval(wachten);
    }, WACHTTIJD_MS);
  }
  return true;
}

export function inWinkelwagen(stap: TrechterStap): boolean {
  return meld(stap, {
    label: GOOGLE_ADS_LABEL_WAGEN,
    ga4: "add_to_cart",
    meta: "AddToCart",
  });
}

export function startAfrekenen(stap: TrechterStap): boolean {
  return meld(stap, {
    label: GOOGLE_ADS_LABEL_AFREKENEN,
    ga4: "begin_checkout",
    meta: "InitiateCheckout",
  });
}

/**
 * Wat de server zojuist in de wagen legde, melden en wissen.
 *
 * Toevoegen gaat via een server action die daarna doorstuurt, dus de
 * knop krijgt nooit een antwoord te zien. De action laat daarom alleen na
 * een geslaagde toevoeging dit kortlevende cookie achter. Daardoor tellen
 * mislukte toevoegingen niet mee.
 */
export function meldToevoeging(): void {
  if (typeof document === "undefined") return;

  const rij = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${TOEGEVOEGD_COOKIE}=`));
  if (!rij) return;

  // Eerst wissen: een kapot cookie mag niet bij elke pagina terugkomen.
  document.cookie = `${TOEGEVOEGD_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;

  try {
    inWinkelwagen(
      JSON.parse(decodeURIComponent(rij.slice(rij.indexOf("=") + 1))) as TrechterStap,
    );
  } catch {
    /* niets te melden */
  }
}
