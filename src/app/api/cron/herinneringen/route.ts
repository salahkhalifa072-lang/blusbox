import { NextResponse } from "next/server";
import { draaiHerinneringsronde } from "@/lib/herinneringen";
import type { IsoDatum } from "@/lib/levensduur";

export const dynamic = "force-dynamic";
// Genoeg lucht voor een ronde met honderden units; Vercel kapt hierna af.
export const maxDuration = 300;

/**
 * §9.3 dagelijkse herinneringsronde.
 *
 * Beveiligd met een gedeeld geheim in plaats van een sessie: dit endpoint
 * wordt door een planner aangeroepen, niet door een mens. Zonder
 * `CRON_SECRET` in de omgeving weigert het endpoint dienst — een open
 * endpoint dat mail verstuurt is een verstuurmachine voor iedereen die de
 * URL raadt.
 *
 * Vercel Cron stuurt zelf een Authorization-header met `CRON_SECRET`; een
 * eigen planner kan dezelfde header meesturen.
 */
export async function GET(request: Request) {
  const geheim = process.env.CRON_SECRET;
  if (!geheim) {
    return NextResponse.json(
      { fout: "CRON_SECRET is niet ingesteld; ronde geweigerd." },
      { status: 503 },
    );
  }

  const meegegeven = request.headers.get("authorization");
  if (meegegeven !== `Bearer ${geheim}`) {
    // Geen uitleg in het antwoord: wie het geheim niet heeft, hoeft niet te
    // weten of het endpoint bestaat en werkt.
    return new NextResponse(null, { status: 404 });
  }

  const vandaag = new Date().toISOString().slice(0, 10) as IsoDatum;

  try {
    const resultaat = await draaiHerinneringsronde(vandaag);

    // In het log, want dit draait zonder toeschouwers.
    console.info(
      `[herinneringen] ${vandaag}: ${resultaat.verstuurd} verstuurd, ` +
        `${resultaat.mislukt} mislukt, ${resultaat.bekeken} bekeken`,
    );
    for (const p of resultaat.problemen) {
      console.warn(`[herinneringen] mislukt voor ${p.email}: ${p.reden}`);
    }

    return NextResponse.json({ datum: vandaag, ...resultaat });
  } catch (fout) {
    console.error("[herinneringen] ronde afgebroken:", fout);
    return NextResponse.json(
      { fout: (fout as Error).message },
      { status: 500 },
    );
  }
}
