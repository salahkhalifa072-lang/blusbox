"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  affiliateCommissies,
  affiliateUitbetalingen,
  affiliateUitbetalingRegels,
  affiliates,
} from "@/db/affiliate-schema";
import { users } from "@/db/schema";
import { vereisDashboard } from "@/lib/sessie";
import {
  haalInstellingen,
  keurRijpeCommissiesGoed,
  schrijfAuditregel,
  slaInstellingenOp,
} from "@/db/affiliate";
import { beoordeelSlug, haaltDrempel } from "@/lib/affiliate/rekenen";
import { euro } from "@/lib/pricing";
import { stuurAfwijzing, stuurGoedkeuring } from "@/lib/affiliate/mail";

/**
 * Beheeracties voor het affiliateprogramma.
 *
 * Elke actie begint met vereisDashboard(). Dat is niet één keer bovenaan
 * geregeld maar per actie herhaald, want een server action is een eigen
 * ingang: wie het adres kent kan hem rechtstreeks aanroepen zonder ooit de
 * pagina te openen waar de knop op staat. De controle op de pagina zegt
 * dus niets over de veiligheid van de actie.
 *
 * Alles wat geld of toegang raakt schrijft een regel in de auditlog, met
 * wie het deed en waarom. Een correctie zonder reden is achteraf niet te
 * verdedigen, dus de reden is verplicht waar dat telt.
 */

export type BeheerStaat =
  | { fase: "leeg" }
  | { fase: "fout"; melding: string }
  | { fase: "klaar"; melding: string };

function tekst(v: FormDataEntryValue | null, max = 300): string {
  return String(v ?? "").trim().slice(0, max);
}

/* --------------------------------------------------- aanvraag beoordelen */

export async function beoordeelAanvraag(
  _vorige: BeheerStaat,
  formData: FormData,
): Promise<BeheerStaat> {
  const actor = await vereisDashboard();

  const affiliateId = tekst(formData.get("affiliateId"), 64);
  const besluit = tekst(formData.get("besluit"), 20);
  const reden = tekst(formData.get("reden"), 500);

  if (!affiliateId) return { fase: "fout", melding: "Geen affiliate gekozen." };
  if (!["goedgekeurd", "afgewezen", "geschorst"].includes(besluit)) {
    return { fase: "fout", melding: "Onbekend besluit." };
  }
  // Afwijzen en schorsen raken iemands inkomsten. Zonder reden is dat later
  // niet uit te leggen, niet aan de affiliate en niet aan jezelf.
  if (besluit !== "goedgekeurd" && reden.length < 3) {
    return { fase: "fout", melding: "Vul een reden in." };
  }

  const [affiliate] = await db
    .select({ id: affiliates.id, userId: affiliates.userId, slug: affiliates.slug })
    .from(affiliates)
    .where(eq(affiliates.id, affiliateId))
    .limit(1);
  if (!affiliate) return { fase: "fout", melding: "Affiliate niet gevonden." };

  await db.transaction(async (tx) => {
    await tx
      .update(affiliates)
      .set({
        status: besluit as "goedgekeurd" | "afgewezen" | "geschorst",
        beheerdersnotitie: reden || null,
        beoordeeldOp: new Date(),
      })
      .where(eq(affiliates.id, affiliateId));

    // De rol volgt de status. Bij afwijzen of schorsen terug naar klant:
    // een geschorste affiliate hoort geen affiliate-rol te houden.
    await tx
      .update(users)
      .set({ rol: besluit === "goedgekeurd" ? "affiliate" : "klant" })
      .where(eq(users.id, affiliate.userId));
  });

  await schrijfAuditregel({
    actorUserId: actor.id,
    affiliateId,
    actie: `aanvraag_${besluit}`,
    reden: reden || null,
    details: affiliate.slug,
  });

  /*
   * Bericht aan de partner. Los van de statuswijziging: die is al
   * opgeslagen, en een mailserver die even niet meewerkt mag niet
   * betekenen dat de goedkeuring zelf terugdraait. Wel melden in de
   * uitkomst, anders denk je dat er bericht uit is terwijl dat niet zo is.
   */
  const mail =
    besluit === "goedgekeurd"
      ? await stuurGoedkeuring(affiliateId).catch((f: unknown) => ({
          verstuurd: false as const,
          reden: String(f),
        }))
      : await stuurAfwijzing(affiliateId).catch((f: unknown) => ({
          verstuurd: false as const,
          reden: String(f),
        }));

  revalidatePath("/dashboard/affiliates");
  return {
    fase: "klaar",
    melding: mail.verstuurd
      ? `${affiliate.slug} is ${besluit}. Bericht verstuurd.`
      : `${affiliate.slug} is ${besluit}. Let op: bericht niet verstuurd (${mail.reden}).`,
  };
}

