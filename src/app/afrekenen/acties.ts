"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { leesWagen, schrijfWagen } from "@/lib/winkelwagen-cookie";
import { LEGE_WAGEN } from "@/lib/winkelwagen";
import { beoordeelInvoer, schrijfGebruikBij } from "@/db/korting";
import { naKorting } from "@/lib/korting";
import { leesKortingscode, wisKortingscode } from "@/lib/kortingscode-cookie";
import {
  BestellingGeweigerd,
  maakBestelling,
  markeerBetaald,
} from "@/lib/bestelling";
import {
  geldigEmail,
  geldigHuisnummer,
  geldigePostcode,
  normaliseerPostcode,
  normaliseerBtwId,
  controleerVies,
} from "@/lib/adres";
import { btwVerlegd } from "@/lib/btw";
import {
  StripeNietGeconfigureerd,
  maakCheckoutSessie,
  stripeBeschikbaar,
} from "@/lib/stripe";
import { berekenWagen } from "@/lib/winkelwagen";
import { beoordeelVerzending } from "@/lib/verzending";
import { koppelAffiliateAanBestelling } from "@/lib/affiliate/koppelen";

export type AfrekenFout = {
  velden?: Record<string, string>;
  algemeen?: string;
  oplossing?: string;
};

/**
 * Places the order and starts the payment.
 *
 * Validation happens here rather than only in the browser: the form can be
 * bypassed, and this is the last point before money changes hands and a
 * package is promised.
 */
