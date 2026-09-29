"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { affiliates } from "@/db/affiliate-schema";
import { vereisLogin } from "@/lib/sessie";
import { affiliateVanGebruiker, schrijfAuditregel } from "@/db/affiliate";
import { beoordeelSlug } from "@/lib/affiliate/rekenen";

/**
 * Wat een affiliate zelf mag wijzigen.
 *
 * Alles loopt via de affiliate die bij de ingelogde gebruiker hoort. Er
 * komt geen id uit het formulier: anders kan iemand met een aangepast
 * verborgen veld de uitbetaalrekening van een ander overschrijven, en dat
 * is precies het soort gat waar geld doorheen wegloopt.
 *
 * Status en commissiepercentage staan hier niet tussen. Die horen bij de
 * beheerder; een affiliate die zijn eigen tarief kan zetten is geen
 * programma meer.
 */

export type ProfielStaat =
  | { fase: "leeg" }
  | { fase: "fout"; melding: string }
  | { fase: "klaar"; melding: string };

function tekst(v: FormDataEntryValue | null, max = 120): string {
  return String(v ?? "").trim().slice(0, max);
}

/**
 * IBAN opschonen en globaal controleren.
 *
 * Bewust geen volledige elfproef: die verschilt per land en een te strenge
 * controle weigert geldige buitenlandse rekeningen. Dit vangt typefouten
 * en plakresten; of het nummer echt bestaat blijkt bij de eerste
 * overboeking, en dan staat er een mens naar te kijken.
 */
function normaliseerRekening(ruw: string): string | null {
  const schoon = ruw.replace(/\s+/g, "").toUpperCase();
  if (schoon.length === 0) return "";
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{8,30}$/.test(schoon)) return null;
  return schoon;
}

export async function slaProfielOp(
  _vorige: ProfielStaat,
  formData: FormData,
): Promise<ProfielStaat> {
  const actor = await vereisLogin();
  const affiliate = await affiliateVanGebruiker(actor.id);
  if (!affiliate) return { fase: "fout", melding: "Geen affiliateaccount." };

  const bedrijfsnaam = tekst(formData.get("bedrijfsnaam"));
  const website = tekst(formData.get("website"), 200);
  const kanalen = tekst(formData.get("kanalen"), 300);
  const rekeningRuw = tekst(formData.get("rekening"), 40);
  const tenNameVan = tekst(formData.get("tenNameVan"));
  const nieuweSlug = tekst(formData.get("slug"), 32).toLowerCase();

  const rekening = normaliseerRekening(rekeningRuw);
  if (rekening === null) {
    return {
      fase: "fout",
      melding: "Dat rekeningnummer ziet er niet uit als een IBAN. Controleer het even.",
    };
  }
  if (rekening && !tenNameVan) {
    return {
      fase: "fout",
      melding: "Vul ook in op wiens naam de rekening staat.",
    };
  }

  const wijzigingen: Record<string, unknown> = {
    bedrijfsnaam: bedrijfsnaam || null,
    website: website || null,
    kanalen: kanalen || null,
    uitbetaalRekening: rekening || null,
    uitbetaalTenNameVan: tenNameVan || null,
  };

  // De slug mag alleen wijzigen zolang er nog niets mee verdiend is: een
  // link die al in video's en nieuwsbrieven staat mag niet onder iemands
  // handen wegveranderen omdat de eigenaar een mooiere naam bedacht.
  if (nieuweSlug && nieuweSlug !== affiliate.slug) {
    const oordeel = beoordeelSlug(nieuweSlug);
    if (!oordeel.geldig) return { fase: "fout", melding: oordeel.reden };

    const [bezet] = await db
      .select({ id: affiliates.id })
      .from(affiliates)
      .where(eq(affiliates.slug, nieuweSlug))
      .limit(1);
    if (bezet) {
      return { fase: "fout", melding: "Die naam is al in gebruik." };
    }
    wijzigingen.slug = nieuweSlug;
  }

  await db
    .update(affiliates)
    .set(wijzigingen)
    .where(eq(affiliates.id, affiliate.id));

  // Wél vastleggen dát de uitbetaalgegevens wijzigden, niet wát ze werden.
  // Een auditlog met rekeningnummers erin is een tweede plek waar ze
  // kunnen uitlekken.
  await schrijfAuditregel({
    actorUserId: actor.id,
    affiliateId: affiliate.id,
    actie: "profiel_gewijzigd",
    details: [
      wijzigingen.slug ? `slug → ${nieuweSlug}` : null,
      rekening !== (affiliate.uitbetaalRekening ?? "")
        ? "uitbetaalgegevens aangepast"
        : null,
    ]
      .filter(Boolean)
      .join(", ") || "contactgegevens aangepast",
  }).catch(() => {});

  revalidatePath("/affiliate/dashboard");
  return { fase: "klaar", melding: "Opgeslagen." };
}
