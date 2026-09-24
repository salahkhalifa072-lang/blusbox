"use server";

import { redirect } from "next/navigation";
import { haalFactuur } from "@/db/facturen";
import { markeerBetaald } from "@/lib/bestelling";
import { maakCheckoutSessie, stripeBeschikbaar } from "@/lib/stripe";
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
    await markeerBetaald(factuur.orderId, sessie.id, "nieuw");
    url = sessie.url;
  } catch (fout) {
    console.error(`Betaling factuur ${factuur.factuurnummer} starten mislukt:`, fout);
  }

  redirect(url ?? `${terug}?fout=betalen`);
}
