import { berekenTotalen, splitsIncl, type OrderTotalen } from "./btw";
import { kortingCenten, naKorting } from "./korting";
import { catalogus, vindItem, type CatalogusItem } from "./catalogus";
import { beoordeelVerzending, type VerzendOordeel } from "./verzending";

/**
 * Cart domain logic — pure, so it can be tested without a request.
 * Persistence lives in lib/winkelwagen-cookie.ts.
 */

export type RegelInvoer = { slug: string; aantal: number };

export type Winkelwagen = { regels: RegelInvoer[] };

export const LEGE_WAGEN: Winkelwagen = { regels: [] };

/** Guards against a hostile or stale cookie. */
export const MAX_AANTAL_PER_REGEL = 99;

export function normaliseerWagen(wagen: Winkelwagen): Winkelwagen {
  const samengevoegd = new Map<string, number>();

  for (const regel of wagen.regels) {
    const item = vindItem(regel.slug);
    if (!item || !item.actief) continue;

    const aantal = Math.floor(Number(regel.aantal));
    if (!Number.isFinite(aantal) || aantal <= 0) continue;

    const totaal = (samengevoegd.get(regel.slug) ?? 0) + aantal;
    samengevoegd.set(regel.slug, Math.min(totaal, MAX_AANTAL_PER_REGEL));
  }

  return {
    regels: [...samengevoegd].map(([slug, aantal]) => ({ slug, aantal })),
  };
}

export function voegToe(
  wagen: Winkelwagen,
  slug: string,
  aantal = 1,
): Winkelwagen {
  return normaliseerWagen({
    regels: [...wagen.regels, { slug, aantal }],
  });
}

export function wijzigAantal(
  wagen: Winkelwagen,
  slug: string,
  aantal: number,
): Winkelwagen {
  if (aantal <= 0) return verwijder(wagen, slug);
  return normaliseerWagen({
    regels: wagen.regels.map((r) => (r.slug === slug ? { slug, aantal } : r)),
  });
}

export function verwijder(wagen: Winkelwagen, slug: string): Winkelwagen {
  return { regels: wagen.regels.filter((r) => r.slug !== slug) };
}

export type WagenRegel = {
  item: CatalogusItem;
  aantal: number;
  regelExclBtwCenten: number;
};

/** Wat een toegepaste kortingscode met dit mandje doet. */
export type WagenKorting = {
  code: string;
  percentageBp: number;
  /** Wat de klant minder betaalt, in de valuta die hij op het scherm ziet. */
  bedragCenten: number;
};

export type WagenOverzicht = {
  regels: WagenRegel[];
  aantalArtikelen: number;
  /** Aerosol modules in the shipment — what the carrier rules count */
  aantalModules: number;
  totalen: OrderTotalen;
  /** null wanneer er geen code is toegepast */
  korting: WagenKorting | null;
  verzending: VerzendOordeel;
  /** True when nothing blocks checkout */
  afrekenbaar: boolean;
  leeg: boolean;
};

/**
 * Everything the cart and checkout pages need, in one pass: line totals,
 * btw, and whether this basket can actually be shipped to this address.
 * The shipping verdict travels with the totals so no page can render a
 * "pay now" button for an order we would have to cancel afterwards.
 */
