/**
 * Meting: Google Ads-conversies en GA4.
 *
 * Alles hangt aan omgevingsvariabelen en niets staat hard in de code. Dat
 * is hier geen netheid maar een schakelaar: staan ze leeg, dan wordt er
 * geen enkel script geladen, verschijnt er geen toestemmingsbanner en
 * blijft het cookiebeleid zeggen dat wij niet meten. Dat is precies wat er
 * vandaag waar is, en het blijft waar tot iemand de variabelen invult.
 *
 * De omgekeerde volgorde is de valkuil: eerst de tag plaatsen en later de
 * banner en het cookiebeleid bijwerken. Dan meet je een tijdlang zonder
 * toestemming, met een cookiebeleid dat het tegendeel beweert.
 *
 * NEXT_PUBLIC_ omdat deze waarden in de browser nodig zijn. Ze zijn geen
 * geheim: iedereen die de advertentie ziet kan ze uit de broncode lezen.
 * Het is een ontvangstadres, geen sleutel.
 */

/** Conversie-id uit Google Ads, in de vorm AW-1234567890. */
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() ?? "";

/**
 * Het conversielabel van de actie "Aankoop". Google toont id en label
 * samen als AW-123/AbC-D_efGh; hier hoort alleen het deel ná de schuine
 * streep.
 */
export const GOOGLE_ADS_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSIE_LABEL?.trim() ?? "";

/** Meet-id van GA4, in de vorm G-XXXXXXXXXX. Optioneel. */
export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID?.trim() ?? "";

/**
 * Het script laadt onder één id. Staat Ads ingesteld, dan die; anders GA4.
 * Beide tegelijk kan: gtag stuurt daarna naar allebei door.
 */
export const METING_ID = GOOGLE_ADS_ID || GA4_ID;

/** Valt er iets te meten, en dus iets te vragen? */
export const metingActief = METING_ID !== "";

/**
 * Waar de aankoopconversie heen gaat. Zonder label kan Google de conversie
 * niet thuisbrengen, dus dan sturen we hem niet — een conversie zonder
 * label verdwijnt geruisloos en dat is erger dan geen conversie, want je
 * denkt dat je meet.
 */
export const conversieDoel =
  GOOGLE_ADS_ID && GOOGLE_ADS_LABEL ? `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LABEL}` : "";

/**
 * Bij welke orderstatus een aankoop geteld mag worden.
 *
 * Niet bij `nieuw`: die staat er al voordat er betaald is, en een klant
 * die afhaakt op het betaalscherm zou dan als verkoop tellen. Google zou
 * vervolgens bieden op mensen die niet betalen. Ook niet bij
 * `terugbetaald` — dat is geen omzet, en wie de pagina later teruglaadt
 * hoort geen tweede conversie te veroorzaken.
 */
export const BETAALDE_STATUSSEN = [
  "betaald",
  "in_behandeling",
  "verzonden",
  "geleverd",
] as const;

export function isBetaald(status: string): boolean {
  return (BETAALDE_STATUSSEN as readonly string[]).includes(status);
}
