import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { affiliateKlikken } from "@/db/affiliate-schema";
import {
  goedgekeurdeAffiliateViaSlug,
  haalInstellingen,
  registreerKlik,
} from "@/db/affiliate";
import {
  AFFILIATE_COOKIE,
  cookieOpties,
  schrijfAttributie,
} from "@/lib/affiliate/cookie";
import { veiligDoelPad } from "@/lib/affiliate/rekenen";

/**
 * De persoonlijke affiliatelink: /r/<slug>
 *
 * Registreert de klik, zet de ondertekende cookie en stuurt door. Alles
 * server-side; de browser krijgt niets te zien behalve een omleiding.
 *
 * Deze route mag nooit cachen. Een doorstuur die uit de cache komt
 * registreert geen klik en zet geen cookie, en dan werkt het programma
 * stilletjes niet meer voor de tweede bezoeker.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Klikken per bron per minuut waarboven we niet meer registreren. */
const KLIKPLAFOND_PER_MINUUT = 20;

/**
 * Een niet-herleidbare vingerafdruk van de bezoeker.
 *
 * Het IP-adres zelf slaan we niet op: dat is een persoonsgegeven en we
 * hebben het niet nodig. Wat we wél nodig hebben is kunnen zien dat
 * driehonderd klikken van dezelfde plek komen, en daar is een hash genoeg
 * voor. Met het servergeheim erin is hij niet terug te rekenen en niet te
 * vergelijken met een hash uit een ander systeem.
 */
function bronHash(ip: string | null): string | null {
  if (!ip) return null;
  const geheim = process.env.AUTH_SECRET;
  if (!geheim) return null;
  return createHmac("sha256", geheim)
    .update(`affiliate-bron|${ip}`)
    .digest("base64url")
    .slice(0, 22);
}

/** Grove soort, genoeg voor statistiek en botherkenning. */
function apparaatSoort(ua: string | null): string {
  const s = (ua ?? "").toLowerCase();
  if (!s) return "onbekend";
  if (/bot|crawler|spider|preview|curl|wget|headless/.test(s)) return "bot";
  if (/mobile|android|iphone|ipad/.test(s)) return "mobiel";
  return "desktop";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const url = new URL(request.url);
  const basis = `${url.protocol}//${url.host}`;

  const affiliate = await goedgekeurdeAffiliateViaSlug(
    slug.trim().toLowerCase(),
  );

  // Onbekende of ingetrokken slug: gewoon naar de homepage. Geen foutpagina
  // en geen melding dat de slug niet bestaat — dat zou een middel zijn om
  // te achterhalen wie er wél affiliate is.
  if (!affiliate) {
    return NextResponse.redirect(new URL("/", basis), 302);
  }

  const instellingen = await haalInstellingen();
  if (!instellingen.programmaActief) {
    return NextResponse.redirect(new URL("/", basis), 302);
  }

  const doelPad = veiligDoelPad(url.searchParams.get("naar"));

  // UTM-parameters mogen mee naar de bestemming, de rest niet: alleen
  // doorgeven wat we kennen voorkomt dat iemand via deze route willekeurige
  // parameters op onze eigen pagina's plakt.
  const bestemming = new URL(doelPad, basis);
  for (const sleutel of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ]) {
    const waarde = url.searchParams.get(sleutel);
    if (waarde) bestemming.searchParams.set(sleutel, waarde.slice(0, 64));
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const hash = bronHash(ip);
  const apparaat = apparaatSoort(request.headers.get("user-agent"));

  const antwoord = NextResponse.redirect(bestemming, 302);

  // Bots laten we wel door maar tellen we niet mee: anders staat het
  // dashboard vol klikken van linkcontroles en previewbots, en lijkt de
  // conversie van een eerlijke affiliate veel slechter dan hij is.
  if (apparaat === "bot") return antwoord;

  try {
    if (hash) {
      const eenMinuutGeleden = new Date(Date.now() - 60_000);
      const [recent] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(affiliateKlikken)
        .where(
          and(
            eq(affiliateKlikken.affiliateId, affiliate.id),
            eq(affiliateKlikken.bronHash, hash),
            gte(affiliateKlikken.aangemaaktOp, eenMinuutGeleden),
          ),
        );
      // Boven het plafond registreren we niet meer, maar sturen we wel
      // gewoon door. De bezoeker merkt niets; de affiliate krijgt er alleen
      // geen klikken meer bij.
      if ((recent?.n ?? 0) >= KLIKPLAFOND_PER_MINUUT) return antwoord;
    }

    const klikId = await registreerKlik({
      affiliateId: affiliate.id,
      doelPad,
      bronHash: hash,
      apparaat,
      verwijzer: request.headers.get("referer")?.slice(0, 200) ?? null,
    });

    antwoord.cookies.set(
      AFFILIATE_COOKIE,
      schrijfAttributie({
        affiliateId: affiliate.id,
        klikId,
        klikOp: Date.now(),
      }),
      cookieOpties(instellingen.attributieDagen),
    );
  } catch (fout) {
    // Een mislukte registratie mag de bezoeker nooit in de weg zitten: die
    // wil naar de pagina, niet naar een foutmelding. Wel loggen, want een
    // link die stil geen klikken meer registreert kost de affiliate geld.
    console.error("Affiliateklik niet geregistreerd:", (fout as Error).message);
  }

  return antwoord;
}