/* ------------------------------------------------------ slug en tarief */

export async function wijzigAffiliate(
  _vorige: BeheerStaat,
  formData: FormData,
): Promise<BeheerStaat> {
  const actor = await vereisDashboard();

  const affiliateId = tekst(formData.get("affiliateId"), 64);
  const nieuweSlug = tekst(formData.get("slug"), 32).toLowerCase();
  const percentageRuw = tekst(formData.get("percentage"), 10);

  if (!affiliateId) return { fase: "fout", melding: "Geen affiliate gekozen." };

  const wijzigingen: Record<string, unknown> = {};
  const gelogd: string[] = [];

  if (nieuweSlug) {
    const oordeel = beoordeelSlug(nieuweSlug);
    if (!oordeel.geldig) return { fase: "fout", melding: oordeel.reden };

    const [bezet] = await db
      .select({ id: affiliates.id })
      .from(affiliates)
      .where(eq(affiliates.slug, nieuweSlug))
      .limit(1);
    if (bezet && bezet.id !== affiliateId) {
      return { fase: "fout", melding: "Die naam is al in gebruik." };
    }
    wijzigingen.slug = nieuweSlug;
    gelogd.push(`slug → ${nieuweSlug}`);
  }

  if (percentageRuw !== "") {
    // Komma en punt allebei toestaan: op een Nederlands toetsenbord typt
    // iedereen 17,5 en niet 17.5.
    const getal = Number(percentageRuw.replace(",", "."));
    if (!Number.isFinite(getal) || getal < 0 || getal > 100) {
      return { fase: "fout", melding: "Percentage moet tussen 0 en 100 liggen." };
    }
    const bp = Math.round(getal * 100);
    wijzigingen.percentageBp = bp;
    gelogd.push(`percentage → ${getal}%`);
  }

  if (Object.keys(wijzigingen).length === 0) {
    return { fase: "fout", melding: "Niets gewijzigd." };
  }

  await db.update(affiliates).set(wijzigingen).where(eq(affiliates.id, affiliateId));

  await schrijfAuditregel({
    actorUserId: actor.id,
    affiliateId,
    actie: "affiliate_gewijzigd",
    details: gelogd.join(", "),
  });

  revalidatePath("/dashboard/affiliates");
  return { fase: "klaar", melding: gelogd.join(", ") };
}

/* ---------------------------------------------------------- commissies */

export async function keurRijpeGoed(
  vorige: BeheerStaat,
  formData: FormData,
): Promise<BeheerStaat> {
  // Deze actie heeft geen invoer nodig, maar useActionState geeft altijd
  // beide mee. Ze hier benoemen en wegstrepen is duidelijker dan de
  // lintregel uitzetten voor het hele bestand.
  void vorige;
  void formData;

  const actor = await vereisDashboard();
  const aantal = await keurRijpeCommissiesGoed();

  if (aantal > 0) {
    await schrijfAuditregel({
      actorUserId: actor.id,
      actie: "commissies_goedgekeurd",
      details: `${aantal} commissie(s) na afloop van de bedenktijd`,
    });
  }

  revalidatePath("/dashboard/affiliates");
  return {
    fase: "klaar",
    melding:
      aantal > 0
        ? `${aantal} commissie(s) goedgekeurd.`
        : "Er stond niets klaar om goed te keuren.",
  };
}

export async function corrigeerCommissie(
  _vorige: BeheerStaat,
  formData: FormData,
): Promise<BeheerStaat> {
  const actor = await vereisDashboard();

  const commissieId = tekst(formData.get("commissieId"), 64);
  const besluit = tekst(formData.get("besluit"), 20);
  const reden = tekst(formData.get("reden"), 500);

  if (!commissieId) return { fase: "fout", melding: "Geen commissie gekozen." };
  if (!["goedgekeurd", "geblokkeerd", "teruggedraaid"].includes(besluit)) {
    return { fase: "fout", melding: "Onbekend besluit." };
  }
  // Een handmatige correctie op geld is precies waar een auditlog voor
  // bestaat, en een auditregel zonder reden is een lege huls.
  if (reden.length < 3) {
    return { fase: "fout", melding: "Vul een reden in." };
  }

  const [commissie] = await db
    .select()
    .from(affiliateCommissies)
    .where(eq(affiliateCommissies.id, commissieId))
    .limit(1);
  if (!commissie) return { fase: "fout", melding: "Commissie niet gevonden." };

  if (commissie.status === "uitbetaald") {
    return {
      fase: "fout",
      melding:
        "Deze commissie is al uitbetaald. Verreken hem met de affiliate in plaats van de status te wijzigen.",
    };
  }

  await db
    .update(affiliateCommissies)
    .set({
      status: besluit as "goedgekeurd" | "geblokkeerd" | "teruggedraaid",
      bedragCenten: besluit === "teruggedraaid" ? 0 : commissie.bedragCenten,
      goedgekeurdOp: besluit === "goedgekeurd" ? new Date() : commissie.goedgekeurdOp,
      reden,
      bijgewerktOp: new Date(),
    })
    .where(eq(affiliateCommissies.id, commissieId));

  await schrijfAuditregel({
    actorUserId: actor.id,
    affiliateId: commissie.affiliateId,
    commissieId,
    actie: `commissie_${besluit}`,
    reden,
    details: `was ${commissie.status}, ${euro(commissie.bedragCenten)}`,
  });

  revalidatePath("/dashboard/affiliates");
  return { fase: "klaar", melding: `Commissie op ${besluit} gezet.` };
}

