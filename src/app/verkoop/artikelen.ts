import { ROOKMELDER_SLUG, vindItem } from "@/lib/catalogus";

/**
 * Wat er aan de deur verkocht wordt, tegen de prijs uit de catalogus. De
 * verkoper kiest aantallen en kan korting geven; een eigen prijs invullen
 * kan niet.
 */
export const DEUR_ARTIKELEN = ["blusbox", ROOKMELDER_SLUG].flatMap((slug) => {
  const item = vindItem(slug);
  if (!item?.actief || item.prijsInclBtwCenten === undefined) return [];
  return [{ slug, naam: item.naam, prijsInclBtwCenten: item.prijsInclBtwCenten }];
});

/**
 * Hoeveel korting een verkoper aan de deur mag geven, als deel van het
 * totaal. De admin zit er niet aan vast. Een grens en geen vrij veld: wie
 * aan de deur onder druk staat, geeft anders meer weg dan de marge draagt.
 */
export const MAX_DEURKORTING_PROCENT = 25;

export type DeurRegel = { slug: string; aantal: number; stukprijsInclBtwCenten: number };

/**
 * Korting in euro's verwerken in de stukprijzen.
 *
 * In de stukprijs en niet als losse minregel, net als bij een kortingscode:
 * dan kloppen factuur, btw en het bedrag dat Stripe int altijd met elkaar.
 * Elke stukprijs zakt naar verhouding; door afronding op hele centen kan
 * de korting een paar cent van het gevraagde bedrag afwijken. Het echte
 * verschil komt terug als `kortingCenten`, en dat staat op de bestelling.
 */
export function pasKortingToe(
  regels: DeurRegel[],
  gevraagdCenten: number,
): { regels: DeurRegel[]; kortingCenten: number; totaalCenten: number } {
  const vol = regels.reduce((t, r) => t + r.stukprijsInclBtwCenten * r.aantal, 0);
  if (gevraagdCenten <= 0 || vol === 0) return { regels, kortingCenten: 0, totaalCenten: vol };
  const factor = Math.max(0, vol - gevraagdCenten) / vol;
  const nieuw = regels.map((r) => ({
    ...r,
    stukprijsInclBtwCenten: Math.max(1, Math.round(r.stukprijsInclBtwCenten * factor)),
  }));
  const totaal = nieuw.reduce((t, r) => t + r.stukprijsInclBtwCenten * r.aantal, 0);
  return { regels: nieuw, kortingCenten: vol - totaal, totaalCenten: totaal };
}
