"use client";

import { useEffect } from "react";
import { abonneer, leesKeuze } from "@/lib/toestemming";
import { conversieDoel, GA4_ID } from "@/lib/meting";

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

const VOORVOEGSEL = "blusbox-conversie-";

type GtagFn = (...args: unknown[]) => void;

function alGemeld(ordernummer: string): boolean {
  try {
    return localStorage.getItem(VOORVOEGSEL + ordernummer) !== null;
  } catch {
    // Privémodus of geblokkeerde opslag: dan vertrouwen we op de
    // ontdubbeling van Google via transaction_id.
    return false;
  }
}

function onthoud(ordernummer: string): void {
  try {
    localStorage.setItem(VOORVOEGSEL + ordernummer, String(Date.now()));
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
}: {
  ordernummer: string;
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
    if (!conversieDoel && !GA4_ID) return;
    if (alGemeld(ordernummer)) return;

    let gestopt = false;
    let wachten: ReturnType<typeof setInterval> | undefined;

    function meld() {
      const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
      if (!gtag) return false;

      const waarde = waardeCenten / 100;

      if (conversieDoel) {
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

      onthoud(ordernummer);
      return true;
    }

    /**
     * gtag bestaat pas zodra het basisscript is uitgevoerd, en dat gebeurt
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
  }, [ordernummer, waardeCenten, regels]);

  return null;
}