/* -------------------------------------------------------- uitbetalingen */

/**
 * Maakt een uitbetaling van alles wat goedgekeurd is voor één affiliate.
 *
 * In één transactie: de uitbetaling, de regels en het omzetten van de
 * commissies. Valt er halverwege iets om, dan is er geen uitbetaling met
 * de helft van de regels erin — dat is precies het soort restant waar
 * niemand later nog uitkomt.
 */
export async function maakUitbetaling(
  _vorige: BeheerStaat,
  formData: FormData,
): Promise<BeheerStaat> {
  const actor = await vereisDashboard();
  const affiliateId = tekst(formData.get("affiliateId"), 64);
  if (!affiliateId) return { fase: "fout", melding: "Geen affiliate gekozen." };

  const instellingen = await haalInstellingen();

  const resultaat = await db.transaction(async (tx) => {
    const rijen = await tx
      .select({
        id: affiliateCommissies.id,
        bedragCenten: affiliateCommissies.bedragCenten,
      })
      .from(affiliateCommissies)
      .where(
        and(
          eq(affiliateCommissies.affiliateId, affiliateId),
          eq(affiliateCommissies.status, "goedgekeurd"),
        ),
      );

    if (rijen.length === 0) return { ok: false as const, melding: "Niets goedgekeurd." };

    const totaal = rijen.reduce((s, r) => s + r.bedragCenten, 0);
    if (!haaltDrempel(totaal, instellingen.uitbetalingsdrempelCenten)) {
      return {
        ok: false as const,
        melding: `Onder de drempel van ${euro(instellingen.uitbetalingsdrempelCenten)} — nu ${euro(totaal)}.`,
      };
    }

    const [uitbetaling] = await tx
      .insert(affiliateUitbetalingen)
      .values({ affiliateId, bedragCenten: totaal, status: "concept" })
      .returning({ id: affiliateUitbetalingen.id });

    await tx.insert(affiliateUitbetalingRegels).values(
      rijen.map((r) => ({
        uitbetalingId: uitbetaling.id,
        commissieId: r.id,
        bedragCenten: r.bedragCenten,
      })),
    );

    await tx
      .update(affiliateCommissies)
      .set({ uitbetalingId: uitbetaling.id, bijgewerktOp: new Date() })
      .where(
        inArray(
          affiliateCommissies.id,
          rijen.map((r) => r.id),
        ),
      );

    return { ok: true as const, id: uitbetaling.id, totaal, aantal: rijen.length };
  });

  if (!resultaat.ok) return { fase: "fout", melding: resultaat.melding };

  await schrijfAuditregel({
    actorUserId: actor.id,
    affiliateId,
    actie: "uitbetaling_aangemaakt",
    details: `${resultaat.aantal} regel(s), ${euro(resultaat.totaal)}`,
  });

  revalidatePath("/dashboard/affiliates");
  return {
    fase: "klaar",
    melding: `Uitbetaling van ${euro(resultaat.totaal)} klaargezet. Maak het bedrag over en markeer hem daarna als betaald.`,
  };
}

