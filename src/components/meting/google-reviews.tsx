"use client";

import { useEffect } from "react";

/**
 * Google Klantenreviews: de "geïntegreerde toestemming".
 *
 * Google toont op de bevestigingspagina een klein venster waarin de klant
 * kiest of hij na levering een korte enquête wil ontvangen. Pas met die
 * beoordelingen kan Google winkelsterren en productreviews tonen in
 * Shopping en Ads. Wij versturen zelf niets: Google mailt alleen klanten
 * die in dat venster ja zeggen.
 *
 * Alleen op een betaalde bestelling met bekend e-mailadres — een enquête
 * over een bestelling die nooit betaald is, is waardeloos voor Google en
 * vervelend voor de klant.
 */

const MERCHANT_ID = 5875424836;

declare global {
  interface Window {
    renderOptIn?: () => void;
    gapi?: {
      load: (naam: string, klaar: () => void) => void;
      surveyoptin: { render: (opties: Record<string, unknown>) => void };
    };
  }
}

export function GoogleReviews({
  ordernummer,
  email,
  landcode,
  leverdatum,
  gtins,
}: {
  ordernummer: string;
  email: string;
  landcode: string;
  /** JJJJ-MM-DD: verwachte leverdatum */
  leverdatum: string;
  gtins: string[];
}) {
  useEffect(() => {
    // Eén keer per bestelling tonen, ook als de pagina herladen wordt.
    const sleutel = `google-reviews-${ordernummer}`;
    try {
      if (sessionStorage.getItem(sleutel)) return;
      sessionStorage.setItem(sleutel, "1");
    } catch {
      // Geen opslag beschikbaar: dan gewoon tonen.
    }

    window.renderOptIn = () => {
      window.gapi?.load("surveyoptin", () => {
        window.gapi?.surveyoptin.render({
          merchant_id: MERCHANT_ID,
          order_id: ordernummer,
          email,
          delivery_country: landcode,
          estimated_delivery_date: leverdatum,
          ...(gtins.length > 0 ? { products: gtins.map((gtin) => ({ gtin })) } : {}),
        });
      });
    };

    if (document.getElementById("google-reviews-script")) {
      window.renderOptIn();
      return;
    }
    const s = document.createElement("script");
    s.id = "google-reviews-script";
    s.src = "https://apis.google.com/js/platform.js?onload=renderOptIn";
    s.async = true;
    s.defer = true;
    document.body.appendChild(s);
  }, [ordernummer, email, landcode, leverdatum, gtins]);

  return null;
}
