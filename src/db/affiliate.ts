import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "./index";
import {
  affiliateAttributies,
  affiliateAuditlog,
  affiliateCommissies,
  affiliateInstellingen,
  affiliateKlikken,
  affiliates,
} from "./affiliate-schema";
import { orderLines, orders, products, users } from "./schema";
import {
  commissieCenten,
  grondslagCenten,
  isZelfverwijzing,
  klikIsGeldig,
  rijpOp,
  STANDAARD_ATTRIBUTIE_DAGEN,
  STANDAARD_DREMPEL_CENTEN,
  STANDAARD_PERCENTAGE_BP,
} from "@/lib/affiliate/rekenen";

/* -------------------------------------------------------- instellingen */

export type Instellingen = {
  standaardPercentageBp: number;
  attributieDagen: number;
  uitbetalingsdrempelCenten: number;
  uitbetalingsfrequentie: string;
  programmaActief: boolean;
  voorwaardenVersie: string;
};

const VALTERUG: Instellingen = {
  standaardPercentageBp: STANDAARD_PERCENTAGE_BP,
  attributieDagen: STANDAARD_ATTRIBUTIE_DAGEN,
  uitbetalingsdrempelCenten: STANDAARD_DREMPEL_CENTEN,
  uitbetalingsfrequentie: "maandelijks",
  programmaActief: true,
  voorwaardenVersie: "2026-09-28",
};

/**
 * De programma-instellingen, met de standaarden als er nog geen rij is.
 *
 * Bewust géén rij aanmaken bij het lezen: dit wordt ook aangeroepen vanuit
 * de doorstuurroute, en die hoort niet te schrijven. De rij ontstaat pas
 * wanneer een beheerder iets wijzigt.
 */
export async function haalInstellingen(): Promise<Instellingen> {
  const [rij] = await db.select().from(affiliateInstellingen).limit(1);
  if (!rij) return VALTERUG;
  return {
    standaardPercentageBp: rij.standaardPercentageBp,
    attributieDagen: rij.attributieDagen,
    uitbetalingsdrempelCenten: rij.uitbetalingsdrempelCenten,
    uitbetalingsfrequentie: rij.uitbetalingsfrequentie,
    programmaActief: rij.programmaActief,
    voorwaardenVersie: rij.voorwaardenVersie,
  };
}

export async function slaInstellingenOp(
  waarden: Partial<Instellingen>,
): Promise<void> {
  const [bestaand] = await db
    .select({ id: affiliateInstellingen.id })
    .from(affiliateInstellingen)
    .limit(1);

  if (bestaand) {
    await db
      .update(affiliateInstellingen)
      .set({ ...waarden, bijgewerktOp: new Date() })
      .where(eq(affiliateInstellingen.id, bestaand.id));
    return;
  }
  await db.insert(affiliateInstellingen).values({ ...VALTERUG, ...waarden });
}

/* ------------------------------------------------------------ opzoeken */

/** Een goedgekeurde affiliate op slug. Alleen goedgekeurde tellen mee. */
export async function goedgekeurdeAffiliateViaSlug(slug: string) {
  const [rij] = await db
    .select({
      id: affiliates.id,
      userId: affiliates.userId,
      slug: affiliates.slug,
      percentageBp: affiliates.percentageBp,
    })
    .from(affiliates)
    .where(
      and(eq(affiliates.slug, slug), eq(affiliates.status, "goedgekeurd")),
    )
    .limit(1);
  return rij ?? null;
}

export async function affiliateVanGebruiker(userId: string) {
  const [rij] = await db
    .select()
    .from(affiliates)
    .where(eq(affiliates.userId, userId))
    .limit(1);
  return rij ?? null;
}

/* -------------------------------------------------------------- klikken */

export async function registreerKlik(opts: {
  affiliateId: string;
  linkId?: string | null;
  doelPad: string;
  bronHash?: string | null;
  apparaat?: string | null;
  verwijzer?: string | null;
}): Promise<string> {
  const [rij] = await db
    .insert(affiliateKlikken)
    .values({
      affiliateId: opts.affiliateId,
      linkId: opts.linkId ?? null,
      doelPad: opts.doelPad,
      bronHash: opts.bronHash ?? null,
      apparaat: opts.apparaat ?? null,
      verwijzer: opts.verwijzer ?? null,
    })
    .returning({ id: affiliateKlikken.id });
  return rij.id;
}

/* ----------------------------------------------------------- attributie */

