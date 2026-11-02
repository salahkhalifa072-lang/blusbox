"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { abonneer } from "@/lib/toestemming";
import { meldToevoeging, startAfrekenen, type TrechterStap } from "@/lib/trechter";

/** Meldt op elke pagina wat de server net aan de wagen toevoegde. */
export function ToevoegingMelder() {
  const pad = usePathname();
  useEffect(() => {
    meldToevoeging();
  }, [pad]);
  return null;
}

/**
 * "Begonnen met afrekenen", bij het openen van /afrekenen.
 *
 * Bij het laden en niet bij de klik op betalen: juist wie begint maar niet
 * afmaakt, wil je zien. Het slot voorkomt een tweede melding als de pagina
 * opnieuw rendert, bijvoorbeeld na het toevoegen van de rookmelder. Geeft
 * de bezoeker hier pas toestemming, dan telt deze stap alsnog mee.
 */
export function AfrekenenGestart(stap: TrechterStap) {
  const gemeld = useRef(false);
  const laatste = useRef(stap);

  useEffect(() => {
    laatste.current = stap;
  });

  useEffect(() => {
    function meld() {
      if (!gemeld.current) gemeld.current = startAfrekenen(laatste.current);
    }
    meld();
    return abonneer((keuze) => {
      if (keuze === "verleend") meld();
    });
  }, []);

  return null;
}
