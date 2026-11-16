/**
 * Contant afgerekend aan de deur. De betaalreferentie op de bestelling
 * begint dan met dit voorvoegsel, gevolgd door de verkoper die het geld
 * heeft. Los bestand zonder afhankelijkheden: de datalaag en de pagina's
 * gebruiken het allebei.
 */
export const CONTANT_VOORVOEGSEL = "contant:";

export function isContant(betaalreferentie: string | null | undefined): boolean {
  return Boolean(betaalreferentie?.startsWith(CONTANT_VOORVOEGSEL));
}