/**
 * Koppelt een affiliate aan een bestelling, op het moment dat de
 * bestelling wordt aangemaakt.
 *
 * Laatste geldige verwijzing wint, en dat is precies wat hier gebeurt: de
 * cookie bevat altijd de laatste klik, en deze functie schrijft één rij
 * per bestelling. De unieke sleutel op order_id is de grendel — tweemaal
 * aanroepen voor dezelfde bestelling verandert niets.
 *
 * Er wordt hier bewust nog geen commissie gemaakt. Een bestelling die
 * nooit betaald wordt hoort geen commissie op te leveren, en dat is pas
 * bekend als de betaling rond is.
 */
export async function legAttributieVast(opts: {
  orderId: string;
  affiliateId: string;
  klikId: string;
  klikOp: Date;
}): Promise<void> {
  await db
    .insert(affiliateAttributies)
    .values({
      orderId: opts.orderId,
      affiliateId: opts.affiliateId,
      klikId: opts.klikId,
      klikOp: opts.klikOp,
    })
    .onConflictDoNothing({ target: affiliateAttributies.orderId });
}

/* ----------------------------------------------------------- commissie */

export type CommissieUitkomst =
  | { gemaakt: true; commissieId: string; bedragCenten: number }
  | { gemaakt: false; reden: string };

/**
 * Maakt de commissie voor een betaalde bestelling.
 *
 * Wordt aangeroepen vanuit de Stripe-webhook, nadat vaststaat dat er
 * betaald is. Alles gebeurt in één transactie, zodat er nooit een halve
 * commissie achterblijft wanneer er halverwege iets misgaat.
 *
 * De volgorde van de controles is niet willekeurig: eerst de goedkoopste
 * afwijzingen (geen attributie, geen bestelling), dan de inhoudelijke
 * (zelfverwijzing, uitgesloten producten), en pas als laatste het schrijven.
 */
