"use client";

import { useEffect } from "react";
import { abonneer, leesKeuze } from "@/lib/toestemming";
import { conversieDoel, GA4_ID, META_PIXEL_ID } from "@/lib/meting";

/**
 * De aankoopconversie op de bestelbevestiging.
 *
 * Dit is het enige punt waarop Google leert welke klik een bestelling
 * werd. Zonder dit signaal kan het niet bieden op mensen die kopen, en
 * zie je alleen wat de campagne kost.
 *
 * Drie dingen moeten kloppen, en alle drie gaan ze vaak mis:
 *
 * 1. Eén keer per bestelling. Een klant die de bevestiging bookmarkt of
 *    terugkeert via de knop terug, telt anders twee keer. `transaction_id`
 *    laat Google ontdubbelen, maar daar gaat tijd overheen en het werkt
 *    niet over accounts heen; daarom houden we het ook zelf bij.
 * 2. Alleen als er betaald is. De pagina bestaat al vóór de betaling.
 *    Welke statussen tellen staat in lib/meting.
 * 3. Het bedrag exclusief btw en exclusief verzendkosten. Dat is wat er
 *    werkelijk binnenkomt. Stuur je het bedrag inclusief btw, dan lijkt
 *    de opbrengst 21% hoger dan hij is en draait een campagne die verlies
 *    maakt er op papier quitte uit.
 */

/**
 * Per platform bijgehouden: blokkeert een adblocker alleen de Meta-pixel,
 * dan mag dat niet betekenen dat Google de aankoop ook niet krijgt — of
 * dat hij bij een volgend bezoek alsnog dubbel naar Google gaat.
 */
const VOORVOEGSEL = {
  google: "blusbox-conversie-",
  meta: "blusbox-meta-conversie-",
} as const;
type Platform = keyof typeof VOORVOEGSEL;

type GtagFn = (...args: unknown[]) => void;

function alGemeld(platform: Platform, ordernummer: string): boolean {
  try {
    return localStorage.getItem(VOORVOEGSEL[platform] + ordernummer) !== null;
  } catch {
    // Privémodus of geblokkeerde opslag: dan vertrouwen we op de
    // ontdubbeling van Google via transaction_id.
    return false;
  }
}

function onthoud(platform: Platform, ordernummer: string): void {
  try {
    localStorage.setItem(VOORVOEGSEL[platform] + ordernummer, String(Date.now()));
  } catch {
    /* niets te doen */
  }
}

export type AankoopRegel = {
  id: string;
  naam: string;
  aantal: number;
  /** Stukprijs exclusief btw, in centen. */
  stukprijsCenten: number;
};

export function Aankoop({
  ordernummer,
  waardeCenten,
  regels,
  email,
}: {
  ordernummer: string;
  /**
   * Voor verbeterde conversies. gtag normaliseert en hasht het adres in de
   * browser (SHA-256) voordat het naar Google gaat; Google krijgt het nooit
   * leesbaar. Het helpt een aankoop aan een klik te koppelen als de
   * advertentiecookie ontbreekt, bijvoorbeeld bij kopen op een ander
   * apparaat. Alleen na toestemming, zoals alles hier.
   */
  email?: string | null;
  /** Exclusief btw en exclusief verzendkosten. */
  waardeCenten: number;
  /**
   * Per artikel, zodat GA4 ziet dat er naast de Blusbox ook een rookmelder
   * is verkocht. Eén samengevoegde regel zou de rookmelderverkoop in de
   * Blusbox-cijfers laten verdwijnen.
   */
  regels: AankoopRegel[];
}) {
  useEffect(() => {
    const open = new Set<Platform>();
    if ((conversieDoel || GA4_ID) && !alGemeld("google", ordernummer)) open.add("google");
    if (META_PIXEL_ID && !alGemeld("meta", ordernummer)) open.add("meta");
    if (open.size === 0) return;

    let gestopt = false;
    let wachten: ReturnType<typeof setInterval> | undefined;
    const waarde = waardeCenten / 100;

    function meldGoogle() {
      const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
      if (!gtag) return false;

      if (conversieDoel) {
        if (email) gtag("set", "user_data", { email });
        gtag("event", "conversion", {
          send_to: conversieDoel,
          value: waarde,
          currency: "EUR",
          transaction_id: ordernummer,
        });
      }

      if (GA4_ID) {
        gtag("event", "purchase", {
          transaction_id: ordernummer,
          value: waarde,
          currency: "EUR",
          items: regels.map((r) => ({
            item_id: r.id,
            item_name: r.naam,
            quantity: r.aantal,
            price: r.stukprijsCenten / 100,
          })),
        });
      }

      return true;
    }

    /**
     * Purchase naar Meta. Het ordernummer gaat mee als eventID: komt er
     * later een server-koppeling (Conversions API) bij die dezelfde
     * aankoop meldt, dan telt Meta hem op dat id maar één keer.
     *
     * Het e-mailadres gaat via een tweede `init` mee ("advanced
     * matching"); de pixel normaliseert en hasht het in de browser
     * voordat het verstuurd wordt.
     */
    function meldMeta() {
      const fbq = (window as unknown as { fbq?: GtagFn }).fbq;
      if (!fbq) return false;
      if (email) fbq("init", META_PIXEL_ID, { em: email.trim().toLowerCase() });
      fbq(
        "track",
        "Purchase",
        {
          value: waarde,
          currency: "EUR",
          content_type: "product",
          content_ids: regels.map((r) => r.id),
          contents: regels.map((r) => ({
            id: r.id,
            quantity: r.aantal,
            item_price: r.stukprijsCenten / 100,
          })),
          num_items: regels.reduce((n, r) => n + r.aantal, 0),
        },
        { eventID: ordernummer },
      );
      return true;
    }

    function meld() {
      for (const platform of [...open]) {
        const gelukt = platform === "google" ? meldGoogle() : meldMeta();
        if (gelukt) {
          onthoud(platform, ordernummer);
          open.delete(platform);
        }
      }
      return open.size === 0;
    }

    /**
     * gtag en fbq bestaan pas zodra hun basisscript is uitgevoerd, en dat gebeurt
     * ná deze render. Even wachten dus — maar niet eindeloos: blokkeert een
     * adblocker het script, dan blijft dit anders elke seconde draaien
     * zolang de pagina openstaat.
     */
    function probeer() {
      if (gestopt || meld()) {
        clearInterval(wachten);
        return;
      }
    }

    function start() {
      if (leesKeuze() !== "verleend") return;
      probeer();
      if (!gestopt) {
        wachten = setInterval(probeer, 400);
        setTimeout(() => {
          gestopt = true;
          clearInterval(wachten);
        }, 15_000);
      }
    }

    start();

    // Geeft de bezoeker pas op deze pagina toestemming, dan telt die
    // bestelling alsnog mee.
    const opzeggen = abonneer((keuze) => {
      if (keuze === "verleend") start();
    });

    return () => {
      gestopt = true;
      clearInterval(wachten);
      opzeggen();
    };
  }, [ordernummer, waardeCenten, regels, email]);

  return null;
}