export async function rekenAf(
  _vorigeStaat: AfrekenFout | null,
  formData: FormData,
): Promise<AfrekenFout> {
  const lees = (k: string) => String(formData.get(k) ?? "").trim();

  const email = lees("email");
  const landcode = (lees("landcode") || "NL").toUpperCase();
  const postcode = lees("postcode");
  const huisnummer = lees("huisnummer");
  const straat = lees("straat");
  const plaats = lees("plaats");
  const isZakelijk = formData.get("zakelijk") === "ja";
  const bedrijfsnaam = lees("bedrijfsnaam");
  const btwIdRuw = lees("btwId");

  const velden: Record<string, string> = {};

  if (!geldigEmail(email)) {
    velden.email = "Vul een geldig e-mailadres in.";
  }
  if (!geldigePostcode(postcode, landcode)) {
    velden.postcode =
      landcode === "NL"
        ? "Vul een geldige postcode in, bijvoorbeeld 1011 AB."
        : "Vul een geldige postcode in.";
  }
  if (!geldigHuisnummer(huisnummer)) {
    velden.huisnummer = "Vul een geldig huisnummer in.";
  }
  if (isZakelijk && !bedrijfsnaam) {
    velden.bedrijfsnaam = "Vul de bedrijfsnaam in.";
  }

  if (Object.keys(velden).length > 0) return { velden };

  // Reverse charge only with a btw-id that VIES actually confirms. An
  // unreachable VIES means we charge Dutch btw — over-charging is
  // recoverable, under-charging leaves the seller liable.
  let btwIdGevalideerd = false;
  let btwId: string | undefined;

  if (isZakelijk && btwIdRuw) {
    btwId = normaliseerBtwId(btwIdRuw);
    const vies = await controleerVies(btwId);

    if (vies.status === "ongeldig") {
      return {
        velden: {
          btwId:
            "Dit btw-nummer is niet gevonden in VIES. Controleer het, of laat het veld leeg.",
        },
      };
    }
    btwIdGevalideerd = vies.status === "geldig";
  }

  const wagen = await leesWagen();

  // Bezorgen wij hier eigenlijk wel naartoe? Het formulier biedt alleen
  // toegestane landen aan, maar een <select> zegt niets: een POST met een
  // andere landcode komt hier gewoon binnen. Dit is het laatste punt vóór
  // de bestelling en de betaling, dus hier hoort de controle.
  const oordeel = beoordeelVerzending({
    bestemming: { landcode, postcode },
    aantalModules: wagen.regels.reduce((som, r) => som + r.aantal, 0),
  });
  if (!oordeel.toegestaan) {
    return { algemeen: oordeel.reden, oplossing: oordeel.oplossing };
  }

  /*
   * De kortingscode hier opnieuw beoordelen, niet eerder.
   *
   * Dit is het laatste punt waarop de prijs wordt vastgesteld. Een code
   * die tussen het invoeren en het afrekenen is uitgezet of opgeraakt,
   * moet hier alsnog vervallen — anders bepaalt het tabblad dat iemand
   * open liet staan wat hij betaalt.
   */
  const bewaardeCode = await leesKortingscode();
  const kortingOordeel = bewaardeCode ? await beoordeelInvoer(bewaardeCode) : null;
  const korting = kortingOordeel?.geldig
    ? { code: kortingOordeel.code, percentageBp: kortingOordeel.percentageBp }
    : null;

  let bestelling;
  try {
    bestelling = await maakBestelling(
      wagen,
      {
        email,
        landcode,
        postcode: normaliseerPostcode(postcode, landcode),
        huisnummer,
        straat: straat || undefined,
        plaats: plaats || undefined,
        isZakelijk,
        bedrijfsnaam: bedrijfsnaam || undefined,
        btwId,
        btwIdGevalideerd:
          btwIdGevalideerd &&
          btwVerlegd({ landcode, isZakelijk, btwIdGevalideerd }),
      },
      undefined,
      korting,
    );
  } catch (fout) {
    if (fout instanceof BestellingGeweigerd) {
      return { algemeen: fout.message, oplossing: fout.oplossing };
    }
    throw fout;
  }

  /*
   * De affiliate vastleggen, nu de bestelling bestaat.
   *
   * Hier en niet bij de betaling: op dit moment is de cookie van de
   * bezoeker nog binnen bereik. De Stripe-webhook komt van Stripe zelf en
   * heeft geen enkele cookie van de klant, dus daar valt niets meer te
   * koppelen. De commissie zelf ontstaat wél pas bij de bevestigde
   * betaling — een bestelling die blijft steken hoort niets op te leveren.
   *
   * Mislukt dit, dan gaat het afrekenen gewoon door. Een klant die niet
   * kan betalen omdat een affiliateboeking hapert is een veel groter
   * probleem dan een gemiste commissie.
   */
  try {
    await koppelAffiliateAanBestelling(bestelling.id);
  } catch (fout) {
    console.error("Affiliate niet gekoppeld:", (fout as Error).message);
  }

  /*
   * Het gebruik bijschrijven en de cookie opruimen.
   *
   * Bij het aanmaken van de bestelling en niet bij de betaling: op dit
   * moment is de cookie nog binnen bereik, en de Stripe-webhook heeft die
   * niet. Gevolg is wel dat een afgebroken betaling een gebruik kost. Bij
   * een code zonder maximum — zoals glasvezel20 — merkt niemand dat;
   * geeft een code ooit een beperkt aantal keren korting, dan is dit de
   * plek om het naar de webhook te verplaatsen.
   *
   * De korting zit al in de bestelling, dus mislukt dit, dan betaalt de
   * klant nog steeds het juiste bedrag.
   */
  if (korting) {
    await schrijfGebruikBij(korting.code).catch((fout: unknown) =>
      console.error("Kortinggebruik niet bijgeschreven:", fout),
    );
    await wisKortingscode();
  }

  // Order exists and is reserved. If payment cannot start, the customer
  // still has an order number to refer to — never a silent dead end.
  if (!stripeBeschikbaar()) {
    await schrijfWagen(LEGE_WAGEN);
    redirect(`/bestelling/${bestelling.ordernummer}?betalen=nietingesteld`);
  }

  const kop = await headers();
  const host = kop.get("host") ?? "";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const basis = `${protocol}://${host}`;

  // Rebuild the lines for Stripe. Consumers are charged incl. btw, so the
  // unit amount shown on the Stripe page matches the site exactly; on a
  // reverse-charged order the excl. price is the amount due.
  const overzicht = berekenWagen(wagen, {
    landcode,
    isZakelijk,
    btwIdGevalideerd,
    // Dezelfde korting als in de bestelling, anders int Stripe een ander
    // bedrag dan er op de bevestiging en de factuur staat.
    korting,
  });

  let sessie;
  try {
    sessie = await maakCheckoutSessie({
      regels: overzicht.regels.map((r) => ({
        naam: r.item.naam,
        omschrijving: r.item.omschrijving,
        // Charge exactly what the page advertised. Falling back to
        // inclBtw() would recompute from the net price and can land a
        // cent away from the shown amount.
        stukprijsCenten: naKorting(
          overzicht.totalen.btwVerlegd
            ? r.item.prijsExclBtwCenten
            : (r.item.prijsInclBtwCenten ?? r.item.prijsExclBtwCenten),
          korting?.percentageBp ?? 0,
        ),
        aantal: r.aantal,
      })),
      email,
      ordernummer: bestelling.ordernummer,
      orderId: bestelling.id,
      succesUrl: `${basis}/bestelling/${bestelling.ordernummer}`,
      annuleerUrl: `${basis}/winkelwagen`,
      btwVerlegd: overzicht.totalen.btwVerlegd,
    });
  } catch (fout) {
    if (fout instanceof StripeNietGeconfigureerd) {
      await schrijfWagen(LEGE_WAGEN);
      redirect(`/bestelling/${bestelling.ordernummer}?betalen=nietingesteld`);
    }
    console.error("Stripe-sessie aanmaken mislukt:", fout);
    return {
      algemeen: `De betaling kon niet worden gestart. Je bestelling is bewaard onder nummer ${bestelling.ordernummer}.`,
      oplossing: "Probeer het opnieuw, of neem contact met ons op.",
    };
  }

  await markeerBetaald(bestelling.id, sessie.id, "nieuw");
  await schrijfWagen(LEGE_WAGEN);

  redirect(sessie.url ?? `/bestelling/${bestelling.ordernummer}`);
}
