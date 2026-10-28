import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { META_PIXEL_ID, isBetaald } from "./meting";
import { TOESTEMMING_COOKIE, TOESTEMMING_VERSIE } from "./toestemming";
import { haalBestelling } from "./bestelling";
import { siteUrl } from "./site";
import { contactadresVanBestelling } from "@/db/queries";

/**
 * Meta Conversions API: de aankoop ook vanaf de server melden.
 *
 * De pixel in de browser mist een deel van de aankopen: adblockers,
 * Safari en iOS houden hem tegen. De server ziet elke betaling via de
 * Stripe-webhook, dus die meldt hem hier nog een keer. Beide meldingen
 * dragen het ordernummer als event_id, zodat Meta ze samenvoegt tot één
 * aankoop.
 *
 * Toestemming is de valkuil. De webhook komt van Stripe en weet niets van
 * de cookiebanner; zonder voorzorg zou de server ook aankopen melden van
 * klanten die "Weigeren" kozen. Daarom wordt bij het afrekenen — het
 * laatste moment waarop we de browser van de klant nog zien — vastgelegd
 * of er toestemming was, en alleen dan gaan de koppelgegevens mee in de
 * metadata van de Stripe-sessie. Geen toestemming, geen metadata, geen
 * melding.
 *
 * Het toegangstoken is wél een geheim: het staat alleen in Vercel
 * (META_CAPI_TOKEN), nooit in deze openbare repository. Zonder token doet
 * dit bestand niets.
 */

const GRAPH_VERSIE = "v26.0";

/** Wat er bij toestemming mee gaat in de Stripe-metadata. */
export type MetaKoppeling = {
  meta_ok: "ja";
  meta_fbp?: string;
  meta_fbc?: string;
  meta_ip?: string;
  meta_ua?: string;
};

/**
 * In de server action van het afrekenen aanroepen. Geeft null zonder
 * toestemming. Stripe staat maximaal 500 tekens per waarde toe.
 */
export async function metaKoppelingBijAfrekenen(): Promise<MetaKoppeling | null> {
  if (!META_PIXEL_ID) return null;
  const pot = await cookies();
  const keuze = decodeURIComponent(pot.get(TOESTEMMING_COOKIE)?.value ?? "");
  if (keuze !== `verleend.${TOESTEMMING_VERSIE}`) return null;

  const kop = await headers();
  const ip = kop.get("x-forwarded-for")?.split(",")[0]?.trim() || kop.get("x-real-ip") || "";
  const kort = (s: string | undefined) => (s ? s.slice(0, 500) : undefined);

  return {
    meta_ok: "ja",
    meta_fbp: kort(pot.get("_fbp")?.value),
    meta_fbc: kort(pot.get("_fbc")?.value),
    meta_ip: kort(ip),
    meta_ua: kort(kop.get("user-agent") ?? undefined),
  };
}

function hash(waarde: string): string {
  return createHash("sha256").update(waarde.trim().toLowerCase()).digest("hex");
}

/**
 * Vanuit de webhook, na een geslaagde betaling. Gooit nooit: een mislukte
 * melding aan Meta mag de afhandeling van een betaalde bestelling niet
 * verstoren.
 */
export async function meldMetaAankoop(opts: {
  ordernummer: string;
  metadata: Record<string, string> | null | undefined;
  email?: string | null;
}): Promise<void> {
  const token = process.env.META_CAPI_TOKEN?.trim();
  const m = opts.metadata;
  if (!token || !META_PIXEL_ID || m?.meta_ok !== "ja") return;

  try {
    const gegevens = await haalBestelling(opts.ordernummer);
    if (!gegevens || !isBetaald(gegevens.order.status)) return;
    const { order, regels } = gegevens;

    // Zelfde id's en bedrag als de pixel op de bevestigingspagina, anders
    // ziet Meta twee verschillende aankopen.
    const contents = regels.map((r) => ({
      id: r.slug === "blusbox" || r.slug === "vervangmodule" ? "BB-MODULE-01" : r.slug,
      quantity: r.aantal,
      item_price: r.stukprijsExclBtwCenten / 100,
    }));
    const email = opts.email || (await contactadresVanBestelling(opts.ordernummer));

    const gebeurtenis = {
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      event_id: opts.ordernummer,
      action_source: "website",
      event_source_url: `${siteUrl}/bestelling/${opts.ordernummer}`,
      user_data: {
        ...(email ? { em: [hash(email)] } : {}),
        country: [hash(order.landcode || "nl")],
        ...(m.meta_fbp ? { fbp: m.meta_fbp } : {}),
        ...(m.meta_fbc ? { fbc: m.meta_fbc } : {}),
        ...(m.meta_ip ? { client_ip_address: m.meta_ip } : {}),
        ...(m.meta_ua ? { client_user_agent: m.meta_ua } : {}),
      },
      custom_data: {
        currency: "EUR",
        value: order.subtotaalExclBtwCenten / 100,
        content_type: "product",
        content_ids: contents.map((c) => c.id),
        contents,
        num_items: contents.reduce((n, c) => n + c.quantity, 0),
        order_id: opts.ordernummer,
      },
    };

    const antwoord = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSIE}/${META_PIXEL_ID}/events`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          data: [gebeurtenis],
          // Alleen om te testen: met een code uit Events Manager →
          // Testgebeurtenissen verschijnt de melding daar en telt hij niet mee.
          ...(process.env.META_CAPI_TESTCODE
            ? { test_event_code: process.env.META_CAPI_TESTCODE }
            : {}),
        }),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!antwoord.ok) {
      console.error(
        `Meta CAPI ${opts.ordernummer}: ${antwoord.status} ${(await antwoord.text()).slice(0, 300)}`,
      );
    }
  } catch (fout) {
    console.error(`Meta CAPI ${opts.ordernummer} mislukt:`, (fout as Error).message);
  }
}