export async function markeerUitbetaald(
  _vorige: BeheerStaat,
  formData: FormData,
): Promise<BeheerStaat> {
  const actor = await vereisDashboard();
  const uitbetalingId = tekst(formData.get("uitbetalingId"), 64);
  const referentie = tekst(formData.get("referentie"), 100);

  if (!uitbetalingId) return { fase: "fout", melding: "Geen uitbetaling gekozen." };
  if (referentie.length < 3) {
    return {
      fase: "fout",
      melding: "Vul het betaalkenmerk in, zodat de overboeking terug te vinden is.",
    };
  }

  const uitkomst = await db.transaction(async (tx) => {
    const [uitbetaling] = await tx
      .select()
      .from(affiliateUitbetalingen)
      .where(eq(affiliateUitbetalingen.id, uitbetalingId))
      .limit(1);
    if (!uitbetaling) return { ok: false as const, melding: "Niet gevonden." };
    if (uitbetaling.status === "uitbetaald") {
      return { ok: false as const, melding: "Stond al op uitbetaald." };
    }

    await tx
      .update(affiliateUitbetalingen)
      .set({ status: "uitbetaald", referentie, uitbetaaldOp: new Date() })
      .where(eq(affiliateUitbetalingen.id, uitbetalingId));

    await tx
      .update(affiliateCommissies)
      .set({ status: "uitbetaald", bijgewerktOp: new Date() })
      .where(eq(affiliateCommissies.uitbetalingId, uitbetalingId));

    return { ok: true as const, affiliateId: uitbetaling.affiliateId, bedrag: uitbetaling.bedragCenten };
  });

  if (!uitkomst.ok) return { fase: "fout", melding: uitkomst.melding };

  await schrijfAuditregel({
    actorUserId: actor.id,
    affiliateId: uitkomst.affiliateId,
    actie: "uitbetaling_voldaan",
    details: `${euro(uitkomst.bedrag)}, kenmerk ${referentie}`,
  });

  revalidatePath("/dashboard/affiliates");
  return { fase: "klaar", melding: `${euro(uitkomst.bedrag)} afgeboekt.` };
}

/* --------------------------------------------------------- instellingen */

export async function wijzigInstellingen(
  _vorige: BeheerStaat,
  formData: FormData,
): Promise<BeheerStaat> {
  const actor = await vereisDashboard();

  const percentage = Number(tekst(formData.get("percentage"), 10).replace(",", "."));
  const dagen = Number(tekst(formData.get("dagen"), 10));
  const drempel = Number(tekst(formData.get("drempel"), 12).replace(",", "."));
  const frequentie = tekst(formData.get("frequentie"), 20);
  const actief = formData.get("actief") === "ja";

  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    return { fase: "fout", melding: "Percentage moet tussen 0 en 100 liggen." };
  }
  if (!Number.isInteger(dagen) || dagen < 1 || dagen > 365) {
    return { fase: "fout", melding: "Attributieperiode moet 1 tot 365 dagen zijn." };
  }
  if (!Number.isFinite(drempel) || drempel < 0) {
    return { fase: "fout", melding: "Drempel moet nul of hoger zijn." };
  }

  await slaInstellingenOp({
    standaardPercentageBp: Math.round(percentage * 100),
    attributieDagen: dagen,
    uitbetalingsdrempelCenten: Math.round(drempel * 100),
    uitbetalingsfrequentie: frequentie || "maandelijks",
    programmaActief: actief,
  });

  await schrijfAuditregel({
    actorUserId: actor.id,
    actie: "instellingen_gewijzigd",
    details: `${percentage}%, ${dagen} dagen, drempel € ${drempel.toFixed(2)}, ${actief ? "actief" : "uit"}`,
  });

  revalidatePath("/dashboard/affiliates");
  return { fase: "klaar", melding: "Instellingen opgeslagen." };
}

/* ------------------------------------------------------------- export */

/**
 * Commissies als CSV, voor de boekhouding.
 *
 * Puntkomma als scheidingsteken en een komma in de bedragen: dat is wat
 * Excel in een Nederlandse taalinstelling verwacht. Met komma's als
 * scheiding belandt alles in één kolom.
 */
export async function exporteerCommissies(): Promise<string> {
  await vereisDashboard();

  const rijen = await db
    .select({
      ordernummer: sql<string>`(select ordernummer from orders where orders.id = ${affiliateCommissies.orderId})`,
      slug: affiliates.slug,
      naam: users.name,
      grondslag: affiliateCommissies.grondslagCenten,
      percentageBp: affiliateCommissies.percentageBp,
      bedrag: affiliateCommissies.bedragCenten,
      status: affiliateCommissies.status,
      aangemaaktOp: affiliateCommissies.aangemaaktOp,
    })
    .from(affiliateCommissies)
    .innerJoin(affiliates, eq(affiliates.id, affiliateCommissies.affiliateId))
    .innerJoin(users, eq(users.id, affiliates.userId));

  const centen = (c: number) => (c / 100).toFixed(2).replace(".", ",");

  const kop = [
    "datum",
    "ordernummer",
    "affiliate",
    "naam",
    "grondslag",
    "percentage",
    "commissie",
    "status",
  ].join(";");

  const regels = rijen.map((r) =>
    [
      r.aangemaaktOp.toISOString().slice(0, 10),
      r.ordernummer,
      r.slug,
      (r.naam ?? "").replace(/;/g, ","),
      centen(r.grondslag),
      (r.percentageBp / 100).toString().replace(".", ","),
      centen(r.bedrag),
      r.status,
    ].join(";"),
  );

  return [kop, ...regels].join("\n");
}
