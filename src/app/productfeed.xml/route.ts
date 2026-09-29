import { siteUrl } from "@/lib/site";
import { bedrijf } from "@/lib/bedrijf";
import {
  ADVIESPRIJS_CENTEN,
  PRIJS_INCL_CENTEN,
  TOON_ADVIESPRIJS,
} from "@/lib/pricing";
import { MODULE_PAKKET } from "@/lib/verzending";
import { gemiddeldeWaardering, REVIEWS } from "@/lib/reviews";

/**
 * Productfeed voor Google Merchant Center.
 *
 * Zonder feed geen Shopping-vermelding — niet betaald en niet gratis.
 * Gestructureerde data op de pagina is genoeg voor een rijk zoekresultaat
 * met sterren en prijs, maar de productkaartjes bovenaan komen alleen uit
 * Merchant Center, en dat trekt zijn gegevens uit een feed als deze.
 *
 * Merchant Center haalt dit bestand zelf op zodra je de URL er als
 * geplande feed instelt. Dat betekent dat een prijswijziging op de site
 * vanzelf doorwerkt; een handmatig geüploade lijst loopt binnen een maand
 * achter en dan wordt je vermelding afgekeurd wegens prijsverschil.
 *
 * De cijfers komen uit dezelfde bron als de webshop. Wijkt de prijs in de
 * feed af van die op de pagina, dan keurt Google het product af — dat is
 * hun belangrijkste controle.
 */

export const revalidate = 3600;

/** XML-tekens ontsnappen; een ampersand in een titel breekt anders de feed. */
function xml(tekst: string): string {
  return tekst
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function bedrag(centen: number): string {
  return `${(centen / 100).toFixed(2)} EUR`;
}

export async function GET() {
  const gemiddelde = gemiddeldeWaardering();

  const omschrijving = [
    "Blusbox is een automatische blusmodule voor de meterkast.",
    "De module klikt op de DIN-rail naast de hoofdschakelaar en aardlekschakelaar en heeft geen stroom of bedrading nodig.",
    "Bij 170 °C activeert het detectiekoord de module, die de beginnende brand in de kast dooft met condensed aerosol.",
    "Het residu is niet-geleidend en niet-corrosief, zodat de installatie intact blijft.",
    `Afmetingen circa ${MODULE_PAKKET.lengteCm} × ${MODULE_PAKKET.breedteCm} × ${MODULE_PAKKET.hoogteCm} cm, gewicht ${MODULE_PAKKET.gewichtGram} gram. Levensduur tien jaar.`,
  ].join(" ");

  /*
   * Geen EAN of GTIN op dit product. Dan moet identifier_exists op no
   * staan, met merk en mpn als vervanging — laat je dat weg, dan wordt
   * het artikel afgekeurd omdat Google een streepjescode verwacht.
   */
  const velden: [string, string][] = [
    ["g:id", "BB-MODULE-01"],
    ["g:title", "Blusbox — automatische blusmodule voor de meterkast"],
    ["g:description", omschrijving],
    ["g:link", `${siteUrl}/blusbox`],
    ["g:image_link", `${siteUrl}/media/module-packshot.jpg`],
    ["g:additional_image_link", `${siteUrl}/media/verpakking-open.jpg`],
    ["g:availability", "in_stock"],
    ["g:price", bedrag(TOON_ADVIESPRIJS ? ADVIESPRIJS_CENTEN : PRIJS_INCL_CENTEN)],
    ...(TOON_ADVIESPRIJS
      ? ([["g:sale_price", bedrag(PRIJS_INCL_CENTEN)]] as [string, string][])
      : []),
    ["g:brand", "Blusbox"],
    ["g:mpn", "BB-MODULE-01"],
    ["g:identifier_exists", "no"],
    ["g:condition", "new"],
    ["g:product_type", "Brandbeveiliging > Blusmodules > Meterkast"],
    // Categorienummer uit de taxonomie van Google: brandbestrijding.
    ["g:google_product_category", "3348"],
    ["g:shipping_weight", `${MODULE_PAKKET.gewichtGram} g`],
    ...(gemiddelde !== null && REVIEWS.length > 0
      ? ([
          ["g:product_review_count", String(REVIEWS.length)],
          ["g:product_review_average", gemiddelde.toFixed(1)],
        ] as [string, string][])
      : []),
  ];

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xml(bedrijf.naam)}</title>
    <link>${siteUrl}</link>
    <description>Automatische blusmodule voor de meterkast</description>
    <item>
${velden.map(([naam, waarde]) => `      <${naam}>${xml(waarde)}</${naam}>`).join("\n")}
      <g:shipping>
        <g:country>NL</g:country>
        <g:service>Standaard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
    </item>
  </channel>
</rss>
`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Een uur cachen: Merchant Center haalt hooguit een paar keer per
      // dag op, en zo blijft een prijswijziging binnen een uur zichtbaar.
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
