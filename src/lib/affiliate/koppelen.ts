import { cookies } from "next/headers";
import {
  goedgekeurdeAffiliateViaSlug,
  haalInstellingen,
  legAttributieVast,
} from "@/db/affiliate";
import { db } from "@/db";
import { affiliates } from "@/db/affiliate-schema";
import { eq } from "drizzle-orm";
import { AFFILIATE_COOKIE, leesAttributie } from "./cookie";
import { klikIsGeldig } from "./rekenen";

/**
 * Koppelt de affiliate uit de cookie aan een zojuist aangemaakte bestelling.
 *
 * Dit is het moment waarop de toeschrijving definitief wordt. Daarna doet
 * de cookie er niet meer toe: verandert de bezoeker hem later, of klikt
 * hij op een andere affiliatelink, dan blijft deze bestelling bij deze
 * affiliate horen.
 *
 * Alles wordt hier opnieuw gecontroleerd, ook al deed de doorstuurroute
 * dat al. Tussen de klik en het afrekenen kan een maand zitten, en in die
 * tijd kan een affiliate geschorst zijn of het programma uitgezet. Wat de
 * browser aanlevert is bovendien altijd een bewering, nooit een feit —
 * zelfs met een geldige handtekening blijft het een waarde die van buiten
 * komt, dus wordt het affiliate-id tegen de database gehouden.
 */
export async function koppelAffiliateAanBestelling(
  orderId: string,
): Promise<boolean> {
  const instellingen = await haalInstellingen();
  if (!instellingen.programmaActief) return false;

  const pot = await cookies();
  const attributie = leesAttributie(pot.get(AFFILIATE_COOKIE)?.value);
  if (!attributie) return false;

  if (
    !klikIsGeldig({
      klikOp: new Date(attributie.klikOp),
      nu: new Date(),
      attributieDagen: instellingen.attributieDagen,
    })
  ) {
    return false;
  }

  const [affiliate] = await db
    .select({ id: affiliates.id, status: affiliates.status })
    .from(affiliates)
    .where(eq(affiliates.id, attributie.affiliateId))
    .limit(1);

  if (!affiliate || affiliate.status !== "goedgekeurd") return false;

  await legAttributieVast({
    orderId,
    affiliateId: affiliate.id,
    klikId: attributie.klikId,
    klikOp: new Date(attributie.klikOp),
  });

  return true;
}

/**
 * De affiliate achter een slug, voor de bevestigingstekst op een
 * landingspagina. Geeft alleen terug of hij bestaat en goedgekeurd is —
 * nooit gegevens van de persoon zelf.
 */
export async function slugIsActief(slug: string): Promise<boolean> {
  const affiliate = await goedgekeurdeAffiliateViaSlug(slug);
  return affiliate !== null;
}