export function berekenWagen(
  wagen: Winkelwagen,
  opts: {
    landcode: string;
    isZakelijk: boolean;
    btwIdGevalideerd: boolean;
    /** Een al goedgekeurde kortingscode; de geldigheid is hier al bepaald. */
    korting?: { code: string; percentageBp: number } | null;
  },
): WagenOverzicht {
  const genormaliseerd = normaliseerWagen(wagen);

  const bp = opts.korting?.percentageBp ?? 0;
  const metKorting = (centen: number | undefined) =>
    centen === undefined ? undefined : bp > 0 ? naKorting(centen, bp) : centen;

  const regels: WagenRegel[] = genormaliseerd.regels.flatMap((r) => {
    const item = vindItem(r.slug);
    if (!item) return [];
    return [
      {
        item,
        aantal: r.aantal,
        /*
         * Langs dezelfde route als berekenTotalen hieronder: bestaat er
         * een brutoprijs, dan is díé de waarheid en volgt netto door
         * deling. Netto apart korten en dan optellen scheelt een cent
         * met het subtotaal — en dan telt op de factuur de som van de
         * regels niet op tot het factuurtotaal.
         */
        regelExclBtwCenten:
          item.prijsInclBtwCenten !== undefined
            ? splitsIncl(
                metKorting(item.prijsInclBtwCenten)!,
                item.btwPercentage,
              ).exclCenten * r.aantal
            : metKorting(item.prijsExclBtwCenten)! * r.aantal,
      },
    ];
  });

  // Elke regel is één module per stuk; er zijn geen bundels meer.
  const aantalModules = regels.reduce((som, r) => som + r.aantal, 0);

  /*
   * De korting gaat op de stukprijs, vóór de btw-berekening.
   *
   * Dat is het enige punt waar hij één keer hoeft te landen: totalen,
   * btw, de regels van de bestelling, het bedrag dat Stripe int, de
   * factuur en de grondslag van de affiliatecommissie komen allemaal
   * hiervandaan. Zou je de korting er achteraf aftrekken, dan klopt de
   * btw niet meer met het geïnde bedrag — en dat is de fout die pas bij
   * de aangifte opvalt.
   *
   * Op de brutoprijs voor consumenten en op de nettoprijs bij een
   * zakelijke of verlegde bestelling, zodat in beide gevallen het bedrag
   * dat op het scherm staat het bedrag is waarover gerekend wordt.
   */
  const totalen = berekenTotalen(
    regels.map((r) => ({
      aantal: r.aantal,
      stukprijsExclBtwCenten: metKorting(r.item.prijsExclBtwCenten)!,
      stukprijsInclBtwCenten: metKorting(r.item.prijsInclBtwCenten),
      btwPercentage: r.item.btwPercentage,
    })),
    {
      landcode: opts.landcode,
      isZakelijk: opts.isZakelijk,
      btwIdGevalideerd: opts.btwIdGevalideerd,
      // §8: shipping is free on every order, always.
      verzendkostenCenten: 0,
    },
  );

  const verzending = beoordeelVerzending({
    bestemming: { landcode: opts.landcode },
    aantalModules,
  });

  const leeg = regels.length === 0;

  /*
   * Wat de klant minder betaalt, uitgedrukt in de valuta die op zijn
   * scherm staat: inclusief btw voor een consument, exclusief bij een
   * verlegde bestelling. Apart uitgerekend over de volle prijs, zodat het
   * getoonde kortingsbedrag optelt met het getoonde totaal — het
   * terugrekenen uit de totalen loopt een cent uit de pas zodra de btw
   * ergens is afgerond.
   */
  let korting: WagenKorting | null = null;
  if (opts.korting && bp > 0 && !leeg) {
    const vol = regels.reduce((som, r) => {
      const stuk = totalen.btwVerlegd
        ? r.item.prijsExclBtwCenten
        : (r.item.prijsInclBtwCenten ?? r.item.prijsExclBtwCenten);
      return som + stuk * r.aantal;
    }, 0);
    const bedragCenten = kortingCenten(vol, bp);
    if (bedragCenten > 0) {
      korting = { code: opts.korting.code, percentageBp: bp, bedragCenten };
    }
  }

  return {
    regels,
    aantalArtikelen: regels.reduce((som, r) => som + r.aantal, 0),
    aantalModules,
    totalen,
    korting,
    verzending,
    afrekenbaar: !leeg && verzending.toegestaan,
    leeg,
  };
}

/** Serialise for the cookie — slug/aantal only, never prices. */
export function naarCookie(wagen: Winkelwagen): string {
  return normaliseerWagen(wagen)
    .regels.map((r) => `${r.slug}:${r.aantal}`)
    .join(",");
}

/**
 * Parse a cookie back. Anything unrecognised is dropped rather than
 * throwing — a stale cookie after a catalogue change must not break the
 * shop for that visitor.
 */
export function uitCookie(waarde: string | undefined): Winkelwagen {
  if (!waarde) return LEGE_WAGEN;

  const regels: RegelInvoer[] = [];
  for (const deel of waarde.split(",")) {
    const [slug, aantal] = deel.split(":");
    if (!slug) continue;
    regels.push({ slug, aantal: Number(aantal) });
  }
  return normaliseerWagen({ regels });
}

/** Slugs a visitor could legitimately add, for validating form input. */
export function geldigeSlugs(): string[] {
  return catalogus.filter((c) => c.actief).map((c) => c.slug);
}
