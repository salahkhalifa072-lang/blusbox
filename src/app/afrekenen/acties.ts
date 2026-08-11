"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { leesWagen, schrijfWagen } from "@/lib/winkelwagen-cookie";
import { LEGE_WAGEN } from "@/lib/winkelwagen";
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

export type AfrekenFout = {
  velden?: Record<string, string>;
  algemeen?: string;
  oplossing?: string;
};

/**
 * Places the order and starts the payment.
 *
 * Validation happens here rather than only in the browser: the form can be
 * bypassed, and this is the last point before money and a dangerous-goods
 * shipment are involved.
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
    );
  } catch (fout) {
    if (fout instanceof BestellingGeweigerd) {
      return { algemeen: fout.message, oplossing: fout.oplossing };
    }
    throw fout;
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
        stukprijsCenten: overzicht.totalen.btwVerlegd
          ? r.item.prijsExclBtwCenten
          : (r.item.prijsInclBtwCenten ?? r.item.prijsExclBtwCenten),
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