export async function maakCommissieVoorBestelling(
  orderId: string,
): Promise<CommissieUitkomst> {
  const instellingen = await haalInstellingen();
  if (!instellingen.programmaActief) {
    return { gemaakt: false, reden: "Programma staat uit" };
  }

  return db.transaction(async (tx) => {
    const [attributie] = await tx
      .select()
      .from(affiliateAttributies)
      .where(eq(affiliateAttributies.orderId, orderId))
      .limit(1);
    if (!attributie) return { gemaakt: false, reden: "Geen affiliate" };

    const [bestelling] = await tx
      .select({
        id: orders.id,
        userId: orders.userId,
        gastEmail: orders.gastEmail,
        status: orders.status,
        geleverdOp: orders.geleverdOp,
        balieverkoop: orders.balieverkoop,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    if (!bestelling) return { gemaakt: false, reden: "Bestelling onbekend" };

    if (bestelling.status === "geannuleerd" || bestelling.status === "terugbetaald") {
      return { gemaakt: false, reden: "Bestelling geannuleerd of terugbetaald" };
    }

    const [affiliate] = await tx
      .select({
        id: affiliates.id,
        userId: affiliates.userId,
        status: affiliates.status,
        percentageBp: affiliates.percentageBp,
        email: users.email,
      })
      .from(affiliates)
      .innerJoin(users, eq(users.id, affiliates.userId))
      .where(eq(affiliates.id, attributie.affiliateId))
      .limit(1);
    if (!affiliate) return { gemaakt: false, reden: "Affiliate onbekend" };
    if (affiliate.status !== "goedgekeurd") {
      return { gemaakt: false, reden: "Affiliate niet goedgekeurd" };
    }

    if (
      isZelfverwijzing({
        affiliateUserId: affiliate.userId,
        affiliateEmail: affiliate.email,
        bestellerUserId: bestelling.userId,
        bestellerEmail: bestelling.gastEmail,
      })
    ) {
      return { gemaakt: false, reden: "Zelfverwijzing" };
    }

    // Klik binnen de attributieperiode? De cookie wordt al op tijd
    // verlopen gezet, maar een bestelling kan lang na de klik betaald
    // worden en dan hoort de termijn alsnog te gelden.
    if (
      attributie.klikOp &&
      !klikIsGeldig({
        klikOp: attributie.klikOp,
        nu: new Date(),
        attributieDagen: instellingen.attributieDagen,
      })
    ) {
      return { gemaakt: false, reden: "Klik verlopen" };
    }

    const regels = await tx
      .select({
        stukprijsExclBtwCenten: orderLines.stukprijsExclBtwCenten,
        aantal: orderLines.aantal,
        uitgesloten: products.commissieUitgesloten,
      })
      .from(orderLines)
      .innerJoin(products, eq(products.id, orderLines.productId))
      .where(eq(orderLines.orderId, orderId));

    const grondslag = grondslagCenten(regels);
    if (grondslag <= 0) {
      return { gemaakt: false, reden: "Geen commissiabele producten" };
    }

    const percentageBp =
      affiliate.percentageBp ?? instellingen.standaardPercentageBp;
    const bedrag = commissieCenten(grondslag, percentageBp);
    if (bedrag <= 0) return { gemaakt: false, reden: "Bedrag is nul" };

    const rijp = rijpOp({
      geleverdOp: bestelling.geleverdOp,
      balieverkoop: bestelling.balieverkoop,
      betaaldOp: new Date(),
    });

    const [nieuw] = await tx
      .insert(affiliateCommissies)
      .values({
        orderId,
        affiliateId: affiliate.id,
        grondslagCenten: grondslag,
        percentageBp,
        bedragCenten: bedrag,
        rijpOp: rijp,
      })
      // De database bewaakt "één commissie per bestelling". Komt de
      // webhook tweemaal binnen, dan levert dit niets op en is dat goed.
      .onConflictDoNothing({ target: affiliateCommissies.orderId })
      .returning({ id: affiliateCommissies.id });

    if (!nieuw) return { gemaakt: false, reden: "Bestond al" };

    return { gemaakt: true, commissieId: nieuw.id, bedragCenten: bedrag };
  });
}

/**
 * Draait de commissie van een bestelling terug, geheel of gedeeltelijk.
 *
 * Gebruikt bij retour, annulering en terugboeking. Een commissie die al
 * is uitbetaald wordt niet stil teruggedraaid: dat geld is weg en moet met
 * de affiliate worden verrekend, dus die krijgt een aantekening in plaats
 * van een stille statuswijziging.
 */
export async function draaiCommissieTerug(opts: {
  orderId: string;
  reden: string;
  actorUserId?: string | null;
}): Promise<{ teruggedraaid: boolean; reden: string }> {
  return db.transaction(async (tx) => {
    const [commissie] = await tx
      .select()
      .from(affiliateCommissies)
      .where(eq(affiliateCommissies.orderId, opts.orderId))
      .limit(1);

    if (!commissie) return { teruggedraaid: false, reden: "Geen commissie" };
    if (commissie.status === "teruggedraaid") {
      return { teruggedraaid: false, reden: "Stond al teruggedraaid" };
    }

    const alUitbetaald = commissie.status === "uitbetaald";

    await tx
      .update(affiliateCommissies)
      .set({
        status: "teruggedraaid",
        bedragCenten: 0,
        reden: alUitbetaald
          ? `${opts.reden} — let op: was al uitbetaald, verrekenen met de affiliate`
          : opts.reden,
        bijgewerktOp: new Date(),
      })
      .where(eq(affiliateCommissies.id, commissie.id));

    await tx.insert(affiliateAuditlog).values({
      actorUserId: opts.actorUserId ?? null,
      affiliateId: commissie.affiliateId,
      commissieId: commissie.id,
      actie: "commissie_teruggedraaid",
      reden: opts.reden,
      details: `€ ${(commissie.bedragCenten / 100).toFixed(2)} vervallen${
        alUitbetaald ? " (was al uitbetaald)" : ""
      }`,
    });

    return { teruggedraaid: true, reden: opts.reden };
  });
}

/**
 * Zet rijpe commissies op goedgekeurd.
 *
 * Draait idempotent: alleen open commissies waarvan de bedenktijd voorbij
 * is. Tweemaal aanroepen levert de tweede keer nul op.
 */
export async function keurRijpeCommissiesGoed(): Promise<number> {
  const rijen = await db
    .update(affiliateCommissies)
    .set({ status: "goedgekeurd", goedgekeurdOp: new Date(), bijgewerktOp: new Date() })
    .where(
      and(
        eq(affiliateCommissies.status, "open"),
        sql`${affiliateCommissies.rijpOp} is not null`,
        sql`${affiliateCommissies.rijpOp} <= now()`,
      ),
    )
    .returning({ id: affiliateCommissies.id });
  return rijen.length;
}

/* -------------------------------------------------------- overzichten */

export async function statistiekenVoorAffiliate(affiliateId: string) {
  const [klikken] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(affiliateKlikken)
    .where(eq(affiliateKlikken.affiliateId, affiliateId));

  const perStatus = await db
    .select({
      status: affiliateCommissies.status,
      n: sql<number>`count(*)::int`,
      som: sql<number>`coalesce(sum(${affiliateCommissies.bedragCenten}), 0)::int`,
    })
    .from(affiliateCommissies)
    .where(eq(affiliateCommissies.affiliateId, affiliateId))
    .groupBy(affiliateCommissies.status);

  const bedrag = (s: string) => perStatus.find((r) => r.status === s)?.som ?? 0;
  const aantal = (s: string) => perStatus.find((r) => r.status === s)?.n ?? 0;

  const bestellingen =
    aantal("open") + aantal("goedgekeurd") + aantal("uitbetaald");
  const klikAantal = klikken?.n ?? 0;

  return {
    klikken: klikAantal,
    bestellingen,
    conversiePromille:
      klikAantal > 0 ? Math.round((bestellingen / klikAantal) * 1000) : 0,
    openCenten: bedrag("open"),
    goedgekeurdCenten: bedrag("goedgekeurd"),
    uitbetaaldCenten: bedrag("uitbetaald"),
    totaalCenten: bedrag("open") + bedrag("goedgekeurd") + bedrag("uitbetaald"),
  };
}

/**
 * De commissieregels voor het affiliate-dashboard.
 *
 * Let op wat er niet in staat: geen e-mailadres, geen naam, geen adres van
 * de klant. Een affiliate hoort te zien dát er is gekocht en wat het hem
 * oplevert, niet wie het heeft gekocht. Het ordernummer gaat mee omdat
 * beide partijen ergens naar moeten kunnen verwijzen bij een vraag.
 */
export async function commissiesVoorAffiliate(affiliateId: string, limiet = 100) {
  return db
    .select({
      id: affiliateCommissies.id,
      ordernummer: orders.ordernummer,
      besteldOp: orders.geplaatstOp,
      grondslagCenten: affiliateCommissies.grondslagCenten,
      percentageBp: affiliateCommissies.percentageBp,
      bedragCenten: affiliateCommissies.bedragCenten,
      status: affiliateCommissies.status,
      rijpOp: affiliateCommissies.rijpOp,
    })
    .from(affiliateCommissies)
    .innerJoin(orders, eq(orders.id, affiliateCommissies.orderId))
    .where(eq(affiliateCommissies.affiliateId, affiliateId))
    .orderBy(desc(orders.geplaatstOp))
    .limit(limiet);
}

/* ----------------------------------------------------------- beheerder */

export async function alleAffiliates() {
  return db
    .select({
      id: affiliates.id,
      slug: affiliates.slug,
      status: affiliates.status,
      percentageBp: affiliates.percentageBp,
      bedrijfsnaam: affiliates.bedrijfsnaam,
      landcode: affiliates.landcode,
      aangemaaktOp: affiliates.aangemaaktOp,
      naam: users.name,
      email: users.email,
    })
    .from(affiliates)
    .innerJoin(users, eq(users.id, affiliates.userId))
    .orderBy(desc(affiliates.aangemaaktOp));
}

export async function commissiesVoorBeheer(statussen?: string[]) {
  const basis = db
    .select({
      id: affiliateCommissies.id,
      ordernummer: orders.ordernummer,
      besteldOp: orders.geplaatstOp,
      bedragCenten: affiliateCommissies.bedragCenten,
      grondslagCenten: affiliateCommissies.grondslagCenten,
      percentageBp: affiliateCommissies.percentageBp,
      status: affiliateCommissies.status,
      rijpOp: affiliateCommissies.rijpOp,
      reden: affiliateCommissies.reden,
      affiliateSlug: affiliates.slug,
      affiliateNaam: users.name,
    })
    .from(affiliateCommissies)
    .innerJoin(orders, eq(orders.id, affiliateCommissies.orderId))
    .innerJoin(affiliates, eq(affiliates.id, affiliateCommissies.affiliateId))
    .innerJoin(users, eq(users.id, affiliates.userId))
    .orderBy(desc(orders.geplaatstOp))
    .limit(300);

  if (!statussen || statussen.length === 0) return basis;
  return basis.where(
    inArray(
      affiliateCommissies.status,
      statussen as ("open" | "goedgekeurd" | "uitbetaald" | "teruggedraaid" | "geblokkeerd")[],
    ),
  );
}

export async function schrijfAuditregel(opts: {
  actorUserId?: string | null;
  affiliateId?: string | null;
  commissieId?: string | null;
  actie: string;
  reden?: string | null;
  details?: string | null;
}) {
  await db.insert(affiliateAuditlog).values({
    actorUserId: opts.actorUserId ?? null,
    affiliateId: opts.affiliateId ?? null,
    commissieId: opts.commissieId ?? null,
    actie: opts.actie,
    reden: opts.reden ?? null,
    details: opts.details ?? null,
  });
}

export async function auditlogRegels(limiet = 200) {
  return db
    .select({
      id: affiliateAuditlog.id,
      actie: affiliateAuditlog.actie,
      reden: affiliateAuditlog.reden,
      details: affiliateAuditlog.details,
      aangemaaktOp: affiliateAuditlog.aangemaaktOp,
      actor: users.email,
    })
    .from(affiliateAuditlog)
    .leftJoin(users, eq(users.id, affiliateAuditlog.actorUserId))
    .orderBy(desc(affiliateAuditlog.aangemaaktOp))
    .limit(limiet);
}
