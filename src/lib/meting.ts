/**
 * Meting: Google Ads-conversies, GA4 en de Meta-pixel.
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

/**
 * Conversie-id uit Google Ads (account blusbox.nl, 386-282-9476), in de
 * vorm AW-1234567890. De omgevingsvariabele gaat voor; zonder staat hier
 * het echte account, zodat de meting niet afhangt van een instelling in
 * Vercel die iemand vergeet. Een lege variabele zet de meting niet uit —
 * daarvoor moet deze regel weg.
 */
export const GOOGLE_ADS_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "AW-18538501244";

/**
 * Het conversielabel van de actie "Aankoop". Google toont id en label
 * samen als AW-123/AbC-D_efGh; hier hoort alleen het deel ná de schuine
 * streep.
 */
export const GOOGLE_ADS_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSIE_LABEL?.trim() || "w4eHCOyEtKodEPyo7IdF";

/** Labels van de tussenstappen, zelfde vorm als hierboven. */
export const GOOGLE_ADS_LABEL_WAGEN =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL_WAGEN?.trim() || "_Oj2CPSosK4dEPyo7IdF";
export const GOOGLE_ADS_LABEL_AFREKENEN =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL_AFREKENEN?.trim() || "RCKCCPeosK4dEPyo7IdF";

/** Meet-id van GA4, in de vorm G-XXXXXXXXXX. Optioneel. */
export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID?.trim() ?? "";

/**
 * Pixel-id uit Meta Events Manager (dataset "Blusbox"). Net als de
 * Google-id geen geheim: hij staat in de broncode van elke pagina waar
 * de pixel draait. De omgevingsvariabele gaat voor.
 *
 * Sinds 19 november 2026 de nieuwe dataset onder advertentieaccount
 * 4046521502315595, gekoppeld aan het bedrijfsportfolio (daardoor werkt de
 * Conversions API erop). De oude (1283982580559306) hing aan een portfolio
 * dat met een Instagram-account was aangemaakt en niet meer te beheren is.
 * Een tussenversie met 1687659139639334 is vervallen.
 * Het CAPI-token (META_CAPI_TOKEN) hoort bij de dataset, dus dat is mee
 * vervangen.
 */
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "1143142338086552";

/**
 * Domeinverificatie van Meta (Bedrijfsinstellingen → Merkveiligheid →
 * Domeinen). Zonder geverifieerd domein mag Meta aankopen op blusbox.nl
 * niet als advertentiedoel gebruiken. Een openbare meta-tag, geen sleutel.
 * Hoort bij het nieuwe portfolio; de tag van het oude is weg, dat portfolio
 * is niet meer te beheren.
 */
export const META_DOMEINVERIFICATIE =
  process.env.META_DOMEINVERIFICATIE?.trim() || "82jx1zn039r74c0av0gtfklk66zhp3";

/**
 * Het script laadt onder één id. Staat Ads ingesteld, dan die; anders GA4.
 * Beide tegelijk kan: gtag stuurt daarna naar allebei door.
 */
export const METING_ID = GOOGLE_ADS_ID || GA4_ID;

/** Valt er iets te meten, en dus iets te vragen? */
export const metingActief = METING_ID !== "" || META_PIXEL_ID !== "";

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

/**
 * Het product-id richting Google en Meta, gelijk aan dat in de productfeed.
 * Blusbox en vervangmodule zijn één product met twee ingangen.
 */
export function meetId(slug: string): string {
  return slug === "blusbox" || slug === "vervangmodule" ? "BB-MODULE-01" : slug;
}

export function isBetaald(status: string): boolean {
  return (BETAALDE_STATUSSEN as readonly string[]).includes(status);
}
