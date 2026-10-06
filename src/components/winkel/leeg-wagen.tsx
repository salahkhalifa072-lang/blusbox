"use client";

import { useEffect } from "react";
import { leegWagenNaBetaling } from "@/app/afrekenen/acties";

/**
 * Leegt de winkelwagen zodra de klant op een betaalde bestelling landt.
 *
 * Een cookie zetten kan niet tijdens het opbouwen van een pagina, alleen
 * vanuit een server action; daarom deze kleine aanroep na het laden.
 */
export function LeegWagen() {
  useEffect(() => {
    leegWagenNaBetaling().catch(() => {});
  }, []);
  return null;
}
