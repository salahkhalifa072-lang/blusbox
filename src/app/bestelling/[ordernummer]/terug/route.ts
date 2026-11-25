import { NextResponse } from "next/server";
import { pasKlopt } from "@/lib/bestelpas";
import { geefBestelpas } from "@/lib/bestelpas-cookie";

/**
 * Waar de betaalpagina de klant naartoe terugstuurt.
 *
 * Na iDEAL komt een klant niet altijd terug in de browser waarmee hij
 * begon: de bank-app opent de link soms in de standaardbrowser, terwijl
 * hij bestelde in de browser van Instagram. Die tweede browser heeft de
 * bestelpas-cookie niet. Daarom draagt de teruglink een code mee; klopt
 * die, dan krijgt ook deze browser de pas.
 *
 * Daarna meteen door naar de gewone bestelpagina, zonder code in de
 * adresbalk: zo komt hij niet in de geschiedenis en niet bij de
 * meetscripts terecht, die het adres van de pagina meesturen.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ ordernummer: string }> },
) {
  const { ordernummer: ruw } = await context.params;
  const ordernummer = decodeURIComponent(ruw);
  const url = new URL(request.url);

  if (pasKlopt(ordernummer, url.searchParams.get("s"))) {
    await geefBestelpas(ordernummer);
  }
  // Ook bij een verkeerde code door naar de bestelpagina: die toont dan
  // alleen de status, zonder gegevens.
  return NextResponse.redirect(
    new URL(`/bestelling/${encodeURIComponent(ordernummer)}`, `${url.protocol}//${url.host}`),
    303,
  );
}
