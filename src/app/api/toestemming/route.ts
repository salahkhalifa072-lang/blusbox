import { NextResponse } from "next/server";
import { telToestemming } from "@/db/toestemming";

/**
 * Telt hoe vaak de cookievraag getoond is en hoe vaak er op "Akkoord" of
 * "Weigeren" is gedrukt.
 *
 * Naar onze eigen server en niet naar Google of Meta: daar mag pas iets
 * heen ná toestemming, en wie weigert zou dan per definitie ongeteld
 * blijven. Er wordt niets over de bezoeker vastgelegd, alleen een teller
 * per dag opgehoogd.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Alleen vanaf onze eigen pagina's. Houdt geen vastberaden vervalser
  // tegen, wel de toevallige vreemde site die deze URL aanroept.
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") {
    return new NextResponse(null, { status: 204 });
  }

  let keuze: unknown;
  try {
    keuze = ((await request.json()) as { keuze?: unknown })?.keuze;
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (keuze !== "verleend" && keuze !== "geweigerd" && keuze !== "getoond") {
    return new NextResponse(null, { status: 400 });
  }

  try {
    await telToestemming(keuze);
  } catch (fout) {
    // Een teller die hapert mag de bezoeker nooit raken.
    console.error("[toestemming] niet geteld:", fout);
  }
  return new NextResponse(null, { status: 204 });
}
