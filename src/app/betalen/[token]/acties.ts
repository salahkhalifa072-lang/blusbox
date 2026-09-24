"use server";

import { redirect } from "next/navigation";
import { haalFactuur, koppelBetaalsessie } from "@/db/facturen";
import {
  laatSessieVerlopen,
  maakCheckoutSessie,
  stripeBeschikbaar,
} from "@/lib/stripe";
import { siteUrl } from "@/lib/site";

/**
 * Start de betaling van een factuur.
 *
 * Elke klik maakt een nieuwe Checkout-sessie. Een sessie van Stripe
 * verloopt na 24 uur, een factuur heeft twee weken; een Stripe-link in de
 * mail zou dus halverwege de betaaltermijn doodlopen.
 *
 * Een POST en geen GET: virusscanners openen elke link in een mail, en
 * zouden anders bij elke controle een betaalsessie aanmaken.
 *
 * Het bedrag komt uit de database, nooit uit het formulier.
 */
export async function startBetaling(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  if (!token) return;
  const terug = `/betalen/${token}`;

  const factuur = await haalFactuur({ betaaltoken: token });
  if (!factuur) redirect(terug);
  if (factuur.status !== "nieuw") redirect(terug);
  if (!stripeBeschikbaar()) redirect(`${terug}?fout=betalen`);

  // Een eerdere betaalpagina van deze factuur (ander tabblad, gisteren
  // geopend) eerst dichtzetten. Anders kan de klant op beide afrekenen en
  // is hij twee keer afgeschreven.
  if (factuur.stripeSessie) await laatSessieVerlopen(factuur.stripeSessie);

  let url: string | null = null;
  try {
    const sessie = await maakCheckoutSessie({
      // Eén regel per factuurregel, met het brutobedrag per stuk. Alleen
      // als dat niet op hele centen uitkomt, gaat de regel als geheel mee —
      // anders zou Stripe een cent afwijken van de factuur.
      regels: factuur.totalen.regels.map((r) =>
        r.regelInclBtwCenten % r.aantal === 0
          ? {
              naam: r.naam,
              stukprijsCenten: r.regelInclBtwCenten / r.aantal,
              aantal: r.aantal,
            }
          : {
              naam: `${r.aantal} × ${r.naam}`,
              stukprijsCenten: r.regelInclBtwCenten,
              aantal: 1,
            },
      ),
      email: factuur.email ?? undefined,
      ordernummer: factuur.ordernummer,
      orderId: factuur.orderId,
      succesUrl: `${siteUrl}${terug}?betaald=1`,
      annuleerUrl: `${siteUrl}${terug}`,
      bron: "factuur",
    });
    // Alleen koppelen zolang de factuur nog open is. Is hij net betaald
    // (andere sessie, webhook kwam tussendoor), dan deze sessie weer
    // sluiten en terug naar de pagina, die dan "betaald" toont.
    if (await koppelBetaalsessie(factuur.orderId, sessie.id)) {
      url = sessie.url;
    } else {
      await laatSessieVerlopen(sessie.id);
      url = terug;
    }
  } catch (fout) {
    console.error(`Betaling factuur ${factuur.factuurnummer} starten mislukt:`, fout);
  }

  redirect(url ?? `${terug}?fout=betalen`);
}
