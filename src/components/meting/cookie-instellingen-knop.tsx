"use client";

import { openCookieInstellingen } from "@/lib/toestemming";

/**
 * "Cookie-instellingen" in de footer: opent dezelfde vraag als de eerste
 * keer, met dezelfde twee knoppen. Zo is intrekken één klik verder dan
 * toestemming geven, en niet verstopt achter een pagina vol tekst.
 */
export function CookieInstellingenKnop({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openCookieInstellingen} className={className}>
      Cookie-instellingen
    </button>
  );
}
